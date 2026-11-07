import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { toast } from './toast.js';

export { toast };

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a pleasant medical chime alert (two-tone chord)
 */
export function playReminderChime(soundType: string = 'chime') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (soundType === 'bell') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } else {
      // Two-tone medical reminder chime: E5 -> B5 -> E6
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(659.25, now, 0.35); // E5
      playTone(987.77, now + 0.18, 0.45); // B5
      playTone(1318.51, now + 0.36, 0.8); // E6
    }

    // Trigger haptic vibration if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
  } catch (err) {
    console.warn('Audio playback not permitted yet or failed:', err);
  }
}

export interface SpeechOptions {
  lang?: 'en' | 'kn';
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onFallback?: (msg: string) => void;
  onLoading?: (isLoading: boolean) => void;
}

/**
 * Translates common clinical prescription and label phrases into natural Kannada
 */
export function translateInstructionToKannada(text: string): string {
  if (!text) return '';
  // If already in Kannada, preserve
  if (/[\u0C80-\u0CFF]/.test(text)) return text;

  let kn = text;
  kn = kn.replace(/take strictly according to physician advice\.?/gi, 'ವೈದ್ಯರ ಸಲಹೆಯಂತೆ ಮಾತ್ರ ಸೇವಿಸಿ.');
  kn = kn.replace(/follow prescribed precautions and storage directions\.?/gi, 'ಮುನ್ನೆಚ್ಚರಿಕೆಗಳನ್ನು ಪಾಲಿಸಿ ಮತ್ತು ಮಕ್ಕಳಿಂದ ದೂರವಿಡಿ.');
  kn = kn.replace(/consult prescribing clinician for indication and target diagnosis\.?/gi, 'ಸೂಚನೆಗಳಿಗಾಗಿ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.');
  kn = kn.replace(/take 1 tablet daily before food/gi, 'ದಿನಕ್ಕೆ ಒಂದು ಮಾತ್ರೆ ಊಟಕ್ಕೆ ಮುಂಚೆ ಸೇವಿಸಿ');
  kn = kn.replace(/take 1 or 2 tablets every 6 hours/gi, 'ಪ್ರತಿ 6 ಗಂಟೆಗೊಮ್ಮೆ 1 ಅಥವಾ 2 ಮಾತ್ರೆ ಸೇವಿಸಿ');
  kn = kn.replace(/take 1 capsule orally every 8 hours with water/gi, 'ಪ್ರತಿ 8 ಗಂಟೆಗೊಮ್ಮೆ 1 ಕ್ಯಾಪ್ಸೂಲ್ ನೀರಿನೊಂದಿಗೆ ಸೇವಿಸಿ');
  kn = kn.replace(/take with breakfast and dinner/gi, 'ಬೆಳಗ್ಗಿನ ಉಪಹಾರ ಮತ್ತು ರಾತ್ರಿಯ ಊಟದೊಂದಿಗೆ ಸೇವಿಸಿ');
  kn = kn.replace(/take with food/gi, 'ಊಟದೊಂದಿಗೆ ಸೇವಿಸಿ');
  kn = kn.replace(/take after food/gi, 'ಊಟದ ನಂತರ ಸೇವಿಸಿ');
  kn = kn.replace(/take before food/gi, 'ಊಟಕ್ಕೆ ಮುಂಚೆ ಸೇವಿಸಿ');
  kn = kn.replace(/after food/gi, 'ಊಟದ ನಂತರ');
  kn = kn.replace(/before food/gi, 'ಊಟಕ್ಕೆ ಮುಂಚೆ');
  kn = kn.replace(/with food/gi, 'ಊಟದೊಂದಿಗೆ');
  kn = kn.replace(/empty stomach/gi, 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ');
  kn = kn.replace(/at bedtime/gi, 'ರಾತ್ರಿ ಮಲಗುವ ಮುನ್ನ');
  kn = kn.replace(/complete full prescribed course/gi, 'ಸಂಪೂರ್ಣ ಕೋರ್ಸ್ ಪೂರ್ಣಗೊಳಿಸಿ');
  kn = kn.replace(/do not consume excessive alcohol while taking this medicine/gi, 'ಈ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವಾಗ ಮದ್ಯಪಾನ ಮಾಡಬೇಡಿ');
  kn = kn.replace(/do not exceed 4000mg/gi, '4000 ಮಿಲಿಗ್ರಾಂ ಮೀರಬಾರದು');
  kn = kn.replace(/avoid alcohol/gi, 'ಮದ್ಯಪಾನ ಮಾಡಬೇಡಿ');
  kn = kn.replace(/store below 25°c/gi, '25 ಡಿಗ್ರಿಗಿಂತ ಕಡಿಮೆ ತಾಪಮಾನದಲ್ಲಿ ಇರಿಸಿ');
  return kn;
}

/**
 * Builds formatted narration text for medicine detail reading aloud
 * Includes dosage, usage, food instructions, and side effects in English and Kannada
 */
export function buildMedicineNarration(
  medicine: {
    name: string;
    strength?: string;
    dosageInstructions?: string;
    foodInstructions?: string;
    sideEffects?: string;
    warnings?: string;
  },
  lang: 'en' | 'kn' = 'en'
): string {
  const name = medicine.name || 'Medicine';
  const strength = medicine.strength ? `, ${medicine.strength}` : '';
  const dosage = medicine.dosageInstructions || (lang === 'kn' ? 'ವೈದ್ಯರ ಸಲಹೆಯಂತೆ ಮಾತ್ರ ಸೇವಿಸಿ.' : 'Take as instructed by healthcare practitioner.');
  const food = medicine.foodInstructions || '';
  const sideEffects = medicine.sideEffects || '';
  const warnings = medicine.warnings || (lang === 'kn' ? 'ಮುನ್ನೆಚ್ಚರಿಕೆಗಳನ್ನು ಪಾಲಿಸಿ ಮತ್ತು ಮಕ್ಕಳಿಂದ ದೂರವಿಡಿ.' : 'Follow prescribed precautions and storage directions.');

  if (lang === 'kn') {
    let knText = `ಔಷಧಿ ಹೆಸರು: ${name}${strength}. ಸೇವಿಸುವ ವಿಧಾನ: ${translateInstructionToKannada(dosage)}.`;
    if (food) {
      knText += ` ಊಟದ ಸೂಚನೆ: ${translateInstructionToKannada(food)}.`;
    }
    if (sideEffects) {
      knText += ` ಸಾಮಾನ್ಯ ಅಡ್ಡಪರಿಣಾಮಗಳು: ${translateInstructionToKannada(sideEffects)}.`;
    }
    if (warnings) {
      knText += ` ಎಚ್ಚರಿಕೆಗಳು: ${translateInstructionToKannada(warnings)}.`;
    }
    return knText;
  }

  // English: Medicine: Amoxicillin, 500 mg. Dosage and administration: Take 1 capsule... Food instructions: ... Side effects / Warnings: ...
  let enText = `Medicine: ${name}${strength}. Dosage and administration: ${dosage}.`;
  if (food) {
    enText += ` Food instructions: ${food}.`;
  }
  if (sideEffects) {
    enText += ` Common side effects include ${sideEffects}.`;
  }
  if (warnings) {
    enText += ` Warnings and precautions: ${warnings}.`;
  }
  return enText;
}

/**
 * Sanitizes speech text by stripping markdown, HTML, raw database/JSON keys,
 * and expanding medical abbreviations (mg -> milligrams, ml -> milliliters).
 */
export function cleanSpeechField(value: any, isAbbrevConverted: boolean = true): string {
  if (value === null || value === undefined) return '';
  let str = '';
  if (Array.isArray(value)) {
    str = value
      .filter((v) => v !== null && v !== undefined)
      .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
      .join(', ');
  } else if (typeof value === 'object') {
    str =
      value.instruction ||
      value.summary ||
      (Array.isArray(value.common) ? value.common.join(', ') : '') ||
      '';
  } else {
    str = String(value);
  }

  // Gracefully skip literal 'null', 'undefined', 'n/a', 'none'
  if (/^(null|undefined|none|n\/a|unspecified)$/i.test(str.trim())) return '';

  // 1. Remove HTML tags
  str = str.replace(/<[^>]+>/g, ' ');

  // 2. Remove raw JSON / database keys
  const jsonKeys = [
    /\b(dosage_and_administration|indications_and_usage|adverse_reactions|contraindications|boxed_warning|dosageInstructions|foodInstructions|foodInteractions|sideEffects|rawInstructions|warnings_and_precautions|ingredientFallbackUsed|verifiedBadge|meal_instruction|custom_name|active_ingredient)\b[:\s=]*/gi,
  ];
  for (const regex of jsonKeys) {
    str = str.replace(regex, ' ');
  }

  // Replace snake_case underscores in leftover identifiers
  str = str.replace(/([a-zA-Z]+)_([a-zA-Z]+)/g, '$1 $2');

  // 3. Remove all markdown symbols, hyphens, and bullet points: *, -, #, `, ~, [, ], (, ), >, •
  str = str.replace(/[\*\_#\`~\[\]\(\)>•–—\-]/g, ' ');
  // Remove list numbering e.g. "1. " or "1) " at line starts without stripping quantity digits
  str = str.replace(/^\s*(?:[•–—]|\d+[.)])\s+/gm, ' ');

  // 4. Convert medical abbreviations
  if (isAbbrevConverted) {
    str = str.replace(/(\d+)\s*mg\b/gi, '$1 milligrams');
    str = str.replace(/\bmg\b/gi, 'milligrams');
    str = str.replace(/(\d+)\s*ml\b/gi, '$1 milliliters');
    str = str.replace(/\bml\b/gi, 'milliliters');
    str = str.replace(/(\d+)\s*mcg\b/gi, '$1 micrograms');
    str = str.replace(/\bmcg\b/gi, 'micrograms');
  }

  // Normalize spaces
  str = str.replace(/\s+/g, ' ').trim();

  // If text became just punctuation or empty
  if (/^[.,;:!?-]+$/.test(str)) return '';

  return str;
}

/**
 * Truncates long label sections (max 3 sentences or ~300 characters)
 */
export function limitSection(text: string): { text: string; isTruncated: boolean } {
  if (!text) return { text: '', isTruncated: false };
  const trimmed = text.trim();
  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  let isTruncated = false;
  let result = trimmed;

  if (sentences.length > 3) {
    result = sentences.slice(0, 3).join(' ');
    isTruncated = true;
  }

  if (result.length > 300) {
    const slice = result.slice(0, 300);
    const lastBoundary = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
    if (lastBoundary > 60) {
      result = slice.slice(0, lastBoundary + 1);
    } else {
      result = slice.trim().replace(/[,;\s]+$/, '');
    }
    isTruncated = true;
  }

  return { text: result.replace(/[.\s]+$/, ''), isTruncated };
}

/**
 * Natural Language Speech Formatter
 * Builds conversational, human-like prescription narration for English & Kannada
 */
export function formatForSpeech(medicine: any, language: 'en' | 'kn' = 'en'): string {
  if (!medicine) return '';

  const isKn = language === 'kn';

  // 1. Resolve Medicine Name
  const rawName =
    medicine.name ||
    medicine.medicine_name ||
    medicine.brand ||
    medicine.custom_name ||
    medicine.brandName ||
    medicine.genericName ||
    (isKn ? 'ಔಷಧಿ' : 'Medicine');
  const cleanName = cleanSpeechField(rawName);

  // 2. Resolve Food Instruction
  let rawFood = '';
  if (isKn && medicine.kannada?.foodInstructions) {
    rawFood = medicine.kannada.foodInstructions;
  } else {
    const rawTiming =
      medicine.meal_instruction ||
      medicine.foodInstructions?.timing ||
      medicine.foodInteractions?.timing;

    if (rawTiming === 'before_food') {
      rawFood = isKn ? 'ಊಟಕ್ಕೆ ಮುಂಚೆ ಸೇವಿಸಿ' : 'Take before food';
    } else if (rawTiming === 'with_food') {
      rawFood = isKn ? 'ಊಟದೊಂದಿಗೆ ಸೇವಿಸಿ' : 'Take with food';
    } else if (rawTiming === 'empty_stomach') {
      rawFood = isKn ? 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಸೇವಿಸಿ' : 'Take on an empty stomach';
    } else if (rawTiming === 'after_food') {
      rawFood = isKn ? 'ಊಟದ ನಂತರ ಸೇವಿಸಿ' : 'Take after food';
    } else {
      rawFood =
        medicine.foodInstruction ||
        medicine.foodInstructions?.instruction ||
        medicine.foodInstructions ||
        medicine.foodInteractions?.instruction ||
        medicine.food ||
        '';
      if (typeof rawFood === 'object') {
        rawFood = (rawFood as any).instruction || (rawFood as any).timingLabel || '';
      }
    }
  }

  let cleanFood = cleanSpeechField(rawFood);
  if (isKn && cleanFood && !/[\u0C80-\u0CFF]/.test(cleanFood)) {
    cleanFood = translateInstructionToKannada(cleanFood);
  }

  // 3. Resolve Dosage
  let rawDosage =
    (isKn && medicine.kannada?.usageAndDosage) ||
    medicine.dosage ||
    medicine.dosageInstructions ||
    medicine.dosage_and_administration ||
    medicine.usageAndDosage?.summary ||
    medicine.usageAndDosage?.recommendedDose ||
    medicine.prescription_instructions ||
    '';
  let cleanDosage = cleanSpeechField(rawDosage);
  if (isKn && cleanDosage && !/[\u0C80-\u0CFF]/.test(cleanDosage)) {
    cleanDosage = translateInstructionToKannada(cleanDosage);
  }

  // 4. Resolve Usage / Indications
  let rawUsage =
    medicine.usage ||
    medicine.indications ||
    medicine.indications_and_usage ||
    medicine.verified_purpose_en ||
    medicine.usageAndDosage?.indications ||
    medicine.purpose ||
    '';
  let cleanUsage = cleanSpeechField(rawUsage);
  if (isKn && cleanUsage && !/[\u0C80-\u0CFF]/.test(cleanUsage)) {
    cleanUsage = translateInstructionToKannada(cleanUsage);
  }
  const usageResult = limitSection(cleanUsage);
  cleanUsage = usageResult.text;
  const isUsageTruncated = usageResult.isTruncated;

  // 5. Resolve Side Effects
  let rawSideEffects =
    (isKn && medicine.kannada?.sideEffects) ||
    (medicine.sideEffects && typeof medicine.sideEffects === 'object' && Array.isArray(medicine.sideEffects.common)
      ? medicine.sideEffects.common
      : medicine.sideEffects) ||
    medicine.side_effects ||
    medicine.adverse_reactions ||
    '';
  let cleanSideEffects = cleanSpeechField(rawSideEffects);
  if (isKn && cleanSideEffects && !/[\u0C80-\u0CFF]/.test(cleanSideEffects)) {
    cleanSideEffects = translateInstructionToKannada(cleanSideEffects);
  }
  const sideEffectsResult = limitSection(cleanSideEffects);
  cleanSideEffects = sideEffectsResult.text;
  const isSideEffectsTruncated = sideEffectsResult.isTruncated;

  // Construct conversational sentence template
  const parts: string[] = [];

  if (isKn) {
    // Kannada Template:
    // "ಇಲ್ಲಿದೆ {Medicine Name} ಮಾಹಿತಿ. {Food Instruction}. ಶಿಫಾರಸು ಮಾಡಿದ ಡೋಸೇಜ್ {Dosage}. ಈ ಔಷಧಿಯನ್ನು {Usage} ಗಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ. ಸಾಮಾನ್ಯ ಅಡ್ಡಪರಿಣಾಮಗಳು ಒಳಗೊಂಡಿರಬಹುದು {Side Effects}."
    if (cleanName) {
      parts.push(`ಇಲ್ಲಿದೆ ${cleanName} ಮಾಹಿತಿ.`);
    }
    if (cleanFood) {
      parts.push(cleanFood.endsWith('.') ? cleanFood : `${cleanFood}.`);
    }
    if (cleanDosage) {
      parts.push(`ಶಿಫಾರಸು ಮಾಡಿದ ಡೋಸೇಜ್ ${cleanDosage.replace(/[.\s]+$/, '')}.`);
    }
    if (cleanUsage) {
      parts.push(`ಈ ಔಷಧಿಯನ್ನು ${cleanUsage.replace(/[.\s]+$/, '')} ಗಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ.`);
      if (isUsageTruncated) {
        parts.push('ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ, ದಯವಿಟ್ಟು ಸಂಪೂರ್ಣ ಲೇಬಲ್ ಓದಿ.');
      }
    }
    if (cleanSideEffects) {
      parts.push(`ಸಾಮಾನ್ಯ ಅಡ್ಡಪರಿಣಾಮಗಳು ಒಳಗೊಂಡಿರಬಹುದು ${cleanSideEffects.replace(/[.\s]+$/, '')}.`);
      if (isSideEffectsTruncated) {
        parts.push('ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ, ದಯವಿಟ್ಟು ಸಂಪೂರ್ಣ ಲೇಬಲ್ ಓದಿ.');
      }
    }
  } else {
    // English Template:
    // "Here is the information for {Medicine Name}. {Food Instruction}. The recommended dosage is {Dosage}. This medicine is used for {Usage}. Please be aware that common side effects may include {Side Effects}."
    if (cleanName) {
      parts.push(`Here is the information for ${cleanName}.`);
    }
    if (cleanFood) {
      parts.push(cleanFood.endsWith('.') ? cleanFood : `${cleanFood}.`);
    }
    if (cleanDosage) {
      parts.push(`The recommended dosage is ${cleanDosage.replace(/[.\s]+$/, '')}.`);
    }
    if (cleanUsage) {
      parts.push(`This medicine is used for ${cleanUsage.replace(/[.\s]+$/, '')}.`);
      if (isUsageTruncated) {
        parts.push('For more details, please read the full label.');
      }
    }
    if (cleanSideEffects) {
      parts.push(`Please be aware that common side effects may include ${cleanSideEffects.replace(/[.\s]+$/, '')}.`);
      if (isSideEffectsTruncated) {
        parts.push('For more details, please read the full label.');
      }
    }
  }

  return parts.join(' ');
}

/**
 * Checks if a native Kannada voice (kn-IN or kn) is installed on device
 */
export function isKannadaVoiceAvailable(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  return voices.some((v) => {
    const l = (v.lang || '').trim().toLowerCase();
    return l === 'kn-in' || l === 'kn';
  });
}

export interface KannadaVoiceStatus {
  available: boolean;
  voiceName: string | null;
  guidance: string;
}

/**
 * Returns detailed diagnostics on whether the Android/browser device has the Kannada voice pack
 */
export function getKannadaVoiceStatus(): KannadaVoiceStatus {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return {
      available: false,
      voiceName: null,
      guidance: 'Web Speech API is not supported in this browser.',
    };
  }
  const voices = window.speechSynthesis.getVoices();
  const knVoice = voices.find((v) => v.lang.toLowerCase().startsWith('kn'));
  if (knVoice) {
    return {
      available: true,
      voiceName: knVoice.name,
      guidance: `Kannada voice active: ${knVoice.name} (${knVoice.lang}).`,
    };
  }
  return {
    available: false,
    voiceName: null,
    guidance: 'Kannada voice pack not detected. Neural Gemini Kannada Speech synthesis is active.',
  };
}

/**
 * Creates and configures a SpeechSynthesisUtterance object
 */
export function createConfiguredUtterance(
  text: string,
  options: SpeechOptions = {}
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  const isKn = options.lang === 'kn';
  utterance.lang = isKn ? 'kn-IN' : 'en-US';

  // Find appropriate voice if available
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) =>
      v.lang.toLowerCase().startsWith(isKn ? 'kn' : 'en')
    );
    if (voice) {
      utterance.voice = voice;
    }
  }

  // Rate, pitch, and volume adjustments
  utterance.rate = options.rate !== undefined ? options.rate : (isKn ? 0.9 : 1.0);
  utterance.pitch = options.pitch !== undefined ? options.pitch : 1.0;
  utterance.volume = options.volume !== undefined ? options.volume : 1.0;

  return utterance;
}

