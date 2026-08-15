/**
 * Splash Screen with gradient identity and animated loader.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={['#001A6B', '#00288E', '#003C36']} style={styles.container}>
      <View style={styles.logoCard}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
        />
      </View>
      <Text style={styles.appName}>مسار RTC</Text>
      <Text style={styles.tagline}>نتابع رحلتك خطوة بخطوة</Text>
      <Text style={styles.org}>جمعية رسالة — مركز التدريب والتطوير</Text>

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
    marginTop: 36,
  },
});
