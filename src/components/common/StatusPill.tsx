/**
 * Standard StatusPill Component for Masar RTC Native Mobile.
 * Semantic status indicators with high contrast (WCAG AA) and optional micro-icons.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Radii, Spacing } from '../../core/theme/tokens';
import { CheckCircle2, Clock, AlertCircle, ShieldCheck, XCircle, Info } from 'lucide-react-native';

export type StatusVariant =
  | 'active'
  | 'enrolled'
  | 'present'
  | 'completed'
  | 'pending'
  | 'waitlist'
  | 'late'
  | 'absent'
  | 'rejected'
  | 'excused'
  | 'neutral'
  | 'urgent';

export interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = 'neutral',
  showIcon = true,
  size = 'md',
  style,
}) => {
  const colors = useAppStore((s) => s.colors);

  const getStyleProps = () => {
    switch (variant) {
      case 'active':
      case 'enrolled':
      case 'present':
        return {
          bg: colors.greenSoft,
          textColor: colors.green,
          borderColor: colors.green + '40',
          Icon: CheckCircle2,
        };
      case 'completed':
        return {
          bg: colors.primarySoft,
          textColor: colors.primary,
          borderColor: colors.primary + '40',
          Icon: ShieldCheck,
        };
      case 'pending':
      case 'waitlist':
      case 'late':
        return {
          bg: colors.amberSoft,
          textColor: colors.amber,
          borderColor: colors.amber + '40',
          Icon: Clock,
        };
      case 'absent':
      case 'rejected':
      case 'urgent':
        return {
          bg: colors.redSoft,
          textColor: colors.red,
          borderColor: colors.red + '40',
          Icon: AlertCircle,
        };
      case 'excused':
      case 'neutral':
      default:
        return {
          bg: colors.card2,
          textColor: colors.mut,
          borderColor: colors.line,
          Icon: Info,
        };
    }
  };

  const { bg, textColor, borderColor, Icon } = getStyleProps();

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const iconSize = isSmall ? 11 : isLarge ? 16 : 13;

  return (
    <View
      accessibilityRole="text"
      style={[
        styles.pill,
        {
          backgroundColor: bg,
          borderColor,
          paddingVertical: isSmall ? 2 : isLarge ? 6 : 4,
          paddingHorizontal: isSmall ? 6 : isLarge ? 12 : 8,
        },
        style,
      ]}
    >
      {showIcon && <Icon color={textColor} size={iconSize} />}
      <Text
        style={[
          styles.label,
          {
            color: textColor,
            fontSize: isSmall ? 10.5 : isLarge ? 13.5 : 12,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '700',
  },
});
