/**
 * Hardcoded Brand-to-Generic Dictionary & Aggressive OCR Sanitization Engine
 * Maps popular Indian and international brand names directly to their canonical generic salt names.
 */

export const BRAND_TO_GENERIC_MAP: Record<string, string> = {
  // Azithromycin
  'azithral': 'azithromycin',
  'azithral-500': 'azithromycin',
  'azithral 500': 'azithromycin',
  'azithral 250': 'azithromycin',
  'azee': 'azithromycin',
  'azee 500': 'azithromycin',
  'azee 250': 'azithromycin',
  'zithromax': 'azithromycin',
  'zithrox': 'azithromycin',
  'azithro': 'azithromycin',
  'azitop': 'azithromycin',

  // Paracetamol / Acetaminophen
  'dolo': 'paracetamol',
  'dolo-650': 'paracetamol',
  'dolo 650': 'paracetamol',
  'dolo650': 'paracetamol',
  'crocin': 'paracetamol',
  'crocin advance': 'paracetamol',
  'crocin 650': 'paracetamol',
  'calpol': 'paracetamol',
  'calpol 500': 'paracetamol',
  'calpol 650': 'paracetamol',
  'pacimol': 'paracetamol',
  'pacimol 650': 'paracetamol',
  'tylenol': 'acetaminophen',

  // Omeprazole / Rabeprazole
  'omez': 'omeprazole',
  'omez-20': 'omeprazole',
  'omez 20': 'omeprazole',
  'omez 40': 'omeprazole',
  'omeprazole': 'omeprazole',
  'prilosec': 'omeprazole',
  'razo': 'rabeprazole',
  'rabekind': 'rabeprazole',
  'rabicip': 'rabeprazole',

  // Amoxicillin / Amoxicillin + Clavulanate
  'augmentin': 'amoxicillin',
  'augmentin 625': 'amoxicillin',
  'augmentin 625 duo': 'amoxicillin',
  'augmentin duo': 'amoxicillin',
  'clavam': 'amoxicillin',
  'clavam 625': 'amoxicillin',
  'moxclav': 'amoxicillin',
  'mox': 'amoxicillin',
  'mox 500': 'amoxicillin',
  'novamox': 'amoxicillin',
  'novamox 500': 'amoxicillin',
  'amoxil': 'amoxicillin',

  // Diphenhydramine (Cough / Allergy)
  'benadryl': 'diphenhydramine',
  'benadryl cough': 'diphenhydramine',

  // Pantoprazole
  'pan': 'pantoprazole',
  'pan-40': 'pantoprazole',
  'pan 40': 'pantoprazole',
  'pantocid': 'pantoprazole',
  'pantocid 40': 'pantoprazole',
  'pantop': 'pantoprazole',
  'pantodac': 'pantoprazole',
  'protonix': 'pantoprazole',

  // Metformin
  'glycomet': 'metformin',
  'glycomet 500': 'metformin',
  'glycomet 850': 'metformin',
  'glucophage': 'metformin',

  // Cetirizine / Levocetirizine
  'cetzine': 'cetirizine',
  'cetzine 10': 'cetirizine',
  'alerid': 'cetirizine',
  'okacet': 'cetirizine',
  'zyrtec': 'cetirizine',
  'vozet': 'levocetirizine',
  'levocet': 'levocetirizine',

  // Fexofenadine
  'allegra': 'fexofenadine',
  'allegra 120': 'fexofenadine',
  'allegra 180': 'fexofenadine',
  'fexova': 'fexofenadine',

  // Ibuprofen
  'brufen': 'ibuprofen',
  'brufen 400': 'ibuprofen',
  'advil': 'ibuprofen',
  'motrin': 'ibuprofen',
  'combiflam': 'ibuprofen',

  // Atorvastatin
  'atorva': 'atorvastatin',
  'atorva 10': 'atorvastatin',
  'atorva 20': 'atorvastatin',
  'atorlip': 'atorvastatin',
  'lipitor': 'atorvastatin',

  // Telmisartan / Amlodipine
  // Zerodol / Aceclofenac
  'zerodol': 'aceclofenac',
  'zerodol-sp': 'aceclofenac',
  'zerodol sp': 'aceclofenac',
  'zerodol-p': 'aceclofenac',
  'zerodol p': 'aceclofenac',
  'hifenac': 'aceclofenac',
  'aceclo': 'aceclofenac',

  // Telmisartan / Amlodipine
  'telma': 'telmisartan',
  'telma 40': 'telmisartan',
  'telmikind': 'telmisartan',
  'norvasc': 'amlodipine',
  'amlong': 'amlodipine',

  // Aciloc / Ranitidine / Acid Reducers
  'aciloc': 'ranitidine',
  'aciloc-150': 'ranitidine',
  'aciloc 150': 'ranitidine',
  'aciloc 300': 'ranitidine',
  'zantac': 'ranitidine',
  'rantac': 'ranitidine',

  // Other Common Indian Formularies
  'lantus': 'insulin glargine',
  'ascoril': 'salbutamol',
  'ciplox': 'ciprofloxacin',
  'ciprogut': 'ciprofloxacin',
  'meftal': 'mefenamic acid',
  'meftal-spas': 'mefenamic acid',
};

