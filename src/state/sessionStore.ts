/**
 * Global Session State Store (fixes P1-5 / P0-5)
 * ---------------------------------------------------------------
 * The volunteer's live session (id + checkin_code) used to live in
 * local component state, so it was destroyed every time the custom
 * navigator unmounted the screen (e.g. after manual attendance).
 *
 * Now it lives here (Zustand = survives navigation) and is persisted
 * to SecureStore so it survives app restarts too. It is also
 * re-synced from the backend via RPC.getActiveSession() when
 * available, so it stays truthful even on other devices.
 *
 * Also holds the pending deep-link/notification target screen.
 */
import { create } from 'zustand';
import { RTCSecureStorage } from '../core/storage/secureStorage';

export interface ActiveSession {
  id: string;
  batchId: string;
  checkinCode: string;
  title: string;
  startedAt: number;
}

interface SessionState {
  activeSession: ActiveSession | null;
  pendingRoute: string | null;
  setActiveSession: (session: ActiveSession | null) => void;
  clearActiveSession: () => void;
  setPendingRoute: (route: string | null) => void;
  restoreActiveSession: () => Promise<void>;
}

const SESSION_KEY = 'rtc_active_session';

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  pendingRoute: null,

  setActiveSession: (session) => {
    set({ activeSession: session });
    if (session) {
      RTCSecureStorage.setItem(SESSION_KEY, JSON.stringify(session)).catch(() => {});
    } else {
      RTCSecureStorage.removeItem(SESSION_KEY).catch(() => {});
    }
  },

  clearActiveSession: () => {
    set({ activeSession: null });
    RTCSecureStorage.removeItem(SESSION_KEY).catch(() => {});
  },

  setPendingRoute: (route) => set({ pendingRoute: route }),

  restoreActiveSession: async () => {
    try {
      const raw = await RTCSecureStorage.getItem(SESSION_KEY);
      if (raw && raw !== 'null') {
        const parsed = JSON.parse(raw) as ActiveSession;
        if (parsed?.id && parsed?.batchId) {
          set({ activeSession: parsed });
        }
      }
    } catch (e) {
      // ignore corrupted persisted session
    }
  },
}));
