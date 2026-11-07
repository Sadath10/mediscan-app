import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseOcrText,
  callDeepReadOcr,
  executeMedicineVerificationPipeline,
} from '../server/ocrPipeline.js';
import { sanitizeOcrText, BRAND_TO_GENERIC_MAP } from '../server/brandDictionary.js';

describe('OCR Parsing Logic', () => {
  it('extracts brand name, strength, dosage form, and expiry date from packaging text', () => {
    const sampleText = `
      TYLENOL
      Acetaminophen
      Extra Strength 500 mg
      24 Gelcaps
      EXP: 10/2028
      Batch: TX-8921
    `;

    const parsed = parseOcrText(sampleText);

    expect(parsed.rawText).toContain('TYLENOL');
    expect(parsed.candidateNames).toContain('Tylenol');
    expect(parsed.candidateNames).toContain('Acetaminophen');
    expect(parsed.strengths).toContain('500 mg');
    expect(parsed.expiryDates.length).toBeGreaterThan(0);
    expect(parsed.expiryDates[0]).toMatch(/10\/2028/i);
  });

  it('correctly handles various strength formats (mg, mcg, g, ml)', () => {
    const sample = 'Amoxicillin 250 mg / 5ml suspension with 50 mcg levothyroxine';
    const parsed = parseOcrText(sample);

    expect(parsed.strengths).toContain('250 mg');
    expect(parsed.strengths).toContain('5ml');
    expect(parsed.strengths).toContain('50 mcg');
  });

  it('filters out pharmaceutical manufacturing noise words', () => {
    const noise = `
      Manufactured by: Micro Labs Ltd
      Marketed by: Sun Pharma
      Rx Only Keep out of reach of children
      Store below 30 C protect from light
      DOLO 650
      Paracetamol Tablets
    `;
    const parsed = parseOcrText(noise);

    expect(parsed.candidateNames).toContain('Dolo');
    expect(parsed.candidateNames).toContain('Paracetamol');
    expect(parsed.candidateNames).not.toContain('Manufactured');
    expect(parsed.candidateNames).not.toContain('Children');
  });
});

describe('DeepRead AI OCR Integration (deepread.tech)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws error when DEEPREAD_API_KEY is not set', async () => {
    delete process.env.DEEPREAD_API_KEY;
    await expect(callDeepReadOcr('data:image/jpeg;base64,dGVzdA==')).rejects.toThrow(
      'DEEPREAD_API_KEY is not configured in environment secrets'
    );
  });

  it('calls DeepRead process endpoint with X-API-Key and parses text', async () => {
    process.env.DEEPREAD_API_KEY = 'test_deepread_key_123';

    const mockResponse = {
      markdown: 'DOLO 650\nParacetamol Tablets 650mg\nEXP: 05/2028',
      confidence: 0.98,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await callDeepReadOcr('data:image/jpeg;base64,dGVzdA==');

    expect(result.text).toContain('DOLO 650');
    expect(result.confidence).toBe(0.98);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.deepread.tech/v1/process',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-API-Key': 'test_deepread_key_123',
        }),
      })
    );
  });

  it('runs verification pipeline with manual override and extracts candidate entities', async () => {
    const manualText = 'Amoxicillin 500mg capsules EXP: 11/2027';
    const pipeline = await executeMedicineVerificationPipeline('', manualText);

    expect(pipeline.rawText).toBe(manualText);
    expect(pipeline.entities.candidateNames).toContain('Amoxicillin');
    expect(pipeline.entities.strengths).toContain('500 mg');
    expect(pipeline.entities.dosageForms).toContain('Capsule');
    expect(pipeline.ocrEngine).toBe('deterministic_parser');
  });
});

