/**
 * Offline status banner matching web net-banner.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useT } from '../../core/i18n';
import { WifiOff } from 'lucide-react-native';

export const OfflineBanner: React.FC = () => {
  const { isOnline, colors } = useAppStore();
  const { t } = useT();

  if (isOnline) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.amber }]}>
      <WifiOff color="#FFFFFF" size={16} />
      <Text style={styles.text}>{t('offlineBanner')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
