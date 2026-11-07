import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutUser, testConnection } from './firebase.js';
import { MediscanProvider, useMediscan } from './context/MediscanContext.js';
import { Navbar } from './components/Navbar.js';
import { DashboardView } from './components/DashboardView.js';
import { ScannerView } from './components/ScannerView.js';
import { CabinetView } from './components/CabinetView.js';
import { AddReminderView } from './components/AddReminderView.js';
import { HistoryView } from './components/HistoryView.js';
import { SettingsView } from './components/SettingsView.js';
import { DoseDueModal } from './components/DoseDueModal.js';
import { MedicineDetailModal } from './components/MedicineDetailModal.js';
import { AddCabinetModal } from './components/AddCabinetModal.js';
import { ToastContainer } from './components/Toast.js';
import { Language } from './translations.js';
import {
  registerServiceWorker,
  requestNotificationPermission,
  pollDueNotifications,
  DueNotificationPayload,
} from './utils/notifications.js';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('mediscan_lang') as Language) || 'en';
  });

  const [user, setUser] = useState<User | null>(null);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return 'Notification' in window ? Notification.permission : 'denied';
  });

  // Global centralized state from context
  const {
    medicines,
    reminders,
    doseLogs,
    todayDoses,
    nextDose,
    summary,
    adherenceDays,
    overallPercentage,
    currentStreak,
    scanHistory,
    toasts,
    dismissToast,
    addMedicine,
    deleteMedicine,
    addReminder,
    toggleReminderStatus,
    deleteReminder,
    recordDoseAction,
    clearAllHistory,
    refreshAll,
  } = useMediscan();

  // Modals state
  const [dueModalItem, setDueModalItem] = useState<DueNotificationPayload | null>(null);
  const [selectedMonograph, setSelectedMonograph] = useState<any | null>(null);
  const [showAddCabinetModal, setShowAddCabinetModal] = useState<boolean>(false);

  // Reminder form prefill
  const [reminderPrefillName, setReminderPrefillName] = useState<string>('');
  const [reminderPrefillId, setReminderPrefillId] = useState<number | null>(null);

  // Save language preference
  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('mediscan_lang', newLang);
  };

  // Firebase Auth listener
  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await setDoc(
            doc(db, 'users', currentUser.uid),
            {
              uid: currentUser.uid,
              email: currentUser.email || '',
              language: lang,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Firestore user profile sync warning:', err);
        }
      }
    });
    return () => unsubscribe();
  }, [lang]);

  // Initialize service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Periodic notification polling (every 20 seconds)
  useEffect(() => {
    const handleNotification = (notif: DueNotificationPayload) => {
      setDueModalItem(notif);
      refreshAll();
    };

    pollDueNotifications(handleNotification, lang);

    const interval = setInterval(() => {
      pollDueNotifications(handleNotification, lang);
    }, 20000);

    return () => clearInterval(interval);
  }, [lang, refreshAll]);

  // Open monograph detail modal
  const handleOpenDetails = async (medicineName: string, medicineId?: number | null) => {
    if (medicineId) {
      try {
        const res = await fetch(`/api/medicines/verified/${medicineId}`);
        if (res.ok) {
          const med = await res.json();
          setSelectedMonograph(med);
          return;
        }
      } catch {
        // fallback
      }
    }

    const foundInCabinet = medicines.find(
      (c) =>
        c.custom_name?.toLowerCase() === medicineName.toLowerCase() ||
        c.brand?.toLowerCase() === medicineName.toLowerCase()
    );
    if (foundInCabinet) {
      setSelectedMonograph(foundInCabinet);
      return;
    }

    try {
      const res = await fetch(`/api/medicines/search?q=${encodeURIComponent(medicineName)}`);
      if (res.ok) {
        const list = await res.json();
        if (list.length > 0) {
          setSelectedMonograph(list[0]);
          return;
        }
      }
    } catch {
      // ignore
    }

    setSelectedMonograph({
      name: medicineName,
      active_ingredient: 'Active Salt',
      strength: 'Prescribed Strength',
      dosage_form: 'Tablet',
      verified_purpose_en: 'Take strictly according to physician prescription directions.',
      verified_purpose_kn: 'ದಯವಿಟ್ಟು ವೈದ್ಯರ ನಿರ್ದೇಶನದಂತೆ ಮಾತ್ರ ಸೇವಿಸಿ.',
      precautions_en: 'Consult healthcare professional if adverse reactions occur.',
      precautions_kn: 'ಯಾವುದೇ ಅಡ್ಡಪರಿಣಾಮಗಳು ಕಂಡುಬಂದರೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    });
  };

  const handleSetReminderFromShortcut = (name: string, id?: number | null) => {
    setReminderPrefillName(name);
    setReminderPrefillId(id || null);
    setCurrentTab('add-reminder');
  };

  const handleRefreshPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={handleSetLang}
        pendingCount={summary.pending}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            lang={lang}
            onNavigate={setCurrentTab}
            todayDoses={todayDoses}
            nextDose={nextDose}
            summary={summary}
            onDoseAction={recordDoseAction}
            onOpenDetails={handleOpenDetails}
          />
        )}

        {currentTab === 'scanner' && (
          <ScannerView
            lang={lang}
            onSaveToCabinet={addMedicine}
            onSetReminder={handleSetReminderFromShortcut}
          />
        )}

        {currentTab === 'cabinet' && (
          <CabinetView
            lang={lang}
            cabinetItems={medicines}
            onAddNew={() => setShowAddCabinetModal(true)}
            onDeleteItem={deleteMedicine}
            onSetReminder={handleSetReminderFromShortcut}
            onViewMonograph={(item) => setSelectedMonograph(item)}
          />
        )}

        {currentTab === 'add-reminder' && (
          <AddReminderView
            lang={lang}
            cabinetMedicines={medicines}
            prefillMedicineName={reminderPrefillName}
            prefillMedicineId={reminderPrefillId}
            activeSchedules={reminders}
            onSaveSchedule={addReminder}
            onToggleStatus={toggleReminderStatus}
            onDeleteSchedule={deleteReminder}
            onScheduleSaved={() => {
              setReminderPrefillName('');
              setReminderPrefillId(null);
            }}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            lang={lang}
            doseLogs={doseLogs}
            adherenceDays={adherenceDays}
            overallPercentage={overallPercentage}
            currentStreak={currentStreak}
            scanHistory={scanHistory}
            onClearHistory={clearAllHistory}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            lang={lang}
            setLang={handleSetLang}
            notificationPermission={notificationPermission}
            onRefreshPermission={handleRefreshPermission}
          />
        )}
      </main>

      {/* Dose Due Modal Popup */}
      <DoseDueModal
        lang={lang}
        dueItem={dueModalItem}
        onClose={() => setDueModalItem(null)}
        onAction={recordDoseAction}
        onOpenDetails={(medName) => handleOpenDetails(medName)}
      />

      {/* Verified Monograph Modal */}
      <MedicineDetailModal
        lang={lang}
        medicine={selectedMonograph}
        onClose={() => setSelectedMonograph(null)}
        onSetReminder={handleSetReminderFromShortcut}
      />

      {/* Add to Cabinet Modal */}
      {showAddCabinetModal && (
        <AddCabinetModal
          lang={lang}
          onClose={() => setShowAddCabinetModal(false)}
          onSave={async (data) => {
            await addMedicine(data);
          }}
        />
      )}

      {/* Floating Toast Feedback Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <MediscanProvider>
      <AppContent />
    </MediscanProvider>
  );
}