// Active audio element tracking for server/cloud-synthesized audio
let activeAudioElement: HTMLAudioElement | null = null;

/**
 * Plays audio from a free public Cloud TTS endpoint (Google Translate TTS proxy)
 * Fallback chain: If backend returns error JSON or 503, notifies user with toast
 */
export async function playCloudTts(
  text: string,
  lang: 'kn' | 'en' = 'kn',
  options: SpeechOptions = {}
): Promise<void> {
  options.onLoading?.(true);

  if (typeof window === 'undefined') {
    options.onLoading?.(false);
    return;
  }

  // Take first 200 chars for clean playback
  const encoded = encodeURIComponent(text.slice(0, 200));
  const origin = (typeof window !== 'undefined' && window.location?.origin) || '';
  const proxyUrl = `${origin}/api/speech/cloud-tts?q=${encoded}&tl=${lang}`;

  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) {
      let errorJson = null;
      try {
        errorJson = await res.json();
      } catch {}
      console.warn('Backend Cloud TTS error status:', res.status, errorJson);
      toast.error('Audio unavailable. Please check your internet connection.');
      options.onLoading?.(false);
      options.onError?.(errorJson || new Error('Cloud TTS unavailable'));
      options.onEnd?.();
      return;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      console.warn('Cloud TTS returned JSON error:', json);
      toast.error('Audio unavailable. Please check your internet connection.');
      options.onLoading?.(false);
      options.onError?.(json);
      options.onEnd?.();
      return;
    }

    const audioBlob = await res.blob();

    if (typeof Audio === 'undefined') {
      options.onLoading?.(false);
      options.onEnd?.();
      return;
    }

    const objectUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(objectUrl);
    activeAudioElement = audio;

    if (options.volume !== undefined) audio.volume = options.volume;
    if (options.rate !== undefined) audio.playbackRate = options.rate;

    audio.onplay = () => {
      options.onLoading?.(false);
      options.onStart?.();
    };

    audio.onended = () => {
      try { URL.revokeObjectURL(objectUrl); } catch {}
      activeAudioElement = null;
      options.onLoading?.(false);
      options.onEnd?.();
    };

    audio.onerror = (e) => {
      try { URL.revokeObjectURL(objectUrl); } catch {}
      activeAudioElement = null;
      console.warn('Audio playback error:', e);
      toast.error('Audio unavailable. Please check your internet connection.');
      options.onLoading?.(false);
      options.onError?.(e);
      options.onEnd?.();
    };

    await audio.play();
  } catch (err: any) {
    console.warn('Failed to fetch or play cloud audio:', err);
    toast.error('Audio unavailable. Please check your internet connection.');
    activeAudioElement = null;
    options.onLoading?.(false);
    options.onError?.(err);
    options.onEnd?.();
  }
}