describe('Local Seed Dataset & Intelligent OCR Indian Pharmacopeia Architecture', () => {
  it('identifies Indian brand Dolo-650 and Paracetamol Tablets IP with local verified badge', async () => {
    const ocrText = `
      DOLO-650
      Paracetamol Tablets IP 650 mg
      Micro Labs Limited
      Batch: DL-7721
      EXP: 12/2028
    `;

    const result = await executeMedicineVerificationPipeline('', ocrText);

    expect(result.isVerified).toBe(true);
    expect(result.verifiedBadge).toBe('local');
    expect(result.topMatch?.name).toBe('Dolo-650');
    expect(result.topMatch?.genericName).toBe('Paracetamol');
    expect(result.topMatch?.dosageForm).toBe('Tablet');
    expect(result.topMatch?.strength).toBe('650 mg');
  });

  it('detects Syrup form (Benadryl) with dosage in ml and shake well instructions', async () => {
    const syrupText = `
      BENADRYL Cough Formula Syrup
      Diphenhydramine HCl Oral Syrup 100 ml
      Johnson & Johnson
      Shake well before use
      EXP: 09/2027
    `;

    const result = await executeMedicineVerificationPipeline('', syrupText);

    expect(result.isVerified).toBe(true);
    expect(result.verifiedBadge).toBe('local');
    expect(result.topMatch?.name).toBe('Benadryl Cough Syrup');
    expect(result.topMatch?.dosageForm).toBe('Syrup');
    expect(result.topMatch?.foodInstructions).toContain('Shake bottle well');
  });

  it('detects Capsule form (Omez) with gastro-resistant whole-swallow instructions', async () => {
    const capsuleText = `
      OMEZ 20
      Omeprazole Gastro-resistant Capsules IP 20 mg
      Dr. Reddy's Laboratories
      EXP: 11/2028
    `;

    const result = await executeMedicineVerificationPipeline('', capsuleText);

    expect(result.isVerified).toBe(true);
    expect(result.verifiedBadge).toBe('local');
    expect(result.topMatch?.name).toBe('Omez 20');
    expect(result.topMatch?.dosageForm).toBe('Capsule');
    expect(result.topMatch?.foodTiming).toBe('before_food');
  });

  it('detects Injection form (Lantus) with physician administration guidance', async () => {
    const injectionText = `
      LANTUS Solostar
      Insulin Glargine Injection IP 100 units/ml
      Sanofi India
      EXP: 05/2027
    `;

    const result = await executeMedicineVerificationPipeline('', injectionText);

    expect(result.isVerified).toBe(true);
    expect(result.verifiedBadge).toBe('local');
    expect(result.topMatch?.name).toBe('Lantus');
    expect(result.topMatch?.dosageForm).toBe('Injection');
  });

  it('falls back to generic salt when unfamiliar brand is scanned with Pharmacopeia salt line', async () => {
    const unfamiliarPackaging = `
      FEVREX-SUPER
      Paracetamol Tablets IP 500 mg
      Unknown Local Pharma Ltd
      EXP: 08/2029
    `;

    const result = await executeMedicineVerificationPipeline('', unfamiliarPackaging);

    // Because Paracetamol is found in the local formulary, it matches Paracetamol
    expect(result.isVerified).toBe(true);
    expect(result.topMatch?.genericName).toBe('Paracetamol');
  });

  it('contains at least 50 common medicines covering Tablets, Syrups, and Capsules', async () => {
    const { LOCAL_MEDICINES } = await import('../src/data/localMedicines.js');
    expect(LOCAL_MEDICINES.length).toBeGreaterThanOrEqual(50);
    const forms = new Set(LOCAL_MEDICINES.map((m) => m.form));
    expect(forms.has('Tablet')).toBe(true);
    expect(forms.has('Syrup')).toBe(true);
    expect(forms.has('Capsule')).toBe(true);
  });
});

