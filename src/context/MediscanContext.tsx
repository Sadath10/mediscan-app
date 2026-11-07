import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

export interface MedicineItem {
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

export interface ReminderSchedule {
  id: number;
  user_id: string;
  medicine_id?: number | null;
  medicine_name: string;
  tablets_per_dose: number;
  dosage_unit: string;
  doses_per_day: number;
  scheduled_times: string; // JSON string or array string
  start_date: string;
  end_date?: string | null;
  days_of_week?: string;
  meal_instruction?: string;
  meal_instruction_kn?: string;
  sound_preference?: string;
  vibration_enabled?: number | boolean;
  timezone?: string;
  status: 'active' | 'paused' | 'completed';
  isActive?: boolean;
  notes?: string | null;
}

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
  notes?: string | null;
}

export interface AdherenceDay {
  date: string;
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  percentage: number;
}

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface MediscanContextType {
  medicines: MedicineItem[];
  reminders: ReminderSchedule[];
  doseLogs: DoseItem[];
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
  adherenceDays: AdherenceDay[];
  overallPercentage: number;
  currentStreak: number;
  scanHistory: any[];
  toasts: ToastItem[];
  isLoading: boolean;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;
  addMedicine: (itemData: any) => Promise<boolean>;
  deleteMedicine: (id: number) => Promise<boolean>;
  addReminder: (scheduleData: any) => Promise<{ success: boolean; warnings?: string[] }>;
  toggleReminderStatus: (id: number, currentStatus?: string) => Promise<boolean>;
  deleteReminder: (id: number) => Promise<boolean>;
  recordDoseAction: (doseId: number, action: 'taken' | 'skipped' | 'snoozed', snoozeMinutes?: number) => Promise<boolean>;
  clearAllHistory: () => Promise<boolean>;
  refreshAll: () => Promise<void>;
}

const MediscanContext = createContext<MediscanContextType | undefined>(undefined);

