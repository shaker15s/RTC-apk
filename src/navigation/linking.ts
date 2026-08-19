/**
 * Deep Linking Configuration for Masar RTC Native Mobile.
 * Handles incoming universal links and custom schemes across Android and iOS.
 * ---------------------------------------------------------------
 * Screens marked with `?` have optional params; others are required.
 * verify screen carries serial? param for certification verification.
 * All screen prefixes map to deep link schema for cross-platform routing.
 */
import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    Linking.createURL('/'),
    'org.resala.rtc.masar://',
    'https://rtc-kohl.vercel.app',
  ],
  config: {
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
