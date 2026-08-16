/**
 * Standard SectionHeader Component for Masar RTC Native Mobile.
 * Unifies section titles, optional subtitle, badge count, and action CTA with haptic feedback.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { TitleMedium, Caption } from './Typography';
import { RTCHaptics } from '../../core/native/haptics';
import { Radii, Spacing, TouchTarget } from '../../core/theme/tokens';
import { ChevronLeft } from 'lucide-react-native';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actionLabel,
  onAction,
  actionIcon,
  style,
}) => {
  const colors = useAppStore((s) => s.colors);

  const handleAction = () => {
    if (onAction) {
      RTCHaptics.selection();
      onAction();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleWrap}>
        <View style={styles.titleRow}>
          <TitleMedium numberOfLines={1}>{title}</TitleMedium>
          {badge !== undefined && (
            <View style={[styles.badgePill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{badge}</Text>
            </View>
          )}
        </View>
        {subtitle ? <Caption numberOfLines={1}>{subtitle}</Caption> : null}
      </View>

      {onAction && actionLabel ? (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleAction}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>{actionLabel}</Text>
          {actionIcon || <ChevronLeft color={colors.primary} size={15} />}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: TouchTarget.minHeight,
    justifyContent: 'center',
    paddingStart: Spacing.md,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
