import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractFoodInstructions,
  extractUsageAndDosage,
  extractSideEffects,
  getMedicineDetails,
  querySafeRx,
  queryOpenFdaLabel,
  generateSafeRxSignature,
  formatMedicalText,
  formatMedicalBullets,
} from '../server/medicineDetailsService.js';
import {
  resolveLocalBrandToGeneric,
  resolveGenericIngredient,
  normalizeBrandWithRxNorm,
} from '../server/brandMapping.js';

describe('SafeRx & openFDA Real-time Multi-API Fallback Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates valid SafeRx HMAC-SHA256 signature for saferx-hmac-sha256-v1 specification', () => {
    const apiKey = 'test_saferx_secret_key_123';
    const method = 'GET';
    const path = '/api/drug';
    const timestamp = '1710000000000';
    const nonce = 'abcd-1234-efgh';

    const sig = generateSafeRxSignature(apiKey, method, path, timestamp, nonce);

    expect(sig).toBeTruthy();
    expect(typeof sig).toBe('string');
    expect(sig.length).toBe(64); // SHA-256 hex length
  });

  it('generates valid SafeRx HMAC-SHA256 signature with method, escaped path, sorted query, and body digest', () => {
    const apiKey = 'test_saferx_secret_key_123';
    const method = 'GET';
    const path = '/api/drug';
    const timestamp = '1710000000000';
    const nonce = 'abcd-1234-efgh';
    const query = 'name=paracetamol&version=v1';
    const body = '';

    const sig = generateSafeRxSignature(apiKey, method, path, timestamp, nonce, query, body);

    expect(sig).toBeTruthy();
    expect(typeof sig).toBe('string');
    expect(sig.length).toBe(64);
  });

  it('defaults to openFDA as primary lookup when SafeRx key is omitted or SafeRx fails', async () => {
    const previousKey = process.env.SAFERX_API_KEY;
    delete process.env.SAFERX_API_KEY;

    const mockOpenFdaData = {
      openfda: {
        brand_name: ['Tylenol'],
        generic_name: ['Acetaminophen'],
      },
      dosage_and_administration: ['Take 2 caplets every 6 hours.'],
      indications_and_usage: ['Pain relief.'],
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('api.fda.gov')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ results: [mockOpenFdaData] }),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });

    const safeRxRes = await querySafeRx('Acetaminophen');
    expect(safeRxRes).toBeNull(); // Defaulted without throwing

    const details = await getMedicineDetails('Acetaminophen_Default_' + Date.now());
    expect(details.found).toBe(true);
    expect(details.sources).toContain('openFDA Drug Label API');

    process.env.SAFERX_API_KEY = previousKey;
  });

  it('maps common Indian brands to active ingredients via ingredient fallback logic', async () => {
    // 1. Local Indian brand dictionary
    const doloResolved = resolveLocalBrandToGeneric('Dolo-650');
    expect(doloResolved?.generic).toBe('Paracetamol');
    expect(doloResolved?.strength).toBe('650 mg');

    const augmentinResolved = resolveLocalBrandToGeneric('Augmentin 625 Duo');
    expect(augmentinResolved?.generic).toContain('Amoxicillin and Clavulanate');

    const panResolved = resolveLocalBrandToGeneric('Pan-40');
    expect(panResolved?.generic).toBe('Pantoprazole');

    // 2. Querying "Dolo-650" triggers ingredient fallback to Paracetamol when brand has no direct openFDA entry
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      // Direct brand lookup returns empty
      if (url.includes('Dolo-650')) {
        return Promise.resolve({ ok: true, json: async () => ({ results: [] }) });
      }
      // Ingredient fallback for "Paracetamol" returns match
      if (url.includes('Paracetamol')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [
              {
                openfda: {
                  brand_name: ['Paracetamol'],
                  generic_name: ['Paracetamol (Acetaminophen)'],
                  dosage_form: ['TABLET'],
                },
                dosage_and_administration: ['Take 1 tablet every 4 to 6 hours after meals.'],
                indications_and_usage: ['Fever reduction and pain relief.'],
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });

    const details = await getMedicineDetails('Dolo-650_FallbackTest_' + Date.now());
    expect(details.found).toBe(true);
    expect(details.ingredientFallbackUsed).toBe(true);
    expect(details.matchedIngredient).toBe('Paracetamol');
  });

  it('normalizes brand names to generic ingredients using RxNorm API', async () => {
    const mockRxNormResponse = {
      drugGroup: {
        conceptGroup: [
          {
            tty: 'IN',
            conceptProperties: [
              {
                rxcui: '161',
                name: 'Acetaminophen',
                tty: 'IN',
              },
            ],
          },
        ],
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRxNormResponse,
    });

    const generic = await normalizeBrandWithRxNorm('Tylenol');
    expect(generic).toBe('Acetaminophen');
  });

  it('returns clean not-found state with helpful message when no data is found in registries', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    const details = await getMedicineDetails('TotallyUnknownChemical_XYZ_999');
    expect(details.found).toBe(false);
    expect(details.message).toContain('No data found. Try searching by generic name.');
    expect(details.usageAndDosage.summary).toContain('No data found');
  });

  it('extracts "Take with food" and meal timing from SafeRx food interaction object', () => {
    const mockSafeRxFood = {
      timing: 'with_food',
      instruction: 'Take with food to minimize gastrointestinal discomfort.',
    };

    const parsed = extractFoodInstructions(mockSafeRxFood, '', '');

    expect(parsed.timing).toBe('with_food');
    expect(parsed.timingLabel).toBe('Take With Food');
    expect(parsed.instruction).toContain('Take with food');
  });

  it('extracts food instructions and conflicts from openFDA dosage and warnings text', () => {
    const dosageText = 'Take 1 tablet every 12 hours with a full glass of water after food.';
    const warningsText = 'Avoid consuming grapefruit juice while taking this medication. Do not consume alcohol.';

    const parsed = extractFoodInstructions(null, dosageText, warningsText);

    expect(parsed.timing).toBe('after_food');
    expect(parsed.conflicts).toContain('Avoid consuming grapefruit or grapefruit juice.');
    expect(parsed.conflicts).toContain('Do not consume alcohol while taking this medication.');
  });

  it('extracts recommended dose, frequency, and max daily dose from openFDA dosage_and_administration', () => {
    const mockFdaLabel = {
      dosage_and_administration: [
        'Adults and children 12 years and older: take 2 caplets every 6 hours while symptoms last. Do not exceed 6 caplets in 24 hours.',
      ],
      indications_and_usage: [
        'Temporarily relieves minor aches and pains due to headache, common cold, and toothache.',
      ],
    };

    const parsed = extractUsageAndDosage(mockFdaLabel, 'Acetaminophen', '500 mg');

    expect(parsed.recommendedDose).toBe('2 caplets');
    expect(parsed.frequency).toBe('Every 6 hours');
    expect(parsed.maxDailyDose).toBe('6 caplets in 24 hours');
    expect(parsed.summary).toContain('2 caplets');
    expect(parsed.summary).toContain('every 6 hours');
    expect(parsed.indications).toContain('Temporarily relieves minor aches and pains');
  });

  it('categorizes side effects into Common and Seek Medical Help', () => {
    const mockSafeRxAe = {
      common: ['Nausea', 'Headache', 'Dizziness'],
      severe: ['Difficulty breathing', 'Swelling of face'],
    };

    const parsed = extractSideEffects(mockSafeRxAe, '', '');

    expect(parsed.common).toContain('Nausea');
    expect(parsed.common).toContain('Headache');
    expect(parsed.seekMedicalHelp).toContain('Difficulty breathing');
    expect(parsed.seekMedicalHelp).toContain('Swelling of face');
    expect(parsed.disclaimer).toContain('official drug databases');
  });

  it('formatMedicalText cleans HTML tags, generic headers, and cross-references into readable text', () => {
    const rawFdaText = '<p><b>DOSAGE AND ADMINISTRATION:</b> Adults and children 12 years and over: Take 2 caplets every 6 hours with a full glass of water. [see Warnings and Precautions (5.1)] Do not exceed 6 caplets in 24 hours.</p>';
    const cleaned = formatMedicalText(rawFdaText);

    expect(cleaned).not.toContain('<p>');
    expect(cleaned).not.toContain('<b>');
    expect(cleaned).not.toContain('DOSAGE AND ADMINISTRATION:');
    expect(cleaned).not.toContain('[see Warnings and Precautions (5.1)]');
    expect(cleaned).toContain('Adults and children 12 years and over: Take 2 caplets every 6 hours with a full glass of water.');
    expect(cleaned).toContain('Do not exceed 6 caplets in 24 hours.');

    const bullets = formatMedicalBullets(rawFdaText);
    expect(bullets.length).toBeGreaterThanOrEqual(1);
    expect(bullets[0]).toContain('Take 2 caplets every 6 hours');
  });

  it('aggregates openFDA, SafeRx, and DailyMed in parallel into UnifiedMedicineProfile with prominent dosage and Take After Food badge', async () => {
    const prevKey = process.env.SAFERX_API_KEY;
    process.env.SAFERX_API_KEY = 'test_saferx_secret_key';

    const mockSafeRxResponse = {
      food: {
        timing: 'after_food',
        instruction: 'Take orally after food with water to minimize gastric irritation.',
      },
      ae: {
        common: ['Nausea or mild upset stomach', 'Mild headache'],
        severe: ['Difficulty breathing or wheezing', 'Swelling of face or throat'],
      },
      bbw: ['Severe liver warning if consumed with alcoholic beverages.'],
    };

    const mockOpenFdaResponse = {
      openfda: {
        brand_name: ['AggregatorMockBrand'],
        generic_name: ['MockCustomSodiumSalt'],
        dosage_form: ['TABLET, DELAYED RELEASE'],
      },
      dosage_and_administration: [
        'DOSAGE AND ADMINISTRATION: Adults: Take 1 tablet once daily before morning meal. Swallow whole. [see Dosage and Administration (2.1)]',
      ],
      indications_and_usage: [
        'INDICATIONS AND USAGE: Indicated for short-term treatment of adult patients in the healing and symptomatic relief of erosive esophagitis.',
      ],
      adverse_reactions: ['Headache, diarrhea, nausea, abdominal pain.'],
      boxed_warning: ['Increased risk of bone fractures with long-term high-dose therapy.'],
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('saferx.online')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSafeRxResponse,
        });
      }
      if (url.includes('api.fda.gov')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ results: [mockOpenFdaResponse] }),
        });
      }
      if (url.includes('dailymed.nlm.nih.gov')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [] }),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });

    const testDrugName = 'CustomFdaDrug_MockTest_' + Date.now();
    const details = await getMedicineDetails(testDrugName);

    // Assert unified profile structure
    expect(details.found).toBe(true);
    expect(details.verifiedBadge).toBe('openfda');

    // Card 1: Dosage & Food instructions badge
    expect(details.dosage).toBeTruthy();
    expect(details.dosage).toContain('Take 1 tablet');
    expect(details.dosage).not.toContain('DOSAGE AND ADMINISTRATION:');
    expect(details.dosage).not.toContain('[see Dosage and Administration (2.1)]');
    expect(details.foodInteractions.timing).toBe('after_food');
    expect(details.foodInteractions.timingLabel).toBe('After Food');
    expect(details.foodInstructions.timingLabel).toBe('After Food');
    expect(details.foodInteractions.instruction).toContain('Take orally after food');

    // Card 2: Usage (What is it for?)
    expect(details.usage).toBeTruthy();
    expect(details.usage).toContain('Indicated for short-term treatment');
    expect(details.usage).not.toContain('INDICATIONS AND USAGE:');

    // Card 3: Side effects and Boxed warning
    expect(details.sideEffects.common).toContain('Nausea or mild upset stomach');
    expect(details.sideEffects.seekMedicalHelp).toContain('Difficulty breathing or wheezing');
    expect(details.blackBoxWarnings.length).toBeGreaterThan(0);
    expect(details.blackBoxWarnings[0]).toContain('Severe liver warning');

    // Sources and TTS Script
    expect(details.sources).toContain('SafeRx Drug Safety API');
    expect(details.sources).toContain('openFDA Drug Label API');
    expect(details.englishSpeechText).toContain('Take');
    expect(details.englishSpeechText).toContain('Food instructions:');

    process.env.SAFERX_API_KEY = prevKey;
  });
});
