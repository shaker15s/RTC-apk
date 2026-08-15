/**
 * Navigation reference for imperative navigation from outside React
 * components (notification taps, deep links, tab bar).
 */
import { createNavigationContainerRef } from '@react-navigation/native';

// All registered screen names + their route params (loose by design:
// most screens take none, a few take ids).
export type RootParamList = Record<string, object | undefined> & {
  's-course-detail': { courseId?: string };
  's-course-rating': { courseId?: string; courseTitle?: string };
  'v-batches': { selectedBatchId?: string };
  'v-attendance': { sessionId?: string; batchId?: string };
  'v-report': { sessionId?: string; sessionTitle?: string };
  verify: { serial?: string };
};

export const navigationRef = createNavigationContainerRef<RootParamList>();

/**
 * Navigate to a screen from anywhere in the app (guarded at call sites).
 */
export function navigateFromOutside<K extends keyof RootParamList>(
  screenId: K,
  params?: RootParamList[K]
) {
  if (navigationRef.isReady()) {
    // @ts-ignore — params shapes vary per screen and are validated upstream
    navigationRef.navigate(screenId as never, params as never);
  }
}
