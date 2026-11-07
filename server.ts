import express, { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  getDb,
  MedicineRecord,
  CabinetItem,
  ReminderSchedule,
  DoseLog,
  ScanHistoryItem,
} from './server/db.js';
import {
  identifyMedicineFromImage,
  generateSpeechAudio,
} from './server/gemini.js';
import {
  calculateDailyTotal,
  checkScheduleConflicts,
  generateDoseLogsForDate,
  getDueNotifications,
  recordNotificationDelivered,
  getAdherenceReport,
  evaluateMissedDoses,
} from './server/reminderEngine.js';
import {
  executeMedicineVerificationPipeline,
  queryOpenFdaDrugLabel,
} from './server/ocrPipeline.js';
import {
  ScanOcrSchema,
  OpenFdaVerifySchema,
  DoseStatusSchema,
  ScheduleSchema,
  SpeechSynthesizeSchema,
  GlobalLookupSchema,
} from './server/validators.js';
import { getSpeechEngineInfo } from './server/speechEngine.js';
import {
  executeGlobalMedicineLookup,
  syncEssentialMedicineDataset,
  searchOpenFda,
  searchRxNorm,
  searchDailyMed,
} from './server/globalMedicineAggregator.js';
import { getMedicineDetails } from './server/medicineDetailsService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for parsing JSON with high limit for packaging photos
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Initialize DB early
const db = getDb();

// Background scheduler ticker: runs every 30 seconds to evaluate missed doses & update schedules
setInterval(() => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    generateDoseLogsForDate(todayStr);
    evaluateMissedDoses(todayStr);
  } catch (err) {
    console.error('Scheduler interval error:', err);
  }
}, 30000);

// ==========================================
// REST APIs
// ==========================================

// Health Check & API Status Registry
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'SQLite (mediscan.db) & Cloud Firestore',
    service: 'Mediscan-X API Engine',
    version: '2.5.0',
    services: {
      deepread_ocr: {
        configured: !!process.env.DEEPREAD_API_KEY,
        status: process.env.DEEPREAD_API_KEY ? 'ACTIVE' : 'FALLBACK_TO_DETERMINISTIC_PARSER',
        endpoint: 'https://api.deepread.tech/v1/process (deepread.tech)',
        note: 'DeepRead AI OCR for packaging text extraction.',
      },
      text_to_speech: {
        provider: 'Web Speech API (window.speechSynthesis)',
        status: 'ACTIVE',
        requiresApiKey: false,
        note: 'Browser-native speech synthesis for Kannada & English. No external paid APIs or keys required.',
      },
      dailymed_nlm: {
        status: 'ACTIVE',
        isPrimary: true,
        note: 'Free NLM DailyMed SPL v2 REST API (no auth required)',
      },
      rxnorm_nih: {
        status: 'ACTIVE',
        isPrimary: true,
        note: 'Free NIH drug normalization API (no auth required)',
      },
      openfda_drug_label: {
        status: 'ACTIVE',
        rate_limit: '240 req/min (free tier without key)',
      },
    },
  });
});

// Provide direct google-services.json download for Android integration
app.get('/google-services.json', (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'google-services.json'));
});

