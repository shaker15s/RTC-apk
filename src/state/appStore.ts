/**
 * Application global UI state (Theme, Language, Network, Toasts).
 */
import { create } from 'zustand';
import { LightColors, DarkColors, ThemeColors } from '../core/theme/tokens';
import { LanguageKey, setLanguage as setI18nLanguage } from '../core/i18n';
import { RTCSecureStorage } from '../core/storage/secureStorage';

export interface ToastItem {
  id: string;
  message: string;
  type: 'ok' | 'err' | 'warn' | 'info';
  icon?: string;
}

interface AppState {
  isDark: boolean;
  colors: ThemeColors;
  language: LanguageKey;
  isOnline: boolean;
  toasts: ToastItem[];
  unreadNotificationsCount: number;

  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
  setAppLanguage: (lang: LanguageKey) => void;
  setOnlineStatus: (status: boolean) => void;
  showToast: (message: string, type?: 'ok' | 'err' | 'warn' | 'info', icon?: string) => void;
  hideToast: (id: string) => void;
  incrementUnread: () => void;
  resetUnread: () => void;
  initPreferences: () => Promise<void>;
  initNetworkListener: () => () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isDark: false,
  colors: LightColors,
  language: 'ar',
  isOnline: true,
  toasts: [],
  unreadNotificationsCount: 0,

  setDarkMode: (isDark: boolean) => {
    set({ isDark, colors: isDark ? DarkColors : LightColors });
    RTCSecureStorage.setItem('rtc_dark_mode', JSON.stringify(isDark));
  },

  toggleDarkMode: () => {
    const next = !get().isDark;
    get().setDarkMode(next);
  },

  setAppLanguage: (lang: LanguageKey) => {
    setI18nLanguage(lang);
    set({ language: lang });
    RTCSecureStorage.setItem('rtc_pref_lang', JSON.stringify(lang));
  },

  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline });
  },

  incrementUnread: () => {
    set((s) => ({ unreadNotificationsCount: s.unreadNotificationsCount + 1 }));
  },

  resetUnread: () => {
    set({ unreadNotificationsCount: 0 });
  },

  showToast: (message: string, type: 'ok' | 'err' | 'warn' | 'info' = 'ok', icon?: string) => {
    const id = Date.now().toString() + Math.random().toString();
    const item: ToastItem = { id, message, type, icon };
    set((state) => ({ toasts: [...state.toasts, item] }));

    setTimeout(() => {
      get().hideToast(id);
    }, 4000);
  },

  hideToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  initNetworkListener: () => {
    // Basic connectivity polling / fallback watcher
    const interval = setInterval(() => {
      // Keep online by default or integrate NetInfo if installed
    }, 30000);

    return () => clearInterval(interval);
  },

  initPreferences: async () => {
    try {
      const darkPref = await RTCSecureStorage.getItem('rtc_dark_mode');
      if (darkPref !== null) {
        const isDark = JSON.parse(darkPref);
        set({ isDark, colors: isDark ? DarkColors : LightColors });
      }

      const langPref = await RTCSecureStorage.getItem('rtc_pref_lang');
      if (langPref !== null) {
        const lang = JSON.parse(langPref);
        setI18nLanguage(lang);
        set({ language: lang });
      }
    } catch (e) {}
  },
}));

