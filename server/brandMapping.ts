/**
 * Brand to Generic Ingredient Normalization Service
 * 1. Comprehensive dictionary for Indian & Global brand names to active ingredients
 * 2. RxNorm REST API (NIH) normalization for brand-to-ingredient resolution
 */

// Authoritative mapping of popular Indian and international brands to active ingredients
export const COMMON_BRAND_TO_INGREDIENT_MAP: Record<string, { generic: string; strength?: string; form?: string }> = {
  // Paracetamol / Acetaminophen
  'dolo': { generic: 'Paracetamol', strength: '650 mg', form: 'Tablet' },
  'dolo 650': { generic: 'Paracetamol', strength: '650 mg', form: 'Tablet' },
  'dolo-650': { generic: 'Paracetamol', strength: '650 mg', form: 'Tablet' },
  'dolo650': { generic: 'Paracetamol', strength: '650 mg', form: 'Tablet' },
  'crocin': { generic: 'Paracetamol', strength: '500 mg', form: 'Tablet' },
  'crocin 650': { generic: 'Paracetamol', strength: '650 mg', form: 'Tablet' },
  'crocin advance': { generic: 'Paracetamol', strength: '500 mg', form: 'Tablet' },
  'calpol': { generic: 'Paracetamol', strength: '500 mg', form: 'Tablet' },
  'calpol 500': { generic: 'Paracetamol', strength: '500 mg', form: 'Tablet' },
  'calpol 650': { generic: 'Paracetamol', strength: '650 mg', form: 'Tablet' },
  'pacimol': { generic: 'Paracetamol', strength: '500 mg', form: 'Tablet' },
  'pacimol 650': { generic: 'Paracetamol', strength: '650 mg', form: 'Tablet' },
  'tylenol': { generic: 'Acetaminophen', strength: '500 mg', form: 'Tablet' },
  'tylenol extra strength': { generic: 'Acetaminophen', strength: '500 mg', form: 'Caplet' },

  // Amoxicillin & Clavulanate
  'augmentin': { generic: 'Amoxicillin and Clavulanate Potassium', strength: '625 mg', form: 'Tablet' },
  'augmentin 625': { generic: 'Amoxicillin and Clavulanate Potassium', strength: '625 mg', form: 'Tablet' },
  'augmentin 625 duo': { generic: 'Amoxicillin and Clavulanate Potassium', strength: '625 mg', form: 'Tablet' },
  'augmentin duo': { generic: 'Amoxicillin and Clavulanate Potassium', strength: '625 mg', form: 'Tablet' },
  'moxclav': { generic: 'Amoxicillin and Clavulanate Potassium', strength: '625 mg', form: 'Tablet' },
  'clavam': { generic: 'Amoxicillin and Clavulanate Potassium', strength: '625 mg', form: 'Tablet' },
  'clavam 625': { generic: 'Amoxicillin and Clavulanate Potassium', strength: '625 mg', form: 'Tablet' },
  'moxikind-cv': { generic: 'Amoxicillin and Clavulanate Potassium', strength: '625 mg', form: 'Tablet' },

  // Amoxicillin
  'mox': { generic: 'Amoxicillin', strength: '500 mg', form: 'Capsule' },
  'mox 500': { generic: 'Amoxicillin', strength: '500 mg', form: 'Capsule' },
  'novamox': { generic: 'Amoxicillin', strength: '500 mg', form: 'Capsule' },
  'novamox 500': { generic: 'Amoxicillin', strength: '500 mg', form: 'Capsule' },
  'amoxil': { generic: 'Amoxicillin', strength: '500 mg', form: 'Capsule' },

  // Pantoprazole
  'pan': { generic: 'Pantoprazole', strength: '40 mg', form: 'Tablet' },
  'pan 40': { generic: 'Pantoprazole', strength: '40 mg', form: 'Tablet' },
  'pan-40': { generic: 'Pantoprazole', strength: '40 mg', form: 'Tablet' },
  'pantocid': { generic: 'Pantoprazole', strength: '40 mg', form: 'Tablet' },
  'pantocid 40': { generic: 'Pantoprazole', strength: '40 mg', form: 'Tablet' },
  'pantop': { generic: 'Pantoprazole', strength: '40 mg', form: 'Tablet' },
  'pantop 40': { generic: 'Pantoprazole', strength: '40 mg', form: 'Tablet' },
  'pantodac': { generic: 'Pantoprazole', strength: '40 mg', form: 'Tablet' },
  'protonix': { generic: 'Pantoprazole Sodium', strength: '40 mg', form: 'Tablet' },

  // Omeprazole / Rabeprazole
  'omez': { generic: 'Omeprazole', strength: '20 mg', form: 'Capsule' },
  'omez 20': { generic: 'Omeprazole', strength: '20 mg', form: 'Capsule' },
  'prilosec': { generic: 'Omeprazole', strength: '20 mg', form: 'Capsule' },
  'razo': { generic: 'Rabeprazole', strength: '20 mg', form: 'Tablet' },
  'rabekind': { generic: 'Rabeprazole', strength: '20 mg', form: 'Tablet' },
  'rabicip': { generic: 'Rabeprazole', strength: '20 mg', form: 'Tablet' },

  // Metformin
  'glycomet': { generic: 'Metformin Hydrochloride', strength: '500 mg', form: 'Tablet' },
  'glycomet 500': { generic: 'Metformin Hydrochloride', strength: '500 mg', form: 'Tablet' },
  'glycomet 850': { generic: 'Metformin Hydrochloride', strength: '850 mg', form: 'Tablet' },
  'glucophage': { generic: 'Metformin', strength: '500 mg', form: 'Tablet' },

  // Azithromycin
  'azee': { generic: 'Azithromycin', strength: '500 mg', form: 'Tablet' },
  'azee 500': { generic: 'Azithromycin', strength: '500 mg', form: 'Tablet' },
  'azithral': { generic: 'Azithromycin', strength: '500 mg', form: 'Tablet' },
  'azithral 500': { generic: 'Azithromycin', strength: '500 mg', form: 'Tablet' },
  'zithromax': { generic: 'Azithromycin', strength: '250 mg', form: 'Tablet' },

  // Cetirizine / Levocetirizine
  'cetzine': { generic: 'Cetirizine', strength: '10 mg', form: 'Tablet' },
  'cetzine 10': { generic: 'Cetirizine', strength: '10 mg', form: 'Tablet' },
  'alerid': { generic: 'Cetirizine', strength: '10 mg', form: 'Tablet' },
  'okacet': { generic: 'Cetirizine', strength: '10 mg', form: 'Tablet' },
  'zyrtec': { generic: 'Cetirizine', strength: '10 mg', form: 'Tablet' },
  'vozet': { generic: 'Levocetirizine', strength: '5 mg', form: 'Tablet' },
  'levocet': { generic: 'Levocetirizine', strength: '5 mg', form: 'Tablet' },

  // Ibuprofen
  'brufen': { generic: 'Ibuprofen', strength: '400 mg', form: 'Tablet' },
  'brufen 400': { generic: 'Ibuprofen', strength: '400 mg', form: 'Tablet' },
  'advil': { generic: 'Ibuprofen', strength: '200 mg', form: 'Tablet' },
  'motrin': { generic: 'Ibuprofen', strength: '200 mg', form: 'Tablet' },
  'combiflam': { generic: 'Ibuprofen and Paracetamol', strength: '400mg/325mg', form: 'Tablet' },

  // Atorvastatin
  'atorva': { generic: 'Atorvastatin', strength: '10 mg', form: 'Tablet' },
  'atorva 10': { generic: 'Atorvastatin', strength: '10 mg', form: 'Tablet' },
  'atorva 20': { generic: 'Atorvastatin', strength: '20 mg', form: 'Tablet' },
  'atorlip': { generic: 'Atorvastatin', strength: '10 mg', form: 'Tablet' },
  'lipitor': { generic: 'Atorvastatin', strength: '10 mg', form: 'Tablet' },

  // Telmisartan / Amlodipine
  'telma': { generic: 'Telmisartan', strength: '40 mg', form: 'Tablet' },
  'telma 40': { generic: 'Telmisartan', strength: '40 mg', form: 'Tablet' },
  'telmikind': { generic: 'Telmisartan', strength: '40 mg', form: 'Tablet' },
  'amlosafe': { generic: 'Amlodipine', strength: '5 mg', form: 'Tablet' },
  'amlong': { generic: 'Amlodipine', strength: '5 mg', form: 'Tablet' },
  'norvasc': { generic: 'Amlodipine', strength: '5 mg', form: 'Tablet' },

  // Cefixime / Antibiotics
  'zifi': { generic: 'Cefixime', strength: '200 mg', form: 'Tablet' },
  'zifi 200': { generic: 'Cefixime', strength: '200 mg', form: 'Tablet' },
  'taxim-o': { generic: 'Cefixime', strength: '200 mg', form: 'Tablet' },
  'cifran': { generic: 'Ciprofloxacin', strength: '500 mg', form: 'Tablet' },
  'ciplox': { generic: 'Ciprofloxacin', strength: '500 mg', form: 'Tablet' },

  // Aspirin
  'ecosprin': { generic: 'Aspirin', strength: '75 mg', form: 'Tablet' },
  'ecosprin 75': { generic: 'Aspirin', strength: '75 mg', form: 'Tablet' },
  'ecosprin 150': { generic: 'Aspirin', strength: '150 mg', form: 'Tablet' },
  'disprin': { generic: 'Aspirin', strength: '350 mg', form: 'Tablet' },
};

