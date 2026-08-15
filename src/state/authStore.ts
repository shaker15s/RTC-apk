/**
 * Auth & Profile Store using Zustand.
 */
import { create } from 'zustand';
import { supabase } from '../data/supabaseClient';
import { RPC, UserProfile } from '../data/rpc';
import { Repository, Branch } from '../data/repositories';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { RTC_CONFIG } from '../core/config';
import { RTCSecureStorage } from '../core/storage/secureStorage';

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  session: any | null;
  profile: UserProfile | null;
  branches: Branch[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateProfileData: (patch: Partial<UserProfile>) => Promise<UserProfile>;
  loadBranches: () => Promise<void>;
  resetAuthData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  branches: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  initAuth: async () => {
    set({ isLoading: true });
    try {
      // 1. Load branches for onboarding & filters
      const branches = await Repository.fetchBranches();

      // 2. Check current session
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;

      if (currentSession?.user) {
        let prof = await RPC.getMyProfile();
        if (!prof) {
          await RPC.ensureMyProfile();
          prof = await RPC.getMyProfile();
        }
        set({
          session: currentSession,
          profile: prof,
          branches,
          isInitialized: true,
          isLoading: false,
        });
      } else {
        set({
          session: null,
          profile: null,
          branches,
          isInitialized: true,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({
        isInitialized: true,
        isLoading: false,
        error: err?.message || 'تعذر تحميل بيانات الجلسة',
      });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const redirectUrl = Linking.createURL('auth');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account', access_type: 'offline' },
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('تعذر توليد رابط المصادقة');

      // Open in secure system browser custom tab (ephemeral and seamless)
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl, {
        showInRecents: false,
        preferEphemeralSession: true,
      });

      if (result.type === 'success' && result.url) {
        const returnUrl = result.url;
        const parsed = Linking.parse(returnUrl);

        // 1. Check PKCE Authorization Code in queryParams
        if (parsed.queryParams?.code) {
          const code = parsed.queryParams.code as string;
          const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;

          set({ session: sessionData.session });
          
          // Ensure profile exists in PostgreSQL database for new user
          const userMeta = sessionData.session?.user?.user_metadata;
          await RPC.ensureMyProfile(userMeta?.full_name || userMeta?.name || 'مستخدم مسار');
          await get().refreshProfile();
        } 
        // 2. Check Implicit / Hash tokens in URL fragment
        else if (returnUrl.includes('#') || returnUrl.includes('access_token')) {
          const hashPart = returnUrl.split('#')[1] || returnUrl.split('?')[1] || '';
          const params = new URLSearchParams(hashPart);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setSessionError) throw setSessionError;

            set({ session: sessionData.session });
            
            // Ensure profile exists in PostgreSQL database for new user
            const userMeta = sessionData.session?.user?.user_metadata;
            await RPC.ensureMyProfile(userMeta?.full_name || userMeta?.name || 'مستخدم مسار');
            await get().refreshProfile();
          }
        }
      }
      set({ isLoading: false });
    } catch (err: any) {
      if (err?.message?.includes('cancel') || err?.message?.includes('dismiss')) {
        set({ isLoading: false, error: null });
      } else {
        set({ isLoading: false, error: err?.message || 'فشل تسجيل الدخول باستخدام Google' });
      }
    }
  },

  signOut: async () => {
    try {
      await RPC.disableMyPushDevices();
      await supabase.auth.signOut();
      await RTCSecureStorage.clear();
      set({ session: null, profile: null });
    } catch (e) {
      set({ session: null, profile: null });
    }
  },

  refreshProfile: async () => {
    try {
      const prof = await RPC.getMyProfile();
      set({ profile: prof });
      return prof;
    } catch (e) {
      return null;
    }
  },

  updateProfileData: async (patch: Partial<UserProfile>) => {
    set({ isLoading: true });
    try {
      const updated = await Repository.updateProfile(patch);
      set({ profile: updated, isLoading: false });
      return updated;
    } catch (e: any) {
      set({ isLoading: false, error: e?.message });
      throw e;
    }
  },

  loadBranches: async () => {
    try {
      const branches = await Repository.fetchBranches(true);
      set({ branches });
    } catch (e) {}
  },

  resetAuthData: async () => {
    await RTCSecureStorage.clear();
    await supabase.auth.signOut();
    set({ session: null, profile: null, error: null });
  },
}));
