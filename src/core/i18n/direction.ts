/**
 * Layout direction (RTL/LTR) switching — v100.4.0d
 * ---------------------------------------------------------------
 * React Native reads the layout direction natively at startup, so a
 * live RTL↔LTR flip requires: forceRTL() + an app reload. Arabic is
 * RTL and English is LTR.
 *
 * Callers show a confirmation dialog first (the language switch
 * itself is instant when no direction change is needed).
 */
import { I18nManager, DevSettings } from 'react-native';
import * as Updates from 'expo-updates';
import type { LanguageKey } from './index';

/**
 * True when switching to `nextLang` would flip the layout direction
 * and therefore need an app reload.
 */
export function layoutNeedsReload(nextLang: LanguageKey): boolean {
  const wantRTL = nextLang === 'ar';
  return wantRTL !== I18nManager.isRTL;
}

/**
 * Apply the layout direction for the next app start. Persists
 * natively across reloads/restarts.
 */
export function applyLayoutDirection(nextLang: LanguageKey): void {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(nextLang === 'ar');
}

/**
 * Reload the app so the new native direction takes effect.
 * Uses expo-updates (works in production & preview builds) with a
 * DevSettings fallback for Expo Go.
 */
export function reloadApp(): void {
  Updates.reloadAsync().catch(() => {
    if (__DEV__) {
      DevSettings.reload();
    }
  });
}