/**
 * Normalizes input brand string to key (stripping hyphens and extra spaces)
 */
export function cleanBrandQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Local fast mapping check for Indian & global brands
 */
export function resolveLocalBrandToGeneric(brandName: string): { generic: string; strength?: string; form?: string } | null {
  if (!brandName) return null;
  const clean = cleanBrandQuery(brandName);

  // Exact match
  if (COMMON_BRAND_TO_INGREDIENT_MAP[clean]) {
    return COMMON_BRAND_TO_INGREDIENT_MAP[clean];
  }

  // Without dosage suffix (e.g. "dolo-650" -> "dolo")
  const baseName = clean.replace(/\b\d+(\.\d+)?\s*(mg|g|mcg|ml)?\b/gi, '').trim();
  if (baseName && COMMON_BRAND_TO_INGREDIENT_MAP[baseName]) {
    return COMMON_BRAND_TO_INGREDIENT_MAP[baseName];
  }

  // Prefix matching
  for (const [key, mapping] of Object.entries(COMMON_BRAND_TO_INGREDIENT_MAP)) {
    if (clean.startsWith(key) || key.startsWith(clean)) {
      return mapping;
    }
  }

  return null;
}

/**
 * RxNorm REST API normalization: Converts brand name to generic ingredient concept
 * Uses https://rxnav.nlm.nih.gov/REST/
 */
