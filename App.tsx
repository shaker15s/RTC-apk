/**
 * Root Application Entry for Masar RTC Mobile (org.resala.rtc.masar)
 *
 * v100.1.0 quality fixes:
 *  - Boot gate on appStore.prefsReady: no light-mode flash for dark users (F-16)
 *  - Notification tap handling: routes to the screen requested by the
 *    notification payload via sessionStore.pendingRoute (F-12)
 *  - Notification permission is NO LONGER requested at cold boot (U-1);
 *    it is requested contextually after profile completion.
 *  - OAuth deep links still flow through the shared handleOAuthReturnUrl().
 */
import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppStore } from './src/state/appStore';
import { useAuthStore, handleOAuthReturnUrl } from './src/state/authStore';
import { useSessionStore } from './src/state/sessionStore';
import { RTCNotifications } from './src/core/native/notifications';
import { CustomButton } from './src/components/common/CustomButton';
import { supabase } from './src/data/supabaseClient';
import { t } from './src/core/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Masar RTC:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>{t('errorTitle')}</Text>
          <Text style={styles.errorSubtitle}>
            {t('errorSubtitle')}
          </Text>
          <CustomButton
            title={t('retryCta')}
            onPress={() => this.setState({ hasError: false, error: null })}
            variant="primary"
            size="mid"
            style={{ marginTop: 16 }}
          />
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { isDark, prefsReady, initNetworkListener, initPreferences } = useAppStore();
  const { refreshProfile, initAuth } = useAuthStore();

  useEffect(() => {
    // 1. Initialize user theme & language preferences
    initPreferences();

    // 2. Initialize auth state & persisted session
    initAuth();

    // 3. Initialize offline/online network watcher (real NetInfo — P0-3)
    const cleanupNet = initNetworkListener();

    // 3. Foreground app state listener for token / data refresh
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // When app comes to foreground, refresh session & profile
        supabase.auth.getSession().then(({ data }) => {
          if (data?.session) {
            refreshProfile();
            // Retry silent push registration
            RTCNotifications.syncPushRegistration().catch(() => {});
          }
        });

        // Silent background OTA updates check
        if (!__DEV__) {
          try {
            const Updates = require('expo-updates');
            if (Updates && Updates.checkForUpdateAsync) {
              Updates.checkForUpdateAsync().then((res: any) => {
                if (res?.isAvailable && Updates.fetchUpdateAsync) {
                  Updates.fetchUpdateAsync().catch(() => {});
                }
              }).catch(() => {});
            }
          } catch (err) {}
        }
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // 4. Setup Deep Link Handling
    // This catches OAuth redirects that arrive via Android Intent filter
    // (when Chrome Custom Tab redirects to org.resala.rtc.masar://auth?code=...)
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      if (!url) return;

      // Only process auth-related URLs
      if (url.includes('code=') || url.includes('access_token')) {
        await handleOAuthReturnUrl(url);
      }
    };

    const linkSub = Linking.addEventListener('url', handleDeepLink);

    // Also check if the app was opened via a deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // 5. Automatic OTA Update check — download silently, apply on next restart
    // NOTE: Do NOT call reloadAsync() here — it would restart the app every time it opens!
    // The update applies automatically via the fallbackToCacheTimeout: 0 in app.json.
    if (!__DEV__) {
      import('expo-updates')
        .then(async (Updates) => {
          try {
            const check = await Updates.checkForUpdateAsync();
            if (check.isAvailable) {
              await Updates.fetchUpdateAsync();
              try {
                useAppStore.getState().showToast(t('updateReadyToast'), 'info');
              } catch {
                // toast store may not be ready
              }
            }
          } catch (e) {
            // Non-blocking if offline or in expo go
          }
        })
        .catch(() => {});
    }

    return () => {
      cleanupNet();
      linkSub.remove();
      appStateSub.remove();
    };
  }, []);

  // 5. Notification tap routing (fixes F-12). Native module can be
  //    missing after a bad OTA — never crash the whole app.
  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    try {
      const routeFromPayload = (payload: any) => {
        const screen = payload?.request?.content?.data?.screen;
        if (screen && typeof screen === 'string') {
          useSessionStore.getState().setPendingRoute(screen);
        }
      };

      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        routeFromPayload(response?.notification);
      });

      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) routeFromPayload(response.notification);
        })
        .catch(() => {});
    } catch {
      // Expo Go / outdated native binary — ignore
    }

    return () => {
      try {
        sub?.remove();
      } catch {
        // ignore
      }
    };
  }, []);

  // Gate rendering until preferences are loaded so dark-mode users
  // never see a light flash (F-16).
  if (!prefsReady) {
    return (
      <View style={styles.bootContainer}>
        <StatusBar style="light" />
        <ActivityIndicator color="#89F5E7" size="small" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="transparent" translucent />
        <AppNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    backgroundColor: '#001A6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#070B16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#9AA8C3',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});
