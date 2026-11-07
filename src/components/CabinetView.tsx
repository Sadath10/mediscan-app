import React, { useState } from 'react';
import {
  Pill,
  Plus,
  Clock,
  Trash2,
  Edit2,
  AlertCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Volume2,
} from 'lucide-react';
import { Language, translations } from '../translations.js';

interface CabinetItem {
  id: number;
  medicine_id?: number | null;
  custom_name: string;
  brand: string;
  active_ingredient: string;
  strength: string;
  dosage_form: string;
  current_stock: number;
  expiry_date?: string | null;
  prescribed_by?: string | null;
  prescription_instructions?: string | null;
  notes?: string | null;
  verified_purpose_en?: string;
  verified_purpose_kn?: string;
  precautions_en?: string;
  precautions_kn?: string;
}

interface CabinetViewProps {
  lang: Language;
  cabinetItems: CabinetItem[];
  onAddNew: () => void;
  onDeleteItem: (id: number) => void;
  onSetReminder: (medicineName: string, medicineId?: number | null) => void;
  onViewMonograph: (item: CabinetItem) => void;
}

export const CabinetView: React.FC<CabinetViewProps> = ({
  lang,
  cabinetItems,
  onAddNew,
  onDeleteItem,
  onSetReminder,
  onViewMonograph,
}) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = cabinetItems.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.custom_name.toLowerCase().includes(q) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (item.active_ingredient && item.active_ingredient.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Pill className="w-7 h-7 text-teal-600" />
            <span>{t.cabinet}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {lang === 'kn'
              ? 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಔಷಧಿಗಳ ಸಂಗ್ರಹ, ಉಳಿದಿರುವ ಮಾತ್ರೆಗಳು ಮತ್ತು ವೈದ್ಯರ ಸೂಚನೆಗಳು.'
              : 'Your personal inventory of saved medicines, inventory stock levels, and clinical monographs.'}
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-xs transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'kn' ? 'ಹೊಸ ಔಷಧಿ ಸೇರಿಸಿ' : 'Add Medicine'}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={lang === 'kn' ? 'ಔಷಧಿ ಅಥವಾ ಅಂಶದ ಹೆಸರನ್ನು ಹುಡುಕಿ...' : 'Search medicine by name or active salt...'}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
        />
      </div>

      {/* Grid of Cabinet Medicines */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            {searchTerm ? (lang === 'kn' ? 'ಯಾವುದೇ ಫಲಿತಾಂಶ ಕಂಡುಬಂದಿಲ್ಲ' : 'No matching medicines found') : (lang === 'kn' ? 'ಕ್ಯಾಬಿನೆಟ್ ಖಾಲಿಯಾಗಿದೆ' : 'Your cabinet is empty')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? (lang === 'kn' ? 'ದಯವಿಟ್ಟು ಬೇರೆ ಹೆಸರನ್ನು ಪ್ರಯತ್ನಿಸಿ.' : 'Try a different search term.')
              : (lang === 'kn' ? 'ಹೊಸ ಔಷಧಿ ಸೇರಿಸಲು ಮೇಲಿನ ಬಟನ್ ಒತ್ತಿ ಅಥವಾ ಸ್ಕ್ಯಾನರ್ ಬಳಸಿ.' : 'Scan a medicine packaging or tap "Add Medicine" to begin your digital cabinet.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isLowStock = item.current_stock <= 5;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-teal-400/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-extrabold text-lg text-slate-900">{item.custom_name}</h3>
                        {item.medicine_id && (
                          <span className="p-0.5 text-emerald-600 bg-emerald-50 rounded" title="Verified Monograph">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {item.active_ingredient} • <span className="font-bold text-slate-700">{item.strength}</span> ({item.dosage_form})
                      </p>
                    </div>

                    {/* Stock Badge */}
                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isLowStock ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.current_stock} {lang === 'kn' ? 'ಉಳಿದಿದೆ' : 'left'}
                    </div>
                  </div>

                  {/* Purpose / Clinical notes preview */}
                  <div className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {lang === 'kn'
                      ? item.verified_purpose_kn || item.prescription_instructions || 'ಯಾವುದೇ ವಿವರಗಳಿಲ್ಲ'
                      : item.verified_purpose_en || item.prescription_instructions || 'No instructions provided'}
                  </div>

                  {isLowStock && (
                    <div className="mt-2 text-[11px] font-semibold text-rose-700 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{t.stockLowWarning}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onSetReminder(item.custom_name, item.medicine_id)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'kn' ? 'ಜ್ಞಾಪನೆ ಹೊಂದಿಸಿ' : 'Set Reminder'}</span>
                    </button>

                    <button
                      onClick={() => onViewMonograph(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      {lang === 'kn' ? 'ವಿವರ' : 'Details'}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(t.confirmDelete)) {
                        onDeleteItem(item.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
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
  );
};
