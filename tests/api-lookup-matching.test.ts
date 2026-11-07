import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  searchDailyMed,
  searchRxNorm,
  searchOpenFda,
  executeGlobalMedicineLookup,
} from '../server/globalMedicineAggregator.js';

describe('Global Medicine API Aggregation & Matching (Free Authoritative Sources)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('queries DailyMed API (NLM) as primary source without requiring an API key', async () => {
    const mockDailyMedResponse = {
      data: [
        {
          setid: 'b6dc8d2b-6c67-4d9d-9a99-0d33e14b2d11',
          title: 'ACETAMINOPHEN TABLET [REMEDYREPACK INC.]',
          published_date: '2025-01-15',
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDailyMedResponse,
    });

    const results = await searchDailyMed('Acetaminophen');

    expect(results.length).toBe(1);
    expect(results[0].dailymedSetId).toBe('b6dc8d2b-6c67-4d9d-9a99-0d33e14b2d11');
    expect(results[0].source).toBe('dailymed');
    expect(results[0].isVerified).toBe(true);
  });

  it('queries RxNorm API (NIH) as primary source and parses RxCUI concepts without requiring an API key', async () => {
    const mockRxNormResponse = {
      drugGroup: {
        conceptGroup: [
          {
            tty: 'SCD',
            conceptProperties: [
              {
                rxcui: '198440',
                name: 'Acetaminophen 500 MG Oral Tablet',
                synonym: 'Tylenol 500 MG Tablet',
                tty: 'SCD',
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

    const results = await searchRxNorm('Acetaminophen');

    expect(results.length).toBe(1);
    expect(results[0].rxCui).toBe('198440');
    expect(results[0].source).toBe('rxnorm');
    expect(results[0].name).toBe('Acetaminophen 500 MG Oral Tablet');
  });

  it('queries openFDA API and extracts structured label attributes', async () => {
    const mockFdaResponse = {
      results: [
        {
          id: 'fda-tylenol-01',
          openfda: {
            brand_name: ['Tylenol Extra Strength'],
            generic_name: ['Acetaminophen'],
            dosage_form: ['TABLET'],
            manufacturer_name: ['McNeil Consumer Healthcare'],
          },
          dosage_and_administration: ['Take 2 caplets every 6 hours while symptoms last.'],
          indications_and_usage: ['Temporarily relieves minor aches and pains.'],
          warnings: ['Liver warning: This product contains acetaminophen.'],
          purpose: ['Pain reliever/fever reducer'],
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockFdaResponse,
    });

    const results = await searchOpenFda('Tylenol');

    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Tylenol Extra Strength');
    expect(results[0].genericName).toBe('Acetaminophen');
    expect(results[0].dosageAndAdministration).toContain('Take 2 caplets');
    expect(results[0].indicationsAndUsage).toContain('Temporarily relieves');
    expect(results[0].source).toBe('openfda');
    expect(results[0].isVerified).toBe(true);
  });

  it('executes multi-source lookup with DailyMed and RxNorm as primary active sources', async () => {
    // Mock fetch for DailyMed returning match
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('dailymed.nlm.nih.gov')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [
              {
                setid: 'c7fc444a-32e6-4299-87c2-55fb4d4eb0c1',
                title: 'AMOXICILLIN CAPSULE [TEVA]',
                published_date: '2024-11-01',
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });

    const pipeline = await executeGlobalMedicineLookup('Amoxicillin');

    expect(pipeline.isVerified).toBe(true);
    expect(pipeline.primarySourceStatus.status).toBe('ACTIVE');
    expect(pipeline.primarySourceStatus.isConfigured).toBe(true);
    expect(pipeline.topMatch?.source).toBe('dailymed');
    expect(pipeline.topMatch?.dailymedSetId).toBe('c7fc444a-32e6-4299-87c2-55fb4d4eb0c1');
  });

  it('falls back seamlessly to local verified database when remote APIs are unavailable', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    const pipeline = await executeGlobalMedicineLookup('Paracetamol');

    expect(pipeline.isVerified).toBe(true);
    expect(pipeline.topMatch?.genericName).toContain('Paracetamol');
    expect(pipeline.topMatch?.source).toBe('local_seed');
  });
});
