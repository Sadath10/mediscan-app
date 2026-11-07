import { describe, it, expect } from 'vitest';
import { calculateDailyTotal, generateDoseLogsForDate } from '../server/reminderEngine.js';
import { getDb } from '../server/db.js';

describe('Schedule Generation & Dosage Calculations', () => {
  it('correctly calculates daily total for 1 tablet taken twice daily', () => {
    const calc = calculateDailyTotal(1, 2);
    expect(calc.dailyTotal).toBe(2);
    expect(calc.tabletsPerDose).toBe(1);
    expect(calc.dosesPerDay).toBe(2);
  });

  it('correctly calculates daily total for 0.5 tablet taken 3 times daily', () => {
    const calc = calculateDailyTotal(0.5, 3);
    expect(calc.dailyTotal).toBe(1.5);
  });

  it('generates exactly 2 scheduled dose entries per day for timesPerDay=2', () => {
    const db = getDb();
    const testDate = '2026-11-15';
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO reminder_schedules (
        user_id, medicine_name, tablets_per_dose, dosage_unit, doses_per_day,
        scheduled_times, start_date, meal_instruction, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `);

    const res = insert.run(
      'vitest_user',
      'Metformin 500',
      1.0,
      'tablet',
      2,
      JSON.stringify(['08:00', '20:00']),
      testDate,
      'after_food',
      now,
      now
    );
    const schedId = Number(res.lastInsertRowid);

    // Generate logs for testDate
    generateDoseLogsForDate(testDate);

    const logs = db
      .prepare('SELECT * FROM dose_logs WHERE reminder_id = ? AND scheduled_date = ?')
      .all(schedId, testDate) as any[];

    expect(logs.length).toBe(2);
    expect(logs[0].scheduled_time).toBe('08:00');
    expect(logs[1].scheduled_time).toBe('20:00');

    // Clean up
    db.prepare('DELETE FROM dose_logs WHERE reminder_id = ?').run(schedId);
    db.prepare('DELETE FROM reminder_schedules WHERE id = ?').run(schedId);
  });
});
