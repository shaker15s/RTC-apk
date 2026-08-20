/**
 * Supabase client instance with encrypted Keychain/Keystore session storage and PKCE flow.
 */
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { RTC_CONFIG } from '../core/config';
import { RTCSecureStorage } from '../core/storage/secureStorage';

export const supabase = createClient(RTC_CONFIG.supabaseUrl, RTC_CONFIG.supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: RTCSecureStorage,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});
