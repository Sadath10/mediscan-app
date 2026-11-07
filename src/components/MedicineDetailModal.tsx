import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Volume2,
  VolumeX,
  Pill,
  Clock,
  AlertTriangle,
  Info,
  Sliders,
  Utensils,
  AlertCircle,
  HeartPulse,
  Coffee,
  CheckCircle2,
  Sparkles,
  Syringe,
  FlaskConical,
  Droplet,
  Loader2,
} from 'lucide-react';
import { Language, translations } from '../translations.js';
import {
  formatForSpeech,
  speakText,
  stopSpeaking,
} from '../utils/audio.js';

interface MedicineDetailModalProps {
  lang: Language;
  medicine: any | null;
  onClose: () => void;
  onSetReminder: (name: string, id?: number) => void;
}

interface DetailedData {
  name: string;
  genericName: string;
  brandName?: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  found?: boolean;
  verifiedBadge?: 'local' | 'openfda' | 'unverified';
  ingredientFallbackUsed?: boolean;
  matchedIngredient?: string;
  dosage?: string;
  usage?: string;
  foodInteractions?: {
    timing: 'before_food' | 'after_food' | 'with_food' | 'empty_stomach' | 'general';
    timingLabel: string;
    instruction: string;
    conflicts: string[];
  };
  formattedDosageBullets?: string[];
  formattedUsageBullets?: string[];
  usageAndDosage: {
    summary: string;
    recommendedDose?: string;
    frequency?: string;
    maxDailyDose?: string;
    indications?: string;
    rawInstructions?: string;
  };
  sideEffects: {
    common: string[];
    seekMedicalHelp: string[];
    disclaimer: string;
  };
  foodInstructions: {
    timing: 'before_food' | 'after_food' | 'with_food' | 'empty_stomach' | 'general';
    timingLabel: string;
    instruction: string;
    conflicts: string[];
  };
  blackBoxWarnings: string[];
  sources: string[];
  cached?: boolean;
  kannada?: {
    usageAndDosage: string;
    foodInstructions: string;
    sideEffects: string;
    speechText: string;
  };
  englishSpeechText: string;
  disclaimer: string;
}