describe('Brand Dictionary & Aggressive OCR Sanitization Engine', () => {
  it('correctly maps Indian & global brands to canonical generic salts in brandDictionary', () => {
    expect(BRAND_TO_GENERIC_MAP['azithral']).toBe('azithromycin');
    expect(BRAND_TO_GENERIC_MAP['azee']).toBe('azithromycin');
    expect(BRAND_TO_GENERIC_MAP['zithromax']).toBe('azithromycin');
    expect(BRAND_TO_GENERIC_MAP['dolo']).toBe('paracetamol');
    expect(BRAND_TO_GENERIC_MAP['crocin']).toBe('paracetamol');
    expect(BRAND_TO_GENERIC_MAP['calpol']).toBe('paracetamol');
    expect(BRAND_TO_GENERIC_MAP['omez']).toBe('omeprazole');
    expect(BRAND_TO_GENERIC_MAP['augmentin']).toBe('amoxicillin');
    expect(BRAND_TO_GENERIC_MAP['clavam']).toBe('amoxicillin');
    expect(BRAND_TO_GENERIC_MAP['benadryl']).toBe('diphenhydramine');
  });

  it('sanitizes noisy OCR text and extracts generic name for Azithral-500', () => {
    const rawOcr = 'AZITHRAL-500 Azithromycin Tablets IP 500mg Batch AZ-8812';
    const sanitized = sanitizeOcrText(rawOcr);

    expect(sanitized.genericName).toBe('azithromycin');
    expect(sanitized.detectedDosage).toBe('500 mg');
    expect(sanitized.detectedForm).toBe('Tablet');
    expect(sanitized.searchQuery).toBe('azithromycin');
  });

  it('sanitizes lowercase brand text with dosage and forms stripped', () => {
    const rawOcr = 'azithral 500mg tablet ip';
    const sanitized = sanitizeOcrText(rawOcr);

    expect(sanitized.genericName).toBe('azithromycin');
    expect(sanitized.matchedBrand).toBe('Azithral');
  });

  it('recognizes direct generic salt name if no brand is present', () => {
    const rawOcr = 'Azithromycin 500mg USP';
    const sanitized = sanitizeOcrText(rawOcr);

    expect(sanitized.genericName).toBe('azithromycin');
    expect(sanitized.searchQuery).toBe('azithromycin');
  });

  it('runs verification pipeline for Azithral-500 and returns exact profile fields', async () => {
    const result = await executeMedicineVerificationPipeline('', 'Azithral-500');

    expect(result.isVerified).toBe(true);
    expect(result.extractedText).toBe('Azithral-500');
    expect(result.identifiedGeneric).toBe('Azithromycin');
    expect(result.topMatch?.genericName).toBe('Azithromycin');

    // Requirement 3: Exact display UI values for Azithromycin
    expect(result.unifiedProfile).toBeDefined();
    expect(result.unifiedProfile?.dosage).toBe('500 mg');
    expect(result.unifiedProfile?.foodInteractions.instruction).toBe('Take with or without food.');
    expect(result.unifiedProfile?.usage).toBe('Used to treat bacterial infections.');
    expect(result.unifiedProfile?.sideEffects.common.some((e: string) => /nausea/i.test(e))).toBe(true);
    expect(result.unifiedProfile?.sideEffects.common.some((e: string) => /diarrhea/i.test(e))).toBe(true);
  });

  it('mocks a messy OCR string and asserts sanitization extracts Azithromycin and maps to openFDA data', async () => {
    const messyOcr = 'AZITHRAL-500 Azithromycin Tablets IP Mfr: Alembic Ltd';
    const sanitized = sanitizeOcrText(messyOcr);

    // Assert that the sanitization function correctly extracts "Azithromycin"
    expect(sanitized.genericName?.toLowerCase()).toBe('azithromycin');
    expect(sanitized.topCandidate?.toLowerCase()).toBe('azithromycin');
    expect(sanitized.longestWords).toContain('azithromycin');

    // Assert that the verification pipeline successfully maps it to openFDA data
    const result = await executeMedicineVerificationPipeline('', messyOcr);
    expect(result.isVerified).toBe(true);
    expect(result.identifiedGeneric?.toLowerCase()).toBe('azithromycin');
    expect(result.topMatch?.genericName?.toLowerCase()).toBe('azithromycin');
    expect(result.unifiedProfile).toBeDefined();
    expect(result.unifiedProfile?.genericName?.toLowerCase()).toBe('azithromycin');
    expect(result.unifiedProfile?.dosage).toBe('500 mg');
    expect(result.unifiedProfile?.foodInteractions?.instruction).toBe('Take with or without food.');
    expect(result.unifiedProfile?.usage).toBe('Used to treat bacterial infections.');
  });

  it('dynamically parses random medicine packaging noise and isolates active generic salts', () => {
    const messyAugmentin = 'AUGMENTIN 625 DUO Amoxicillin Potassium Clavulanate IP Mfr: GSK Ltd Store below 25C';
    const sanitizedAug = sanitizeOcrText(messyAugmentin);
    expect(sanitizedAug.genericName).toBe('amoxicillin');
    expect(sanitizedAug.longestWords.length).toBeGreaterThan(0);

    const messyZerodol = 'ZERODOL-SP Aceclofenac Paracetamol Tablets IP IPCA Labs Ltd';
    const sanitizedZero = sanitizeOcrText(messyZerodol);
    expect(sanitizedZero.genericName).toBe('aceclofenac');

    const messyAciloc = 'ACILOC 150 Ranitidine Tablets IP Cadila Pharma Ltd';
    const sanitizedAciloc = sanitizeOcrText(messyAciloc);
    expect(sanitizedAciloc.genericName).toBe('ranitidine');
  });
});

