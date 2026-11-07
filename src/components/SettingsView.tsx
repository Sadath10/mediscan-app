import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Volume2,
  Clock,
  Globe,
  AlertTriangle,
  Play,
  Smartphone,
  Check,
  Info,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Language, translations } from '../translations.js';
import { playReminderChime, speakText, isKannadaVoiceAvailable } from '../utils/audio.js';
import { useMediscan } from '../context/MediscanContext.js';
import { VoiceInstallModal } from './VoiceInstallModal.js';

interface SettingsViewProps {
  lang: Language;
  setLang: (lang: Language) => void;
  notificationPermission: NotificationPermission;
  onRefreshPermission: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  lang,
  setLang,
  notificationPermission,
  onRefreshPermission,
}) => {
  const t = translations[lang];
  const { showToast } = useMediscan();

  // Detect native Android platform environment
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform ? Capacitor.isNativePlatform() : false;

  // Local notification state
  const [notificationStatus, setNotificationStatus] = useState<string>('prompt');
  const [soundPreference, setSoundPreference] = useState('chime');
  const [timezone, setTimezone] = useState(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  });
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // Simulated sleek popup for web preview
  const [simulatedPopup, setSimulatedPopup] = useState<string | null>(null);

  // Voice install guide modal & audio loading state
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState<boolean>(false);

  // Check Capacitor native permissions on mount when in native app
  useEffect(() => {
    if (isNative) {
      const checkNativePermissions = async () => {
        try {
          const perm = await LocalNotifications.checkPermissions();
          setNotificationStatus(perm.display);
        } catch (err) {
          console.warn('Capacitor checkPermissions error:', err);
        }
      };
      checkNativePermissions();
    }
  }, [isNative, notificationPermission]);

  // Request native permission or simulate preview in web
  const handleEnableNotifications = async () => {
    if (isNative) {
      try {
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display === 'granted') {
          // Native haptic feedback
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          setNotificationStatus('granted');
          onRefreshPermission();
          showToast(
            lang === 'kn' ? 'ಸ್ಥಳೀಯ ನೋಟಿಫಿಕೇಶನ್‌ಗಳು ಸಕ್ರಿಯವಾಗಿವೆ' : 'Native Notifications Enabled',
            'success'
          );
        } else {
          setNotificationStatus(perm.display || 'denied');
          onRefreshPermission();
          showToast('Permission denied. Please enable in phone settings.', 'error');
        }
      } catch (err) {
        console.warn('Native permission request error:', err);
        setNotificationStatus('denied');
      }
    } else {
      // Running in Web / AI Studio Preview: DO NOT show red error toast
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      playReminderChime(soundPreference);
      setSimulatedPopup(lang === 'kn' ? 'ಡೋಲೋ ೬೫೦ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ!' : 'Time to take Dolo 650!');
      showToast('🔔 Mediscan: Time to take Dolo 650!', 'info');
      setTimeout(() => setSimulatedPopup(null), 4500);
    }
  };

  // Dispatch live native notification or preview simulation
  const handleTestLiveNotification = async () => {
    // Trigger haptic pulse
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200]);
    }

    // Play chime sound
    playReminderChime(soundPreference);

    if (isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'Mediscan Test',
              body: "It's time to take your medicine!",
              id: 1,
              schedule: { at: new Date(Date.now() + 1000) },
              sound: 'beep.wav',
              attachments: undefined,
              actionTypeId: '',
              extra: null,
            },
          ],
        });
        setTestStatus(lang === 'kn' ? 'ಸ್ಥಳೀಯ ನೋಟಿಫಿಕೇಶನ್ ಕಳುಹಿಸಲಾಗಿದೆ!' : 'Native notification sent!');
        showToast(lang === 'kn' ? 'ಸ್ಥಳೀಯ ನೋಟಿಫಿಕೇಶನ್ ಕಳುಹಿಸಲಾಗಿದೆ!' : 'Native notification sent!', 'success');
      } catch (err) {
        console.warn('Native notification schedule error:', err);
        showToast('Native notification failed to schedule.', 'error');
      }
    } else {
      // In Web preview: trigger sleek simulation without blocking errors
      setSimulatedPopup(lang === 'kn' ? 'ಡೋಲೋ ೬೫೦ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ!' : 'Time to take Dolo 650!');
      showToast('🔔 Mediscan: Time to take Dolo 650!', 'info');
      setTimeout(() => setSimulatedPopup(null), 4500);
    }

    setTimeout(() => setTestStatus(null), 4000);
  };

  // Play audio chime test
  const handleTestAudio = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80]);
    }
    playReminderChime(soundPreference);
    showToast(lang === 'kn' ? 'ಅಲಾರಂ ಶಬ್ದ ಪರೀಕ್ಷೆ' : 'Playing alert chime', 'info');
  };

  // Test Kannada Voice synthesis with cloud fallback & modal trigger
  const handleTestKannadaVoice = () => {
    const hasLocal = isKannadaVoiceAvailable();
    if (!hasLocal && !isNative) {
      setShowVoiceModal(true);
    }
    setIsVoiceLoading(true);
    speakText('ನಮಸ್ಕಾರ! ಇದು ಮೆಡಿಸ್ಕ್ಯಾನ್ ಔಷಧಿ ಜ್ಞಾಪನೆ ವ್ಯವಸ್ಥೆ. ನಿಮ್ಮ ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ.', {
      lang: 'kn',
      onLoading: (loading) => setIsVoiceLoading(loading),
      onStart: () => {
        setIsVoiceLoading(false);
        setTestStatus(lang === 'kn' ? 'ಕನ್ನಡ ಧ್ವನಿ ನುಡಿಸಲಾಗುತ್ತಿದೆ...' : 'Playing Kannada voice guidance...');
      },
      onEnd: () => {
        setIsVoiceLoading(false);
        setTestStatus(null);
      },
      onError: () => {
        setIsVoiceLoading(false);
        setTestStatus(null);
      },
      onFallback: (msg) => {
        showToast(msg, 'info');
      },
    });
  };

  const isGranted = notificationStatus === 'granted';
  const isDenied = notificationStatus === 'denied';

  return (
    <div className="space-y-5 pb-24 max-w-xl mx-auto relative">
      {/* Sleek simulated in-app popup for web preview */}
      {simulatedPopup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700/80 flex items-center justify-between space-x-3 transition-all animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              🔔
            </div>
            <div>
              <div className="font-black text-xs text-white">Mediscan Reminder</div>
              <div className="text-xs text-teal-200 font-semibold">{simulatedPopup}</div>
            </div>
          </div>
          <button
            onClick={() => setSimulatedPopup(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center space-x-2.5 pt-1">
        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.settings}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'kn' ? 'ಜ್ಞಾಪನೆ ಅನುಮತಿಗಳು ಮತ್ತು ಅಪ್ಲಿಕೇಶನ್ ಆದ್ಯತೆಗಳು' : 'Notification preferences & app settings'}
          </p>
        </div>
      </div>

      {/* 1. Medication Reminders & Environment Handling */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base">
          <Bell className="w-4 h-4 text-teal-600" />
          <span>{lang === 'kn' ? 'ಔಷಧಿ ಜ್ಞಾಪನೆಗಳು (Notifications)' : 'Medication Reminders'}</span>
        </div>

        {/* IF NATIVE AND GRANTED */}
        {isNative && isGranted ? (
          <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-emerald-950">
                {lang === 'kn' ? 'ಸ್ಥಳೀಯ ನೋಟಿಫಿಕೇಶನ್‌ಗಳು ಸಕ್ರಿಯವಾಗಿವೆ' : 'Native Notifications Enabled'}
              </h4>
              <p className="text-xs text-emerald-800/90 mt-0.5 leading-relaxed">
                {lang === 'kn'
                  ? 'ನಿಗದಿತ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ಆಂಡ್ರಾಯ್ಡ್ ಫೋನ್‌ನಲ್ಲಿ ಸ್ಥಳೀಯ ನೋಟಿಫಿಕೇಶನ್‌ಗಳು ಮತ್ತು ಅಲಾರಂಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ.'
                  : 'Native Android alarms, vibrations, and notifications are active for all scheduled doses.'}
              </p>
            </div>
          </div>
        ) : isNative && isDenied ? (
          /* IF NATIVE AND DENIED */
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-amber-950">
                  {lang === 'kn' ? 'ನೋಟಿಫಿಕೇಶನ್ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ' : 'Notifications are Blocked'}
                </h4>
                <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                  {lang === 'kn'
                    ? 'ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಫೋನ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ನೋಟಿಫಿಕೇಶನ್ ಸಕ್ರಿಯಗೊಳಿಸಿ.'
                    : 'Permission denied. Please enable in phone settings.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              {lang === 'kn' ? 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ' : 'Retry Permission'}
            </button>
          </div>
        ) : isNative ? (
          /* IF NATIVE AND PROMPT */
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bell className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-teal-950">
                  {lang === 'kn' ? 'ನೋಟಿಫಿಕೇಶನ್ ಸಕ್ರಿಯಗೊಳಿಸಿ' : 'Enable Notifications'}
                </h4>
                <p className="text-xs text-teal-800/90 mt-0.5 leading-relaxed">
                  {lang === 'kn'
                    ? 'ಆಂಡ್ರಾಯ್ಡ್ ಫೋನ್‌ನಲ್ಲಿ ಸರಿಯಾದ ಸಮಯಕ್ಕೆ ಕಂಪನ ಮತ್ತು ಅಲಾರಂ ಪಡೆಯಿರಿ.'
                    : 'Get native haptic vibrations, alarms, and notifications when doses are due.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              {t.enableNotifications}
            </button>
          </div>
        ) : (
          /* IF WEB / AI STUDIO PREVIEW: Informational Blue Box (No Error Toasts) */
          <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Info className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-blue-950">
                  {lang === 'kn' ? 'ಆಂಡ್ರಾಯ್ಡ್ ಎಪಿಕೆ ನೋಟಿಫಿಕೇಶನ್' : 'Android APK Notification Mode'}
                </h4>
                <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">
                  {lang === 'kn'
                    ? 'ಆಂಡ್ರಾಯ್ಡ್ ಎಪಿಕೆ ಸ್ಥಾಪಿಸಿದಾಗ ನೋಟಿಫಿಕೇಶನ್‌ಗಳು ಸಕ್ರಿಯಗೊಳ್ಳುತ್ತವೆ. ವೆಬ್ ಪೂರ್ವವೀಕ್ಷಣೆಗಳು ನೋಟಿಫಿಕೇಶನ್‌ಗಳನ್ನು ನಿರ್ಬಂಧಿಸುತ್ತವೆ.'
                    : 'Notifications will activate when you install the Android APK. Web previews block notifications.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 flex items-center justify-center space-x-1.5 self-start sm:self-center"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{lang === 'kn' ? 'ಎಪಿಕೆಯಲ್ಲಿ ಪರೀಕ್ಷಿಸಿ' : 'Test in APK'}</span>
            </button>
          </div>
        )}

        {/* Quick Test Controls */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
            {lang === 'kn' ? 'ಪರೀಕ್ಷಾ ಸಾಧನಗಳು (Test Controls)' : 'Test Notification System'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleTestLiveNotification}
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-teal-50/60 border border-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
            >
              <Bell className="w-3.5 h-3.5 text-teal-600" />
              <span>{t.testNotification}</span>
            </button>

            <button
              type="button"
              onClick={handleTestAudio}
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
            >
              <Play className="w-3.5 h-3.5 text-slate-600" />
              <span>{t.testSound}</span>
            </button>

            <button
              type="button"
              onClick={handleTestKannadaVoice}
              disabled={isVoiceLoading}
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center disabled:opacity-60"
            >
              {isVoiceLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{isVoiceLoading ? (lang === 'kn' ? 'ಆಡಿಯೋ ಲೋಡ್...' : 'Loading...') : (lang === 'kn' ? 'ಕನ್ನಡ ಧ್ವನಿ' : 'Kannada Voice')}</span>
            </button>
          </div>

          <div className="mt-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center space-x-1.5 cursor-pointer underline transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
              <span>{lang === 'kn' ? 'ಕನ್ನಡ ಧ್ವನಿ ಪ್ಯಾಕ್ ಸ್ಥಾಪನೆ ಮಾರ್ಗದರ್ಶಿ' : 'How to install offline Kannada voice pack'}</span>
            </button>
          </div>
        </div>

        {testStatus && (
          <p className="text-xs font-semibold text-teal-800 bg-teal-50 p-2.5 rounded-xl border border-teal-200">
            {testStatus}
          </p>
        )}

        {/* Android Native Guidance */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start space-x-2.5">
          <Smartphone className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {lang === 'kn'
              ? 'ಆಂಡ್ರಾಯ್ಡ್ ಎಪಿಕೆ ಯಲ್ಲಿ ಸ್ಥಳೀಯ ಕ್ಯಾಪಾಸಿಟರ್ ನೋಟಿಫಿಕೇಶನ್‌ಗಳು ಆಫ್‌ಲೈನ್‌ನಲ್ಲೂ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ.'
              : 'When compiled to an Android APK via Capacitor, native local notifications trigger reliable alarms and haptic feedback even when offline.'}
          </p>
        </div>
      </div>

      {/* 2. Language Selection */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base">
          <Globe className="w-4 h-4 text-teal-600" />
          <span>{lang === 'kn' ? 'ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ' : 'Application Language'}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => setLang('en')}
            className={`py-2.5 px-4 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              lang === 'en'
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>English</span>
            {lang === 'en' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          <button
            onClick={() => setLang('kn')}
            className={`py-2.5 px-4 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              lang === 'kn'
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>ಕನ್ನಡ (Kannada)</span>
            {lang === 'kn' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>
        </div>
      </div>

      {/* 3. Timezone Selection */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base">
          <Clock className="w-4 h-4 text-teal-600" />
          <span>{lang === 'kn' ? 'ಸಮಯ ವಲಯ' : 'Timezone'}</span>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {lang === 'kn' ? 'ಸ್ಥಳೀಯ ಸಮಯ ವಲಯ' : 'Active Timezone'}
          </label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500 focus:bg-white transition-colors"
          />
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {lang === 'kn'
              ? 'ನಿಮ್ಮ ವೇಳಾಪಟ್ಟಿಗಳು ಮತ್ತು ಡೋಸ್ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಈ ಸಮಯ ವಲಯದಲ್ಲಿ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ.'
              : 'Dose alarms and daily schedules are calculated relative to this local timezone.'}
          </p>
        </div>
      </div>

      {/* How to Install Voice Guide Modal */}
      {showVoiceModal && (
        <VoiceInstallModal
          lang={lang}
          onClose={() => setShowVoiceModal(false)}
        />
      )}
    </div>
  );
};
