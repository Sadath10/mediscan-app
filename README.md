# Mediscan — Full-Stack Medicine Scanning & Reminder Application

Mediscan is a production-ready, full-stack medicine scanning and reminder application built with bilingual English and Kannada (ಕನ್ನಡ) voice assistance, precision daily dosage scheduling, and verified pharmaceutical data aggregation.

---

## Free Service Architecture

Mediscan relies exclusively on free, high-reliability services with zero paid Google Cloud integrations:

1. **DeepRead AI OCR (`deepread.tech`)**:
   - Live AI packaging OCR via `POST /api/scan/ocr` calling `https://api.deepread.tech/v1/process`.
   - Extracts medicine names, strengths (e.g. 500 mg, 650 mg), dosage forms (Tablet, Capsule, Syrup), and expiry dates.
   - Configured via `DEEPREAD_API_KEY` in environment secrets.
   - Graceful fallback to deterministic parsing when offline.

2. **Text-to-Speech (100% Free Web Speech API)**:
   - Uses the browser's built-in `window.speechSynthesis` (Web Speech API).
   - High-fidelity Kannada (`kn-IN`) and English (`en-US`) voice narration with speed, pitch, and volume adjustments.
   - Requires zero external APIs and zero API keys.

3. **Free Authoritative Medicine Data (NLM / NIH)**:
   - **DailyMed API (NLM)**: Primary drug label SPL documents and SetIDs (completely free, no API key required).
   - **RxNorm API (NIH)**: Clinical drug normalization and RxCUI concepts (completely free, no API key required).
   - **openFDA Drug Labels**: FDA product labels, indications, and dosage guidelines (free tier).

4. **Persistence & Security**:
   - **Firebase Firestore**: User records, medicine cabinets, schedules, and dose logs.
   - **SQLite (`node:sqlite`)**: Local pre-seeded WHO EML verified drug database.

---

## Required Environment Variables

Mediscan strictly requires only the following environment variables:

| Variable | Description | Source |
|---|---|---|
| `DEEPREAD_API_KEY` | DeepRead AI OCR API key for medicine packaging text extraction | deepread.tech |
| `FIREBASE_PROJECT_ID` | Firebase project ID (e.g. praxis-module-d53bd) | Firebase Console |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service account email | Firebase Console |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin private key | Firebase Console |

---

## Automated Verification & Testing

Run all unit and integration tests:
```bash
npx vitest run
```
Tests cover:
- DeepRead OCR API integration and fallback parsing
- DailyMed & RxNorm primary API aggregation
- openFDA drug label verification
- Web Speech API (`window.speechSynthesis`) narration
- Dosage mathematics and daily tablet calculation
- Schedule conflict detection & missed dose tracking