// Authoritative known generic names set (lowercase)
export const KNOWN_GENERICS = new Set<string>([
  'azithromycin',
  'paracetamol',
  'acetaminophen',
  'omeprazole',
  'amoxicillin',
  'diphenhydramine',
  'pantoprazole',
  'metformin',
  'cetirizine',
  'fexofenadine',
  'ibuprofen',
  'atorvastatin',
  'telmisartan',
  'insulin glargine',
  'salbutamol',
  'ranitidine',
  'ciprofloxacin',
  'amlodipine',
  'mefenamic acid',
  'rabeprazole',
  'levocetirizine',
  'aceclofenac',
  'serratiopeptidase',
  'clavulanate',
  'aspirin',
]);

export interface SanitizedOcrResult {
  rawText: string;
  sanitizedText: string;
  tokens: string[];
  longestWords: string[];
  topCandidate: string;
  matchedBrand?: string;
  genericName?: string;
  detectedDosage?: string;
  detectedForm?: string;
  searchQuery: string;
}

/**
 * Aggressive OCR Text Sanitization & Longest Word Heuristic:
 * 1. Converts text to lowercase.
 * 2. Extracts dosage and dosage form before stripping.
 * 3. Strips all non-medical noise: numbers, dosages, packaging terms, company names, boilerplate.
 * 4. The Longest Word Heuristic: Generic active salts are typically the longest words
 *    in the block (e.g., "Azithromycin", "Paracetamol", "Pantoprazole", "Aceclofenac").
 * 5. Extracts top 3 longest words as primary search candidates.
 * 6. Cross-references against brandDictionary and known generics.
 */
