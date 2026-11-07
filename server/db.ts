import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve(process.cwd(), 'mediscan.db');

export interface MedicineRecord {
  id: number;
  name: string;
  brand: string;
  active_ingredient: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  verified_purpose_en: string;
  verified_purpose_kn: string;
  common_instructions_en: string;
  common_instructions_kn: string;
  precautions_en: string;
  precautions_kn: string;
  source: string;
  last_verified: string;
  is_verified: number;
  openfda_id?: string | null;
  rxcui?: string | null;
  dailymed_setid?: string | null;
  myhealthbox_id?: string | null;
}

export interface CabinetItem {
  id: number;
  user_id: string;
  medicine_id?: number | null;
  custom_name: string;
  brand: string;
  active_ingredient: string;
  strength: string;
  dosage_form: string;
  current_stock: number;
  expiry_date?: string | null;
  prescribed_by?: string | null;
  prescription_instructions?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderSchedule {
  id: number;
  user_id: string;
  medicine_id?: number | null;
  medicine_name: string;
  tablets_per_dose: number;
  dosage_unit: string;
  doses_per_day: number;
  scheduled_times: string; // JSON array of "HH:MM"
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD or null
  days_of_week: string; // 'daily', 'weekdays', or JSON [0,1,2...]
  meal_instruction: string; // 'before_food', 'after_food', 'with_food', 'empty_stomach', 'bedtime'
  meal_instruction_kn?: string | null;
  sound_preference: string;
  vibration_enabled: number;
  timezone: string;
  status: 'active' | 'paused' | 'completed';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoseLog {
  id: number;
  user_id: string;
  reminder_id: number;
  medicine_id?: number | null;
  medicine_name: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:MM
  prescribed_quantity: number;
  dosage_unit: string;
  actual_action_time?: string | null;
  status: 'pending' | 'taken' | 'skipped' | 'missed' | 'snoozed';
  snooze_until?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ScanHistoryItem {
  id: number;
  image_data_url?: string | null;
  ocr_raw_text: string;
  detected_name: string;
  detected_strength: string;
  detected_form: string;
  matched_medicine_id?: number | null;
  confidence_score: number;
  is_verified_match: number;
  created_at: string;
}

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  dbInstance = new DatabaseSync(DB_PATH);

  // Initialize SQLite settings
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  dbInstance.exec('PRAGMA journal_mode = WAL;');

  initSchema(dbInstance);
  seedVerifiedMedicines(dbInstance);

  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      active_ingredient TEXT NOT NULL,
      strength TEXT NOT NULL,
      dosage_form TEXT NOT NULL,
      manufacturer TEXT,
      verified_purpose_en TEXT NOT NULL,
      verified_purpose_kn TEXT NOT NULL,
      common_instructions_en TEXT NOT NULL,
      common_instructions_kn TEXT NOT NULL,
      precautions_en TEXT,
      precautions_kn TEXT,
      source TEXT NOT NULL,
      last_verified TEXT NOT NULL,
      is_verified INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
    CREATE INDEX IF NOT EXISTS idx_medicines_brand ON medicines(brand);
    CREATE INDEX IF NOT EXISTS idx_medicines_active ON medicines(active_ingredient);
  `);

  try { db.exec('ALTER TABLE medicines ADD COLUMN openfda_id TEXT;'); } catch {}
  try { db.exec('ALTER TABLE medicines ADD COLUMN rxcui TEXT;'); } catch {}
  try { db.exec('ALTER TABLE medicines ADD COLUMN dailymed_setid TEXT;'); } catch {}
  try { db.exec('ALTER TABLE medicines ADD COLUMN myhealthbox_id TEXT;'); } catch {}

  db.exec(`

    CREATE TABLE IF NOT EXISTS personal_cabinet (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'user_primary',
      medicine_id INTEGER,
      custom_name TEXT NOT NULL,
      brand TEXT,
      active_ingredient TEXT,
      strength TEXT,
      dosage_form TEXT DEFAULT 'Tablet',
      current_stock INTEGER DEFAULT 20,
      expiry_date TEXT,
      prescribed_by TEXT,
      prescription_instructions TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reminder_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'user_primary',
      medicine_id INTEGER,
      medicine_name TEXT NOT NULL,
      tablets_per_dose REAL NOT NULL DEFAULT 1.0,
      dosage_unit TEXT NOT NULL DEFAULT 'tablet',
      doses_per_day INTEGER NOT NULL DEFAULT 1,
      scheduled_times TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      days_of_week TEXT NOT NULL DEFAULT 'daily',
      meal_instruction TEXT NOT NULL DEFAULT 'after_food',
      meal_instruction_kn TEXT,
      sound_preference TEXT NOT NULL DEFAULT 'chime',
      vibration_enabled INTEGER NOT NULL DEFAULT 1,
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminder_schedules(status);
    CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminder_schedules(user_id);

    CREATE TABLE IF NOT EXISTS dose_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'user_primary',
      reminder_id INTEGER NOT NULL,
      medicine_id INTEGER,
      medicine_name TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      prescribed_quantity REAL NOT NULL,
      dosage_unit TEXT NOT NULL DEFAULT 'tablet',
      actual_action_time TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      snooze_until TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (reminder_id) REFERENCES reminder_schedules(id) ON DELETE CASCADE,
      UNIQUE(reminder_id, scheduled_date, scheduled_time)
    );

    CREATE INDEX IF NOT EXISTS idx_dose_logs_date ON dose_logs(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_dose_logs_status ON dose_logs(status);

    CREATE TABLE IF NOT EXISTS notifications_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dose_log_id INTEGER,
      reminder_id INTEGER NOT NULL,
      scheduled_datetime TEXT NOT NULL,
      delivered_at TEXT NOT NULL,
      delivery_channel TEXT NOT NULL DEFAULT 'browser',
      status TEXT NOT NULL DEFAULT 'delivered',
      FOREIGN KEY (reminder_id) REFERENCES reminder_schedules(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notif_dose ON notifications_log(dose_log_id);

    CREATE TABLE IF NOT EXISTS scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_data_url TEXT,
      ocr_raw_text TEXT,
      detected_name TEXT,
      detected_strength TEXT,
      detected_form TEXT,
      matched_medicine_id INTEGER,
      confidence_score REAL,
      is_verified_match INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS medicine_details_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_name TEXT UNIQUE COLLATE NOCASE NOT NULL,
      details_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_medicine_details_name ON medicine_details_cache(medicine_name);
  `);
}

function seedVerifiedMedicines(db: DatabaseSync) {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM medicines').get() as { count: number };
  if (countRow && countRow.count > 0) {
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO medicines (
      name, brand, active_ingredient, strength, dosage_form, manufacturer,
      verified_purpose_en, verified_purpose_kn,
      common_instructions_en, common_instructions_kn,
      precautions_en, precautions_kn,
      source, last_verified, is_verified
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, ?,
      ?, ?, 1
    )
  `);

  const initialMedicines = [
    {
      name: 'Dolo 650',
      brand: 'Dolo',
      active_ingredient: 'Paracetamol',
      strength: '650 mg',
      dosage_form: 'Tablet',
      manufacturer: 'Micro Labs Ltd',
      purpose_en: 'Analgesic and antipyretic. Used to relieve mild-to-moderate fever and headache, body aches, toothache, and muscle pain.',
      purpose_kn: 'ಜ್ವರ ಮತ್ತು ಮೈಕೈ ನೋವು ನಿವಾರಕ. ಸೌಮ್ಯದಿಂದ ಮಧ್ಯಮ ಜ್ವರ, ತಲೆನೋವು, ಹಲ್ಲುನೋವು ಮತ್ತು ಮೈಕೈ ನೋವು ಕಡಿಮೆ ಮಾಡಲು ಬಳಸಲಾಗುತ್ತದೆ.',
      instructions_en: 'Take with or after food with a glass of water. Maintain at least 4 to 6 hours between doses. Do not exceed 4 tablets in 24 hours.',
      instructions_kn: 'ಊಟದ ನಂತರ ಒಂದು ಲೋಟ ನೀರಿನೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ. ಎರಡು ಪ್ರಮಾಣಗಳ ನಡುವೆ ಕನಿಷ್ಠ ೪ ರಿಂದ ೬ ಗಂಟೆಗಳ ಅಂತರವಿರಲಿ. ದಿನಕ್ಕೆ ೪ ಮಾತ್ರೆಗಳಿಗಿಂತ ಹೆಚ್ಚು ಸೇವಿಸಬೇಡಿ.',
      precautions_en: 'Avoid alcohol. Do not combine with other paracetamol-containing products. Caution in liver or kidney impairment.',
      precautions_kn: 'ಮದ್ಯಪಾನ ಮಾಡಬೇಡಿ. ಇತರ ಪ್ಯಾರಸಿಟಮಾಲ್ ಔಷಧಿಗಳೊಂದಿಗೆ ಏಕಕಾಲದಲ್ಲಿ ಸೇವಿಸಬೇಡಿ. ಯಕೃತ್ತು ಅಥವಾ ಮೂತ್ರಪಿಂಡ ಸಮಸ್ಯೆ ಇದ್ದರೆ ವೈದ್ಯರ ಸಲಹೆ ಪಡೆಯಿರಿ.',
      source: 'Indian Pharmacopoeia / CDSCO Monograph',
      date: '2026-01-15'
    },
    {
      name: 'Augmentin 625 Duo',
      brand: 'Augmentin',
      active_ingredient: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
      strength: '625 mg',
      dosage_form: 'Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
      purpose_en: 'Broad-spectrum antibiotic. Treats bacterial infections of respiratory tract, ear, sinus, skin, and urinary tract.',
      purpose_kn: 'ಬ್ಯಾಕ್ಟೀರಿಯಾ ಸೋಂಕು ನಿವಾರಕ (ಆಂಟಿಬಯೋಟಿಕ್). ಶ್ವಾಸನಾಳ, ಕಿವಿ, ಸೈನಸ್, ಚರ್ಮ ಮತ್ತು ಮೂತ್ರನಾಳದ ಬ್ಯಾಕ್ಟೀರಿಯಾ ಸೋಂಕುಗಳಿಗೆ ಬಳಸಲಾಗುತ್ತದೆ.',
      instructions_en: 'Take at the start of a meal to minimize gastrointestinal discomfort. Complete the full prescribed course even if symptoms resolve.',
      instructions_kn: 'ಹೊಟ್ಟೆಯ ತೊಂದರೆ ತಪ್ಪಿಸಲು ಊಟದ ಪ್ರಾರಂಭದಲ್ಲಿ ಸೇವಿಸಿ. ರೋಗಲಕ್ಷಣಗಳು ಕಡಿಮೆಯಾದರೂ ಸಹ ವೈದ್ಯರು ಸೂಚಿಸಿದ ಪೂರ್ಣ ಕೋರ್ಸ್ ಮುಗಿಸಿ.',
      precautions_en: 'Do not use if allergic to penicillin or beta-lactam antibiotics. Report severe diarrhea immediately.',
      precautions_kn: 'ಪೆನಿಸಿಲಿನ್ ಅಲರ್ಜಿ ಇರುವವರು ಬಳಸಬಾರದು. ತೀವ್ರ ಭೇದಿ ಉಂಟಾದರೆ ತಕ್ಷಣವೇ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
      source: 'National Formulary of India',
      date: '2026-02-10'
    },
    {
      name: 'Pantocid 40',
      brand: 'Pantocid',
      active_ingredient: 'Pantoprazole',
      strength: '40 mg',
      dosage_form: 'Tablet',
      manufacturer: 'Sun Pharmaceutical Industries Ltd',
      purpose_en: 'Proton pump inhibitor (PPI). Reduces stomach acid production for GERD, acid reflux, heartburn, and peptic ulcers.',
      purpose_kn: 'ಆಮ್ಲೀಯತೆ ಮತ್ತು ಗ್ಯಾಸ್ಟ್ರಿಕ್ ಸಮಸ್ಯೆಗಳಿಗೆ. ಎದೆಯುರಿ, ಆಸಿಡ್ ರಿಫ್ಲಕ್ಸ್ ಮತ್ತು ಜಠರದ ಹುಣ್ಣು (ಅಲ್ಸರ್) ನಿವಾರಿಸಲು ಬಳಸಲಾಗುತ್ತದೆ.',
      instructions_en: 'Take once daily in the morning, 30 to 60 minutes before breakfast. Swallow whole; do not crush or chew.',
      instructions_kn: 'ಪ್ರತಿದಿನ ಬೆಳಗ್ಗೆ ಉಪಹಾರಕ್ಕೆ ೩೦-೬೦ ನಿಮಿಷಗಳ ಮೊದಲು ಸೇವಿಸಿ. ಗುಳಿಗೆಯನ್ನು ಜಗಿಯದೆ ಹಾಗೇ ನುಂಗಿ.',
      precautions_en: 'Long-term continuous use may reduce vitamin B12 or magnesium absorption. Follow physician prescription duration.',
      precautions_kn: 'ದೀರ್ಘಕಾಲದ ಬಳಕೆಯಿಂದ ವಿಟಮಿನ್ ಬಿ೧೨ ಅಥವಾ ಮೆಗ್ನೀಸಿಯಮ್ ಕೊರತೆ ಉಂಟಾಗಬಹುದು. ವೈದ್ಯರ ನಿರ್ದೇಶನದಂತೆ ಮಾತ್ರ ಬಳಸಿ.',
      source: 'Central Drugs Standard Control Organisation (CDSCO)',
      date: '2026-01-20'
    },
    {
      name: 'Glycomet 500',
      brand: 'Glycomet',
      active_ingredient: 'Metformin Hydrochloride',
      strength: '500 mg',
      dosage_form: 'Tablet',
      manufacturer: 'USV Pvt Ltd',
      purpose_en: 'Oral hypoglycemic agent (biguanide). First-line treatment for managing blood glucose levels in Type 2 Diabetes Mellitus.',
      purpose_kn: 'ಟೈಪ್ ೨ ಮಧುಮೇಹ (ಸಕ್ಕರೆ ಕಾಯಿಲೆ) ನಿಯಂತ್ರಣಕ್ಕೆ. ರಕ್ತದಲ್ಲಿನ ಸಕ್ಕರೆ ಮಟ್ಟವನ್ನು ನಿಯಂತ್ರಿಸಲು ಬಳಸಲಾಗುತ್ತದೆ.',
      instructions_en: 'Take with or immediately after meals to reduce stomach upset. Stay well hydrated throughout the day.',
      instructions_kn: 'ಹೊಟ್ಟೆಯ ತೊಂದರೆ ತಪ್ಪಿಸಲು ಊಟದೊಂದಿಗೆ ಅಥವಾ ಊಟವಾದ ತಕ್ಷಣ ತೆಗೆದುಕೊಳ್ಳಿ. ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ.',
      precautions_en: 'Monitor kidney function regularly. Avoid heavy alcohol consumption. Do not skip prescribed meals.',
      precautions_kn: 'ಮೂತ್ರಪಿಂಡದ ಕಾರ್ಯವನ್ನು ನಿಯಮಿತವಾಗಿ ತಪಾಸಣೆ ಮಾಡಿಸಿ. ಮದ್ಯಪಾನ ತ್ಯಜಿಸಿ. ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಆಹಾರ ಸೇವಿಸಿ.',
      source: 'WHO Model List of Essential Medicines',
      date: '2026-03-01'
    },
    {
      name: 'Cetirizine 10mg (Cetzine / Alerid)',
      brand: 'Cetzine',
      active_ingredient: 'Cetirizine Dihydrochloride',
      strength: '10 mg',
      dosage_form: 'Tablet',
      manufacturer: 'Dr. Reddy’s Laboratories Ltd',
      purpose_en: 'Second-generation antihistamine. Relieves allergic rhinitis, runny nose, sneezing, itchy eyes, and allergic skin hives.',
      purpose_kn: 'ಅಲರ್ಜಿ ನಿವಾರಕ. ಶೀತ, ಮೂಗು ಸೋರುವಿಕೆ, ಸೀನು, ಕಣ್ಣು ತುರಿಕೆ ಮತ್ತು ಚರ್ಮದ ಅಲರ್ಜಿ ದದ್ದುಗಳನ್ನು ನಿವಾರಿಸುತ್ತದೆ.',
      instructions_en: 'Take once daily, preferably in the evening or bedtime, with or without food.',
      instructions_kn: 'ದಿನಕ್ಕೆ ಒಮ್ಮೆ, ಸಂಜೆ ಅಥವಾ ರಾತ್ರಿ ಮಲಗುವ ಮುನ್ನ ಊಟದೊಂದಿಗೆ ಅಥವಾ ಇಲ್ಲದೆ ತೆಗೆದುಕೊಳ್ಳಿ.',
      precautions_en: 'May cause mild drowsiness. Avoid driving or operating heavy machinery until you know how it affects you.',
      precautions_kn: 'ಸ್ವಲ್ಪ ನಿದ್ರಾಮಯತೆ ಉಂಟಾಗಬಹುದು. ಇದನ್ನು ಸೇವಿಸಿದ ನಂತರ ವಾಹನ ಚಾಲನೆ ಅಥವಾ ಯಂತ್ರೋಪಕರಣಗಳನ್ನು ಚಲಾಯಿಸಬೇಡಿ.',
      source: 'Indian Pharmacopoeia',
      date: '2026-01-18'
    },
    {
      name: 'Azithral 500',
      brand: 'Azithral',
      active_ingredient: 'Azithromycin',
      strength: '500 mg',
      dosage_form: 'Tablet',
      manufacturer: 'Alembic Pharmaceuticals Ltd',
      purpose_en: 'Macrolide antibiotic. Prescribed for throat infections, tonsillitis, sinusitis, bronchitis, and pneumonia.',
      purpose_kn: 'ಗಂಟಲು ಸೋಂಕು, ಟಾನ್ಸಿಲ್ಸ್, ಸೈನಸ್, ಶ್ವಾಸಕೋಶದ ಬ್ಯಾಕ್ಟೀರಿಯಾ ಸೋಂಕುಗಳ ನಿವಾರಣೆಗೆ ಬಳಸುವ ಆಂಟಿಬಯೋಟಿಕ್.',
      instructions_en: 'Take once daily at the same time every day, either 1 hour before or 2 hours after meals with water.',
      instructions_kn: 'ಪ್ರತಿದಿನ ನಿಗದಿತ ಸಮಯದಲ್ಲಿ ಊಟಕ್ಕೆ ೧ ಗಂಟೆ ಮೊದಲು ಅಥವಾ ಊಟವಾದ ೨ ಗಂಟೆಗಳ ನಂತರ ಸೇವಿಸಿ.',
      precautions_en: 'Do not take antacids containing aluminum or magnesium at the same time. Inform doctor if having cardiac arrhythmia history.',
      precautions_kn: 'ಇದರೊಂದಿಗೆ ಅಲ್ಯೂಮಿನಿಯಂ ಹೊಂದಿರುವ ಗ್ಯಾಸ್ಟ್ರಿಕ್ ಸಿರಪ್ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ. ಹೃದಯ ಬಡಿತದ ಸಮಸ್ಯೆ ಇದ್ದರೆ ತಿಳಿಸಿ.',
      source: 'National Formulary of India',
      date: '2026-02-14'
    },
    {
      name: 'Telma 40',
      brand: 'Telma',
      active_ingredient: 'Telmisartan',
      strength: '40 mg',
      dosage_form: 'Tablet',
      manufacturer: 'Glenmark Pharmaceuticals Ltd',
      purpose_en: 'Angiotensin II receptor blocker (ARB). Controls essential hypertension (high blood pressure) and reduces cardiovascular risk.',
      purpose_kn: 'ರಕ್ತದೊತ್ತಡ (ಬಿಪಿ) ನಿಯಂತ್ರಣಕ್ಕೆ. ಅಧಿಕ ರಕ್ತದೊತ್ತಡವನ್ನು ನಿಯಂತ್ರಿಸಲು ಮತ್ತು ಹೃದಯಾಘಾತದ ಅಪಾಯವನ್ನು ತಗ್ಗಿಸಲು ಬಳಸಲಾಗುತ್ತದೆ.',
      instructions_en: 'Take once daily at the same time each morning, with or without food. Do not stop abruptly.',
      instructions_kn: 'ಪ್ರತಿದಿನ ಬೆಳಗ್ಗೆ ಒಂದೇ ನಿಗದಿತ ಸಮಯದಲ್ಲಿ ತೆಗೆದುಕೊಳ್ಳಿ. ವೈದ್ಯರ ಸಲಹೆಯಿಲ್ಲದೆ ಔಷಧಿಯನ್ನು ನಿಲ್ಲಿಸಬೇಡಿ.',
      precautions_en: 'Monitor blood pressure and kidney parameters periodically. Not recommended during pregnancy.',
      precautions_kn: 'ರಕ್ತದೊತ್ತಡವನ್ನು ನಿಯಮಿತವಾಗಿ ಪರೀಕ್ಷಿಸಿಕೊಳ್ಳಿ. ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ಈ ಔಷಧಿಯನ್ನು ಸೇವಿಸಬಾರದು.',
      source: 'CDSCO Approved Monographs',
      date: '2026-01-30'
    },
    {
      name: 'Ecosprin 75',
      brand: 'Ecosprin',
      active_ingredient: 'Aspirin (Acetylsalicylic Acid)',
      strength: '75 mg',
      dosage_form: 'Enteric-Coated Tablet',
      manufacturer: 'USV Pvt Ltd',
      purpose_en: 'Antiplatelet agent. Prevents blood clot formation, reducing the risk of heart attacks and ischemic strokes.',
      purpose_kn: 'ರಕ್ತ ಹೆಪ್ಪುಗಟ್ಟುವಿಕೆ ತಡೆಗಟ್ಟಲು. ಹೃದಯಾಘಾತ ಮತ್ತು ಪಾರ್ಶ್ವವಾಯು ಅಪಾಯವನ್ನು ತಗ್ಗಿಸಲು ಬಳಸಲಾಗುತ್ತದೆ.',
      instructions_en: 'Take once daily with meals to protect the stomach lining. Swallow whole with water; do not break.',
      instructions_kn: 'ಹೊಟ್ಟೆಯ ರಕ್ಷಣೆಗಾಗಿ ಊಟದ ಜೊತೆಗೆ ಅಥವಾ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಿ. ಗುಳಿಗೆಯನ್ನು ಮುರಿಯದೆ ಪೂರ್ತಿಯಾಗಿ ನುಂಗಿ.',
      precautions_en: 'Watch for signs of unexpected bleeding or bruising. Avoid concurrent use with strong NSAIDs without clinical review.',
      precautions_kn: 'ಅತಿಯಾದ ರಕ್ತಸ್ರಾವದ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದರೆ ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ. ಇತರ ನೋವು ನಿವಾರಕಗಳೊಂದಿಗೆ ಜಾಗರೂಕರಾಗಿ ಬಳಸಿ.',
      source: 'Indian Pharmacopoeia',
      date: '2026-02-01'
    },
    {
      name: 'Combiflam',
      brand: 'Combiflam',
      active_ingredient: 'Ibuprofen (400mg) + Paracetamol (325mg)',
      strength: '725 mg',
      dosage_form: 'Tablet',
      manufacturer: 'Sanofi India Ltd',
      purpose_en: 'Combination pain reliever and anti-inflammatory. Effective for dental pain, joint pain, sprains, and dysmenorrhea.',
      purpose_kn: 'ತೀವ್ರ ಮೈಕೈ ನೋವು, ಕೀಲು ನೋವು, ಹಲ್ಲು ನೋವು ಮತ್ತು ಊತ ನಿವಾರಣೆಗೆ ಬಳಸುವ ಸಂಯೋಜಿತ ನೋವು ನಿವಾರಕ.',
      instructions_en: 'Always take with food or milk to safeguard gastric lining. Use for the shortest duration necessary.',
      instructions_kn: 'ಹೊಟ್ಟೆಯಲ್ಲಿ ಉರಿ ಉಂಟಾಗದಂತೆ ತಡೆಯಲು ಯಾವಾಗಲೂ ಊಟ ಅಥವಾ ಹಾಲಿನೊಂದಿಗೆ ಮಾತ್ರ ಸೇವಿಸಿ.',
      precautions_en: 'Contraindicated in active peptic ulcer disease. Caution in hypertension and cardiovascular disorders.',
      precautions_kn: 'ಹೊಟ್ಟೆಯ ಹುಣ್ಣು (ಅಲ್ಸರ್) ಅಥವಾ ಅಧಿಕ ರಕ್ತದೊತ್ತಡ ಇರುವವರು ವೈದ್ಯರ ಸಲಹೆಯಿಲ್ಲದೆ ಸೇವಿಸಬಾರದು.',
      source: 'CDSCO / National Formulary of India',
      date: '2026-01-25'
    },
    {
      name: 'Montair LC',
      brand: 'Montair',
      active_ingredient: 'Montelukast (10mg) + Levocetirizine (5mg)',
      strength: '15 mg',
      dosage_form: 'Tablet',
      manufacturer: 'Cipla Ltd',
      purpose_en: 'Combination anti-allergic and leukotriene receptor antagonist for allergic rhinitis, allergic asthma, and chronic cough.',
      purpose_kn: 'ಅಲರ್ಜಿಕ್ ಆಸ್ತಮಾ, ಅಲರ್ಜಿ ಕೆಮ್ಮು ಮತ್ತು ದೀರ್ಘಕಾಲದ ಸೀನು/ಶೀತ ನಿವಾರಿಸಲು ಬಳಸುವ ಸಂಯೋಜಿತ ಔಷಧಿ.',
      instructions_en: 'Take once daily at bedtime with or without food.',
      instructions_kn: 'ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ ರಾತ್ರಿ ಮಲಗುವ ಮುನ್ನ ಊಟದೊಂದಿಗೆ ಅಥವಾ ಊಟವಿಲ್ಲದೆ ಸೇವಿಸಿ.',
      precautions_en: 'May cause drowsiness. Report mood or behavioral changes to your physician.',
      precautions_kn: 'ನಿದ್ರಾಮಯತೆ ಉಂಟಾಗಬಹುದು. ಮನಸ್ಥಿತಿಯಲ್ಲಿ ಯಾವುದೇ ವಿಚಿತ್ರ ಬದಲಾವಣೆ ಕಂಡುಬಂದರೆ ವೈದ್ಯರಿಗೆ ತಿಳಿಸಿ.',
      source: 'CDSCO Monographs',
      date: '2026-02-22'
    },
    {
      name: 'Thyronorm 50 mcg',
      brand: 'Thyronorm',
      active_ingredient: 'Levothyroxine Sodium',
      strength: '50 mcg',
      dosage_form: 'Tablet',
      manufacturer: 'Abbott Healthcare Pvt Ltd',
      purpose_en: 'Synthetic thyroid hormone for hypothyroidism. Restores normal metabolic rate and energy balance.',
      purpose_kn: 'ಥೈರಾಯ್ಡ್ ಕೊರತೆ (ಹೈಪೋಥೈರಾಯ್ಡಿಸಮ್) ಚಿಕಿತ್ಸೆಗೆ. ದೇಹದ ಚಯಾಪಚಯ ಕ್ರಿಯೆಯನ್ನು ಸಮತೋಲನದಲ್ಲಿಡಲು ಬಳಸಲಾಗುತ್ತದೆ.',
      instructions_en: 'Take first thing in the morning on an empty stomach with plain water, at least 30 to 45 minutes before tea, coffee, or breakfast.',
      instructions_kn: 'ಬೆಳಗ್ಗೆ ಎದ್ದ ತಕ್ಷಣ ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಸೇವಿಸಿ. ನಂತರ ಕನಿಷ್ಠ ೩೦ ರಿಂದ ೪೫ ನಿಮಿಷ ಯಾವುದೇ ಚಹಾ, ಕಾಫಿ ಅಥವಾ ಉಪಹಾರ ಸೇವಿಸಬೇಡಿ.',
      precautions_en: 'Keep away from moisture and direct heat. Do not alter dose without regular serum TSH/T4 testing.',
      precautions_kn: 'ತೇವಾಂಶ ಮತ್ತು ಬಿಸಿಲಿಗೆ ತಾಗದಂತೆ ಸುರಕ್ಷಿತವಾಗಿಡಿ. ಟಿಎಸ್‌ಎಚ್ ರಕ್ತ ಪರೀಕ್ಷೆ ಮಾಡಿಸದೆ ಡೋಸ್ ಬದಲಾಯಿಸಬೇಡಿ.',
      source: 'Indian Pharmacopoeia',
      date: '2026-01-10'
    },
    {
      name: 'Pan-D',
      brand: 'Pan',
      active_ingredient: 'Pantoprazole (40mg) + Domperidone (30mg SR)',
      strength: '70 mg',
      dosage_form: 'Capsule',
      manufacturer: 'Alkem Laboratories Ltd',
      purpose_en: 'Prokinetic and PPI combination. Relieves acid reflux with nausea, vomiting, feeling of fullness, and dyspepsia.',
      purpose_kn: 'ಆಮ್ಲೀಯತೆಯೊಂದಿಗೆ ವಾಕರಿಕೆ, ವಾಂತಿ ಮತ್ತು ಹೊಟ್ಟೆ ಉಬ್ಬರ ನಿವಾರಿಸಲು ಬಳಸುವ ಸಂಯೋಜಿತ ಕ್ಯಾಪ್ಸೂಲ್.',
      instructions_en: 'Take once daily in the morning, 30 minutes before breakfast. Swallow whole.',
      instructions_kn: 'ಬೆಳಗ್ಗೆ ಉಪಹಾರಕ್ಕೆ ೩೦ ನಿಮಿಷ ಮುಂಚೆ ನೀರಿನೊಂದಿಗೆ ಸೇವಿಸಿ. ಕ್ಯಾಪ್ಸೂಲ್ ಅನ್ನು ಒಡೆಯದೆ ನುಂಗಿ.',
      precautions_en: 'Not recommended for prolonged unmonitored use. Consult physician if heart palpitation history exists.',
      precautions_kn: 'ದೀರ್ಘಕಾಲ ಅತಿಯಾಗಿ ಬಳಸಬಾರದು. ಹೃದಯ ಬಡಿತದ ಸಮಸ್ಯೆ ಇರುವವರು ಎಚ್ಚರ ವಹಿಸಬೇಕು.',
      source: 'National Formulary of India',
      date: '2026-02-18'
    },
    {
      name: 'Shelcal 500',
      brand: 'Shelcal',
      active_ingredient: 'Calcium (500mg) + Vitamin D3 (250 IU)',
      strength: '500 mg',
      dosage_form: 'Tablet',
      manufacturer: 'Torrent Pharmaceuticals Ltd',
      purpose_en: 'Bone health supplement. Prevents and treats calcium and vitamin D deficiency, osteoporosis, and weak bones.',
      purpose_kn: 'ಮೂಳೆಗಳ ಆರೋಗ್ಯ ಮತ್ತು ಬಲವರ್ಧನೆಗೆ. ಕ್ಯಾಲ್ಸಿಯಂ ಮತ್ತು ವಿಟಮಿನ್ ಡಿ ಕೊರತೆ ನಿವಾರಿಸಲು ಬಳಸುವ ಪೂರಕ ಔಷಧಿ.',
      instructions_en: 'Take once daily after a major meal (lunch or dinner) with plenty of water for optimal absorption.',
      instructions_kn: 'ಊಟದ ನಂತರ (ಮಧ್ಯಾಹ್ನ ಅಥವಾ ರಾತ್ರಿ) ಸಾಕಷ್ಟು ನೀರಿನೊಂದಿಗೆ ಸೇವಿಸಿ.',
      precautions_en: 'Avoid taking simultaneously with iron supplements; maintain a 2-hour gap between them.',
      precautions_kn: 'ಕಬ್ಬಿಣಾಂಶದ (ಐರನ್) ಮಾತ್ರೆಗಳ ಜೊತೆಯಲ್ಲೇ ಸೇವಿಸಬೇಡಿ; ಎರಡರ ನಡುವೆ ಕನಿಷ್ಠ ೨ ಗಂಟೆಗಳ ಅಂತರವಿರಲಿ.',
      source: 'Indian Pharmacopoeia',
      date: '2026-03-05'
    },
    {
      name: 'Atorva 10',
      brand: 'Atorva',
      active_ingredient: 'Atorvastatin',
      strength: '10 mg',
      dosage_form: 'Tablet',
      manufacturer: 'Zydus Healthcare Ltd',
      purpose_en: 'Statin (HMG-CoA reductase inhibitor). Lowers elevated LDL cholesterol and triglycerides while reducing heart disease risk.',
      purpose_kn: 'ಕೊಲೆಸ್ಟ್ರಾಲ್ ನಿಯಂತ್ರಣಕ್ಕೆ. ರಕ್ತದಲ್ಲಿನ ಕೆಟ್ಟ ಕೊಬ್ಬನ್ನು (ಕೊಲೆಸ್ಟ್ರಾಲ್) ಕಡಿಮೆ ಮಾಡಲು ಮತ್ತು ಹೃದಯದ ಆರೋಗ್ಯ ಕಾಪಾಡಲು ಬಳಸಲಾಗುತ್ತದೆ.',
      instructions_en: 'Take once daily in the evening or night with or without food. Maintain a healthy low-fat diet.',
      instructions_kn: 'ಪ್ರತಿದಿನ ಸಂಜೆ ಅಥವಾ ರಾತ್ರಿ ಊಟದ ನಂತರ ಸೇವಿಸಿ. ಕಡಿಮೆ ಕೊಬ್ಬಿನ ಆಹಾರ ಕ್ರಮವನ್ನು ಅನುಸರಿಸಿ.',
      precautions_en: 'Report unexplained muscle aches or fatigue immediately. Avoid grapefruit juice.',
      precautions_kn: 'ವಿವರಿಸಲಾಗದ ಸ್ನಾಯು ನೋವು ಅಥವಾ ನಿಶ್ಯಕ್ತಿ ಕಂಡುಬಂದರೆ ವೈದ್ಯರಿಗೆ ತಿಳಿಸಿ. ಗ್ರೇಪ್‌ಫ್ರೂಟ್ ಜ್ಯೂಸ್ ಸೇವಿಸಬೇಡಿ.',
      source: 'WHO Model List / CDSCO',
      date: '2026-02-12'
    },
    {
      name: 'Amlong 5',
      brand: 'Amlong',
      active_ingredient: 'Amlodipine',
      strength: '5 mg',
      dosage_form: 'Tablet',
      manufacturer: 'Micro Labs Ltd',
      purpose_en: 'Calcium channel blocker for treating high blood pressure (hypertension) and angina (chest pain).',
      purpose_kn: 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡ ಮತ್ತು ಎದೆನೋವು (ಆಂಜಿನಾ) ನಿಯಂತ್ರಿಸಲು ಬಳಸುವ ಔಷಧಿ.',
      instructions_en: 'Take once daily at the same time each day, with or without food.',
      instructions_kn: 'ಪ್ರತಿದಿನ ನಿಗದಿತ ಸಮಯದಲ್ಲಿ ಊಟದೊಂದಿಗೆ ಅಥವಾ ಇಲ್ಲದೆ ಸೇವಿಸಿ.',
      precautions_en: 'May cause peripheral ankle swelling. Inform doctor if swelling occurs or blood pressure drops too low.',
      precautions_kn: 'ಹಿಮ್ಮಡಿಗಳಲ್ಲಿ ಊತ ಕಾಣಿಸಿಕೊಳ್ಳಬಹುದು. ಅತಿಯಾದ ಊತ ಅಥವಾ ತಲೆತಿರುಗುವಿಕೆ ಉಂಟಾದರೆ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.',
      source: 'Indian Pharmacopoeia',
      date: '2026-01-28'
    }
  ];

  for (const m of initialMedicines) {
    stmt.run(
      m.name,
      m.brand,
      m.active_ingredient,
      m.strength,
      m.dosage_form,
      m.manufacturer,
      m.purpose_en,
      m.purpose_kn,
      m.instructions_en,
      m.instructions_kn,
      m.precautions_en,
      m.precautions_kn,
      m.source,
      m.date
    );
  }

  // Pre-seed an initial cabinet item and active reminder schedule for out-of-the-box delight
  const cabinetStmt = db.prepare(`
    INSERT INTO personal_cabinet (
      user_id, medicine_id, custom_name, brand, active_ingredient, strength,
      dosage_form, current_stock, prescription_instructions, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  cabinetStmt.run(
    'user_primary',
    1,
    'Dolo 650',
    'Dolo',
    'Paracetamol',
    '650 mg',
    'Tablet',
    15,
    '1 tablet twice daily after meals as needed for fever/headache',
    'Dr. Ramesh prescription',
    now,
    now
  );

  cabinetStmt.run(
    'user_primary',
    3,
    'Pantocid 40',
    'Pantocid',
    'Pantoprazole',
    '40 mg',
    'Tablet',
    28,
    '1 tablet once daily morning 30 min before food',
    'Acid reflux management',
    now,
    now
  );

  const reminderStmt = db.prepare(`
    INSERT INTO reminder_schedules (
      user_id, medicine_id, medicine_name, tablets_per_dose, dosage_unit,
      doses_per_day, scheduled_times, start_date, days_of_week, meal_instruction,
      meal_instruction_kn, sound_preference, vibration_enabled, timezone, status,
      notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Example: Dolo 650: 1 tablet per dose, 2 doses per day at 08:00 and 20:00
  const today = new Date().toISOString().split('T')[0];
  reminderStmt.run(
    'user_primary',
    1,
    'Dolo 650',
    1,
    'tablet',
    2,
    JSON.stringify(['08:00', '20:00']),
    today,
    'daily',
    'after_food',
    'ಊಟದ ನಂತರ',
    'chime',
    1,
    'Asia/Kolkata',
    'active',
    'Take 1 tablet after meals with water',
    now,
    now
  );

  // Pantocid 40: 1 tablet once daily at 07:30 before food
  reminderStmt.run(
    'user_primary',
    3,
    'Pantocid 40',
    1,
    'tablet',
    1,
    JSON.stringify(['07:30']),
    today,
    'daily',
    'before_food',
    'ಊಟಕ್ಕೆ ಮುಂಚೆ',
    'bell',
    1,
    'Asia/Kolkata',
    'active',
    'Take before breakfast on an empty stomach',
    now,
    now
  );
}
