import { describe, it, expect } from 'vitest';
import { getDb } from '../server/db.js';

describe('Dose Status Updates (taken, skipped, snoozed, missed)', () => {
  it('correctly transitions dose status to taken with action timestamp', () => {
    const db = getDb();
    const now = new Date().toISOString();

    // Create valid parent schedule to satisfy FOREIGN KEY constraint
    const sched = db.prepare(`
      INSERT INTO reminder_schedules (
        user_id, medicine_name, tablets_per_dose, dosage_unit, doses_per_day,
        scheduled_times, start_date, meal_instruction, status, created_at, updated_at
      ) VALUES (?, 'Test Med Status', 1, 'tablet', 1, '["08:00"]', '2026-10-20', 'after_food', 'active', ?, ?)
    `).run('vitest_user', now, now);
    const schedId = Number(sched.lastInsertRowid);

    const insert = db.prepare(`
      INSERT INTO dose_logs (
        user_id, reminder_id, medicine_name, scheduled_date, scheduled_time,
        prescribed_quantity, status, created_at
      ) VALUES (?, ?, 'Test Med Status', '2026-10-20', '08:00', 1.0, 'pending', ?)
    `);
    const res = insert.run('vitest_user', schedId, now);
    const doseId = Number(res.lastInsertRowid);

    const actionTime = new Date().toISOString();
    db.prepare("UPDATE dose_logs SET status = 'taken', actual_action_time = ? WHERE id = ?").run(actionTime, doseId);

    const updated = db.prepare('SELECT * FROM dose_logs WHERE id = ?').get(doseId) as any;
    expect(updated.status).toBe('taken');
    expect(updated.actual_action_time).toBe(actionTime);

    // Clean up
    db.prepare('DELETE FROM dose_logs WHERE id = ?').run(doseId);
    db.prepare('DELETE FROM reminder_schedules WHERE id = ?').run(schedId);
  });

  it('correctly sets snooze_until timestamp when snoozed', () => {
    const db = getDb();
    const now = new Date().toISOString();

    // Create valid parent schedule to satisfy FOREIGN KEY constraint
    const sched = db.prepare(`
      INSERT INTO reminder_schedules (
        user_id, medicine_name, tablets_per_dose, dosage_unit, doses_per_day,
        scheduled_times, start_date, meal_instruction, status, created_at, updated_at
      ) VALUES (?, 'Test Med Snooze', 1, 'tablet', 1, '["08:00"]', '2026-10-20', 'after_food', 'active', ?, ?)
    `).run('vitest_user', now, now);
    const schedId = Number(sched.lastInsertRowid);

    const insert = db.prepare(`
      INSERT INTO dose_logs (
        user_id, reminder_id, medicine_name, scheduled_date, scheduled_time,
        prescribed_quantity, status, created_at
      ) VALUES (?, ?, 'Test Med Snooze', '2026-10-20', '08:00', 1.0, 'pending', ?)
    `);
    const res = insert.run('vitest_user', schedId, now);
    const doseId = Number(res.lastInsertRowid);

    const snoozeMins = 15;
    const snoozeUntil = new Date(Date.now() + snoozeMins * 60 * 1000).toISOString();
    db.prepare("UPDATE dose_logs SET status = 'snoozed', snooze_until = ? WHERE id = ?").run(snoozeUntil, doseId);

    const updated = db.prepare('SELECT * FROM dose_logs WHERE id = ?').get(doseId) as any;
    expect(updated.status).toBe('snoozed');
    expect(updated.snooze_until).toBe(snoozeUntil);

    // Clean up
    db.prepare('DELETE FROM dose_logs WHERE id = ?').run(doseId);
    db.prepare('DELETE FROM reminder_schedules WHERE id = ?').run(schedId);
  });
});