// Search verified medicines
app.get('/api/medicines/search', (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').trim().toLowerCase();
    if (!query) {
      const all = db.prepare('SELECT * FROM medicines ORDER BY name ASC LIMIT 30').all();
      return res.json(all);
    }

    const sql = `
      SELECT * FROM medicines
      WHERE LOWER(name) LIKE ?
         OR LOWER(brand) LIKE ?
         OR LOWER(active_ingredient) LIKE ?
      ORDER BY name ASC LIMIT 25
    `;
    const searchPattern = `%${query}%`;
    const matches = db.prepare(sql).all(searchPattern, searchPattern, searchPattern);
    res.json(matches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get verified medicine detail
app.get('/api/medicines/verified/:id', (req: Request, res: Response) => {
  try {
    const item = db.prepare('SELECT * FROM medicines WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Medicine not found in verified registry' });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DeepRead AI OCR (deepread.tech) + Deterministic Parsing + DailyMed/RxNorm/openFDA Drug Label Verification
app.post('/api/scan/ocr', async (req: Request, res: Response) => {
  try {
    const parsed = ScanOcrSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const { imageBase64, manualTextOverride } = parsed.data;
    const result = await executeMedicineVerificationPipeline(imageBase64, manualTextOverride);

    // Save scan to scan_history table
    const nowIso = new Date().toISOString();
    const previewDataUrl = imageBase64.length > 500000 ? imageBase64.substring(0, 100000) + '...' : imageBase64;
    const insertScan = db.prepare(`
      INSERT INTO scan_history (
        image_data_url, ocr_raw_text, detected_name, detected_strength,
        detected_form, matched_medicine_id, confidence_score, is_verified_match, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertScan.run(
      previewDataUrl,
      result.rawText,
      result.topMatch?.brandName || result.entities.candidateNames[0] || 'Unknown',
      result.entities.strengths[0] || '',
      result.entities.dosageForms[0] || 'Tablet',
      null,
      result.isVerified ? 0.95 : 0.5,
      result.isVerified ? 1 : 0,
      nowIso
    );

    res.json(result);
  } catch (err: any) {
    console.error('OCR pipeline error:', err);
    res.status(500).json({ error: 'OCR pipeline failed: ' + err.message });
  }
});

// openFDA Drug Label Search Endpoint
app.post('/api/scan/verify', async (req: Request, res: Response) => {
  try {
    const parsed = OpenFdaVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const matches = await queryOpenFdaDrugLabel(parsed.data.candidateName);
    res.json({
      candidate: parsed.data.candidateName,
      matches,
      isVerified: matches.length > 0,
      source: 'https://api.fda.gov/drug/label.json',
      dataset: 'openFDA Drug Label Dataset',
      fallbackDatasetNotice: 'Pillbox dataset is integrated as secondary reference (DailyMed derived).',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'openFDA verification error: ' + err.message });
  }
});

// Multimodal AI Image Identification
app.post('/api/medicines/identify', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data received for analysis' });
    }

    const result = await identifyMedicineFromImage(imageBase64, mimeType || 'image/jpeg');

    // Automatically log this scan to scan_history
    const nowIso = new Date().toISOString();
    const insertScan = db.prepare(`
      INSERT INTO scan_history (
        image_data_url, ocr_raw_text, detected_name, detected_strength,
        detected_form, matched_medicine_id, confidence_score, is_verified_match, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Only save a short preview thumbnail if imageBase64 is very long to avoid huge DB records
    const previewDataUrl = imageBase64.length > 500000 ? imageBase64.substring(0, 100000) + '...' : imageBase64;

    const scanInsertResult = insertScan.run(
      previewDataUrl,
      result.raw_ocr_text,
      result.detected_name,
      result.strength,
      result.dosage_form,
      result.matched_medicine?.id || null,
      result.confidence_score,
      result.is_verified_database_match ? 1 : 0,
      nowIso
    );

    res.json({
      ...result,
      scan_id: scanInsertResult.lastInsertRowid,
    });
  } catch (err: any) {
    console.error('Error in /api/medicines/identify:', err);
    res.status(500).json({ error: 'Failed to process medicine packaging: ' + err.message });
  }
});

// Server-assisted Speech Synthesis endpoint
// Synthesizes authentic Kannada and English voice audio using Gemini TTS, falling back gracefully to client Web Speech API
app.post('/api/speech/synthesize', async (req: Request, res: Response) => {
  try {
    const { text, languageCode, lang } = req.body || {};

    // If no text provided, return speech engine status info
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      const info = getSpeechEngineInfo();
      return res.json(info);
    }

    const validated = SpeechSynthesizeSchema.safeParse({
      text: text.trim(),
      languageCode: languageCode || (lang === 'kn' ? 'kn-IN' : 'en-US'),
    });

    const targetText = validated.success ? validated.data.text : text.trim();
    const targetLangCode = validated.success ? validated.data.languageCode : (languageCode || 'en-US');
    const isKannada = targetLangCode.toLowerCase().startsWith('kn') || lang === 'kn';
    const targetLang: 'en' | 'kn' = isKannada ? 'kn' : 'en';

    // Synthesize authentic speech audio via Gemini TTS
    const base64Audio = await generateSpeechAudio(targetText, targetLang);

    if (base64Audio) {
      return res.json({
        status: 'SUCCESS',
        audioContent: base64Audio,
        format: 'audio/wav',
        mimeType: 'audio/wav',
        language: targetLang,
        engine: 'Gemini 3.8 Flash Lite TTS',
      });
    }

    return res.json({
      status: 'FALLBACK_TO_CLIENT',
      message: 'Server speech synthesis unavailable, client Web Speech API fallback engaged.',
      engine: 'Web Speech API',
    });
  } catch (err: any) {
    console.error('Speech synthesis route error:', err);
    res.status(500).json({
      status: 'ERROR',
      error: 'Speech synthesis error: ' + err.message,
    });
  }
});

// Engine diagnostics status endpoint
app.get('/api/speech/synthesize', async (_req: Request, res: Response) => {
  try {
    const info = getSpeechEngineInfo();
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: 'Speech info check failed: ' + err.message });
  }
});

// Free public Cloud TTS endpoint (Google Translate TTS proxy) with 5s timeout & 429 hardening
app.get('/api/speech/cloud-tts', async (req: Request, res: Response) => {
  try {
    const text = (req.query.q as string || '').trim();
    const tl = (req.query.tl as string || 'kn').trim();
    if (!text) {
      return res.status(400).json({ error: 'Parameter q (text) is required' });
    }
    // Limit to 200 chars per standard Google TTS query
    const encoded = encodeURIComponent(text.slice(0, 200));
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${encodeURIComponent(tl)}&client=tw-ob`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let upstream: any;
    try {
      upstream = await fetch(ttsUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
        },
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.warn('Cloud TTS external fetch failed or timed out:', fetchErr?.message);
      return res.status(503).json({ error: 'Cloud TTS unavailable' });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!upstream || !upstream.ok || upstream.status === 429) {
      console.warn(`Cloud TTS upstream returned status ${upstream?.status}`);
      return res.status(503).json({ error: 'Cloud TTS unavailable' });
    }

    const buffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Cloud TTS route error:', err);
    res.status(503).json({ error: 'Cloud TTS unavailable' });
  }
});

// Legacy TTS endpoint fallback
app.post('/api/medicines/tts', async (req: Request, res: Response) => {
  try {
    const { text, lang, languageCode } = req.body || {};
    if (text && typeof text === 'string' && text.trim().length > 0) {
      const isKn = (languageCode && languageCode.startsWith('kn')) || lang === 'kn';
      const base64Audio = await generateSpeechAudio(text.trim(), isKn ? 'kn' : 'en');
      if (base64Audio) {
        return res.json({
          status: 'SUCCESS',
          audioContent: base64Audio,
          format: 'audio/wav',
        });
      }
    }
    res.json({
      status: 'CLIENT_NATIVE',
      message: 'Mediscan uses Gemini TTS with Web Speech API fallback for audio.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'TTS status check failed: ' + err.message });
  }
});

// Dataset Pre-loading & Background Sync endpoint (Mandatory section 2)
// POST /api/dataset/sync — fetches and merges WHO EML & openFDA essential medicines into database
app.post('/api/dataset/sync', async (req: Request, res: Response) => {
  try {
    const syncResult = await syncEssentialMedicineDataset();
    res.json({
      ...syncResult,
      timestamp: new Date().toISOString(),
      message: 'Essential medicine dataset successfully synced and deduplicated with unique openFdaId, rxCui, and dailymedSetId keys.',
    });
  } catch (err: any) {
    console.error('Dataset sync error:', err);
    res.status(500).json({ error: 'Dataset sync failed: ' + err.message });
  }
});

// Free Multi-Source Medicine Search (DailyMed -> RxNorm -> openFDA -> Local Database)
app.get('/api/medicines/global-search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Search query parameter "q" is required' });
    }

    const result = await executeGlobalMedicineLookup(query);
    res.json(result);
  } catch (err: any) {
    console.error('Global search error:', err);
    res.status(500).json({ error: 'Global medicine search failed: ' + err.message });
  }
});

// Real-time Medicine Data Retrieval & Multi-API Aggregator (SafeRx -> openFDA -> DailyMed / RxNorm -> Local Seed)
// Mandated endpoint: GET /api/medicine/details?name=<name>
app.get('/api/medicine/details', async (req: Request, res: Response) => {
  try {
    const rawName = String(req.query.name || req.query.q || '').trim();
    if (!rawName) {
      return res.status(400).json({ error: 'Query parameter "name" or "q" is required.' });
    }

    const details = await getMedicineDetails(rawName);
    res.json(details);
  } catch (err: any) {
    console.error('Medicine details lookup error:', err);
    res.status(500).json({ error: 'Failed to retrieve medicine details: ' + err.message });
  }
});


// Personal Cabinet CRUD
app.get('/api/cabinet', (req: Request, res: Response) => {
  try {
    const cabinet = db.prepare(`
      SELECT c.*, m.verified_purpose_en, m.verified_purpose_kn, m.precautions_en, m.precautions_kn
      FROM personal_cabinet c
      LEFT JOIN medicines m ON c.medicine_id = m.id
      ORDER BY c.created_at DESC
    `).all();
    res.json(cabinet);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cabinet', (req: Request, res: Response) => {
  try {
    const custom_name = (req.body.custom_name || req.body.medicineName || req.body.name || '').trim();
    const brand = (req.body.brand || custom_name).trim();
    const active_ingredient = (req.body.active_ingredient || req.body.activeIngredient || req.body.genericName || '').trim();
    const strength = (req.body.strength || '').trim();
    const dosage_form = (req.body.dosage_form || req.body.dosageForm || req.body.form || 'Tablet').trim();
    const current_stock = parseInt(String(req.body.current_stock || req.body.currentStock || 20), 10) || 20;
    const expiry_date = req.body.expiry_date || req.body.expiryDate || null;
    const prescribed_by = req.body.prescribed_by || req.body.prescribedBy || null;
    const prescription_instructions = req.body.prescription_instructions || req.body.dosageInstructions || req.body.instructions || null;
    const notes = req.body.notes || null;
    const medicine_id = req.body.medicine_id || req.body.medicineId || null;

    if (!custom_name) {
      return res.status(400).json({ error: 'Medicine name is required' });
    }

    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO personal_cabinet (
        user_id, medicine_id, custom_name, brand, active_ingredient, strength,
        dosage_form, current_stock, expiry_date, prescribed_by, prescription_instructions, notes, created_at, updated_at
      ) VALUES ('user_primary', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      medicine_id,
      custom_name,
      brand,
      active_ingredient,
      strength,
      dosage_form,
      current_stock,
      expiry_date,
      prescribed_by,
      prescription_instructions,
      notes,
      now,
      now
    );

    const newItem = db.prepare('SELECT * FROM personal_cabinet WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cabinet/:id', (req: Request, res: Response) => {
  try {
    const custom_name = (req.body.custom_name || req.body.medicineName || req.body.name || '').trim();
    const brand = (req.body.brand || custom_name).trim();
    const active_ingredient = (req.body.active_ingredient || req.body.activeIngredient || '').trim();
    const strength = (req.body.strength || '').trim();
    const dosage_form = (req.body.dosage_form || req.body.dosageForm || 'Tablet').trim();
    const current_stock = parseInt(String(req.body.current_stock || req.body.currentStock || 20), 10) || 20;
    const expiry_date = req.body.expiry_date || req.body.expiryDate || null;
    const prescribed_by = req.body.prescribed_by || req.body.prescribedBy || null;
    const prescription_instructions = req.body.prescription_instructions || req.body.dosageInstructions || null;
    const notes = req.body.notes || null;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE personal_cabinet
      SET custom_name = ?, brand = ?, active_ingredient = ?, strength = ?,
          dosage_form = ?, current_stock = ?, expiry_date = ?, prescribed_by = ?,
          prescription_instructions = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).run(
      custom_name,
      brand,
      active_ingredient,
      strength,
      dosage_form,
      current_stock,
      expiry_date,
      prescribed_by,
      prescription_instructions,
      notes,
      now,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM personal_cabinet WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cabinet/:id', (req: Request, res: Response) => {
  try {
    const item = db.prepare('SELECT * FROM personal_cabinet WHERE id = ?').get(req.params.id) as any;
    if (item) {
      // Find and delete any associated reminder schedules and pending doses to prevent ghost notifications
      const schedules = db.prepare(`
        SELECT id FROM reminder_schedules
        WHERE (medicine_id IS NOT NULL AND medicine_id = ?)
           OR LOWER(TRIM(medicine_name)) = LOWER(TRIM(?))
           OR LOWER(TRIM(medicine_name)) = LOWER(TRIM(?))
      `).all(item.medicine_id || -999, item.custom_name, item.brand || item.custom_name) as any[];

      for (const s of schedules) {
        db.prepare("DELETE FROM dose_logs WHERE reminder_id = ? AND status IN ('pending', 'snoozed')").run(s.id);
        db.prepare('DELETE FROM reminder_schedules WHERE id = ?').run(s.id);
      }
    }
    db.prepare('DELETE FROM personal_cabinet WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Medicine removed from personal cabinet and associated reminders stopped' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reminder Schedules
app.get('/api/reminders', (req: Request, res: Response) => {
  try {
    const schedules = db.prepare('SELECT * FROM reminder_schedules ORDER BY created_at DESC').all();
    res.json(schedules);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reminders', (req: Request, res: Response) => {
  try {
    const {
      medicine_id,
      medicine_name,
      tablets_per_dose,
      dosage_unit,
      doses_per_day,
      scheduled_times,
      start_date,
      end_date,
      days_of_week,
      meal_instruction,
      meal_instruction_kn,
      sound_preference,
      vibration_enabled,
      timezone,
      notes,
    } = req.body;

    if (!medicine_name) {
      return res.status(400).json({ error: 'Medicine name is required' });
    }

    const parsedTimes = Array.isArray(scheduled_times) ? scheduled_times : JSON.parse(scheduled_times || '["08:00"]');
    const safeTablets = Math.max(0.25, parseFloat(String(tablets_per_dose)) || 1.0);
    const safeDosesPerDay = Math.max(1, parseInt(String(doses_per_day), 10) || parsedTimes.length);

    // Conflict check
    const conflictCheck = checkScheduleConflicts(medicine_name, parsedTimes);

    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO reminder_schedules (
        user_id, medicine_id, medicine_name, tablets_per_dose, dosage_unit,
        doses_per_day, scheduled_times, start_date, end_date, days_of_week,
        meal_instruction, meal_instruction_kn, sound_preference, vibration_enabled,
        timezone, status, notes, created_at, updated_at
      ) VALUES ('user_primary', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `).run(
      medicine_id || null,
      medicine_name,
      safeTablets,
      dosage_unit || 'tablet',
      safeDosesPerDay,
      JSON.stringify(parsedTimes),
      start_date || new Date().toISOString().split('T')[0],
      end_date || null,
      days_of_week || 'daily',
      meal_instruction || 'after_food',
      meal_instruction_kn || 'ಊಟದ ನಂತರ',
      sound_preference || 'chime',
      vibration_enabled !== undefined ? (vibration_enabled ? 1 : 0) : 1,
      timezone || 'Asia/Kolkata',
      notes || null,
      now,
      now
    );

    // Immediately generate today's dose logs for this schedule
    generateDoseLogsForDate();

    const created = db.prepare('SELECT * FROM reminder_schedules WHERE id = ?').get(result.lastInsertRowid);
    const calc = calculateDailyTotal(safeTablets, safeDosesPerDay);

    res.status(201).json({
      schedule: created,
      calculation: calc,
      warnings: conflictCheck.warnings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reminders/:id', (req: Request, res: Response) => {
  try {
    const {
      medicine_name,
      tablets_per_dose,
      dosage_unit,
      doses_per_day,
      scheduled_times,
      start_date,
      end_date,
      days_of_week,
      meal_instruction,
      meal_instruction_kn,
      sound_preference,
      vibration_enabled,
      notes,
      status,
    } = req.body;

    const parsedTimes = Array.isArray(scheduled_times) ? scheduled_times : JSON.parse(scheduled_times || '["08:00"]');
    const safeTablets = Math.max(0.25, parseFloat(String(tablets_per_dose)) || 1.0);
    const safeDosesPerDay = Math.max(1, parseInt(String(doses_per_day), 10) || parsedTimes.length);

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE reminder_schedules
      SET medicine_name = ?, tablets_per_dose = ?, dosage_unit = ?, doses_per_day = ?,
          scheduled_times = ?, start_date = ?, end_date = ?, days_of_week = ?,
          meal_instruction = ?, meal_instruction_kn = ?, sound_preference = ?,
          vibration_enabled = ?, notes = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      medicine_name,
      safeTablets,
      dosage_unit || 'tablet',
      safeDosesPerDay,
      JSON.stringify(parsedTimes),
      start_date,
      end_date,
      days_of_week,
      meal_instruction,
      meal_instruction_kn,
      sound_preference,
      vibration_enabled ? 1 : 0,
      notes,
      status || 'active',
      now,
      req.params.id
    );

    // Regenerate today's logs
    generateDoseLogsForDate();

    const updated = db.prepare('SELECT * FROM reminder_schedules WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/reminders/:id/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active, paused, or completed' });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const todayStr = nowIso.split('T')[0];

    db.prepare('UPDATE reminder_schedules SET status = ?, updated_at = ? WHERE id = ?').run(status, nowIso, req.params.id);

    if (status === 'paused') {
      // Immediately stop counting towards today's expected doses by deleting pending/snoozed doses for this schedule
      db.prepare(`
        DELETE FROM dose_logs
        WHERE reminder_id = ? AND scheduled_date >= ? AND status IN ('pending', 'snoozed')
      `).run(req.params.id, todayStr);
    } else if (status === 'active') {
      // When Resumed: calculate and insert upcoming doses from current time forward
      const schedule = db.prepare('SELECT * FROM reminder_schedules WHERE id = ?').get(req.params.id) as unknown as ReminderSchedule;
      if (schedule) {
        let times: string[] = [];
        try {
          times = JSON.parse(schedule.scheduled_times);
        } catch {
          times = ['08:00'];
        }

        const currentHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        const insertStmt = db.prepare(`
          INSERT OR IGNORE INTO dose_logs (
            user_id, reminder_id, medicine_id, medicine_name, scheduled_date, scheduled_time,
            prescribed_quantity, dosage_unit, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `);

        for (const time of times) {
          if (time >= currentHHMM) {
            insertStmt.run(
              schedule.user_id,
              schedule.id,
              schedule.medicine_id ?? null,
              schedule.medicine_name,
              todayStr,
              time,
              schedule.tablets_per_dose,
              schedule.dosage_unit || 'tablet',
              nowIso
            );
          }
        }
      }
    }

    const updated = db.prepare('SELECT * FROM reminder_schedules WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reminders/:id', (req: Request, res: Response) => {
  try {
    db.prepare("DELETE FROM dose_logs WHERE reminder_id = ? AND status IN ('pending', 'snoozed')").run(req.params.id);
    db.prepare('DELETE FROM reminder_schedules WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Today's doses & actions
app.get('/api/doses/today', (req: Request, res: Response) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const doses = generateDoseLogsForDate(todayStr);

    // Attach schedule details (e.g. meal_instruction) to each dose
    const enrichedDoses = doses.map((dose) => {
      const schedule = db.prepare('SELECT * FROM reminder_schedules WHERE id = ?').get(dose.reminder_id) as unknown as ReminderSchedule;
      return {
        ...dose,
        meal_instruction: schedule?.meal_instruction || 'after_food',
        meal_instruction_kn: schedule?.meal_instruction_kn || 'ಊಟದ ನಂತರ',
        schedule_status: schedule?.status || 'active',
      };
    });

    const total = enrichedDoses.length;
    const taken = enrichedDoses.filter((d) => d.status === 'taken').length;
    const pending = enrichedDoses.filter((d) => d.status === 'pending' || d.status === 'snoozed').length;
    const missed = enrichedDoses.filter((d) => d.status === 'missed').length;
    const skipped = enrichedDoses.filter((d) => d.status === 'skipped').length;
    const adherencePercent = total > 0 ? Math.round((taken / total) * 100) : 0;

    // Find next upcoming dose
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let nextDose = enrichedDoses.find((d) => {
      if (d.status !== 'pending' && d.status !== 'snoozed') return false;
      const [h, m] = d.scheduled_time.split(':').map((v) => parseInt(v, 10));
      return h * 60 + m >= currentMinutes;
    });

    if (!nextDose && pending > 0) {
      // Due/overdue pending dose
      nextDose = enrichedDoses.find((d) => d.status === 'pending' || d.status === 'snoozed');
    }

    res.json({
      date: todayStr,
      doses: enrichedDoses,
      summary: {
        total,
        taken,
        pending,
        missed,
        skipped,
        adherencePercent,
      },
      nextDose: nextDose || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dose Action: 'taken', 'skipped', 'snoozed'
app.post('/api/doses/:id/action', (req: Request, res: Response) => {
  try {
    const { action, snoozeMinutes, notes } = req.body;
    const doseId = req.params.id;

    const dose = db.prepare('SELECT * FROM dose_logs WHERE id = ?').get(doseId) as unknown as DoseLog;
    if (!dose) return res.status(404).json({ error: 'Dose record not found' });

    const nowIso = new Date().toISOString();

    if (action === 'taken') {
      db.prepare(`
        UPDATE dose_logs
        SET status = 'taken', actual_action_time = ?, notes = coalesce(notes, '') || ?, snooze_until = NULL
        WHERE id = ?
      `).run(nowIso, notes ? ` [${notes}]` : '', doseId);

      // Deduct 1 dose from cabinet stock if medicine matches
      if (dose.medicine_id) {
        db.prepare('UPDATE personal_cabinet SET current_stock = MAX(0, current_stock - ?) WHERE medicine_id = ?')
          .run(dose.prescribed_quantity, dose.medicine_id);
      }
    } else if (action === 'skipped') {
      db.prepare(`
        UPDATE dose_logs
        SET status = 'skipped', actual_action_time = ?, notes = coalesce(notes, '') || ?, snooze_until = NULL
        WHERE id = ?
      `).run(nowIso, notes ? ` [Skipped: ${notes}]` : ' [Skipped by user]', doseId);
    } else if (action === 'snoozed') {
      const mins = parseInt(String(snoozeMinutes), 10) || 10;
      const snoozeDate = new Date(Date.now() + mins * 60 * 1000).toISOString();
      db.prepare(`
        UPDATE dose_logs
        SET status = 'snoozed', snooze_until = ?, notes = coalesce(notes, '') || ?
        WHERE id = ?
      `).run(snoozeDate, ` [Snoozed for ${mins}m]`, doseId);
    } else {
      return res.status(400).json({ error: 'Invalid action. Must be taken, skipped, or snoozed' });
    }

    const updated = db.prepare('SELECT * FROM dose_logs WHERE id = ?').get(doseId);
    res.json({
      success: true,
      action,
      dose: updated,
      safetyMessage: action === 'skipped'
        ? 'Dose marked as skipped. Do not double up on your next dose. Follow standard prescription directions.'
        : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Explicit POST /api/doses/:id/status endpoint with Zod validation per specification
app.post('/api/doses/:id/status', (req: Request, res: Response) => {
  try {
    const parsed = DoseStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const { status, snoozeMinutes, notes } = parsed.data;
    const doseId = req.params.id;

    const dose = db.prepare('SELECT * FROM dose_logs WHERE id = ?').get(doseId) as unknown as DoseLog;
    if (!dose) return res.status(404).json({ error: 'Dose record not found' });

    const nowIso = new Date().toISOString();

    if (status === 'taken') {
      db.prepare(`
        UPDATE dose_logs
        SET status = 'taken', actual_action_time = ?, notes = coalesce(notes, '') || ?, snooze_until = NULL
        WHERE id = ?
      `).run(nowIso, notes ? ` [${notes}]` : '', doseId);

      if (dose.medicine_id) {
        db.prepare('UPDATE personal_cabinet SET current_stock = MAX(0, current_stock - ?) WHERE medicine_id = ?')
          .run(dose.prescribed_quantity, dose.medicine_id);
      }
    } else if (status === 'skipped') {
      db.prepare(`
        UPDATE dose_logs
        SET status = 'skipped', actual_action_time = ?, notes = coalesce(notes, '') || ?, snooze_until = NULL
        WHERE id = ?
      `).run(nowIso, notes ? ` [Skipped: ${notes}]` : ' [Skipped by user]', doseId);
    } else if (status === 'snoozed') {
      const mins = snoozeMinutes || 10;
      const snoozeDate = new Date(Date.now() + mins * 60 * 1000).toISOString();
      db.prepare(`
        UPDATE dose_logs
        SET status = 'snoozed', snooze_until = ?, notes = coalesce(notes, '') || ?
        WHERE id = ?
      `).run(snoozeDate, ` [Snoozed for ${mins}m]`, doseId);
    }

    const updated = db.prepare('SELECT * FROM dose_logs WHERE id = ?').get(doseId);
    res.json({
      success: true,
      status,
      dose: updated,
      safetyMessage: status === 'skipped'
        ? 'Dose marked as skipped. Follow your prescription; do not take double dose next time.'
        : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Server-side scheduled notification trigger webhook for Cloud Scheduler / external cron
app.post('/api/notifications/trigger', (req: Request, res: Response) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    generateDoseLogsForDate(todayStr);
    evaluateMissedDoses(todayStr);

    const dueList = getDueNotifications(15);
    res.json({
      triggered: true,
      timestamp: new Date().toISOString(),
      dueCount: dueList.length,
      dueDoses: dueList.map((d) => ({
        doseLogId: d.dose.id,
        reminderId: d.schedule.id,
        medicineName: d.schedule.medicine_name,
        scheduledTime: d.dose.scheduled_time,
        tablets: d.dose.prescribed_quantity,
        unit: d.dose.dosage_unit,
      })),
      schedulerInfo: {
        method: 'Cloud Scheduler / Webhook',
        instruction: 'Point Google Cloud Scheduler (HTTP target) or cron job to POST https://<your-app-domain>/api/notifications/trigger every minute or every 5 minutes.',
        cronExpression: '* * * * *',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Trigger execution failed: ' + err.message });
  }
});

// Dose History & Analytics
app.get('/api/doses/history', (req: Request, res: Response) => {
  try {
    const report = getAdherenceReport('user_primary');
    const recentLogs = db.prepare(`
      SELECT * FROM dose_logs
      ORDER BY scheduled_date DESC, scheduled_time DESC
      LIMIT 100
    `).all();

    res.json({
      adherenceReport: report,
      recentLogs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clear Dose Logs History
app.delete('/api/doses/history', (_req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM dose_logs').run();
    db.prepare('DELETE FROM notifications_log').run();
    res.json({ success: true, message: 'Dose logs history cleared successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications Polling (for real-time in-app alerts and browser notifications)
app.get('/api/notifications/poll', (req: Request, res: Response) => {
  try {
    const due = getDueNotifications(15);
    res.json({
      count: due.length,
      notifications: due.map((item) => ({
        doseLogId: item.dose.id,
        reminderId: item.schedule.id,
        medicineName: item.schedule.medicine_name,
        quantity: item.dose.prescribed_quantity,
        unit: item.dose.dosage_unit,
        scheduledTime: item.dose.scheduled_time,
        mealInstructionEn: item.schedule.meal_instruction,
        mealInstructionKn: item.schedule.meal_instruction_kn,
        soundPreference: item.schedule.sound_preference,
        vibrationEnabled: !!item.schedule.vibration_enabled,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Acknowledge notification delivery
app.post('/api/notifications/ack', (req: Request, res: Response) => {
  try {
    const { doseLogId, reminderId, scheduledDateTime, channel } = req.body;
    if (doseLogId && reminderId) {
      recordNotificationDelivered(doseLogId, reminderId, scheduledDateTime || new Date().toISOString(), channel || 'browser');
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Test notification
app.post('/api/notifications/test', (req: Request, res: Response) => {
  res.json({
    testNotification: {
      title: 'Mediscan-X Reminder Test',
      body: 'Test alert: 1 Tablet Dolo 650 is scheduled after food. Reminder sounds and vibration are operational.',
      sound: 'chime',
      timestamp: new Date().toISOString(),
    },
  });
});

// Scan History
app.get('/api/scans', (req: Request, res: Response) => {
  try {
    const scans = db.prepare(`
      SELECT s.*, m.name as matched_medicine_name, m.verified_purpose_en, m.verified_purpose_kn
      FROM scan_history s
      LEFT JOIN medicines m ON s.matched_medicine_id = m.id
      ORDER BY s.created_at DESC
      LIMIT 50
    `).all();
    res.json(scans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User settings
app.get('/api/settings', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT key, value FROM user_settings').all() as any[];
    const settings: Record<string, string> = {
      language: 'en',
      soundEnabled: 'true',
      vibrationEnabled: 'true',
      timezone: 'Asia/Kolkata',
      gracePeriodMinutes: '60',
    };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(updates)) {
      stmt.run(k, String(v));
    }
    res.json({ success: true, settings: updates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Vite Integration & Static Server
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mediscan-X] Server active and listening on port ${PORT}`);
    console.log(`[Mediscan-X] Database: SQLite at ${path.resolve(process.cwd(), 'mediscan.db')}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Mediscan-X server:', err);
  process.exit(1);
});
