import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { RootStackParamList } from './types';

/**
 * Returns true if the URL is an OAuth callback that should NOT be
 * handled by React Navigation's deep-link router.
 */
function isOAuthCallback(url: string | null): boolean {
  if (!url) return false;
  return url.includes('code=') || url.includes('access_token') || url.includes('error=');
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    ...(Platform.OS === 'web' && typeof window !== 'undefined'
      ? [window.location.origin, 'https://rtc-kohl.vercel.app']
      : [Linking.createURL('/'), 'org.resala.rtc.masar://', 'https://rtc-kohl.vercel.app']),
  ],

  // Override getInitialURL to intercept OAuth callbacks before
  // React Navigation tries to resolve them as screen routes.
  async getInitialURL(): Promise<string | null> {
    // On web, check the browser URL
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const href = window.location.href;
      if (isOAuthCallback(href)) return null;
      const url = new URL(href);
      // If path is root or empty, don't trigger deep link
      if (url.pathname === '/' || url.pathname === '') return null;
      return href;
    }
    // On native, use Linking
    const url = await Linking.getInitialURL();
    if (isOAuthCallback(url)) return null;
    return url;
  },

  // Override subscribe to filter out OAuth deep links on native
  subscribe(listener: (url: string) => void) {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (!isOAuthCallback(url)) {
        listener(url);
      }
    });
    return () => sub.remove();
  },

  config: {
    initialRouteName: 'onboarding',
    screens: {
      // Public screens
      onboarding: '',
      verify: {
        path: 'verify',
        parse: {
          serial: (serial: string) => serial,
        },
      },
      changelog: 'changelog',
      support: 'support',

      // Student screens
      's-home': 'home',
      's-courses': 'courses',
      's-course-detail': 'course/:courseId',
      's-course-rating': 'course-rating/:courseId',
      's-points': 'points',
      's-ledger': 'ledger',
      's-certs': 'certificates',
      's-profile': 'profile',
      's-edit-profile': 'profile/edit',
      's-explore': 'explore',
      's-notifications': 'notifications',
      's-checkin': 'checkin',
      's-excuse': 'excuse',
      's-attendance': 'attendance',
      's-leaderboard': 'leaderboard',

      // Volunteer screens
      'v-home': 'volunteer',
      'v-batches': 'batches',
      'v-attendance': 'attendance',
      'v-courses': 'courses',
      'v-excuses': 'excuses',
      'v-profile': 'profile',
      'v-report': 'report',

      // Admin screens
      'a-home': 'admin',
      'a-users': 'admin/users',
      'a-courses': 'admin/courses',
      'a-certs': 'admin/certificates',
      'a-settings': 'admin/settings',
      'a-branches': 'admin/branches',
      'a-committees': 'admin/committees',
      'a-broadcast': 'admin/broadcast',
      'a-analytics': 'admin/analytics',
    },
  },
};
