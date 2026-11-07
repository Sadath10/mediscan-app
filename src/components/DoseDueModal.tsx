import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  ShieldAlert,
  Pill,
} from 'lucide-react';
import { Language, translations } from '../translations.js';
import { speakText, stopSpeaking } from '../utils/audio.js';

interface DoseDueModalProps {
  lang: Language;
  dueItem: {
    doseLogId: number;
    reminderId: number;
    medicineName: string;
    quantity: number;
    unit: string;
    scheduledTime: string;
    mealInstructionEn: string;
    mealInstructionKn?: string;
  } | null;
  onClose: () => void;
  onAction: (doseLogId: number, action: 'taken' | 'skipped' | 'snoozed', snoozeMinutes?: number) => void;
  onOpenDetails: (medicineName: string) => void;
}

export const DoseDueModal: React.FC<DoseDueModalProps> = ({
  lang,
  dueItem,
  onClose,
  onAction,
  onOpenDetails,
}) => {
  if (!dueItem) return null;
  const t = translations[lang];
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mealText = lang === 'kn'
    ? (dueItem.mealInstructionKn || 'ಊಟದ ನಂತರ')
    : (dueItem.mealInstructionEn === 'before_food' ? 'Before food' : dueItem.mealInstructionEn === 'after_food' ? 'After food' : 'With food');

  const speakReminder = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const text = lang === 'kn'
      ? `ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ. ದಯವಿಟ್ಟು ${dueItem.medicineName} ${dueItem.quantity} ${dueItem.unit} ${mealText} ತೆಗೆದುಕೊಳ್ಳಿ.`
      : `Medicine reminder: Please take ${dueItem.quantity} ${dueItem.unit} of ${dueItem.medicineName}, ${mealText}. Scheduled for ${dueItem.scheduledTime}.`;

    setIsSpeaking(true);
    speakText(text, lang, undefined, () => setIsSpeaking(false));
  };

  useEffect(() => {
    // Speak automatically on modal popup
    speakReminder();
    return () => stopSpeaking();
  }, [dueItem]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-teal-500 relative overflow-hidden animate-in zoom-in-95">
        {/* Glow header badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-teal-500 animate-ping" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
              {lang === 'kn' ? 'ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ!' : 'Dose Due Now!'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-inner border border-teal-200">
            <Pill className="w-9 h-9 stroke-[2.2]" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            ⏰ {dueItem.scheduledTime}
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {dueItem.medicineName}
          </h2>

          <p className="text-sm font-semibold text-slate-700">
            {lang === 'kn' ? 'ಪ್ರಮಾಣ: ' : 'Take: '}
            <span className="text-teal-700 font-extrabold text-base">
              {dueItem.quantity} {dueItem.unit}
            </span>{' '}
            • <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">{mealText}</span>
          </p>

          {/* Voice button */}
          <button
            onClick={speakReminder}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-semibold"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-teal-600" />}
            <span>{isSpeaking ? t.stopVoice : lang === 'kn' ? 'ಕನ್ನಡ ಧ್ವನಿ' : 'Audio Reminder'}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onAction(dueItem.doseLogId, 'taken');
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md transition-all hover:scale-[1.01]"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{t.markAsTaken}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onAction(dueItem.doseLogId, 'snoozed', 10);
                onClose();
              }}
              className="flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.snooze}</span>
            </button>

            <button
              onClick={() => {
                onAction(dueItem.doseLogId, 'skipped');
                onClose();
              }}
              className="py-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs"
            >
              <span>{t.skipDose}</span>
            </button>
          </div>

          <button
            onClick={() => {
              onOpenDetails(dueItem.medicineName);
              onClose();
            }}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            {t.viewDetails} →
          </button>
        </div>
      </div>
    </div>
  );
};
