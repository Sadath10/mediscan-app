import { playReminderChime } from './audio.js';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface DueNotificationPayload {
  doseLogId: number;
  reminderId: number;
  medicineName: string;
  quantity: number;
  unit: string;
  scheduledTime: string;
  mealInstructionEn: string;
  mealInstructionKn?: string;
  soundPreference: string;
  vibrationEnabled: boolean;
}

let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
const notifiedDoseIds = new Set<number>();

/**
 * Register Service Worker for PWA and notification display
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      serviceWorkerRegistration = reg;
      return reg;
    } catch (err) {
      console.warn('Service Worker registration skipped:', err);
    }
  }
  return null;
}

/**
 * Requests notification permission (Capacitor native or browser)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  try {
    const res = await LocalNotifications.requestPermissions();
    if (res.display === 'granted') return 'granted';
    if (res.display === 'denied') return 'denied';
  } catch {
    // fallback to browser Notification API
  }

  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

/**
 * Dispatches an actual notification (via Capacitor LocalNotifications or ServiceWorker or window.Notification)
 */
export async function dispatchNotification(
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  // First try Capacitor native notification
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Math.floor(Math.random() * 90000) + 10000,
          schedule: { at: new Date(Date.now() + 100) },
          sound: undefined,
          actionTypeId: '',
          extra: data || {},
        },
      ],
    });
    return true;
  } catch (nativeErr) {
    // Fallback to web browser notification
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions = {
    body,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: `mediscan-${data?.doseLogId || Date.now()}`,
    data,
    requireInteraction: true,
  };

  try {
    if (serviceWorkerRegistration && 'showNotification' in serviceWorkerRegistration) {
      await serviceWorkerRegistration.showNotification(title, options);
      return true;
    } else {
      new Notification(title, options);
      return true;
    }
  } catch (err) {
    console.warn('Direct notification failed, trying fallback:', err);
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Polls backend for due notifications
 */
export async function pollDueNotifications(
  onNotificationReceived: (item: DueNotificationPayload) => void,
  lang: 'en' | 'kn' = 'en'
): Promise<void> {
  try {
    const res = await fetch('/api/notifications/poll');
    if (!res.ok) return;

    const data = await res.json();
    if (!data.notifications || !Array.isArray(data.notifications)) return;

    for (const item of (data.notifications as DueNotificationPayload[])) {
      if (notifiedDoseIds.has(item.doseLogId)) {
        continue;
      }
      notifiedDoseIds.add(item.doseLogId);

      // Play chime
      playReminderChime(item.soundPreference || 'chime');

      // Trigger mobile haptic vibration pulse if supported and enabled
      if (item.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([300, 150, 300, 150, 500]);
      }

      // Build bilingual notification copy
      const title = lang === 'kn'
        ? `ಮೆಡಿಸ್ಕ್ಯಾನ್: ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ!`
        : `Mediscan: Time for ${item.medicineName}`;

      const mealText = lang === 'kn'
        ? (item.mealInstructionKn || 'ಊಟದ ನಂತರ')
        : (item.mealInstructionEn === 'before_food' ? 'Before food' : item.mealInstructionEn === 'after_food' ? 'After food' : 'With food');

      const body = lang === 'kn'
        ? `ದಯವಿಟ್ಟು ${item.quantity} ${item.unit} ${item.medicineName} (${mealText}) ತೆಗೆದುಕೊಳ್ಳಿ. ಸಮಯ: ${item.scheduledTime}`
        : `Please take ${item.quantity} ${item.unit} of ${item.medicineName} (${mealText}). Scheduled: ${item.scheduledTime}`;

      // Dispatch to OS notification center
      dispatchNotification(title, body, { doseLogId: item.doseLogId });

      // Notify backend that notification was delivered
      fetch('/api/notifications/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doseLogId: item.doseLogId,
          reminderId: item.reminderId,
          channel: 'browser',
        }),
      }).catch(() => {});

      // Trigger in-app UI modal
      onNotificationReceived(item);
    }
  } catch (err) {
    console.warn('Poll due notifications error:', err);
  }
}
