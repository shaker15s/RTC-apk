/**
 * PrimaryActionCard Component for Masar RTC Native Mobile.
 * High-emphasis action card for key user flows (e.g. Next Lecture, Start Session, Check-In).
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../state/appStore';
import { AnimatedPressable } from './AnimatedPressable';
import { Radii, Spacing, Shadows } from '../../core/theme/tokens';
import { ChevronLeft } from 'lucide-react-native';

export interface PrimaryActionCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actionLabel?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  gradientColors?: [string, string, ...string[]];
  footer?: React.ReactNode;
  style?: ViewStyle;
}

export const PrimaryActionCard: React.FC<PrimaryActionCardProps> = ({
  title,
  subtitle,
  badge,
  actionLabel,
  onPress,
  icon,
  gradientColors,
  footer,
  style,
}) => {
  const colors = useAppStore((s) => s.colors);
  const defaultGradient = colors.isDark
    ? (['#0A1D4E', '#00288E'] as [string, string])
    : (['#00288E', '#1E40AF'] as [string, string]);

  const effectiveGradient = gradientColors || defaultGradient;

  const content = (
    <LinearGradient
      colors={effectiveGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, Shadows.medium, style]}
    >
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          {badge ? (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      </View>

      {footer ? <View style={styles.footerContainer}>{footer}</View> : null}

      {actionLabel ? (
        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>{actionLabel}</Text>
          <ChevronLeft color="#FFFFFF" size={16} />
        </View>
      ) : null}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} scaleTarget={0.98}>
        {content}
      </AnimatedPressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    borderRadius: Radii.xxl,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  textContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    marginBottom: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerContainer: {
    marginTop: Spacing.xs,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