export function sanitizeOcrText(rawText: string): SanitizedOcrResult {
  if (!rawText || typeof rawText !== 'string') {
    return {
      rawText: '',
      sanitizedText: '',
      tokens: [],
      longestWords: [],
      topCandidate: '',
      searchQuery: '',
    };
  }

  const rawLower = rawText.toLowerCase().trim();

  // 1. Extract detected dosage (e.g., 500mg, 650mg, 20mg, 100ml, 625mg)
  let detectedDosage: string | undefined;
  const doseMatch = rawLower.match(/(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|units|iu)|\b(?:500|650|625|400|250|150|20|10|40|100)\b)/i);
  if (doseMatch) {
    const rawVal = doseMatch[1].trim();
    detectedDosage = /\d+$/.test(rawVal) ? `${rawVal} mg` : rawVal;
  }

  // 2. Extract detected form (Tablet, Capsule, Syrup, Injection, etc.)
  let detectedForm: string | undefined;
  if (/syrup|suspension|liquid|elixir/i.test(rawLower)) {
    detectedForm = 'Syrup';
  } else if (/capsule|caplet/i.test(rawLower)) {
    detectedForm = 'Capsule';
  } else if (/injection|injectable|vial|pen/i.test(rawLower)) {
    detectedForm = 'Injection';
  } else if (/tablet|tab/i.test(rawLower)) {
    detectedForm = 'Tablet';
  }

  // 3. Robust Regex Noise Stripping
  // A. Dosages, units, percentages, and standalone numbers
  let cleaned = rawLower
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|ml|mcg|µg|g|gm|iu|units|%)\b/gi, ' ')
    .replace(/\b\d+\b/g, ' ');

  // B. Packaging and dosage form terms
  cleaned = cleaned.replace(
    /\b(?:tablets?|capsules?|syrups?|suspensions?|oral\s+suspension|injections?|strips?|box|boxes|bottles?|packs?|blisters?|caplets?|drops?|gels?|ointments?|solutions?|elixirs?|tab|cap|inj|vials?|ampoules?)\b/gi,
    ' '
  );

  // C. Pharmacopeial standards and regulatory acronyms
  cleaned = cleaned.replace(/\b(?:ip|bp|usp|ep|nf|in)\b/gi, ' ');

  // D. Common company names, manufacturing, and marketing keywords
  cleaned = cleaned.replace(
    /\b(?:mfr|mfg|manufactured|marketed|marketer|by|pharma|pharmaceuticals?|labs?|laboratories|ltd|limited|inc|incorporated|pvt|private|co|corp|dist|distributed|division|alembic|micro|dr\s*reddys?|sun|gsk|cipla|ipca|cadila|abbott|sanofi|pfizer|alkem|usv|johnson|consumer|healthcare)\b/gi,
    ' '
  );

  // E. Storage, directions, and administrative noise
  cleaned = cleaned.replace(
    /\b(?:batch|no|lot|exp|expiry|exp\s*date|mfd|mrp|rs|inr|lic|licence|license|store|below|protect|from|light|moisture|keep|out|of|reach|children|caution|warning|schedule|h|h1|g|x|rx|only|direction|directions|dosage|as|directed|physician|doctor|for|use|oral|route|swallow|whole|chew|crush|regd|tm)\b/gi,
    ' '
  );

  // F. Strip non-alphanumeric noise characters, preserve letters and hyphens
  cleaned = cleaned.replace(/[^a-z\s-]/gi, ' ').replace(/\s+/g, ' ').trim();

  // 4. Split remaining text into words (length >= 3)
  const rawWords = cleaned
    .split(/\s+/)
    .map((w) => w.trim().replace(/^-+|-+$/g, ''))
    .filter((w) => w.length >= 3);

  // 5. The "Longest Word" Heuristic:
  // Generic active ingredients are typically the longest chemical words (e.g., "azithromycin", "paracetamol", "pantoprazole")
  const uniqueWords = Array.from(new Set(rawWords));
  const sortedByLength = [...uniqueWords].sort((a, b) => b.length - a.length);
  const longestWords = sortedByLength.slice(0, 3);
  const topCandidate = longestWords[0] || '';

  // 6. Check for Brand Mappings in BRAND_TO_GENERIC_MAP
  let matchedBrand: string | undefined;
  let genericName: string | undefined;

  // A. Check exact brand phrases in direct input (e.g., "azithral-500", "zerodol-sp", "dolo-650")
  const normalizedDirect = rawLower.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [brandKey, mappedGeneric] of Object.entries(BRAND_TO_GENERIC_MAP)) {
    const rx = new RegExp(`\\b${brandKey.replace('-', '[- ]?')}\\b`, 'i');
    if (rx.test(normalizedDirect)) {
      matchedBrand = brandKey.charAt(0).toUpperCase() + brandKey.slice(1);
      genericName = mappedGeneric;
      break;
    }
  }

  // B. Check longest words and tokens against BRAND_TO_GENERIC_MAP
  if (!genericName) {
    for (const w of [...longestWords, ...uniqueWords]) {
      if (BRAND_TO_GENERIC_MAP[w]) {
        matchedBrand = w.charAt(0).toUpperCase() + w.slice(1);
        genericName = BRAND_TO_GENERIC_MAP[w];
        break;
      }
    }
  }

  // C. Check if any word IS a recognized generic name
  if (!genericName) {
    for (const w of [...longestWords, ...uniqueWords]) {
      if (KNOWN_GENERICS.has(w)) {
        genericName = w;
        break;
      }
    }
  }

  // D. Check substring matches for known generics (e.g. "azithromycin" in "azithromycindihydrate")
  if (!genericName) {
    for (const gen of KNOWN_GENERICS) {
      if (cleaned.includes(gen)) {
        genericName = gen;
        break;
      }
    }
  }

  // If no generic name resolved yet, the longest word is our prime search candidate!
  const finalSearchQuery = genericName || topCandidate || rawWords[0] || rawLower;

  return {
    rawText,
    sanitizedText: cleaned || rawWords.join(' '),
    tokens: rawWords,
    longestWords,
    topCandidate,
    matchedBrand,
    genericName,
    detectedDosage,
    detectedForm: detectedForm || 'Tablet',
    searchQuery: finalSearchQuery,
  };
}
