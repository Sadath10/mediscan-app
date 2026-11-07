import React, { useState } from 'react';
import { X, Smartphone, Monitor, Laptop, CheckCircle2, Cloud, Sparkles } from 'lucide-react';
import { Language } from '../translations.js';

interface VoiceInstallModalProps {
  lang: Language;
  onClose: () => void;
}

export const VoiceInstallModal: React.FC<VoiceInstallModalProps> = ({ lang, onClose }) => {
  const [activePlatform, setActivePlatform] = useState<'android' | 'windows' | 'mac'>('android');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-teal-600 via-teal-700 to-emerald-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {lang === 'kn' ? 'ಕನ್ನಡ ಧ್ವನಿ ಪ್ಯಾಕ್ ಸ್ಥಾಪಿಸುವುದು ಹೇಗೆ' : 'How to Install Kannada Voice Pack'}
              </h2>
              <p className="text-xs text-teal-100 font-medium">
                {lang === 'kn' ? 'ಉಚಿತ ಆಫ್‌ಲೈನ್ ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ' : 'Enable offline high-quality device voice'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Active Cloud Fallback Assurance Card */}
          <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 flex items-start space-x-3">
            <Cloud className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950 leading-relaxed">
              <span className="font-extrabold text-blue-900 block mb-0.5">
                {lang === 'kn' ? 'ಕ್ಲೌಡ್ ಆಡಿಯೋ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಕ್ರಿಯವಾಗಿದೆ' : 'Cloud Audio is Active Automatically'}
              </span>
              {lang === 'kn'
                ? 'ಸ್ಥಳೀಯ ಧ್ವನಿ ಇಲ್ಲದಿದ್ದರೂ ಸಹ ಮೆಡಿಸ್ಕ್ಯಾನ್ ಕ್ಲೌಡ್ ಆಡಿಯೋ ಬಳಸಿ ಕನ್ನಡದಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ಓದುತ್ತದೆ.'
                : 'Even without installing voice data, Mediscan automatically streams high-quality Cloud Audio for all Kannada narrations.'}
            </div>
          </div>

          {/* Platform Tabs */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
              {lang === 'kn' ? 'ನಿಮ್ಮ ಸಾಧನವನ್ನು ಆರಿಸಿ' : 'Select Your Operating System'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActivePlatform('android')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  activePlatform === 'android'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('windows')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  activePlatform === 'windows'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Windows</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('mac')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  activePlatform === 'mac'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>macOS / iOS</span>
              </button>
            </div>
          </div>

          {/* Step Instructions */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            {activePlatform === 'android' && (
              <div>
                <h4 className="text-xs font-black uppercase text-teal-800 tracking-wider mb-2">
                  Android Step-by-Step:
                </h4>
                <ol className="text-xs text-slate-700 space-y-2 leading-relaxed">
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                    <span>Open <strong>Settings</strong> on your Android phone.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                    <span>Tap <strong>System</strong> &gt; <strong>Languages & Input</strong> (or Accessibility).</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                    <span>Select <strong>Text-to-speech output</strong>.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                    <span>Tap gear icon next to <strong>Speech Recognition & Synthesis by Google</strong> &gt; <strong>Install voice data</strong>.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">5</span>
                    <span>Select <strong>Kannada (India)</strong> and download the free voice pack.</span>
                  </li>
                </ol>
              </div>
            )}

            {activePlatform === 'windows' && (
              <div>
                <h4 className="text-xs font-black uppercase text-teal-800 tracking-wider mb-2">
                  Windows 10/11 Step-by-Step:
                </h4>
                <ol className="text-xs text-slate-700 space-y-2 leading-relaxed">
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                    <span>Open <strong>Settings</strong> (Windows Key + I).</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                    <span>Click <strong>Time & Language</strong> &gt; <strong>Language</strong>.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                    <span>Click <strong>Add a language</strong> and search for <strong>Kannada</strong>.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                    <span>Check <strong>Text-to-speech</strong> and click <strong>Install</strong>.</span>
                  </li>
                </ol>
              </div>
            )}

            {activePlatform === 'mac' && (
              <div>
                <h4 className="text-xs font-black uppercase text-teal-800 tracking-wider mb-2">
                  macOS Step-by-Step:
                </h4>
                <ol className="text-xs text-slate-700 space-y-2 leading-relaxed">
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                    <span>Open <strong>System Settings</strong> (Apple menu).</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                    <span>Click <strong>Accessibility</strong> &gt; <strong>Spoken Content</strong>.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                    <span>Under <strong>System Voice</strong>, choose <strong>Manage Voices...</strong>.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                    <span>Search <strong>Kannada</strong> and click download.</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
          >
            {lang === 'kn' ? 'ಅರ್ಥವಾಯಿತು (Got It)' : 'Got It, Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