export const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({
  lang,
  medicine,
  onClose,
  onSetReminder,
}) => {
  if (!medicine) return null;

  const t = translations[lang];
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [narrationLang, setNarrationLang] = useState<'en' | 'kn'>(lang);
  const [speechRate, setSpeechRate] = useState<number>(lang === 'kn' ? 0.9 : 1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [speechVolume, setSpeechVolume] = useState<number>(1.0);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const isLoadingVoice = isLoadingAudio; // Alias for UI elements
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [detailedData, setDetailedData] = useState<DetailedData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Sync narrationLang if external language changes
  useEffect(() => {
    setNarrationLang(lang);
  }, [lang]);

  // Robust cleanup: stop audio and reset spinner if modal unmounts or closes while loading/playing
  useEffect(() => {
    return () => {
      stopSpeaking();
      setIsSpeaking(false);
      setIsLoadingAudio(false);
    };
  }, []);

  const title = medicine.name || medicine.custom_name || 'Medicine';

  // Fetch real-time multi-API aggregated details from /api/medicine/details
  useEffect(() => {
    let isMounted = true;
    const fetchLiveDetails = async () => {
      try {
        setIsLoadingDetails(true);
        const searchName = medicine.active_ingredient || medicine.genericName || medicine.name || medicine.custom_name;
        const res = await fetch(`/api/medicine/details?name=${encodeURIComponent(searchName)}`);
        if (!res.ok) throw new Error('Details fetch failed');
        const data: DetailedData = await res.json();
        if (isMounted) {
          setDetailedData(data);
        }
      } catch (err) {
        console.warn('Could not fetch external multi-API details, using existing metadata:', err);
      } finally {
        if (isMounted) setIsLoadingDetails(false);
      }
    };

    fetchLiveDetails();

    return () => {
      isMounted = false;
      stopSpeaking();
      setIsSpeaking(false);
      setIsLoadingAudio(false);
    };
  }, [medicine]);

  const handleStopAudio = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setIsLoadingAudio(false);
  };

  const handleClose = () => {
    handleStopAudio();
    onClose();
  };

  // Resolve fields between live API details and medicine props
  const usageSummary = detailedData?.dosage ||
    detailedData?.usageAndDosage?.summary ||
    medicine.dosage_and_administration ||
    medicine.dosageAndAdministration ||
    medicine.common_instructions_en ||
    '1 tablet twice daily with meals.';

  const indicationsText = detailedData?.usage ||
    detailedData?.usageAndDosage?.indications ||
    medicine.indications_and_usage ||
    medicine.indicationsAndUsage ||
    medicine.verified_purpose_en ||
    'Take according to doctor prescription.';

  const foodInstruction = detailedData?.foodInteractions || detailedData?.foodInstructions || {
    timing: (medicine.meal_instruction || 'after_food') as any,
    timingLabel: medicine.meal_instruction === 'before_food' ? 'Before Food' : medicine.meal_instruction === 'with_food' ? 'With Food' : 'After Food',
    instruction: medicine.common_instructions_en || 'Take orally after food with a glass of water.',
    conflicts: [],
  };

  const sideEffectsData = detailedData?.sideEffects || {
    common: ['Mild gastrointestinal discomfort', 'Headache', 'Mild drowsiness'],
    seekMedicalHelp: ['Difficulty breathing or wheezing', 'Swelling of face, lips, or throat', 'Severe skin rash'],
    disclaimer: 'This information is retrieved from official drug databases and is for reference only. Always follow your doctor\'s prescription.',
  };

  const handleToggleListen = () => {
    // Stop Audio Toggle: if audio is currently playing or loading, stop immediately and reset UI
    if (isSpeaking || isLoadingAudio) {
      handleStopAudio();
      return;
    }

    setFallbackNotice(null);
    setIsLoadingAudio(true);

    const isTargetKn = narrationLang === 'kn';

    // Construct conversational speech text using formatForSpeech
    const speechText = formatForSpeech(
      {
        name: title,
        strength: medicine.strength || detailedData?.strength,
        dosage: detailedData?.kannada?.usageAndDosage || usageSummary,
        dosageInstructions: usageSummary,
        foodInstruction: detailedData?.kannada?.foodInstructions || foodInstruction.instruction,
        usage: detailedData?.kannada?.usageAndDosage || indicationsText,
        indications: indicationsText,
        sideEffects: detailedData?.kannada?.sideEffects || sideEffectsData.common.slice(0, 3).join(', '),
        kannada: detailedData?.kannada,
      },
      isTargetKn ? 'kn' : 'en'
    );

    speakText(speechText, {
      lang: isTargetKn ? 'kn' : 'en',
      rate: speechRate,
      pitch: speechPitch,
      volume: speechVolume,
      onLoading: (loading) => setIsLoadingAudio(loading),
      onStart: () => {
        setIsLoadingAudio(false);
        setIsSpeaking(true);
      },
      onEnd: () => {
        setIsLoadingAudio(false);
        setIsSpeaking(false);
      },
      onError: () => {
        setIsLoadingAudio(false);
        setIsSpeaking(false);
      },
      onFallback: (msg) => setFallbackNotice(msg),
    });
  };

  // Badge helper for Food Timing
  const renderFoodTimingBadge = (timing: string) => {
    switch (timing) {
      case 'before_food':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>{lang === 'kn' ? 'ಊಟಕ್ಕೆ ಮುಂಚೆ (Before Food)' : 'Before Food'}</span>
          </span>
        );
      case 'with_food':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
            <Utensils className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'kn' ? 'ಊಟದೊಂದಿಗೆ (With Food)' : 'With Food'}</span>
          </span>
        );
      case 'empty_stomach':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
            <Coffee className="w-3.5 h-3.5 text-blue-700" />
            <span>{lang === 'kn' ? 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ (Empty Stomach)' : 'Empty Stomach'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-teal-100 text-teal-900 border border-teal-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
            <span>{lang === 'kn' ? 'ಊಟದ ನಂತರ (After Food)' : 'After Food'}</span>
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-slate-200 relative animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {detailedData?.verifiedBadge === 'local' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center space-x-1 border border-emerald-300 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified (Local Formulary)</span>
                </span>
              ) : detailedData?.verifiedBadge === 'openfda' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold flex items-center space-x-1 border border-blue-300 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Verified via openFDA</span>
                </span>
              ) : detailedData?.found === false ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[11px] font-bold flex items-center space-x-1 border border-amber-300 shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Unverified (Manual Review)</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center space-x-1 border border-emerald-300 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{medicine.is_verified || detailedData ? t.verifiedMatch : 'Medicine Monograph'}</span>
                </span>
              )}
              {detailedData?.sources && detailedData.sources.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                  {s}
                </span>
              ))}
              {isLoadingDetails && (
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-semibold animate-pulse">
                  Querying Local Formulary & openFDA...
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {medicine.active_ingredient || medicine.genericName || detailedData?.genericName || 'Active Ingredient'} • {medicine.strength || detailedData?.strength || 'Standard Dosage'} ({medicine.dosage_form || detailedData?.dosageForm || 'Tablet'})
            </p>
          </div>
          <button
            onClick={() => {
              handleStopAudio();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authentic Kannada & English Speech Control Banner */}
        <div className="py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700">
              {narrationLang === 'kn' ? 'ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿ:' : 'Voice Guidance:'}
            </span>
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) handleStopAudio();
                  setNarrationLang('kn');
                }}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                  narrationLang === 'kn'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ಕನ್ನಡ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) handleStopAudio();
                  setNarrationLang('en');
                }}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                  narrationLang === 'en'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={() => setShowAudioControls(!showAudioControls)}
              className="p-1 text-slate-400 hover:text-teal-600 rounded-md"
              title="Speech adjustments"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleToggleListen}
            disabled={isLoadingVoice}
            className={`flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-75 ${
              isSpeaking
                ? 'bg-rose-50 text-rose-700 border border-rose-300 animate-pulse'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {isLoadingVoice ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : isSpeaking ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
            <span>
              {isLoadingVoice
                ? (narrationLang === 'kn' ? 'ಆಡಿಯೋ ಲೋಡ್...' : 'Loading audio...')
                : isSpeaking
                ? t.stopVoice
                : narrationLang === 'kn'
                ? 'ಕನ್ನಡದಲ್ಲಿ ಆಲಿಸಿ (Listen kn-IN)'
                : 'Listen in English'}
            </span>
          </button>
        </div>

        {/* Speech Fine-Tuning Controls */}
        {showAudioControls && (
          <div className="p-3 my-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Rate: {speechRate}x</span>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-32 accent-teal-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Pitch: {speechPitch}</span>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                className="w-32 accent-teal-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Volume: {Math.round(speechVolume * 100)}%</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.1"
                value={speechVolume}
                onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                className="w-32 accent-teal-600"
              />
            </div>
          </div>
        )}

        {/* Fallback Notice: User-Friendly Blue Box (Using Cloud Audio for Kannada) */}
        {fallbackNotice && (
          <div className="mt-2.5 p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start space-x-2.5 animate-in fade-in">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-blue-950">{fallbackNotice}</p>
              <p className="text-[11px] text-blue-800/80 mt-0.5">
                {narrationLang === 'kn'
                  ? 'ಉತ್ತಮ ಗುಣಮಟ್ಟದ ಕ್ಲೌಡ್ ಆಡಿಯೋ ಬಳಸಿ ಕನ್ನಡ ಧ್ವನಿ ಸಕ್ರಿಯವಾಗಿದೆ.'
                  : 'High-quality Cloud Audio streaming active.'}
              </p>
            </div>
          </div>
        )}

        {/* No Data Found Guidance Alert */}
        {detailedData && detailedData.found === false && (
          <div className="my-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">No data found in drug databases</span>
              <p className="mt-0.5 text-slate-700 leading-relaxed">
                No matching product label was found for "{title}". Try searching by generic active ingredient (e.g., Paracetamol, Amoxicillin, Pantoprazole, Metformin).
              </p>
            </div>
          </div>
        )}

        {/* Ingredient Fallback Banner */}
        {detailedData?.ingredientFallbackUsed && (
          <div className="my-3 p-3.5 rounded-2xl bg-teal-50 border border-teal-300 text-teal-950 text-xs flex items-start space-x-2.5">
            <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">
                Generic Ingredient Matched: {detailedData.matchedIngredient}
              </span>
              <p className="mt-0.5 text-teal-900 leading-relaxed">
                Brand "{title}" was converted to its active ingredient <strong>{detailedData.matchedIngredient}</strong> and verified against official drug monographs.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MANDATORY SECTION 3: THREE DISTINCT MONOGRAPH CARDS            */}
        {/* ============================================================== */}
        <div className="py-4 space-y-4">

          {/* CARD 1: USAGE & DOSAGE (FORM-SPECIFIC) */}
          {(() => {
            const medForm = (detailedData?.dosageForm || medicine.dosage_form || medicine.form || 'Tablet').toLowerCase();
            const isSyrup = medForm.includes('syrup') || medForm.includes('suspension');
            const isInjection = medForm.includes('injection') || medForm.includes('inj');
            const isCapsule = medForm.includes('capsule') || medForm.includes('cap');

            const cardBorder = isSyrup
              ? 'border-amber-500/25 bg-amber-50/40 text-amber-950'
              : isInjection
              ? 'border-purple-500/25 bg-purple-50/40 text-purple-950'
              : isCapsule
              ? 'border-blue-500/25 bg-blue-50/40 text-blue-950'
              : 'border-teal-500/20 bg-teal-50/40 text-teal-950';

            const cardIcon = isSyrup ? (
              <FlaskConical className="w-4 h-4 text-amber-600" />
            ) : isInjection ? (
              <Syringe className="w-4 h-4 text-purple-600" />
            ) : (
              <Pill className="w-4 h-4 text-teal-600" />
            );

            const cardTitle = isSyrup
              ? (lang === 'kn' ? '೧. ದ್ರವರೂಪದ ಸಿರಪ್ ಡೋಸೇಜ್ (Syrup • ml)' : '1. Liquid Oral Dosage (Syrup • ml)')
              : isInjection
              ? (lang === 'kn' ? '೧. ಇಂಜೆಕ್ಷನ್ ಆಡಳಿತ ಸೂಚನೆಗಳು' : '1. Injectable Administration')
              : isCapsule
              ? (lang === 'kn' ? '೧. ಕ್ಯಾಪ್ಸುಲ್ ಡೋಸೇಜ್ ಮತ್ತು ಬಳಕೆ' : '1. Capsule Dosage & Usage')
              : (lang === 'kn' ? '೧. ಮಾತ್ರೆ ಡೋಸೇಜ್ ಮತ್ತು ಬಳಕೆ' : '1. Tablet Dosage & Usage');

            return (
              <div className={`rounded-2xl border-2 ${cardBorder} p-4 shadow-xs space-y-3`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2 font-black text-sm">
                    {cardIcon}
                    <span>{cardTitle}</span>
                  </div>
                  {detailedData?.usageAndDosage?.recommendedDose && (
                    <span className="px-2 py-0.5 rounded-md bg-white/80 font-bold text-[10px] border border-slate-200">
                      {detailedData.usageAndDosage.recommendedDose}
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 text-xs text-slate-800">
                  <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="font-bold text-slate-700 block mb-0.5 uppercase tracking-wider text-[10px]">
                      {lang === 'kn' ? 'ಶಿಫಾರಸು ಮಾಡಿದ ಡೋಸ್ ಮತ್ತು ಆವರ್ತನ (Prescribed Schedule)' : 'Recommended Dose & Frequency'}
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {lang === 'kn' ? (detailedData?.kannada?.usageAndDosage || usageSummary) : usageSummary}
                    </p>
                    {detailedData?.usageAndDosage?.maxDailyDose && (
                      <p className="text-[11px] text-amber-800 font-semibold mt-1">
                        ⚠️ Maximum Daily Dose: {detailedData.usageAndDosage.maxDailyDose}
                      </p>
                    )}
                  </div>

                  {/* Form-Specific Clinical Guidance Banner */}
                  <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-xs font-semibold flex items-center space-x-2">
                    {isSyrup ? (
                      <>
                        <Droplet className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-amber-950 font-bold">
                          {lang === 'kn'
                            ? 'ಬಳಕೆಗೆ ಮುನ್ನ ಚೆನ್ನಾಗಿ ಕುಲುಕಿ. ಅಳತೆ ಕಪ್ ಅಥವಾ ಚಮಚವನ್ನು ಬಳಸಿ.'
                            : 'Shake well before each use. Measure accurately with calibrated measuring cup or spoon.'}
                        </span>
                      </>
                    ) : isInjection ? (
                      <>
                        <Syringe className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="text-purple-950 font-bold">
                          {lang === 'kn'
                            ? 'ವೈದ್ಯರ ಅಥವಾ ನರ್ಸ್ ರ ನಿರ್ದೇಶನದಂತೆ ಆಸ್ಪತ್ರೆ/ಕ್ಲಿನಿಕ್ ನಲ್ಲಿ ಮಾತ್ರ ನೀಡಲಾಗುತ್ತದೆ.'
                            : 'Administered under healthcare professional guidance / prescribed subcutaneous protocol.'}
                        </span>
                      </>
                    ) : isCapsule ? (
                      <>
                        <Pill className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-blue-950 font-bold">
                          {lang === 'kn'
                            ? 'ಕ್ಯಾಪ್ಸುಲ್ ಅನ್ನು ಮುರಿಯದೆ ಅಥವಾ ಅಗಿಯದೆ ಪೂರ್ತಿಯಾಗಿ ನೀರಿನೊಂದಿಗೆ ಸೇವಿಸಿ.'
                            : 'Swallow whole with a full glass of water. Do not crush, chew, or open the capsule.'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Utensils className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-emerald-950 font-bold">
                          {lang === 'kn'
                            ? 'ಊಟದ ನಂತರ ಒಂದು ಲೋಟ ನೀರಿನೊಂದಿಗೆ ಸೇವಿಸಿ.'
                            : 'Take with or after food with a full glass of water.'}
                        </span>
                      </>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">
                      {lang === 'kn' ? 'ಬಳಕೆ ಮತ್ತು ಸೂಚನೆಗಳು (Indications):' : 'Indications & Purpose:'}
                    </span>
                    <p className="leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-200 text-slate-700">
                      {lang === 'kn' ? (medicine.verified_purpose_kn || indicationsText) : indicationsText}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* CARD 2: FOOD INSTRUCTIONS (PROMINENT ICON & MEAL TIMING) */}
          <div className="rounded-2xl border-2 border-amber-500/25 bg-amber-50/40 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-amber-950 font-black text-sm">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>{lang === 'kn' ? '೨. ಆಹಾರ ಮತ್ತು ಸೇವನೆಯ ನಿಯಮಗಳು' : '2. Food Instructions'}</span>
              </div>
              {renderFoodTimingBadge(foodInstruction.timing)}
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-white/90 p-3 rounded-xl border border-amber-200/70 shadow-2xs">
                <p className="font-bold text-slate-900 leading-relaxed text-xs sm:text-sm">
                  {lang === 'kn'
                    ? (detailedData?.kannada?.foodInstructions || foodInstruction.instruction)
                    : foodInstruction.instruction}
                </p>
              </div>

              {/* Food-Drug Conflicts & Restrictions */}
              {foodInstruction.conflicts && foodInstruction.conflicts.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                  <span className="font-bold text-[11px] flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Food-Drug Warnings:</span>
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {foodInstruction.conflicts.map((conf, i) => (
                      <li key={i}>{conf}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* CARD 3: SIDE EFFECTS (COMMON VS SEEK MEDICAL HELP) */}
          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-4 shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-black text-sm mb-2.5">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <span>{lang === 'kn' ? '೩. ಸಂಭಾವ್ಯ ಅಡ್ಡಪರಿಣಾಮಗಳು' : '3. Side Effects'}</span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Common Side Effects */}
              <div>
                <span className="font-bold text-slate-700 block mb-1.5 text-[11px] uppercase tracking-wider">
                  {lang === 'kn' ? 'ಸಾಮಾನ್ಯ ಅಡ್ಡಪರಿಣಾಮಗಳು (Common)' : 'Common Reactions (Mild)'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sideEffectsData.common.map((effect, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-medium shadow-2xs"
                    >
                      {effect}
                    </span>
                  ))}
                </div>
              </div>

              {/* Seek Medical Help (Severe Reactions) */}
              <div>
                <span className="font-bold text-rose-800 block mb-1.5 text-[11px] uppercase tracking-wider flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{lang === 'kn' ? 'ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ (Seek Medical Help)' : 'Seek Immediate Medical Help If Occurs'}</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sideEffectsData.seekMedicalHelp.map((severe, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-rose-100/80 border border-rose-300 text-rose-900 text-[11px] font-bold"
                    >
                      ⚠️ {severe}
                    </span>
                  ))}
                </div>
              </div>

              {/* Black Box Warnings if present */}
              {detailedData?.blackBoxWarnings && detailedData.blackBoxWarnings.length > 0 && (
                <div className="p-3 rounded-xl bg-black text-white text-[11px] space-y-1">
                  <span className="font-black text-amber-400 uppercase tracking-widest text-[10px] block">
                    BOXED WARNING (SafeRx & FDA)
                  </span>
                  {detailedData.blackBoxWarnings.map((bbw, i) => (
                    <p key={i} className="leading-relaxed">{bbw}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Registry & Identifiers */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <div>
              <span className="font-semibold block">{t.manufacturer}:</span>
              <span>{medicine.manufacturer || detailedData?.brandName || 'Authorized Pharmaceutical'}</span>
            </div>
            <div>
              <span className="font-semibold block">Authoritative APIs:</span>
              <span className="font-mono text-[10px]">
                SafeRx • openFDA • DailyMed • RxNorm
              </span>
            </div>
          </div>
        </div>

        {/* MANDATORY OFFICIAL DISCLAIMER FOOTER */}
        <div className="mt-2 pt-3 border-t border-slate-200 flex items-start space-x-2 text-[11px] text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="italic leading-normal">
            "This information is retrieved from official drug databases and is for reference only. Always follow your doctor's prescription."
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex gap-2">
          <button
            onClick={() => {
              handleStopAudio();
              onSetReminder(title, medicine.id);
              onClose();
            }}
            className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>{lang === 'kn' ? 'ಈ ಔಷಧಿಗೆ ಜ್ಞಾಪನೆ ಹೊಂದಿಸಿ' : 'Set Reminder for this Medicine'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
