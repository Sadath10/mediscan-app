import React, { useState } from 'react';
import { X, Pill, Plus, Search, ShieldCheck } from 'lucide-react';
import { Language, translations } from '../translations.js';

interface AddCabinetModalProps {
  lang: Language;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const AddCabinetModal: React.FC<AddCabinetModalProps> = ({
  lang,
  onClose,
  onSave,
}) => {
  const t = translations[lang];

  const [name, setName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [currentStock, setCurrentStock] = useState(20);
  const [expiryDate, setExpiryDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedMedId, setSelectedMedId] = useState<number | null>(null);

  const handleNameChange = async (val: string) => {
    setName(val);
    setSelectedMedId(null);
    if (val.trim().length >= 2) {
      try {
        const res = await fetch(`/api/medicines/search?q=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const list = await res.json();
          setSuggestions(list);
        }
      } catch {
        // ignore
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (med: any) => {
    setName(med.name);
    setSelectedMedId(med.id);
    setActiveIngredient(med.active_ingredient);
    setStrength(med.strength);
    setDosageForm(med.dosage_form || 'Tablet');
    setInstructions(med.common_instructions_en || '');
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSave({
      medicine_id: selectedMedId,
      custom_name: name.trim(),
      brand: name.trim(),
      active_ingredient: activeIngredient.trim(),
      strength: strength.trim(),
      dosage_form: dosageForm,
      current_stock: currentStock,
      expiry_date: expiryDate || null,
      prescription_instructions: instructions.trim() || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Pill className="w-5 h-5 text-teal-600" />
            <h3 className="font-extrabold text-lg text-slate-900">
              {lang === 'kn' ? 'ಕ್ಯಾಬಿನೆಟ್‌ಗೆ ಔಷಧಿ ಸೇರಿಸಿ' : 'Add Medicine to Cabinet'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs sm:text-sm">
          {/* Name with autocomplete */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t.medicineName} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Dolo 650, Augmentin, Pantocid"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-teal-500"
            />

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-48 overflow-y-auto z-20 divide-y divide-slate-100">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSuggestion(item)}
                    className="p-2.5 hover:bg-teal-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span className="text-slate-500 ml-2">({item.active_ingredient} - {item.strength})</span>
                    </div>
                    <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t.activeIngredient}
              </label>
              <input
                type="text"
                value={activeIngredient}
                onChange={(e) => setActiveIngredient(e.target.value)}
                placeholder="e.g. Paracetamol"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t.strength}
              </label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 650 mg"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t.dosageForm}
              </label>
              <select
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Tablet">Tablet (ಮಾತ್ರೆ)</option>
                <option value="Capsule">Capsule (ಕ್ಯಾಪ್ಸೂಲ್)</option>
                <option value="Syrup">Syrup (ದ್ರವ)</option>
                <option value="Drops">Drops (ಹನಿಗಳು)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t.currentStock}
              </label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {lang === 'kn' ? 'ಮುಕ್ತಾಯ ದಿನಾಂಕ (Expiry Date)' : 'Expiry Date'}
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {lang === 'kn' ? 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸೂಚನೆಗಳು' : 'Prescription Directions'}
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. 1 tablet twice daily after meals"
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all"
            >
              {t.saveToCabinet}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
