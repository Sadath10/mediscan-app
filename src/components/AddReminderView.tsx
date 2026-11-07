import React, { useState, useEffect } from 'react';
import {
  Clock,
  Pill,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Volume2,
  Pause,
  Play,
  Trash2,
  Info,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Language, translations } from '../translations.js';

interface AddReminderViewProps {
  lang: Language;
  cabinetMedicines: any[];
  prefillMedicineName?: string;
  prefillMedicineId?: number | null;
  activeSchedules: any[];
  onSaveSchedule: (scheduleData: any) => Promise<{ success: boolean; warnings?: string[] }>;
  onToggleStatus: (id: number, currentStatus: string) => void;
  onDeleteSchedule: (id: number) => void;
  onScheduleSaved: () => void;
}

export const AddReminderView: React.FC<AddReminderViewProps> = ({
  lang,
  cabinetMedicines,
  prefillMedicineName = '',
  prefillMedicineId = null,
  activeSchedules,
  onSaveSchedule,
  onToggleStatus,
  onDeleteSchedule,
  onScheduleSaved,
}) => {
  const t = translations[lang];

  // Form State
  const [medicineName, setMedicineName] = useState(prefillMedicineName || '');
  const [medicineId, setMedicineId] = useState<number | null>(prefillMedicineId || null);
  const [tabletsPerDose, setTabletsPerDose] = useState<number>(1);
  const [dosageUnit, setDosageUnit] = useState<string>('tablet');
  const [dosesPerDay, setDosesPerDay] = useState<number>(2);
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['08:00', '20:00']);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isOngoing, setIsOngoing] = useState<boolean>(true);
  const [endDate, setEndDate] = useState<string>('');
  const [mealInstruction, setMealInstruction] = useState<string>('after_food');
  const [soundPreference, setSoundPreference] = useState<string>('chime');
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
  const [notes, setNotes] = useState<string>('');

  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Synchronize scheduled times array length when dosesPerDay changes
  useEffect(() => {
    const defaultTimesMap: Record<number, string[]> = {
      1: ['08:00'],
      2: ['08:00', '20:00'],
      3: ['08:00', '14:00', '20:00'],
      4: ['08:00', '12:00', '16:00', '20:00'],
    };

    if (defaultTimesMap[dosesPerDay]) {
      setScheduledTimes(defaultTimesMap[dosesPerDay]);
    } else {
      const times: string[] = [];
      const interval = Math.floor(16 / (dosesPerDay || 1));
      for (let i = 0; i < dosesPerDay; i++) {
        const hour = 7 + i * interval;
        times.push(`${String(hour).padStart(2, '0')}:00`);
      }
      setScheduledTimes(times);
    }
  }, [dosesPerDay]);

  // Calculated daily total
  const calculatedDailyTotal = (Number(tabletsPerDose) || 0) * (Number(dosesPerDay) || 0);

  // Check for duplicate medicine warning or conflict in real-time
  useEffect(() => {
    const foundWarnings: string[] = [];
    if (medicineName.trim()) {
      const isDuplicate = activeSchedules.some(
        (s) => s.medicine_name.toLowerCase().trim() === medicineName.toLowerCase().trim() && s.status === 'active'
      );
      if (isDuplicate) {
        foundWarnings.push(
          lang === 'kn'
            ? `ಎಚ್ಚರಿಕೆ: "${medicineName}" ಗೆ ಈಗಾಗಲೇ ಸಕ್ರಿಯ ಜ್ಞಾಪನೆ ಅಸ್ತಿತ್ವದಲ್ಲಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.`
            : `Warning: An active reminder schedule already exists for "${medicineName}". Verify your prescription.`
        );
      }
    }
    setWarnings(foundWarnings);
  }, [medicineName, activeSchedules, lang]);

  const handleTimeChange = (index: number, newTime: string) => {
    const updated = [...scheduledTimes];
    updated[index] = newTime;
    setScheduledTimes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) {
      alert(lang === 'kn' ? 'ದಯವಿಟ್ಟು ಔಷಧಿಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Please enter or select a medicine name');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(null);

    const mealInstructionKnMap: Record<string, string> = {
      after_food: 'ಊಟದ ನಂತರ',
      before_food: 'ಊಟಕ್ಕೆ ಮುಂಚೆ',
      with_food: 'ಊಟದೊಂದಿಗೆ',
      empty_stomach: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ',
      bedtime: 'ಮಲಗುವ ಮುನ್ನ',
    };

    const payload = {
      medicine_id: medicineId,
      medicine_name: medicineName.trim(),
      tablets_per_dose: tabletsPerDose,
      dosage_unit: dosageUnit,
      doses_per_day: dosesPerDay,
      scheduled_times: scheduledTimes,
      start_date: startDate,
      end_date: isOngoing ? null : endDate || null,
      meal_instruction: mealInstruction,
      meal_instruction_kn: mealInstructionKnMap[mealInstruction] || 'ಊಟದ ನಂತರ',
      sound_preference: soundPreference,
      vibration_enabled: vibrationEnabled ? 1 : 0,
      timezone,
      notes: notes.trim() || null,
    };

    const res = await onSaveSchedule(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(
        lang === 'kn'
          ? 'ಔಷಧಿ ಜ್ಞಾಪನೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ!'
          : 'Medicine reminder schedule saved successfully!'
      );
      // Reset form or notify parent
      onScheduleSaved();
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
          <Clock className="w-7 h-7 text-teal-600" />
          <span>{t.addReminder}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {lang === 'kn'
            ? 'ಪ್ರತಿ ಬಾರಿಗೆ ತೆಗೆದುಕೊಳ್ಳಬೇಕಾದ ಮಾತ್ರೆಗಳು, ದಿನಕ್ಕೆ ಎಷ್ಟು ಬಾರಿ ಮತ್ತು ನಿಖರ ಸಮಯವನ್ನು ನಮೂದಿಸಿ.'
            : 'Configure precise tablets per dose, daily administration frequency, and time-based notification alerts.'}
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-md space-y-6">
        {/* Success Banner */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Warning Banner */}
        {warnings.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-1">
            {warnings.map((w, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Medicine Name & Cabinet Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            {t.medicineName} *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={medicineName}
                onChange={(e) => {
                  setMedicineName(e.target.value);
                  setMedicineId(null);
                }}
                placeholder="e.g., Dolo 650, Augmentin 625, Metformin"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
              />
            </div>
            <div>
              <select
                onChange={(e) => {
                  const selId = Number(e.target.value);
                  const found = cabinetMedicines.find((m) => m.id === selId);
                  if (found) {
                    setMedicineName(found.custom_name);
                    setMedicineId(found.medicine_id || null);
                    setDosageUnit(found.dosage_form?.toLowerCase() || 'tablet');
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-medium text-slate-700"
              >
                <option value="">-- {t.selectFromCabinet} --</option>
                {cabinetMedicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.custom_name} ({m.strength || m.dosage_form})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tablets per Dose & Doses per Day (Strictly Separated) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t.tabletsPerDose} *
            </label>
            <input
              type="number"
              min="0.25"
              step="0.25"
              required
              value={tabletsPerDose}
              onChange={(e) => setTabletsPerDose(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-extrabold text-slate-900"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              {lang === 'kn' ? 'ಪ್ರತಿ ಬಾರಿಗೆ ಎಷ್ಟು ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳಬೇಕು' : 'Quantity taken in a single dose'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {lang === 'kn' ? 'ಔಷಧಿ ರೂಪ (Unit)' : 'Dosage Form'}
            </label>
            <select
              value={dosageUnit}
              onChange={(e) => setDosageUnit(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold"
            >
              <option value="tablet">Tablet (ಮಾತ್ರೆ)</option>
              <option value="capsule">Capsule (ಕ್ಯಾಪ್ಸೂಲ್)</option>
              <option value="ml">ml (ದ್ರವ ಸಿರಪ್)</option>
              <option value="drops">Drops (ಹನಿಗಳು)</option>
              <option value="sachet">Sachet (ಪುಡಿ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t.dosesPerDay} *
            </label>
            <select
              value={dosesPerDay}
              onChange={(e) => setDosesPerDay(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-extrabold text-teal-700 text-sm"
            >
              <option value={1}>1 Time Daily (ದಿನಕ್ಕೆ ೧ ಬಾರಿ)</option>
              <option value={2}>2 Times Daily (ದಿನಕ್ಕೆ ೨ ಬಾರಿ)</option>
              <option value={3}>3 Times Daily (ದಿನಕ್ಕೆ ೩ ಬಾರಿ)</option>
              <option value={4}>4 Times Daily (ದಿನಕ್ಕೆ ೪ ಬಾರಿ)</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {lang === 'kn' ? 'ದಿನಕ್ಕೆ ಎಷ್ಟು ಬಾರಿ ತೆಗೆದುಕೊಳ್ಳಬೇಕು' : 'Frequency of administration per day'}
            </span>
          </div>
        </div>

        {/* Calculated Daily Total Card */}
        <div className="p-4 rounded-xl bg-linear-to-r from-teal-50 to-emerald-50 border border-teal-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                {t.dailyTotal}:
              </span>
              <div className="text-xl sm:text-2xl font-black text-teal-900 mt-0.5">
                {tabletsPerDose} {dosageUnit} × {dosesPerDay} times ={' '}
                <span className="underline decoration-teal-500 decoration-2">
                  {calculatedDailyTotal} {dosageUnit}s daily
                </span>
              </div>
            </div>
            <span className="text-[11px] text-teal-800 font-semibold px-2 py-1 bg-white/80 rounded-md border border-teal-200">
              {lang === 'kn' ? 'ದೈನಂದಿನ ಒಟ್ಟು ಪ್ರಮಾಣ' : 'Daily Schedule Calculation'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 italic flex items-center space-x-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{t.dailyTotalDesc}</span>
          </p>
        </div>

        {/* Scheduled Times Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            {t.scheduledTimes} ({scheduledTimes.length} {lang === 'kn' ? 'ಸಮಯಗಳು' : 'times'}) *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {scheduledTimes.map((time, idx) => (
              <div key={idx} className="relative">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                  {lang === 'kn' ? `ಡೋಸ್ ${idx + 1}` : `Dose ${idx + 1}`}
                </span>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => handleTimeChange(idx, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-sm shadow-2xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Meal Timing & Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t.mealTiming}
            </label>
            <select
              value={mealInstruction}
              onChange={(e) => setMealInstruction(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800"
            >
              <option value="after_food">{t.afterFood} (ಊಟದ ನಂತರ)</option>
              <option value="before_food">{t.beforeFood} (ಊಟಕ್ಕೆ ಮುಂಚೆ)</option>
              <option value="with_food">{t.withFood} (ಊಟದೊಂದಿಗೆ)</option>
              <option value="empty_stomach">{t.emptyStomach} (ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ)</option>
              <option value="bedtime">{t.bedtime} (ಮಲಗುವ ಮುನ್ನ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'kn' ? 'ಸಮಯ ವಲಯ (Time Zone)' : 'Time Zone'}
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700"
            />
          </div>
        </div>

        {/* Start Date & Ongoing/End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t.startDate} *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t.endDate}
              </label>
              <label className="flex items-center space-x-1.5 text-xs text-teal-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOngoing}
                  onChange={(e) => setIsOngoing(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <span>{lang === 'kn' ? 'ನಿರಂತರ ವೇಳಾಪಟ್ಟಿ (Ongoing)' : 'Ongoing'}</span>
              </label>
            </div>
            <input
              type="date"
              disabled={isOngoing}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold ${
                isOngoing ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white border-slate-300'
              }`}
            />
          </div>
        </div>

        {/* Preferences: Sound, Vibration, Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t.soundPreference}
            </label>
            <select
              value={soundPreference}
              onChange={(e) => setSoundPreference(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold"
            >
              <option value="chime">Medical Two-Tone Chime</option>
              <option value="bell">Soft Zen Bell</option>
            </select>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span>{t.vibrationPreference}</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            {lang === 'kn' ? 'ಟಿಪ್ಪಣಿಗಳು (ಐಚ್ಛಿಕ)' : 'Prescription Notes (Optional)'}
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Take with a full glass of water, prescribed by Dr. Rajesh"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md transition-all hover:scale-[1.01]"
          >
            <Clock className="w-5 h-5" />
            <span>{isSubmitting ? 'Saving Schedule...' : t.addReminder}</span>
          </button>
        </div>
      </form>

      {/* Active Schedules List with Pause / Resume / Delete */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Layers className="w-5 h-5 text-teal-600" />
          <span>{lang === 'kn' ? 'ಸಕ್ರಿಯ ಔಷಧಿ ವೇಳಾಪಟ್ಟಿಗಳು' : 'All Configured Reminder Schedules'}</span>
        </h2>

        {activeSchedules.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4">
            {lang === 'kn' ? 'ಯಾವುದೇ ವೇಳಾಪಟ್ಟಿಗಳಿಲ್ಲ.' : 'No reminder schedules created yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {activeSchedules.map((schedule) => {
              let times: string[] = [];
              try {
                times = JSON.parse(schedule.scheduled_times);
              } catch {
                times = ['08:00'];
              }

              const isPaused = schedule.status === 'paused';

              return (
                <div
                  key={schedule.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPaused
                      ? 'bg-slate-50 border-slate-200 opacity-70'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-teal-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-base text-slate-900">{schedule.medicine_name}</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        isPaused ? 'bg-slate-200 text-slate-700' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {isPaused ? t.paused : t.active}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-bold text-slate-800">
                        {schedule.tablets_per_dose} {schedule.dosage_unit}
                      </span>{' '}
                      × {schedule.doses_per_day} times/day •{' '}
                      <span className="text-teal-700 font-semibold">
                        Daily Total: {schedule.tablets_per_dose * schedule.doses_per_day} {schedule.dosage_unit}s
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {times.map((time, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                          ⏰ {time}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={() => onToggleStatus(schedule.id, schedule.status)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isPaused
                          ? 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>

                    <button
                      onClick={() => onDeleteSchedule(schedule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
