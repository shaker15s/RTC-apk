/**
 * Root Application Entry for Masar RTC Mobile (org.resala.rtc.masar)
 *
 * KEY FIX: Deep link handler now uses the shared handleOAuthReturnUrl()
 * from authStore, ensuring consistent code/token exchange.
 * The onAuthStateChange listener in authStore handles all session state updates.
 */
import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppStore } from './src/state/appStore';
import { useAuthStore, handleOAuthReturnUrl } from './src/state/authStore';
import { RTCNotifications } from './src/core/native/notifications';
import { CustomButton } from './src/components/common/CustomButton';
import { supabase } from './src/data/supabaseClient';

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
          <Text style={styles.errorTitle}>حدث خطأ غير متوقع</Text>
          <Text style={styles.errorSubtitle}>
            نعتذر عن هذا الخطأ. يمكنك إعادة تشغيل التطبيق للمتابعة.
          </Text>
          <CustomButton
            title="إعادة المحاولة"
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
});

export default function App() {
  const { isDark, initNetworkListener, initPreferences } = useAppStore();
  const { refreshProfile } = useAuthStore();

  useEffect(() => {
    // 1. Initialize user theme & language preferences
    initPreferences();

    // 2. Initialize offline/online network watcher
    const cleanupNet = initNetworkListener();

    // 3. Register local notification channels
    RTCNotifications.requestPermissions();

    // 4. Foreground app state listener for token / data refresh
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // When app comes to foreground, refresh session & profile
        supabase.auth.getSession().then(({ data }) => {
          if (data?.session) {
            refreshProfile();
          }
        });
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // 5. Setup Deep Link Handling
    // This catches OAuth redirects that arrive via Android Intent filter
    // (when Chrome Custom Tab redirects to org.resala.rtc.masar://auth?code=...)
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      if (!url) return;
      console.log('[App] Deep link received:', url);

      // Only process auth-related URLs
      if (url.includes('code=') || url.includes('access_token')) {
        await handleOAuthReturnUrl(url);
      }
    };

    const linkSub = Linking.addEventListener('url', handleDeepLink);

    // Also check if the app was opened via a deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[App] Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      cleanupNet();
      linkSub.remove();
      appStateSub.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="transparent" translucent />
          <AppNavigator />
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
