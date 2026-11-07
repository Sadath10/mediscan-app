import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Camera,
  Calendar,
  Flame,
  Filter,
  ShieldCheck,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { Language, translations } from '../translations.js';

interface DoseLog {
  id: number;
  medicine_name: string;
  scheduled_date: string;
  scheduled_time: string;
  prescribed_quantity: number;
  dosage_unit: string;
  actual_action_time?: string | null;
  status: 'pending' | 'taken' | 'skipped' | 'missed' | 'snoozed';
  notes?: string | null;
}

interface AdherenceDay {
  date: string;
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  percentage: number;
}

interface ScanItem {
  id: number;
  image_data_url?: string | null;
  detected_name: string;
  detected_strength: string;
  confidence_score: number;
  is_verified_match: number;
  created_at: string;
  ocr_raw_text?: string;
}

interface HistoryViewProps {
  lang: Language;
  doseLogs: DoseLog[];
  adherenceDays: AdherenceDay[];
  overallPercentage: number;
  currentStreak: number;
  scanHistory: ScanItem[];
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  lang,
  doseLogs,
  adherenceDays,
  overallPercentage,
  currentStreak,
  scanHistory,
  onClearHistory,
}) => {
  const t = translations[lang];
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'doses' | 'scans'>('doses');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredLogs = doseLogs.filter((log) => {
    let effectiveStatus = log.status;
    if (effectiveStatus === 'pending' && log.scheduled_date < todayStr) {
      effectiveStatus = 'missed';
    }
    if (filterStatus === 'all') return true;
    return effectiveStatus === filterStatus;
  });

  const handleClearClick = () => {
    const confirmMsg =
      lang === 'kn'
        ? 'ಖಂಡಿತವಾಗಿಯೂ ನಿಮ್ಮ ಎಲ್ಲಾ ಡೋಸ್ ಇತಿಹಾಸ ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಬೇಕೆ? ಈ ಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.'
        : 'Are you sure you want to clear your dose logs? This action cannot be undone.';
    if (window.confirm(confirmMsg)) {
      onClearHistory();
    }
  };

  const getStatusBadge = (log: DoseLog) => {
    let status = log.status;
    if (status === 'pending' && log.scheduled_date < todayStr) {
      status = 'missed';
    }

    switch (status) {
      case 'taken':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.taken}</span>
          </span>
        );
      case 'skipped':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.skipped}</span>
          </span>
        );
      case 'missed':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>{t.missed}</span>
          </span>
        );
      case 'snoozed':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.snoozed}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            {t.pending}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <History className="w-7 h-7 text-teal-600" />
            <span>{t.history}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {lang === 'kn'
              ? 'ನಿಮ್ಮ ಮಾತ್ರೆಗಳ ನಿಷ್ಠೆ, ತಪ್ಪಿಹೋದ ಡೋಸ್‌ಗಳು ಮತ್ತು ಹಿಂದಿನ ಸ್ಕ್ಯಾನ್ ದಾಖಲೆಗಳು.'
              : 'Adherence tracking, dosage compliance records, and packaging scan archive.'}
          </p>
        </div>

        {doseLogs.length > 0 && (
          <button
            onClick={handleClearClick}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold transition-all self-start sm:self-center shadow-2xs hover:border-rose-300 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>{lang === 'kn' ? 'ಎಲ್ಲಾ ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸಿ' : 'Clear All History'}</span>
          </button>
        )}
      </div>

      {/* Adherence & Streak Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Compliance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-slate-500">{t.adherenceRate}</div>
            <div className="text-2xl font-black text-slate-900">{overallPercentage}%</div>
            <p className="text-[11px] text-teal-700 font-semibold">{lang === 'kn' ? 'ಕಳೆದ ೭ ದಿನಗಳಲ್ಲಿ' : 'Last 7 days'}</p>
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl">
            <Flame className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-slate-500">{t.streakDays}</div>
            <div className="text-2xl font-black text-slate-900">{currentStreak} {lang === 'kn' ? 'ದಿನಗಳು' : 'Days'}</div>
            <p className="text-[11px] text-amber-700 font-semibold">{lang === 'kn' ? 'ಸತತ ನಿಷ್ಠೆ' : 'Consecutive compliance'}</p>
          </div>
        </div>

        {/* Total Logged */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-slate-500">{lang === 'kn' ? 'ದಾಖಲಾದ ಡೋಸ್‌ಗಳು' : 'Doses Recorded'}</div>
            <div className="text-2xl font-black text-slate-900">{doseLogs.length}</div>
            <p className="text-[11px] text-emerald-700 font-semibold">{lang === 'kn' ? 'ಒಟ್ಟು ದಾಖಲೆ' : 'Lifetime logs'}</p>
          </div>
        </div>
      </div>

      {/* 7-Day Adherence Visual Breakdown */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-teal-600" />
          <span>{t.weeklyAdherence}</span>
        </h3>

        <div className="grid grid-cols-7 gap-2 text-center">
          {adherenceDays.map((day, idx) => {
            const dateObj = new Date(day.date);
            const dayName = dateObj.toLocaleDateString(lang === 'kn' ? 'kn-IN' : 'en-US', { weekday: 'narrow' });
            const dayNum = dateObj.getDate();

            return (
              <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{dayName}</span>
                <span className="text-xs font-extrabold text-slate-800 my-1">{dayNum}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black ${
                  day.total === 0
                    ? 'bg-slate-200 text-slate-500'
                    : day.percentage >= 80
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : day.percentage >= 50
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-rose-500 text-white'
                }`}>
                  {day.total === 0 ? '—' : `${day.percentage}%`}
                </div>
                <span className="text-[9px] text-slate-500 mt-1">
                  {day.taken}/{day.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs: Dose Logs vs Scan History */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('doses')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'doses'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {lang === 'kn' ? 'ಮಾತ್ರೆಗಳ ಇತಿಹಾಸ (Dose Logs)' : 'Dose Logs History'}
        </button>

        <button
          onClick={() => setActiveTab('scans')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'scans'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {lang === 'kn' ? 'ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸ (Scan Archive)' : 'Packaging Scan History'}
        </button>
      </div>

      {/* Dose Logs View */}
      {activeTab === 'doses' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>{lang === 'kn' ? 'ಫಿಲ್ಟರ್:' : 'Filter:'}</span>
            </span>
            {['all', 'taken', 'missed', 'skipped', 'snoozed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === status
                    ? 'bg-teal-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? (lang === 'kn' ? 'ಎಲ್ಲವೂ' : 'All') : t[status as keyof typeof t] || status}
              </button>
            ))}
          </div>

          {filteredLogs.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center italic">
              {lang === 'kn' ? 'ಯಾವುದೇ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' : 'No dose history found for this selection.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {log.medicine_name}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({log.prescribed_quantity} {log.dosage_unit})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      📅 {log.scheduled_date} at ⏰ {log.scheduled_time}
                      {log.actual_action_time && (
                        <span className="ml-2 text-teal-700">
                          • Action at: {new Date(log.actual_action_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {log.notes && <span className="ml-2 italic text-slate-400">{log.notes}</span>}
                    </div>
                  </div>

                  <div className="self-end sm:self-center">
                    {getStatusBadge(log)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scan History View */}
      {activeTab === 'scans' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          {scanHistory.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center italic">
              {lang === 'kn' ? 'ಯಾವುದೇ ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸವಿಲ್ಲ.' : 'No medicine scans saved yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scanHistory.map((scan) => (
                <div key={scan.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start space-x-3">
                  {scan.image_data_url ? (
                    <img
                      src={scan.image_data_url}
                      alt="Scan"
                      className="w-16 h-16 rounded-lg object-cover border border-slate-300 shrink-0 bg-white"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">
                        {scan.detected_name}
                      </h4>
                      {scan.is_verified_match ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : null}
                    </div>

                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {scan.detected_strength} • AI Match: {Math.round((scan.confidence_score || 0.8) * 100)}%
                    </p>

                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(scan.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