function speakViaBrowser(
  text: string,
  options: SpeechOptions
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this browser environment.');
    if (options.onFallback) {
      options.onFallback('Web Speech API not supported. Using chime indicator.');
    }
    playReminderChime('bell');
    if (options.onEnd) options.onEnd();
    return null;
  }

  const utterance = createConfiguredUtterance(text, options);

  if (options.onStart) {
    utterance.onstart = () => options.onStart!();
  }

  utterance.onend = () => {
    if (options.onEnd) options.onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    if (options.onError) options.onError(e);
    if (options.onEnd) options.onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Speaks text using native Capacitor TTS in APK, local Web Speech API if installed, or Free Cloud TTS
 */
export function speakText(
  text: string,
  optionsOrLang?: SpeechOptions | 'en' | 'kn',
  onStart?: () => void,
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  stopSpeaking();

  const options: SpeechOptions =
    typeof optionsOrLang === 'string'
      ? { lang: optionsOrLang, onStart, onEnd }
      : (optionsOrLang || {});

  const isKn = options.lang === 'kn';

  // 1. Capacitor Native TTS Engine (For Android APK)
  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    try {
      options.onLoading?.(true);
      TextToSpeech.speak({
        text,
        lang: isKn ? 'kn-IN' : 'en-US',
        rate: options.rate || 1.0,
        pitch: options.pitch || 1.0,
        volume: options.volume || 1.0,
        category: 'ambient',
      })
        .then(() => {
          options.onLoading?.(false);
          options.onEnd?.();
        })
        .catch((err) => {
          console.warn('Native Capacitor TTS error, automatically falling back to Cloud TTS:', err);
          options.onFallback?.('Local voice not found. Using cloud audio instead.');
          playCloudTts(text, isKn ? 'kn' : 'en', options);
        });
      return null;
    } catch (nativeErr) {
      console.warn('Native TTS invocation failed, automatically falling back to Cloud TTS:', nativeErr);
      options.onFallback?.('Local voice not found. Using cloud audio instead.');
      playCloudTts(text, isKn ? 'kn' : 'en', options);
      return null;
    }
  }

  // 2. Web Speech API (check if voice with lang === 'kn-IN' or lang === 'kn' exists)
  if (isKn) {
    // Listen for voiceschanged event if supported to ensure voices are fully loaded before checking
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if ('addEventListener' in window.speechSynthesis) {
          window.speechSynthesis.addEventListener(
            'voiceschanged',
            () => {
              window.speechSynthesis.getVoices();
            },
            { once: true }
          );
        }
      } catch {}
    }

    const voices =
      typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices()
        : [];
    const hasLocalKnVoice = voices.some((v) => {
      const l = (v.lang || '').trim().toLowerCase();
      return l === 'kn-in' || l === 'kn';
    });

    if (hasLocalKnVoice) {
      return speakViaBrowser(text, options);
    }

    // 3. Fallback Chain: If Kannada voice is missing, immediately call backend /api/speech/cloud-tts endpoint
    options.onFallback?.('Local voice not found. Using cloud audio instead.');
    playCloudTts(text, 'kn', options);
    return null;
  }

  // Standard English speech synthesis
  return speakViaBrowser(text, options);
}

/**
 * Speaks medicine details using authentic Kannada voice synthesis with Web Speech API fallback
 */
export function speakMedicineNarration(
  medicine: {
    name: string;
    strength?: string;
    dosageInstructions?: string;
    foodInstructions?: string;
    sideEffects?: string;
    warnings?: string;
  },
  options: SpeechOptions = {}
): SpeechSynthesisUtterance | null {
  const narration = buildMedicineNarration(medicine, options.lang || 'en');
  return speakText(narration, options);
}

/**
 * Stops all speech synthesis immediately (audio element, Web Speech, and Capacitor TTS)
 */
export function stopSpeaking(): void {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch (_) {}
    activeAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    try {
      TextToSpeech.stop().catch(() => {});
    } catch (_) {}
  }
}
