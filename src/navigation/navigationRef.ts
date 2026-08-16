/**
 * Navigation reference for imperative navigation from outside React
 * components (notification taps, deep links, tab bar).
 */
import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export type RootParamList = RootStackParamList;

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate to a screen from anywhere in the app (guarded at call sites).
 */
export function navigateFromOutside<K extends keyof RootStackParamList>(
  screenId: K,
  params?: RootStackParamList[K]
) {
  if (navigationRef.isReady()) {
    // @ts-ignore — params shapes vary per screen and are validated upstream
    navigationRef.navigate(screenId as never, params as never);
  }
}