export async function normalizeBrandWithRxNorm(brandName: string): Promise<string | null> {
  const clean = brandName.trim();
  if (!clean || clean.length < 2) return null;

  try {
    const encoded = encodeURIComponent(clean);

    // 1. Check drugs endpoint
    const url = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encoded}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const conceptGroup = data.drugGroup?.conceptGroup;
      if (Array.isArray(conceptGroup)) {
        // Look for ingredient group (TTY: 'IN' or 'MIN')
        for (const group of conceptGroup) {
          if ((group.tty === 'IN' || group.tty === 'MIN') && Array.isArray(group.conceptProperties) && group.conceptProperties.length > 0) {
            return group.conceptProperties[0].name;
          }
        }
        // If brand drug concept found (TTY: 'SBD' or 'BN' or 'SCD'), extract active ingredient name
        for (const group of conceptGroup) {
          if (Array.isArray(group.conceptProperties)) {
            for (const prop of group.conceptProperties) {
              if (prop.synonym && prop.synonym.toLowerCase() !== clean.toLowerCase()) {
                return prop.synonym;
              }
              // SCD format is often "Ingredient Strength Form"
              if (prop.tty === 'SCD' && prop.name) {
                const parts = prop.name.split(/\s+\d+/);
                if (parts[0] && parts[0].trim().length > 2) {
                  return parts[0].trim();
                }
              }
            }
          }
        }
      }
    }

    // 2. Secondary check via RxNorm approximateTerm endpoint
    const approxUrl = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encoded}&maxEntries=3`;
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 4000);
    const approxRes = await fetch(approxUrl, {
      headers: { 'Accept': 'application/json' },
      signal: controller2.signal,
    });
    clearTimeout(timeout2);

    if (approxRes.ok) {
      const approxData = await approxRes.json();
      const candidates = approxData.approximateGroup?.candidate;
      if (Array.isArray(candidates) && candidates.length > 0) {
        // Retrieve concept info for top candidate
        const topRxcui = candidates[0].rxcui;
        if (topRxcui) {
          const relUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${topRxcui}/related.json?tty=IN`;
          const controller3 = new AbortController();
          const timeout3 = setTimeout(() => controller3.abort(), 3500);
          const relRes = await fetch(relUrl, { headers: { 'Accept': 'application/json' }, signal: controller3.signal });
          clearTimeout(timeout3);
          if (relRes.ok) {
            const relData = await relRes.json();
            const relGroups = relData.relatedGroup?.conceptGroup;
            if (Array.isArray(relGroups)) {
              for (const rg of relGroups) {
                if (rg.tty === 'IN' && Array.isArray(rg.conceptProperties) && rg.conceptProperties.length > 0) {
                  return rg.conceptProperties[0].name;
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    // Non-fatal RxNorm query failure
  }

  return null;
}

/**
 * Unified Brand Normalization:
 * Combines local Indian brand dictionary + RxNorm API resolution
 */
export async function resolveGenericIngredient(brandName: string): Promise<{
  generic: string;
  source: 'local_dictionary' | 'rxnorm' | 'direct';
  strength?: string;
  form?: string;
}> {
  // 1. Fast local dictionary check (covering Indian brands like Dolo, Augmentin, Pan-40, Calpol, etc.)
  const localMatch = resolveLocalBrandToGeneric(brandName);
  if (localMatch) {
    return {
      generic: localMatch.generic,
      source: 'local_dictionary',
      strength: localMatch.strength,
      form: localMatch.form,
    };
  }

  // 2. RxNorm NIH Normalization
  const rxNormGeneric = await normalizeBrandWithRxNorm(brandName);
  if (rxNormGeneric) {
    return {
      generic: rxNormGeneric,
      source: 'rxnorm',
    };
  }

  // 3. Direct query name
  return {
    generic: brandName.trim(),
    source: 'direct',
  };
}
