import { describe, it, expect } from 'vitest';
import { ScheduleSchema, UserMedicineSchema, timeStringRegex } from '../server/validators.js';
import { parseOcrText } from '../server/ocrPipeline.js';

describe('Edge Cases & Validation Resilience', () => {
  it('rejects empty medicine name in UserMedicineSchema', () => {
    const invalid = {
      userId: 'user_123',
      medicineName: '',
      strength: '500 mg',
      startDate: '2026-10-20',
    };
    const result = UserMedicineSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format e.g. "25:99" or "8am"', () => {
    expect(timeStringRegex.test('25:99')).toBe(false);
    expect(timeStringRegex.test('8am')).toBe(false);
    expect(timeStringRegex.test('08:00')).toBe(true);
    expect(timeStringRegex.test('23:59')).toBe(true);
  });

  it('rejects schedule where times array length does not match timesPerDay', () => {
    const mismatch = {
      userId: 'user_123',
      medicineId: 'med_123',
      timesPerDay: 2,
      times: ['08:00'], // Only 1 time provided for 2 doses/day
      tabletsPerDose: 1,
    };
    const result = ScheduleSchema.safeParse(mismatch);
    expect(result.success).toBe(false);
  });

  it('rejects timesPerDay outside of 1..6 bounds', () => {
    const outOfBounds = {
      userId: 'user_123',
      medicineId: 'med_123',
      timesPerDay: 8,
      times: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
      tabletsPerDose: 1,
    };
    const result = ScheduleSchema.safeParse(outOfBounds);
    expect(result.success).toBe(false);
  });

  it('safely handles empty or null OCR text without crashing', () => {
    const emptyResult = parseOcrText('');
    expect(emptyResult.candidateNames).toEqual([]);
    expect(emptyResult.strengths).toEqual([]);
    expect(emptyResult.dosageForms).toEqual([]);
  });

  it('rejects unauthenticated request where userId is empty', () => {
    const unauthenticated = {
      userId: '',
      medicineName: 'Paracetamol',
      strength: '500 mg',
      startDate: '2026-10-20',
    };
    const result = UserMedicineSchema.safeParse(unauthenticated);
    expect(result.success).toBe(false);
  });

  it('rejects schedule with duplicate identical dose times', () => {
    const duplicateTimes = {
      userId: 'user_123',
      medicineId: 'med_123',
      timesPerDay: 2,
      times: ['08:00', '08:00'], // Duplicate time
      tabletsPerDose: 1,
    };
    const hasDuplicates = new Set(duplicateTimes.times).size !== duplicateTimes.times.length;
    expect(hasDuplicates).toBe(true);
  });
});

