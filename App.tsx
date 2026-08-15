/**
 * Root Application Entry for Masar RTC Mobile (org.resala.rtc.masar)
 * Features ErrorBoundary, foreground session refresh, deep-linking, and QueryClient.
 */
import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppStore } from './src/state/appStore';
import { useAuthStore } from './src/state/authStore';
import { RTCNotifications } from './src/core/native/notifications';
import { CustomButton } from './src/components/common/CustomButton';
import { supabase } from './src/data/supabaseClient';
import { RPC } from './src/data/rpc';

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
        refreshProfile();
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // 5. Setup Deep Link Handling (org.resala.rtc.masar://auth or https://...)
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      if (!url) return;

      if (url.includes('access_token') || url.includes('code=')) {
        try {
          const parsed = Linking.parse(url);
          if (parsed.queryParams?.code) {
            const { data: sessionData } = await supabase.auth.exchangeCodeForSession(parsed.queryParams.code as string);
            const userMeta = sessionData?.session?.user?.user_metadata;
            await RPC.ensureMyProfile(userMeta?.full_name || userMeta?.name || 'مستخدم مسار');
            await refreshProfile();
          } else if (url.includes('access_token')) {
            const hashPart = url.split('#')[1] || url.split('?')[1] || '';
            const params = new URLSearchParams(hashPart);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              const { data: sessionData } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              const userMeta = sessionData?.session?.user?.user_metadata;
              await RPC.ensureMyProfile(userMeta?.full_name || userMeta?.name || 'مستخدم مسار');
              await refreshProfile();
            }
          }
        } catch (e) {}
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      cleanupNet();
      sub.remove();
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
