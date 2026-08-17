/**
 * Master Typed Navigation Contracts for Masar RTC Native Mobile.
 * Encapsulates all 37 screen routes with strict parameter types for complete TypeScript safety.
 */
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  // Public Routes
  splash: undefined;
  onboarding: undefined;
  verify: { serial?: string } | undefined;
  changelog: undefined;
  support: undefined;

  // Student Routes
  's-home': undefined;
  's-courses': undefined;
  's-course-detail': { courseId: string };
  's-course-rating': { courseId: string; courseTitle?: string };
  's-points': undefined;
  's-ledger': undefined;
  's-certs': undefined;
  's-profile': undefined;
  's-edit-profile': undefined;
  's-explore': undefined;
  's-notifications': undefined;
  's-checkin': { code?: string } | undefined;
  's-excuse': undefined;
  's-attendance': undefined;
  's-leaderboard': undefined;
  's-analytics': undefined;

  // Volunteer / Instructor Routes
  'v-home': undefined;
  'v-batches': { selectedBatchId?: string } | undefined;
  'v-attendance': { sessionId?: string; batchId?: string } | undefined;
  'v-courses': undefined;
  'v-excuses': undefined;
  'v-profile': undefined;
  'v-report': { sessionId?: string; sessionTitle?: string } | undefined;

  // Admin Routes
  'a-home': undefined;
  'a-users': { initialRole?: 'all' | 'student' | 'volunteer' | 'admin' } | undefined;
  'a-courses': undefined;
  'a-certs': undefined;
  'a-settings': undefined;
  'a-branches': undefined;
  'a-committees': undefined;
  'a-broadcast': undefined;
  'a-analytics': undefined;
};

// Generic helper types for screens
export type AppNavigationProp<RouteName extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, RouteName>;

export type AppRouteProp<RouteName extends keyof RootStackParamList> =
  RouteProp<RootStackParamList, RouteName>;

export type AppScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;

// Screen ID union type
export type ScreenId = keyof RootStackParamList;
