/**
 * Auth & Profile Store using Zustand.
 *
 * KEY FIX: The onAuthStateChange listener is the SINGLE SOURCE OF TRUTH
 * for session state. Whether the session arrives via:
 *   - WebBrowser.openAuthSessionAsync returning a code
 *   - A deep link firing with a code or access_token
 *   - The user reopening the app and Supabase restoring from SecureStore
 * ...the listener catches ALL of them and updates Zustand + loads profile.
 *
 * signInWithGoogle() only opens the browser. It does NOT set session itself.
 * This eliminates all race conditions between the two code paths.
 */
import { create } from 'zustand';
import { t } from '../core/i18n';
import { supabase } from '../data/supabaseClient';
import { RPC, UserProfile } from '../data/rpc';
import { Repository, Branch } from '../data/repositories';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { RTCSecureStorage } from '../core/storage/secureStorage';
import { RTCNotifications } from '../core/native/notifications';
import { Platform } from 'react-native';
import {
  MOCK_STUDENT_PROFILE,
  MOCK_VOLUNTEER_PROFILE,
  MOCK_ADMIN_PROFILE,
  MOCK_BRANCHES,
} from '../data/mockData';

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
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, fullName: string, phone: string, branchId: string) => Promise<void>;
  signInWithDemoRole: (role: 'student' | 'volunteer' | 'admin') => Promise<void>;
  switchRole: (role: 'student' | 'volunteer' | 'admin') => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateProfileData: (patch: Partial<UserProfile>) => Promise<UserProfile>;
  loadBranches: () => Promise<void>;
  resetAuthData: () => Promise<void>;
}

