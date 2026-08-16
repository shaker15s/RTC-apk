/**
 * Deep Linking Configuration for Masar RTC Native Mobile.
 * Handles incoming universal links and custom schemes across Android and iOS.
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
      onboarding: 'auth',
      verify: 'verify',
      's-home': 'home',
      's-courses': 'courses',
      's-course-detail': 'course/:courseId',
      's-checkin': 'checkin',
      's-certs': 'certificates',
      's-notifications': 'notifications',
      'v-home': 'volunteer',
      'v-batches': 'batches',
      'a-home': 'admin',
    },
  },
};
