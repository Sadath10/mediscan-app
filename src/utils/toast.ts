export type ToastType = 'success' | 'info' | 'warning' | 'error';

/**
 * Global decoupled toast dispatcher for Mediscan
 * Dispatches window event consumed by MediscanContext and UI components
 */
export const toast = {
  success: (message: string) => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('mediscan:toast', { detail: { message, type: 'success' } })
        );
      } catch {}
    }
  },
  error: (message: string) => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('mediscan:toast', { detail: { message, type: 'error' } })
        );
      } catch {}
    }
  },
  info: (message: string) => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('mediscan:toast', { detail: { message, type: 'info' } })
        );
      } catch {}
    }
  },
  warning: (message: string) => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('mediscan:toast', { detail: { message, type: 'warning' } })
        );
      } catch {}
    }
  },
};
