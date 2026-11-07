import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryOpenFdaDrugLabel } from '../server/ocrPipeline.js';

describe('openFDA Drug Label Lookup & Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('matches medicine from openFDA and returns structured attributes with confidence score', async () => {
    const mockFdaResponse = {
      results: [
        {
          id: 'fda-1234',
          openfda: {
            brand_name: ['TYLENOL EXTRA STRENGTH'],
            generic_name: ['ACETAMINOPHEN'],
            dosage_form: ['TABLET'],
            manufacturer_name: ['Johnson & Johnson'],
            route: ['ORAL'],
            substance_name: ['ACETAMINOPHEN'],
          },
          purpose: ['Pain reliever/fever reducer'],
          warnings: ['Liver warning: This product contains acetaminophen.'],
        },
      ],
    };

    // Mock global fetch
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockFdaResponse,
    });

    const matches = await queryOpenFdaDrugLabel('TYLENOL');

    expect(matches.length).toBe(1);
    expect(matches[0].brandName).toBe('TYLENOL EXTRA STRENGTH');
    expect(matches[0].genericName).toBe('ACETAMINOPHEN');
    expect(matches[0].dosageForm).toBe('TABLET');
    expect(matches[0].isVerified).toBe(true);
    expect(matches[0].score).toBeGreaterThan(0.7);
  });

  it('handles openFDA returning 0 results safely without throwing errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { code: 'NOT_FOUND', message: 'No matches found!' } }),
    });

    const matches = await queryOpenFdaDrugLabel('NonExistentDrugBrandXYZ');
    expect(matches).toEqual([]);
  });
});
