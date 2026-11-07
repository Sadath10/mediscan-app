import { z } from 'zod';

export const timeStringRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
export const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;

export const ScanOcrSchema = z.object({
  imageBase64: z.string().min(1, 'imageBase64 is required'),
  manualTextOverride: z.string().optional(),
});

export const OpenFdaVerifySchema = z.object({
  candidateName: z.string().min(1, 'Medicine candidate name is required').max(128),
});

export const UserMedicineSchema = z.object({
  userId: z.string().min(1, 'User ID is required').max(128),
  medicineName: z.string().min(1, 'Medicine name is required').max(128),
  strength: z.string().min(1, 'Strength is required').max(64),
  form: z.string().max(64).default('Tablet'),
  openFdaId: z.string().max(128).optional(),
  dosageInstructions: z.string().max(512).optional(),
  startDate: z.string().regex(dateStringRegex, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(dateStringRegex, 'End date must be YYYY-MM-DD').optional().nullable(),
  isActive: z.boolean().default(true),
});

export const ScheduleSchema = z.object({
  userId: z.string().min(1, 'User ID is required').max(128),
  medicineId: z.string().min(1, 'Medicine ID is required').max(128),
  timesPerDay: z.number().int().min(1, 'Times per day must be at least 1').max(6, 'Times per day cannot exceed 6'),
  times: z.array(z.string().regex(timeStringRegex, 'Times must be valid HH:MM 24-hour format')).min(1).max(6),
  tabletsPerDose: z.number().positive('Tablets per dose must be positive').max(20),
  instructions: z.string().max(256).optional(),
  status: z.enum(['active', 'paused', 'completed']).default('active'),
}).refine((data) => data.times.length === data.timesPerDay, {
  message: 'Number of scheduled times must exactly match timesPerDay',
  path: ['times'],
});

export const DoseStatusSchema = z.object({
  status: z.enum(['taken', 'skipped', 'snoozed']),
  snoozeMinutes: z.number().int().min(1).max(120).optional(),
  notes: z.string().max(256).optional(),
});

export const SpeechSynthesizeSchema = z.object({
  text: z.string().min(1, 'Text to synthesize is required').max(2000, 'Text exceeds 2000 character limit'),
  languageCode: z.string().default('en-US'),
});

export const GlobalLookupSchema = z.object({
  query: z.string().min(1, 'Medicine search query is required').max(128),
});

