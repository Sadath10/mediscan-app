import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  PlusCircle,
  Pill,
  RotateCcw,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Language, translations } from '../translations.js';

export interface DoseItem {
  id: number;
  reminder_id: number;
  medicine_id?: number | null;
  medicine_name: string;
  scheduled_date: string;
  scheduled_time: string;
  prescribed_quantity: number;
  dosage_unit: string;
  actual_action_time?: string | null;
  status: 'pending' | 'taken' | 'skipped' | 'missed' | 'snoozed';
  snooze_until?: string | null;
  meal_instruction?: string;
  meal_instruction_kn?: string;
}

interface DashboardViewProps {
  lang: Language;
  onNavigate: (tab: string) => void;
  todayDoses: DoseItem[];
  nextDose: DoseItem | null;
  summary: {
    total: number;
    taken: number;
    pending: number;
    missed: number;
    skipped: number;
    adherencePercent: number;
  };
  onDoseAction: (doseId: number, action: 'taken' | 'skipped' | 'snoozed', snoozeMinutes?: number) => void;
  onOpenDetails: (medicineName: string, medicineId?: number | null) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  lang,
  onNavigate,
  todayDoses,
  nextDose,
  summary,
  onDoseAction,
  onOpenDetails,
}) => {
  const t = translations[lang];

  // Today's date formatting
  const now = new Date();
  const formattedDate = now.toLocaleDateString(lang === 'kn' ? 'kn-IN' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const totalScheduledDoses = summary.total;
  const takenCount = summary.taken;
  const pendingCount = summary.pending;

  // Strict mathematical progress: (taken / total) * 100
  const progressPercent =
    totalScheduledDoses > 0 ? Math.min(100, Math.round((takenCount / totalScheduledDoses) * 100)) : 0;

  const formatMealText = (dose: DoseItem) => {
    if (lang === 'kn') return dose.meal_instruction_kn || 'ಊಟದ ನಂತರ';
    const val = dose.meal_instruction || 'after_food';
    if (val === 'before_food') return 'Before food';
    if (val === 'after_food') return 'After food';
    if (val === 'with_food') return 'With food';
    if (val === 'empty_stomach') return 'Empty stomach';
    if (val === 'bedtime') return 'Bedtime';
    return 'After food';
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-24 max-w-xl mx-auto">
      {/* Top Header - Punchy & Minimalist */}
      <div className="pt-1">
        <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
          <CalendarIcon className="w-3.5 h-3.5 text-teal-600" />
          <span>{formattedDate}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
          {lang === 'kn' ? 'ಇಂದಿನ ವೇಳಾಪಟ್ಟಿ' : "Today's Schedule"}
        </h1>
      </div>

      {/* Sleek Hero Completion Card */}
      <div className="bg-linear-to-br from-teal-800 via-teal-700 to-emerald-800 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-200">
              {lang === 'kn' ? 'ಇಂದಿನ ಪ್ರಗತಿ' : 'Today Adherence'}
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                {progressPercent}%
              </span>
            </div>
            <div className="text-xs font-semibold text-teal-100 mt-1">
              {takenCount} / {totalScheduledDoses}{' '}
              {lang === 'kn' ? 'ಮಾತ್ರೆಗಳು ತೆಗೆದುಕೊಂಡಿದೆ' : 'doses completed'}
            </div>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-center p-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-300">
              {pendingCount}
            </span>
            <span className="text-[10px] font-bold text-teal-200 leading-tight uppercase tracking-wider">
              {lang === 'kn' ? 'ಬಾಕಿ' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-teal-950/50 rounded-full h-2.5 p-0.5 overflow-hidden border border-teal-600/40">
          <div
            className="bg-linear-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status Text (Strict Non-Contradictory Logic) */}
        <div className="mt-3 text-xs font-semibold text-teal-100/90 flex items-center space-x-1.5">
          {totalScheduledDoses === 0 ? (
            <span>{lang === 'kn' ? 'ಇಂದು ಯಾವುದೇ ಮಾತ್ರೆಗಳಿಲ್ಲ.' : 'No doses scheduled for today.'}</span>
          ) : takenCount === totalScheduledDoses ? (
            <span className="flex items-center space-x-1.5 text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'kn' ? 'ಶ್ರೇಷ್ಠ ಕೆಲಸ! ಇಂದಿನ ಎಲ್ಲಾ ಮಾತ್ರೆಗಳು ಮುಗಿದಿವೆ.' : 'Great job! All scheduled doses for today are completed.'}</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-amber-200 font-bold">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>
                {lang === 'kn'
                  ? `ನಿಮಗೆ ಇಂದು ${pendingCount} ಬಾಕಿ ಮಾತ್ರೆ(ಗಳು) ಉಳಿದಿವೆ.`
                  : `You have ${pendingCount} pending dose${pendingCount !== 1 ? 's' : ''} remaining for today.`}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Quick Action Tiles (Modern Mobile App Tiles) */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => onNavigate('scanner')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-400 hover:bg-teal-50/30 transition-all cursor-pointer active:scale-95 group text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold text-slate-800">
            {lang === 'kn' ? 'ಸ್ಕ್ಯಾನ್' : 'Scan'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            {lang === 'kn' ? 'ಔಷಧಿ ಸ್ಕ್ಯಾನ್' : 'Medicine'}
          </span>
        </button>

        <button
          onClick={() => onNavigate('add-reminder')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-400 hover:bg-teal-50/30 transition-all cursor-pointer active:scale-95 group text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold text-slate-800">
            {lang === 'kn' ? 'ಜ್ಞಾಪನೆ' : 'Reminder'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            {lang === 'kn' ? 'ಹೊಸ ವೇಳಾಪಟ್ಟಿ' : 'Schedule'}
          </span>
        </button>

        <button
          onClick={() => onNavigate('cabinet')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-400 hover:bg-teal-50/30 transition-all cursor-pointer active:scale-95 group text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <Pill className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold text-slate-800">
            {lang === 'kn' ? 'ಔಷಧಿಗಳು' : 'Medicines'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            {lang === 'kn' ? 'ನನ್ನ ಕ್ಯಾಬಿನೆಟ್' : 'Cabinet'}
          </span>
        </button>
      </div>

      {/* Today's Scheduled Medicines List (CRITICAL FIX FOR CONTRADICTION) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              {lang === 'kn' ? 'ಇಂದಿನ ಮಾತ್ರೆಗಳು' : "Today's Medicines"}
            </h2>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
            {takenCount} / {totalScheduledDoses}
          </span>
        </div>

        {/* Empty State: ONLY RENDERED IF totalScheduledDoses === 0 */}
        {totalScheduledDoses === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">
              {lang === 'kn' ? 'ಇಂದು ಯಾವುದೇ ಮಾತ್ರೆಗಳ ವೇಳಾಪಟ್ಟಿ ಇಲ್ಲ' : 'No doses scheduled for today'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {lang === 'kn' ? 'ಹೊಸ ಜ್ಞಾಪನೆ ಹೊಂದಿಸಲು ಮೇಲಿನ "ಜ್ಞಾಪನೆ" ಬಟನ್ ಒತ್ತಿ.' : 'Tap "Reminder" above to add your medications.'}
            </p>
            <button
              onClick={() => onNavigate('add-reminder')}
              className="mt-3.5 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{lang === 'kn' ? 'ಜ್ಞಾಪನೆ ಸೇರಿಸಿ' : 'Add Reminder'}</span>
            </button>
          </div>
        ) : (
          /* When totalScheduledDoses > 0: Always render the full scheduled list */
          <div className="divide-y divide-slate-100">
            {todayDoses.map((dose) => {
              const isTaken = dose.status === 'taken';
              const isPending = dose.status === 'pending' || dose.status === 'snoozed';
              const isSkipped = dose.status === 'skipped';
              const isMissed = dose.status === 'missed';

              return (
                <div
                  key={dose.id}
                  className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                    isTaken ? 'opacity-85' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Time Pill */}
                    <div
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black shrink-0 ${
                        isTaken
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isPending
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {dose.scheduled_time}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4
                          onClick={() => onOpenDetails(dose.medicine_name, dose.medicine_id)}
                          className="font-bold text-sm sm:text-base text-slate-900 hover:text-teal-700 cursor-pointer transition-colors"
                        >
                          {dose.medicine_name}
                        </h4>
                        {dose.status === 'snoozed' && (
                          <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">
                            {lang === 'kn' ? 'ಮುಂದೂಡಲಾಗಿದೆ' : 'Snoozed'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {dose.prescribed_quantity} {dose.dosage_unit} • {formatMealText(dose)}
                      </p>
                    </div>
                  </div>

                  {/* Right Action / Status Badges */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {isTaken ? (
                      <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-100/90 text-emerald-800 text-xs font-extrabold border border-emerald-200 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        <span>{lang === 'kn' ? 'ತೆಗೆದುಕೊಂಡಿದೆ' : 'Taken'}</span>
                      </div>
                    ) : isPending ? (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onDoseAction(dose.id, 'taken')}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{lang === 'kn' ? 'ತೆಗೆದುಕೊಂಡೆ' : 'Mark as Taken'}</span>
                        </button>
                        <button
                          onClick={() => onDoseAction(dose.id, 'snoozed', 10)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          title={lang === 'kn' ? '೧೦ ನಿಮಿಷ ಮುಂದೂಡಿ' : 'Snooze 10m'}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : isSkipped ? (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
                        {lang === 'kn' ? 'ಬಿಡಲಾಗಿದೆ' : 'Skipped'}
                      </span>
                    ) : isMissed ? (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold">
                        {lang === 'kn' ? 'ತಪ್ಪಿದೆ' : 'Missed'}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
