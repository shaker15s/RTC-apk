/**
 * Internationalization (i18n) Engine for Masar RTC Native Mobile.
 *
 * Supports Arabic (RTL, default) and English (LTR).
 * Modular architecture importing dictionary from ./locales/ar and ./locales/en.
 */

import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ar } from './locales/ar';
import { en } from './locales/en';

export type Language = 'ar' | 'en';
export type LanguageKey = Language;

export const STRINGS = {
  ar,
  en,
};

export type I18nKey = keyof typeof STRINGS.ar;

const LANG_KEY = 'masar_language_pref';
let currentLanguage: Language = 'ar';
const listeners = new Set<(lang: Language) => void>();

export function getLanguage(): Language {
  return currentLanguage;
}

export function subscribeLanguage(listener: (lang: Language) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function initLanguage(): Promise<Language> {
  try {
    const saved = await SecureStore.getItemAsync(LANG_KEY);
    if (saved === 'ar' || saved === 'en') {
      currentLanguage = saved;
    }
  } catch {
    // fallback to Arabic
    currentLanguage = 'ar';
  }
  return currentLanguage;
}

export async function setLanguage(lang: Language, persist = true): Promise<void> {
  if (currentLanguage === lang) return;
  currentLanguage = lang;
  if (persist) {
    try {
      await SecureStore.setItemAsync(LANG_KEY, lang);
    } catch {
      // ignore storage failure
    }
  }
  listeners.forEach((l) => l(lang));
}

/**
 * Translate a key with optional interpolation parameters.
 * E.g. t('welcomeBack') or t('pointsToNext', { p: 20, n: 100 })
 */
export function t(key: I18nKey, params?: Record<string, string | number>): string {
  const dict = STRINGS[currentLanguage] ?? STRINGS.ar;
  let text = (dict as Record<string, string>)[key] ?? (STRINGS.ar as Record<string, string>)[key] ?? String(key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

/**
 * React hook that subscribes to language changes and re-renders when the language changes.
 */
export function useT(): { t: (key: I18nKey, params?: Record<string, string | number>) => string; lang: Language } {
  const [lang, setLang] = useState<Language>(currentLanguage);
  useEffect(() => {
    return subscribeLanguage((newLang) => setLang(newLang));
  }, []);
  return {
    t: (key: I18nKey, params?: Record<string, string | number>) => t(key, params),
    lang,
  };
}

export function dateLocale(): string {
  return currentLanguage === 'ar' ? 'ar-EG' : 'en-US';
}

export function numberLocale(): string {
  return currentLanguage === 'ar' ? 'ar-EG' : 'en-US';
}

export function formatDateLocale(isoDate: string | null | undefined, fallback = ''): string {
  if (!isoDate) return fallback;
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString(dateLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return fallback;
  }
}