export const MediscanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<MedicineItem[]>(() => {
    try {
      const saved = localStorage.getItem('mediscan_medicines');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reminders, setReminders] = useState<ReminderSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('mediscan_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [doseLogs, setDoseLogs] = useState<DoseItem[]>(() => {
    try {
      const saved = localStorage.getItem('mediscan_doselogs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [todayDoses, setTodayDoses] = useState<DoseItem[]>([]);
  const [adherenceDays, setAdherenceDays] = useState<AdherenceDay[]>([]);
  const [overallPercentage, setOverallPercentage] = useState<number>(100);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for global toast events from audio utility and background services
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: 'success' | 'info' | 'warning' | 'error' }>;
      if (customEvent.detail?.message) {
        showToast(customEvent.detail.message, customEvent.detail.type || 'info');
      }
    };
    window.addEventListener('mediscan:toast', handleToastEvent);
    return () => window.removeEventListener('mediscan:toast', handleToastEvent);
  }, [showToast]);

  // Save to local persistence whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('mediscan_medicines', JSON.stringify(medicines));
    } catch (e) {
      console.warn('Failed to save medicines to localStorage', e);
    }
  }, [medicines]);

  useEffect(() => {
    try {
      localStorage.setItem('mediscan_reminders', JSON.stringify(reminders));
    } catch (e) {
      console.warn('Failed to save reminders to localStorage', e);
    }
  }, [reminders]);

  useEffect(() => {
    try {
      localStorage.setItem('mediscan_doselogs', JSON.stringify(doseLogs));
    } catch (e) {
      console.warn('Failed to save doseLogs to localStorage', e);
    }
  }, [doseLogs]);

  // Sync / fetch all data from backend
  const fetchCabinet = useCallback(async () => {
    try {
      const res = await fetch('/api/cabinet');
      if (res.ok) {
        const data = await res.json();
        setMedicines(data);
      }
    } catch (err) {
      console.warn('Failed to fetch cabinet:', err);
    }
  }, []);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const data: ReminderSchedule[] = await res.json();
        const mapped = data.map((r) => ({
          ...r,
          isActive: r.status === 'active',
        }));
        setReminders(mapped);
      }
    } catch (err) {
      console.warn('Failed to fetch reminders:', err);
    }
  }, []);

  const fetchTodayDoses = useCallback(async () => {
    try {
      const res = await fetch('/api/doses/today');
      if (res.ok) {
        const data = await res.json();
        setTodayDoses(data.doses || []);
      }
    } catch (err) {
      console.warn('Failed to fetch today doses:', err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const [resHistory, resScans] = await Promise.all([
        fetch('/api/doses/history'),
        fetch('/api/scans'),
      ]);

      if (resHistory.ok) {
        const data = await resHistory.json();
        setDoseLogs(data.recentLogs || []);
        if (data.adherenceReport) {
          setAdherenceDays(data.adherenceReport.days || []);
          setOverallPercentage(data.adherenceReport.overallPercentage ?? 100);
          setCurrentStreak(data.adherenceReport.currentStreak ?? 0);
        }
      }

      if (resScans.ok) {
        const scans = await resScans.json();
        setScanHistory(scans);
      }
    } catch (err) {
      console.warn('Failed to fetch history:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchCabinet(), fetchReminders(), fetchTodayDoses(), fetchHistory()]);
    setIsLoading(false);
  }, [fetchCabinet, fetchReminders, fetchTodayDoses, fetchHistory]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Filter today's doses: strictly filter out inactive/paused reminders UNLESS already recorded as taken/skipped/missed
  const filteredTodayDoses = useMemo(() => {
    const pausedReminderIds = new Set(
      reminders.filter((r) => r.status === 'paused' || r.isActive === false).map((r) => r.id)
    );

    return todayDoses.filter((dose) => {
      if (pausedReminderIds.has(dose.reminder_id)) {
        // Only keep if user already took or skipped it earlier
        return dose.status === 'taken' || dose.status === 'skipped' || dose.status === 'missed';
      }
      return true;
    });
  }, [todayDoses, reminders]);

  // Mathematical adherence metrics
  const summary = useMemo(() => {
    const total = filteredTodayDoses.length;
    const taken = filteredTodayDoses.filter((d) => d.status === 'taken').length;
    const pending = filteredTodayDoses.filter((d) => d.status === 'pending' || d.status === 'snoozed').length;
    const missed = filteredTodayDoses.filter((d) => d.status === 'missed').length;
    const skipped = filteredTodayDoses.filter((d) => d.status === 'skipped').length;
    const adherencePercent = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;

    return {
      total,
      taken,
      pending,
      missed,
      skipped,
      adherencePercent,
    };
  }, [filteredTodayDoses]);

  // Next upcoming dose
  const nextDose = useMemo(() => {
    const pending = filteredTodayDoses.filter((d) => d.status === 'pending' || d.status === 'snoozed');
    if (pending.length === 0) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Find the first upcoming dose whose time is >= current time
    const upcoming = pending.find((d) => {
      const [h, m] = (d.scheduled_time || '00:00').split(':').map((v) => parseInt(v, 10));
      return h * 60 + m >= currentMinutes;
    });

    if (upcoming) return upcoming;

    // Fallback: earliest pending dose of today
    return pending[0];
  }, [filteredTodayDoses]);

  // Actions

  // 1. Add Medicine
  const addMedicine = async (itemData: any): Promise<boolean> => {
    const custom_name = itemData.custom_name || itemData.medicineName || itemData.name || '';
    const brand = itemData.brand || custom_name;
    const active_ingredient = itemData.active_ingredient || itemData.genericName || '';
    const strength = itemData.strength || '500 mg';
    const dosage_form = itemData.dosage_form || itemData.form || 'Tablet';
    const current_stock = Number(itemData.current_stock || 20);

    const newItem: MedicineItem = {
      id: Date.now(),
      custom_name,
      brand,
      active_ingredient,
      strength,
      dosage_form,
      current_stock,
      prescription_instructions: itemData.prescription_instructions || itemData.dosageInstructions || '',
      notes: itemData.notes || '',
    };

    // Optimistic update
    setMedicines((prev) => [newItem, ...prev]);

    try {
      const res = await fetch('/api/cabinet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_name,
          brand,
          active_ingredient,
          strength,
          dosage_form,
          current_stock,
          prescription_instructions: itemData.prescription_instructions || itemData.dosageInstructions || '',
          notes: itemData.notes || '',
        }),
      });

      if (res.ok) {
        await fetchCabinet();
        showToast('Medicine added', 'success');

        // Firestore sync if authenticated
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            await addDoc(collection(db, 'userMedicines'), {
              userId: currentUser.uid,
              medicineName: custom_name,
              strength,
              form: dosage_form,
              isActive: true,
              createdAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('Firestore userMedicines sync error:', e);
          }
        }
        return true;
      } else {
        await fetchCabinet();
        return false;
      }
    } catch (err) {
      console.error('Failed to add medicine:', err);
      showToast('Error adding medicine', 'error');
      await fetchCabinet();
      return false;
    }
  };

  // 2. Cascading Delete Medicine
  const deleteMedicine = async (id: number): Promise<boolean> => {
    const medToDelete = medicines.find((m) => m.id === id);
    const medNameLower = medToDelete ? medToDelete.custom_name.toLowerCase().trim() : '';
    const brandLower = medToDelete ? medToDelete.brand.toLowerCase().trim() : '';

    // Step 1: Remove from medicines
    setMedicines((prev) => prev.filter((m) => m.id !== id));

    // Step 2 & 3: Find associated reminders & doseLogs and delete them
    const associatedReminderIds = new Set(
      reminders
        .filter((r) => {
          const rName = r.medicine_name.toLowerCase().trim();
          return (
            (medToDelete?.medicine_id && r.medicine_id === medToDelete.medicine_id) ||
            rName === medNameLower ||
            (brandLower && rName === brandLower)
          );
        })
        .map((r) => r.id)
    );

    // Cascading optimistic removal
    setReminders((prev) => prev.filter((r) => !associatedReminderIds.has(r.id)));
    setTodayDoses((prev) =>
      prev.filter((d) => {
        const dName = d.medicine_name.toLowerCase().trim();
        const matchesMed = associatedReminderIds.has(d.reminder_id) || dName === medNameLower || (brandLower && dName === brandLower);
        return !matchesMed;
      })
    );
    setDoseLogs((prev) =>
      prev.filter((l) => {
        const lName = l.medicine_name.toLowerCase().trim();
        return !(associatedReminderIds.has(l.reminder_id) || lName === medNameLower || (brandLower && lName === brandLower));
      })
    );

    try {
      const res = await fetch(`/api/cabinet/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Medicine removed', 'info');
        await Promise.all([fetchCabinet(), fetchReminders(), fetchTodayDoses()]);
        return true;
      } else {
        await Promise.all([fetchCabinet(), fetchReminders(), fetchTodayDoses()]);
        return false;
      }
    } catch (err) {
      console.error('Failed to delete medicine:', err);
      await Promise.all([fetchCabinet(), fetchReminders(), fetchTodayDoses()]);
      return false;
    }
  };

  // 3. Add Reminder
  const addReminder = async (scheduleData: any): Promise<{ success: boolean; warnings?: string[] }> => {
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast(errData.error || 'Failed to create reminder', 'error');
        return { success: false };
      }

      const data = await res.json();
      await Promise.all([fetchReminders(), fetchTodayDoses()]);
      showToast('Reminder schedule created', 'success');

      // Firestore sync if authenticated
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await addDoc(collection(db, 'schedules'), {
            userId: currentUser.uid,
            medicineId: scheduleData.medicine_name,
            timesPerDay: Number(scheduleData.doses_per_day) || 1,
            times: scheduleData.scheduled_times || ['08:00'],
            instructions: scheduleData.meal_instruction || 'after_food',
            status: 'active',
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Firestore schedule sync warning:', e);
        }
      }

      return { success: true, warnings: data.warnings };
    } catch (err: any) {
      showToast('Error saving reminder: ' + err.message, 'error');
      return { success: false };
    }
  };

  // 4. Toggle Reminder Status (Pause / Resume)
  const toggleReminderStatus = async (id: number, currentStatus?: string): Promise<boolean> => {
    const reminder = reminders.find((r) => r.id === id);
    const effectiveStatus = currentStatus || reminder?.status || 'active';
    const newStatus: 'active' | 'paused' = effectiveStatus === 'active' ? 'paused' : 'active';
    const newIsActive = newStatus === 'active';

    // Optimistic update
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus, isActive: newIsActive } : r))
    );

    if (newStatus === 'paused') {
      // Immediately stop counting towards today's expected doses
      setTodayDoses((prev) =>
        prev.filter((d) => !(d.reminder_id === id && (d.status === 'pending' || d.status === 'snoozed')))
      );
    }

    try {
      const res = await fetch(`/api/reminders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await Promise.all([fetchReminders(), fetchTodayDoses()]);
        showToast(newStatus === 'paused' ? 'Reminder paused' : 'Reminder resumed', 'info');
        return true;
      } else {
        await Promise.all([fetchReminders(), fetchTodayDoses()]);
        return false;
      }
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
      await Promise.all([fetchReminders(), fetchTodayDoses()]);
      return false;
    }
  };

  // 5. Delete Reminder
  const deleteReminder = async (id: number): Promise<boolean> => {
    // Optimistic removal
    setReminders((prev) => prev.filter((r) => r.id !== id));
    setTodayDoses((prev) => prev.filter((d) => d.reminder_id !== id));

    try {
      const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Reminder deleted', 'info');
        await Promise.all([fetchReminders(), fetchTodayDoses()]);
        return true;
      } else {
        await Promise.all([fetchReminders(), fetchTodayDoses()]);
        return false;
      }
    } catch (err) {
      console.error('Failed to delete reminder:', err);
      await Promise.all([fetchReminders(), fetchTodayDoses()]);
      return false;
    }
  };

  // 6. Record Dose Action (taken / skipped / snoozed)
  const recordDoseAction = async (
    doseId: number,
    action: 'taken' | 'skipped' | 'snoozed',
    snoozeMinutes: number = 10
  ): Promise<boolean> => {
    const nowIso = new Date().toISOString();

    // Optimistic update in both todayDoses and doseLogs
    setTodayDoses((prev) =>
      prev.map((d) =>
        d.id === doseId
          ? {
              ...d,
              status: action,
              actual_action_time: action === 'taken' ? nowIso : d.actual_action_time,
            }
          : d
      )
    );

    setDoseLogs((prev) =>
      prev.map((d) =>
        d.id === doseId
          ? {
              ...d,
              status: action,
              actual_action_time: action === 'taken' ? nowIso : d.actual_action_time,
            }
          : d
      )
    );

    try {
      const res = await fetch(`/api/doses/${doseId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, snoozeMinutes }),
      });

      if (res.ok) {
        await Promise.all([fetchTodayDoses(), fetchHistory(), fetchCabinet()]);
        if (action === 'taken') {
          showToast('Dose marked as taken', 'success');
        } else if (action === 'skipped') {
          showToast('Dose skipped', 'info');
        } else if (action === 'snoozed') {
          showToast(`Dose snoozed for ${snoozeMinutes} minutes`, 'info');
        }

        // Firestore sync if authenticated
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            await addDoc(collection(db, 'doseLogs'), {
              userId: currentUser.uid,
              medicineId: String(doseId),
              scheduledTime: nowIso,
              status: action,
              takenAt: action === 'taken' ? nowIso : null,
              createdAt: nowIso,
            });
          } catch (e) {
            console.warn('Firestore doseLogs write error:', e);
          }
        }
        return true;
      } else {
        await fetchTodayDoses();
        return false;
      }
    } catch (err) {
      console.error('Failed to record dose action:', err);
      await fetchTodayDoses();
      return false;
    }
  };

  // 7. Clear All History
  const clearAllHistory = async (): Promise<boolean> => {
    // Optimistic wipe
    setDoseLogs([]);
    setAdherenceDays([]);
    setOverallPercentage(0);
    setCurrentStreak(0);

    try {
      const res = await fetch('/api/doses/history', { method: 'DELETE' });
      if (res.ok) {
        showToast('History cleared', 'info');
        await Promise.all([fetchHistory(), fetchTodayDoses()]);
        return true;
      } else {
        await fetchHistory();
        return false;
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
      await fetchHistory();
      return false;
    }
  };

  const contextValue: MediscanContextType = {
    medicines,
    reminders,
    doseLogs,
    todayDoses: filteredTodayDoses,
    nextDose,
    summary,
    adherenceDays,
    overallPercentage,
    currentStreak,
    scanHistory,
    toasts,
    isLoading,
    showToast,
    dismissToast,
    addMedicine,
    deleteMedicine,
    addReminder,
    toggleReminderStatus,
    deleteReminder,
    recordDoseAction,
    clearAllHistory,
    refreshAll,
  };

  return <MediscanContext.Provider value={contextValue}>{children}</MediscanContext.Provider>;
};

export const useMediscan = (): MediscanContextType => {
  const context = useContext(MediscanContext);
  if (!context) {
    throw new Error('useMediscan must be used within a MediscanProvider');
  }
  return context;
};
