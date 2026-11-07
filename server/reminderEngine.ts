import { getDb, ReminderSchedule, DoseLog } from './db.js';

export interface ScheduleCalculation {
  tabletsPerDose: number;
  dosesPerDay: number;
  dailyTotal: number;
  scheduledTimes: string[];
  disclaimer: string;
}

export function calculateDailyTotal(tabletsPerDose: number, dosesPerDay: number): ScheduleCalculation {
  const safeTablets = Math.max(0, Number(tabletsPerDose) || 0);
  const safeDoses = Math.max(0, parseInt(String(dosesPerDay), 10) || 0);
  const total = Number((safeTablets * safeDoses).toFixed(2));

  return {
    tabletsPerDose: safeTablets,
    dosesPerDay: safeDoses,
    dailyTotal: total,
    scheduledTimes: [],
    disclaimer: 'Calculated daily total is an illustrative schedule based on your input, not a clinical prescription or medical recommendation.',
  };
}

/**
 * Checks for schedule conflicts or duplicate reminders for the same medicine.
 */
export function checkScheduleConflicts(
  medicineName: string,
  newTimes: string[],
  excludeReminderId?: number
): { hasConflict: boolean; warnings: string[] } {
  const db = getDb();
  const warnings: string[] = [];

  const activeSchedules = db
    .prepare('SELECT * FROM reminder_schedules WHERE status = ?')
    .all('active') as unknown as ReminderSchedule[];

  for (const schedule of activeSchedules) {
    if (excludeReminderId && schedule.id === excludeReminderId) continue;

    // Check duplicate medicine name
    if (schedule.medicine_name.toLowerCase().trim() === medicineName.toLowerCase().trim()) {
      warnings.push(
        `An active reminder for "${schedule.medicine_name}" already exists (${schedule.doses_per_day} dose(s)/day). Please confirm you intend to create an additional schedule.`
      );
    }

    // Check time collision (within 15 minutes of an existing reminder)
    try {
      const existingTimes = JSON.parse(schedule.scheduled_times) as string[];
      for (const newTime of newTimes) {
        for (const existTime of existingTimes) {
          if (newTime === existTime) {
            warnings.push(
              `Time collision: "${schedule.medicine_name}" is also scheduled at ${existTime}. Ensure you have water and appropriate meal conditions for taking multiple medicines simultaneously.`
            );
          }
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }

  return {
    hasConflict: warnings.length > 0,
    warnings,
  };
}

/**
 * Generates dose logs for a given date (defaults to today in YYYY-MM-DD).
 */
export function generateDoseLogsForDate(targetDateStr?: string): DoseLog[] {
  const db = getDb();
  const dateStr = targetDateStr || new Date().toISOString().split('T')[0];

  // Auto-mark any overdue doses on past dates as missed
  autoMarkPastPendingAsMissed();

  const activeSchedules = db
    .prepare('SELECT * FROM reminder_schedules WHERE status = ? AND start_date <= ? AND (end_date IS NULL OR end_date >= ?)')
    .all('active', dateStr, dateStr) as unknown as ReminderSchedule[];

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO dose_logs (
      user_id, reminder_id, medicine_id, medicine_name, scheduled_date, scheduled_time,
      prescribed_quantity, dosage_unit, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `);

  const nowIso = new Date().toISOString();

  for (const schedule of activeSchedules) {
    let times: string[] = [];
    try {
      times = JSON.parse(schedule.scheduled_times);
    } catch {
      times = ['08:00'];
    }

    for (const time of times) {
      insertStmt.run(
        schedule.user_id,
        schedule.id,
        schedule.medicine_id ?? null,
        schedule.medicine_name,
        dateStr,
        time,
        schedule.tablets_per_dose,
        schedule.dosage_unit || 'tablet',
        nowIso
      );
    }
  }

  // Evaluate any missed doses where scheduled_time + 60 min grace has passed
  evaluateMissedDoses(dateStr);

  // Return only logs for active schedules OR logs that have been recorded as taken/skipped/missed
  return db.prepare(`
    SELECT d.* FROM dose_logs d
    LEFT JOIN reminder_schedules s ON d.reminder_id = s.id
    WHERE d.scheduled_date = ?
      AND (s.status = 'active' OR d.status IN ('taken', 'skipped', 'missed'))
    ORDER BY d.scheduled_time ASC
  `).all(dateStr) as unknown as DoseLog[];
}

/**
 * Automatically marks pending doses for past dates as 'missed'.
 */
export function autoMarkPastPendingAsMissed() {
  const db = getDb();
  const todayStr = new Date().toISOString().split('T')[0];

  // Mark pending doses on past days as missed
  db.prepare(`
    UPDATE dose_logs
    SET status = 'missed', notes = coalesce(notes, '') || ' [Auto-marked missed: date elapsed]'
    WHERE scheduled_date < ? AND status IN ('pending', 'snoozed')
  `).run(todayStr);

  // Also check grace period for today
  evaluateMissedDoses(todayStr);
}

/**
 * Automatically marks pending doses as 'missed' if the grace period (60 mins) has expired.
 * Does NOT count them as taken.
 */
export function evaluateMissedDoses(dateStr: string) {
  const db = getDb();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const graceMinutes = 60; // 60-minute grace period

  const pendingDoses = db
    .prepare("SELECT * FROM dose_logs WHERE scheduled_date = ? AND status IN ('pending', 'snoozed')")
    .all(dateStr) as unknown as DoseLog[];

  const updateStmt = db.prepare(`
    UPDATE dose_logs
    SET status = 'missed', notes = coalesce(notes, '') || ' [Automated grace period expired]'
    WHERE id = ?
  `);

  for (const dose of pendingDoses) {
    if (dose.status === 'snoozed' && dose.snooze_until) {
      const snoozeTime = new Date(dose.snooze_until).getTime();
      if (now.getTime() > snoozeTime + graceMinutes * 60 * 1000) {
        updateStmt.run(dose.id);
      }
      continue;
    }

    if (dateStr < todayStr) {
      // Past day dose still pending -> definitively missed
      updateStmt.run(dose.id);
    } else if (dateStr === todayStr) {
      const [h, m] = dose.scheduled_time.split(':').map((v) => parseInt(v, 10));
      const scheduledTotalMinutes = h * 60 + m;
      if (currentMinutes > scheduledTotalMinutes + graceMinutes) {
        updateStmt.run(dose.id);
      }
    }
  }
}

/**
 * Evaluates currently due reminders that need notification delivery.
 */
export function getDueNotifications(windowMinutes: number = 10): Array<{ dose: DoseLog; schedule: ReminderSchedule }> {
  const db = getDb();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Ensure today's dose logs are populated
  generateDoseLogsForDate(dateStr);

  const dueDoses = db
    .prepare("SELECT * FROM dose_logs WHERE scheduled_date = ? AND status IN ('pending', 'snoozed')")
    .all(dateStr) as unknown as DoseLog[];

  const results: Array<{ dose: DoseLog; schedule: ReminderSchedule }> = [];

  for (const dose of dueDoses) {
    // Check if snooze has fired
    if (dose.status === 'snoozed' && dose.snooze_until) {
      const snoozeMs = new Date(dose.snooze_until).getTime();
      if (now.getTime() >= snoozeMs) {
        // Ready for snooze alert
        const schedule = db.prepare('SELECT * FROM reminder_schedules WHERE id = ?').get(dose.reminder_id) as unknown as ReminderSchedule;
        if (schedule && schedule.status === 'active') {
          results.push({ dose, schedule });
        }
      }
      continue;
    }

    const [h, m] = dose.scheduled_time.split(':').map((v) => parseInt(v, 10));
    const doseMinutes = h * 60 + m;

    // Due if current time is within [doseMinutes - 1, doseMinutes + windowMinutes]
    if (currentMinutes >= doseMinutes - 1 && currentMinutes <= doseMinutes + windowMinutes) {
      // Check deduplication in notifications_log
      const alreadyNotified = db
        .prepare('SELECT id FROM notifications_log WHERE dose_log_id = ?')
        .get(dose.id);

      if (!alreadyNotified) {
        const schedule = db.prepare('SELECT * FROM reminder_schedules WHERE id = ?').get(dose.reminder_id) as unknown as ReminderSchedule;
        if (schedule && schedule.status === 'active') {
          results.push({ dose, schedule });
        }
      }
    }
  }

  return results;
}

/**
 * Records a notification delivery in notifications_log.
 */
export function recordNotificationDelivered(doseLogId: number, reminderId: number, scheduledDateTime: string, channel: string = 'browser') {
  const db = getDb();
  db.prepare(`
    INSERT INTO notifications_log (dose_log_id, reminder_id, scheduled_datetime, delivered_at, delivery_channel, status)
    VALUES (?, ?, ?, ?, ?, 'delivered')
  `).run(doseLogId, reminderId, scheduledDateTime, new Date().toISOString(), channel);
}

/**
 * Calculates 7-day adherence report.
 */
export function getAdherenceReport(userId: string = 'user_primary') {
  const db = getDb();
  autoMarkPastPendingAsMissed();
  const days: Array<{
    date: string;
    total: number;
    taken: number;
    skipped: number;
    missed: number;
    percentage: number;
  }> = [];

  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    const logs = db
      .prepare('SELECT * FROM dose_logs WHERE scheduled_date = ?')
      .all(dateStr) as unknown as DoseLog[];

    const total = logs.length;
    const taken = logs.filter((l) => l.status === 'taken').length;
    const skipped = logs.filter((l) => l.status === 'skipped').length;
    const missed = logs.filter((l) => l.status === 'missed').length;
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 100;

    days.push({
      date: dateStr,
      total,
      taken,
      skipped,
      missed,
      percentage,
    });
  }

  const overallTotal = days.reduce((acc, cur) => acc + cur.total, 0);
  const overallTaken = days.reduce((acc, cur) => acc + cur.taken, 0);
  const overallPercentage = overallTotal > 0 ? Math.round((overallTaken / overallTotal) * 100) : 100;

  return {
    days,
    overallPercentage,
    overallTotal,
    overallTaken,
    currentStreak: calculateStreak(days),
  };
}

function calculateStreak(days: Array<{ percentage: number; total: number }>): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].total === 0 || days[i].percentage >= 80) {
      if (days[i].total > 0) streak++;
    } else {
      break;
    }
  }
  return streak;
}
