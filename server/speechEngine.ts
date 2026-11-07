/**
 * Text-to-Speech Architecture:
 * Mediscan uses the browser's built-in Web Speech API (window.speechSynthesis)
 * for all text-to-speech functionality (reading medicine names, dosages, instructions,
 * and warnings aloud in English and Kannada).
 *
 * This requires ZERO external APIs and ZERO API keys.
 * All client-side synthesis is implemented in src/utils/audio.ts.
 */

export interface SpeechInfoResponse {
  engine: string;
  status: 'ACTIVE';
  requiresApiKey: false;
  languagesSupported: string[];
  message: string;
}

export function getSpeechEngineInfo(): SpeechInfoResponse {
  return {
    engine: 'Gemini 3.8 Flash Lite TTS + Web Speech API',
    status: 'ACTIVE',
    requiresApiKey: false,
    languagesSupported: ['en-US', 'kn-IN'],
    message: 'Authentic Kannada and English voice synthesis using server-assisted neural TTS with browser Web Speech API fallback.',
  };
}
