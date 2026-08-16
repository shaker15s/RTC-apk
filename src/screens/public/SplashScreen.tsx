/**
 * Splash Screen with gradient identity and animated loader.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useT } from '../../core/i18n';
import { useAuthStore } from '../../state/authStore';

export interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const { t } = useT();

  useEffect(() => {
    // Finish as soon as auth init resolves — no fixed 1.8s wait (U-4).
    if (isInitialized) {
      onFinish?.();
      return;
    }
    // Safety cap: never strand the user on the splash if auth hangs.
    const timer = setTimeout(() => {
      useAuthStore.setState({ isInitialized: true, isLoading: false });
      onFinish?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isInitialized, onFinish]);

  return (
    <LinearGradient colors={['#001A6B', '#00288E', '#003C36']} style={styles.container}>
      <View style={styles.logoCard}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
        />
      </View>
      <Text style={styles.appName}>{t('appName')}</Text>
      <Text style={styles.tagline}>{t('tagline')}</Text>
      <Text style={styles.org}>{t('org')}</Text>

      <View style={styles.badgePill}>
        <Text style={styles.badgeText}>✨ تحديث مباشر — v100.4.0 (Live OTA)</Text>
      </View>

      <View style={styles.loaderWrap}>
        <ActivityIndicator color="#89F5E7" size="small" />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoCard: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  org: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  loaderWrap: {
    marginTop: 24,
  },
  badgePill: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(137, 245, 231, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(137, 245, 231, 0.4)',
  },
  badgeText: {
    color: '#89F5E7',
    fontSize: 11,
    fontWeight: '700',
  },
});
