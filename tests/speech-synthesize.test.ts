import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildMedicineNarration,
  createConfiguredUtterance,
  speakText,
  speakMedicineNarration,
  stopSpeaking,
  isKannadaVoiceAvailable,
  formatForSpeech,
} from '../src/utils/audio.js';

describe('Web Speech API Engine (100% Free & Local)', () => {
  let speakMock: any;
  let cancelMock: any;
  let getVoicesMock: any;

  beforeEach(() => {
    vi.restoreAllMocks();

    speakMock = vi.fn();
    cancelMock = vi.fn();
    getVoicesMock = vi.fn().mockReturnValue([
      { lang: 'en-US', name: 'Google US English', default: true },
      { lang: 'en-GB', name: 'Google UK English Female', default: false },
    ]);

    // Mock global SpeechSynthesisUtterance class
    class MockSpeechSynthesisUtterance {
      text: string;
      lang: string = 'en-US';
      rate: number = 1.0;
      pitch: number = 1.0;
      volume: number = 1.0;
      voice: any = null;
      onstart: ((e: any) => void) | null = null;
      onend: ((e: any) => void) | null = null;
      onerror: ((e: any) => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    const listeners: Record<string, Function[]> = {};

    (globalThis as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    (globalThis as any).window = {
      location: { origin: 'http://localhost:3000' },
      speechSynthesis: {
        speak: speakMock,
        cancel: cancelMock,
        getVoices: getVoicesMock,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      addEventListener: (type: string, fn: any) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      removeEventListener: (type: string, fn: any) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter((f) => f !== fn);
        }
      },
      dispatchEvent: (e: any) => {
        const fns = listeners[e?.type] || [];
        fns.forEach((fn) => fn(e));
        return true;
      },
    };

    (globalThis as any).CustomEvent = class {
      type: string;
      detail: any;
      constructor(type: string, opts?: any) {
        this.type = type;
        this.detail = opts?.detail;
      }
    };

    // Default mock fetch for cloud tts proxy
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-type' ? 'audio/mpeg' : null),
      },
      blob: async () => new Blob(['audio-sample'], { type: 'audio/mpeg' }),
    });
  });

  it('builds comprehensive narration text containing name, strength, dosage, and warnings', () => {
    const med = {
      name: 'Amoxicillin',
      strength: '500 mg',
      dosageInstructions: 'Take 1 capsule orally every 8 hours with water.',
      warnings: 'Complete full prescribed course. Discontinue if rash occurs.',
    };

    const enScript = buildMedicineNarration(med, 'en');
    expect(enScript).toContain('Amoxicillin');
    expect(enScript).toContain('500 mg');
    expect(enScript).toContain('Take 1 capsule orally every 8 hours with water.');
    expect(enScript).toContain('Complete full prescribed course');

    const knScript = buildMedicineNarration(med, 'kn');
    expect(knScript).toContain('ಔಷಧಿ ಹೆಸರು: Amoxicillin');
    expect(knScript).toContain('500 mg');
    expect(knScript).toContain('ಸೇವಿಸುವ ವಿಧಾನ:');
    expect(knScript).toContain('ಎಚ್ಚರಿಕೆಗಳು:');
  });

  it('configures SpeechSynthesisUtterance with en-US for English language', () => {
    const utterance = createConfiguredUtterance('Take 1 tablet after food', {
      lang: 'en',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.9,
    });

    expect(utterance.lang).toBe('en-US');
    expect(utterance.rate).toBe(1.0);
    expect(utterance.pitch).toBe(1.0);
    expect(utterance.volume).toBe(0.9);
    expect(utterance.text).toBe('Take 1 tablet after food');
  });

  it('configures SpeechSynthesisUtterance with kn-IN for Kannada language and adjusted pacing', () => {
    const utterance = createConfiguredUtterance('ಊಟದ ನಂತರ ಒಂದು ಮಾತ್ರೆ ಸೇವಿಸಿ', {
      lang: 'kn',
    });

    expect(utterance.lang).toBe('kn-IN');
    expect(utterance.rate).toBe(0.9); // calibrated gentle pace for Kannada phonetics
    expect(utterance.pitch).toBe(1.0);
  });

  it('triggers window.speechSynthesis.speak with configured utterance', () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();

    const utterance = speakText('Paracetamol 650mg dosage instructions', {
      lang: 'en',
      onStart,
      onEnd,
    });

    expect(utterance).not.toBeNull();
    expect(speakMock).toHaveBeenCalledTimes(1);
    expect(speakMock).toHaveBeenCalledWith(utterance);

    // Verify callbacks work
    if (utterance?.onstart) {
      (utterance.onstart as any)({} as any);
    }
    expect(onStart).toHaveBeenCalled();

    if (utterance?.onend) {
      (utterance.onend as any)({} as any);
    }
    expect(onEnd).toHaveBeenCalled();
  });

  it('triggers speakMedicineNarration for full monograph narration', () => {
    const med = {
      name: 'Metformin',
      strength: '500 mg',
      dosageInstructions: 'Take with breakfast and dinner.',
      warnings: 'Do not consume excessive alcohol while taking this medicine.',
    };

    const utterance = speakMedicineNarration(med, { lang: 'en' });
    expect(utterance).not.toBeNull();
    expect(utterance?.text).toContain('Metformin');
    expect(utterance?.text).toContain('Do not consume excessive alcohol');
    expect(speakMock).toHaveBeenCalled();
  });

  it('stops and cancels active speech synthesis via stopSpeaking()', () => {
    stopSpeaking();
    expect(cancelMock).toHaveBeenCalledTimes(1);
  });

  it('detects missing Kannada local voice pack and invokes graceful cloud audio fallback', () => {
    const onFallback = vi.fn();
    // Default mock voices only have en-US and en-GB
    expect(isKannadaVoiceAvailable()).toBe(false);

    speakText('ಕನ್ನಡ ಧ್ವನಿ ಪರೀಕ್ಷೆ', {
      lang: 'kn',
      onFallback,
    });

    expect(onFallback).toHaveBeenCalledWith(
      expect.stringContaining('Local voice not found. Using cloud audio instead.')
    );
  });

  it('falls back to fetching Cloud TTS endpoint when window.speechSynthesis.getVoices() returns an empty array', async () => {
    getVoicesMock.mockReturnValue([]);
    expect(isKannadaVoiceAvailable()).toBe(false);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-type' ? 'audio/mpeg' : null),
      },
      blob: async () => new Blob(['mock-audio'], { type: 'audio/mpeg' }),
    });
    globalThis.fetch = fetchMock;

    const onFallback = vi.fn();
    const onEnd = vi.fn();

    speakText('ಕನ್ನಡ ಧ್ವನಿ ಪರೀಕ್ಷೆ', {
      lang: 'kn',
      onFallback,
      onEnd,
    });

    expect(onFallback).toHaveBeenCalledWith(
      expect.stringContaining('Local voice not found. Using cloud audio instead.')
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/speech/cloud-tts')
    );
  });

  it('notifies user with toast when Cloud TTS backend returns error or 503', async () => {
    getVoicesMock.mockReturnValue([]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Cloud TTS unavailable' }),
    });
    globalThis.fetch = fetchMock;

    let toastEvent: any = null;
    const listener = (e: any) => {
      toastEvent = e.detail;
    };
    (globalThis as any).window.addEventListener('mediscan:toast', listener);

    const onError = vi.fn();
    const onEnd = vi.fn();

    speakText('ಕನ್ನಡ ಧ್ವನಿ ಪರೀಕ್ಷೆ', {
      lang: 'kn',
      onError,
      onEnd,
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(fetchMock).toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
    expect(toastEvent).toEqual({
      message: 'Audio unavailable. Please check your internet connection.',
      type: 'error',
    });

    (globalThis as any).window.removeEventListener('mediscan:toast', listener);
  });

  it('translates common clinical instruction phrases to natural Kannada', async () => {
    const { translateInstructionToKannada } = await import('../src/utils/audio.js');
    expect(translateInstructionToKannada('Take 1 tablet daily before food')).toContain('ಊಟಕ್ಕೆ ಮುಂಚೆ');
    expect(translateInstructionToKannada('Take with food')).toContain('ಊಟದೊಂದಿಗೆ');
    expect(translateInstructionToKannada('At bedtime')).toContain('ರಾತ್ರಿ ಮಲಗುವ ಮುನ್ನ');
    expect(translateInstructionToKannada('ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ')).toBe('ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ');
  });

  describe('Natural Language Speech Formatter (formatForSpeech)', () => {
    it('constructs conversational paragraph for English with exact sentence template', () => {
      const med = {
        name: 'Dolo 650',
        foodInstruction: 'Take after food',
        dosage: '1 tablet twice daily',
        usage: 'treatment of fever and pain',
        sideEffects: 'mild nausea and headache',
      };

      const speech = formatForSpeech(med, 'en');

      expect(speech).toBe(
        'Here is the information for Dolo 650. Take after food. The recommended dosage is 1 tablet twice daily. This medicine is used for treatment of fever and pain. Please be aware that common side effects may include mild nausea and headache.'
      );
    });

    it('constructs conversational paragraph for Kannada with exact sentence template', () => {
      const med = {
        name: 'ಡೋಲೋ ೬೫೦',
        meal_instruction: 'after_food',
        dosage: '1 tablet',
        usage: 'ಜ್ವರ ಮತ್ತು ತಲೆನೋವು ನಿವಾರಣೆ',
        sideEffects: 'ವಾಕರಿಕೆ',
      };

      const speech = formatForSpeech(med, 'kn');

      expect(speech).toContain('ಇಲ್ಲಿದೆ ಡೋಲೋ ೬೫೦ ಮಾಹಿತಿ.');
      expect(speech).toContain('ಊಟದ ನಂತರ ಸೇವಿಸಿ.');
      expect(speech).toContain('ಶಿಫಾರಸು ಮಾಡಿದ ಡೋಸೇಜ್');
      expect(speech).toContain('ಈ ಔಷಧಿಯನ್ನು ಜ್ವರ ಮತ್ತು ತಲೆನೋವು ನಿವಾರಣೆ ಗಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ.');
      expect(speech).toContain('ಸಾಮಾನ್ಯ ಅಡ್ಡಪರಿಣಾಮಗಳು ಒಳಗೊಂಡಿರಬಹುದು ವಾಕರಿಕೆ.');
    });

    it('strips markdown, HTML, raw JSON keys, and converts abbreviations (mg -> milligrams, ml -> milliliters)', () => {
      const med = {
        name: '<b>Amoxicillin</b> 500mg',
        dosage_and_administration: '* Take 500mg with 10ml of water *',
        indications_and_usage: '## Indications\nTreatment of bacterial infection',
        adverse_reactions: ['- Diarrhea', '- mild nausea'],
      };

      const speech = formatForSpeech(med, 'en');

      // Markdown & HTML stripped
      expect(speech).not.toContain('<b>');
      expect(speech).not.toContain('</b>');
      expect(speech).not.toContain('*');
      expect(speech).not.toContain('#');
      expect(speech).not.toContain('-');

      // Raw JSON keys stripped
      expect(speech).not.toContain('dosage_and_administration');
      expect(speech).not.toContain('indications_and_usage');
      expect(speech).not.toContain('adverse_reactions');

      // Abbreviations converted
      expect(speech).toContain('500 milligrams');
      expect(speech).toContain('10 milliliters');
      expect(speech).toContain('Here is the information for Amoxicillin 500 milligrams.');
    });

    it('gracefully skips missing fields without outputting null or undefined', () => {
      const med = {
        name: 'Paracetamol',
        dosage: '1 tablet',
        usage: null,
        sideEffects: undefined,
        foodInstruction: '',
      };

      const speech = formatForSpeech(med, 'en');

      expect(speech).toBe('Here is the information for Paracetamol. The recommended dosage is 1 tablet.');
      expect(speech).not.toContain('null');
      expect(speech).not.toContain('undefined');
      expect(speech).not.toContain('This medicine is used for');
      expect(speech).not.toContain('common side effects');
    });

    it('truncates massive label text and appends label reading guidance', () => {
      const longUsage =
        'Sentence one for indication. Sentence two for therapeutic clinical usage. Sentence three for patient management. Sentence four should trigger sentence limit. Sentence five extra verbose text.';
      const med = {
        name: 'LongLabelMed',
        usage: longUsage,
      };

      const speechEn = formatForSpeech(med, 'en');
      expect(speechEn).toContain('For more details, please read the full label.');
      expect(speechEn).not.toContain('Sentence five');

      const speechKn = formatForSpeech(med, 'kn');
      expect(speechKn).toContain('ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ, ದಯವಿಟ್ಟು ಸಂಪೂರ್ಣ ಲೇಬಲ್ ಓದಿ.');
    });
  });
});