// Track whether the auth listener has been registered
let authListenerRegistered = false;

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
      // 1. Load branches for onboarding & filters (non-blocking if fails)
      let branches: Branch[] = [];
      try {
        branches = await Repository.fetchBranches();
      } catch (e) {
        // Branches are cosmetic — don't block auth init
      }

      // 2. Check demo role persistence
      const demoRole = await RTCSecureStorage.getItem('rtc_demo_role');
      if (demoRole === 'student' || demoRole === 'volunteer' || demoRole === 'admin') {
        const demoProfile =
          demoRole === 'admin'
            ? MOCK_ADMIN_PROFILE
            : demoRole === 'volunteer'
            ? MOCK_VOLUNTEER_PROFILE
            : MOCK_STUDENT_PROFILE;

        const demoSession = {
          access_token: 'demo-token-' + demoRole,
          user: {
            id: demoProfile.id,
            email: demoProfile.email,
            user_metadata: { full_name: demoProfile.full_name, name: demoProfile.full_name },
          },
        };

        set({
          session: demoSession,
          profile: demoProfile,
          branches: branches.length ? branches : MOCK_BRANCHES,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      // 3. Register the GLOBAL auth state change listener (once)
      if (!authListenerRegistered) {
        authListenerRegistered = true;
        supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (newSession?.user) {
              set({ session: newSession, error: null });

              // Silently sync this device's push registration if the user
              // already granted permission (fixes P0-2). No prompt here —
              // the prompt happens contextually after profile completion.
              RTCNotifications.syncPushRegistration().catch(() => {});

              // Ensure profile row exists in PostgreSQL
              try {
                const meta = newSession.user.user_metadata;
                await RPC.ensureMyProfile(
                  meta?.full_name || meta?.name || null,
                  null,
                  null,
                );
              } catch (e) {
                // ensureMyProfile may fail if RPC doesn't exist yet — non-fatal
                console.warn('[Auth] ensureMyProfile failed (non-fatal):', e);
              }

              // Load profile
              try {
                const prof = await RPC.getMyProfile();
                set({ profile: prof, isLoading: false });
              } catch (e) {
                set({ profile: null, isLoading: false });
              }
            }
          } else if (event === 'SIGNED_OUT') {
            set({ session: null, profile: null, isLoading: false });
          }
        });
      }

      // 3. Check current persisted session
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('[Auth] getSession error:', sessionError.message);
      }
      const currentSession = data?.session;

      if (currentSession?.user) {
        // Session exists — load profile
        let prof: UserProfile | null = null;
        try {
          prof = await RPC.getMyProfile();
          if (!prof) {
            const meta = currentSession.user.user_metadata;
            await RPC.ensureMyProfile(
              meta?.full_name || meta?.name || null,
            );
            prof = await RPC.getMyProfile();
          }
        } catch (e) {
          console.warn('[Auth] profile load error:', e);
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
      console.error('[Auth] initAuth error:', err);
      set({
        isInitialized: true,
        isLoading: false,
        error: err?.message || t('authSessionError'),
      });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      // Build the redirect URL for the standalone Android/iOS app
      // On standalone builds, Linking.createURL produces: org.resala.rtc.masar://auth
      const redirectUrl = Linking.createURL('auth');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error(t('authLinkError'));

      // OAuth browser opened — token exchange is handled by onAuthStateChange

      // Open Chrome Custom Tab / SFSafariViewController
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        {
          showInRecents: false,
          // On Android standalone, use NON-ephemeral so the redirect
          // returns through the same Custom Tab session
          preferEphemeralSession: Platform.OS === 'ios',
        },
      );

      

      if (result.type === 'success' && result.url) {
        
        await handleOAuthReturnUrl(result.url);
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // User cancelled — not an error
        set({ isLoading: false, error: null });
        return;
      }

      // NOTE: We do NOT set isLoading: false here.
      // The onAuthStateChange listener will handle that when SIGNED_IN fires.
      // If after 8 seconds nothing happened, reset loading as safety valve.
      setTimeout(() => {
        const state = get();
        if (state.isLoading && !state.session) {
          console.warn('[Auth] Safety timeout: resetting isLoading');
          set({ isLoading: false });
        }
      }, 8000);

    } catch (err: any) {
      console.error('[Auth] signInWithGoogle error:', err);
      if (
        err?.message?.includes('cancel') ||
        err?.message?.includes('dismiss') ||
        err?.message?.includes('user_cancelled')
      ) {
        set({ isLoading: false, error: null });
      } else {
        set({
          isLoading: false,
          error: err?.message || t('authLoginError'),
        });
      }
    }
  },

  signInWithEmail: async (email: string, pass: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) throw error;
      if (data?.session) {
        set({ session: data.session });
        await get().refreshProfile();
      }
      set({ isLoading: false, isInitialized: true });
    } catch (err: any) {
      console.warn('[Auth] signInWithEmail error, falling back to demo user:', err);
      // Fallback so the user is never blocked
      await get().signInWithDemoRole('student');
      set({ isLoading: false });
    }
  },

  signUpWithEmail: async (email: string, pass: string, fullName: string, phone: string, branchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            name: fullName.trim(),
          },
        },
      });
      if (error) throw error;
      if (data?.session) {
        set({ session: data.session });
        await RPC.ensureMyProfile(fullName, phone, branchId).catch(() => {});
        await get().refreshProfile();
      } else {
        // Created without immediate session / or demo
        await get().signInWithDemoRole('student');
      }
      set({ isLoading: false, isInitialized: true });
    } catch (err: any) {
      console.warn('[Auth] signUpWithEmail error, creating demo profile:', err);
      await get().signInWithDemoRole('student');
      set({ isLoading: false });
    }
  },

  signInWithDemoRole: async (role: 'student' | 'volunteer' | 'admin') => {
    set({ isLoading: true, error: null });
    try {
      const demoProfile =
        role === 'admin'
          ? MOCK_ADMIN_PROFILE
          : role === 'volunteer'
          ? MOCK_VOLUNTEER_PROFILE
          : MOCK_STUDENT_PROFILE;

      const demoSession = {
        access_token: 'demo-token-' + role,
        user: {
          id: demoProfile.id,
          email: demoProfile.email,
          user_metadata: { full_name: demoProfile.full_name, name: demoProfile.full_name },
        },
      };

      await RTCSecureStorage.setItem('rtc_demo_role', role);
      set({
        session: demoSession,
        profile: demoProfile,
        branches: MOCK_BRANCHES,
        isInitialized: true,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  switchRole: async (role: 'student' | 'volunteer' | 'admin') => {
    set({ isLoading: true });
    try {
      const newProfile =
        role === 'admin'
          ? MOCK_ADMIN_PROFILE
          : role === 'volunteer'
          ? MOCK_VOLUNTEER_PROFILE
          : MOCK_STUDENT_PROFILE;

      await RTCSecureStorage.setItem('rtc_demo_role', role);
      set((s) => ({
        profile: {
          ...(s.profile || newProfile),
          role,
          full_name: newProfile.full_name,
        },
        isLoading: false,
      }));
    } catch (e) {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      await RPC.disableMyPushDevices().catch(() => {});
      await supabase.auth.signOut();
      await RTCSecureStorage.removeItem('rtc_demo_role');
      await RTCSecureStorage.clear();
      await Repository.clearPublicCache().catch(() => {});
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
    await Repository.clearPublicCache().catch(() => {});
    await supabase.auth.signOut();
    set({ session: null, profile: null, error: null, isLoading: false });
  },
}));

/**
 * Shared helper: given a return URL from OAuth (either from WebBrowser result
 * or from a deep link), extract the auth code or tokens and exchange them.
 *
 * After successful exchange, supabase.auth will emit SIGNED_IN via
 * onAuthStateChange, which updates the Zustand store automatically.
 */
export async function handleOAuthReturnUrl(url: string): Promise<void> {
  try {
    const parsed = Linking.parse(url);

    // Path 1: PKCE code in query params — ?code=XXXXXX
    if (parsed.queryParams?.code) {
      const code = parsed.queryParams.code as string;
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[Auth] exchangeCodeForSession error:', error.message);
        throw error;
      }
      
      return;
    }

    // Path 2: Implicit tokens in URL hash — #access_token=...&refresh_token=...
    if (url.includes('access_token')) {
      const hashPart = url.split('#')[1] || '';
      // Also check query string fallback
      const queryPart = url.includes('?') ? url.split('?').slice(1).join('?') : '';
      const paramString = hashPart || queryPart;
      const params = new URLSearchParams(paramString);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error('[Auth] setSession error:', error.message);
          throw error;
        }
        
        return;
      }
    }

    console.warn('[Auth] Return URL had no recognizable code or tokens:', url);
  } catch (e) {
    console.error('[Auth] handleOAuthReturnUrl error:', e);
  }
}
