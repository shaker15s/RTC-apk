/**
 * Standard MetricCard Component for Masar RTC Native Mobile.
 * Visual stat card with animated numeric values, icon badges, and micro-haptics.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { AnimatedNumber } from './AnimatedNumber';
import { AnimatedPressable } from './AnimatedPressable';
import { Caption, TitleMedium } from './Typography';
import { Radii, Spacing, Shadows } from '../../core/theme/tokens';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

export interface MetricCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  icon?: React.ReactNode;
  color?: string;
  prefix?: string;
  suffix?: string;
  trend?: { value: string; isPositive?: boolean };
  onPress?: () => void;
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  color,
  prefix = '',
  suffix = '',
  trend,
  onPress,
  style,
}) => {
  const colors = useAppStore((s) => s.colors);
  const tintColor = color || colors.primary;

  const content = (
    <View
      style={[
        styles.card,
        Shadows.soft,
        {
          backgroundColor: colors.card,
          borderColor: colors.line,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <Caption numberOfLines={1} style={styles.label}>{label}</Caption>
        {icon && <View style={[styles.iconWrap, { backgroundColor: tintColor + '18' }]}>{icon}</View>}
      </View>

      <View style={styles.valueRow}>
        {typeof value === 'number' ? (
          <AnimatedNumber
            value={value}
            prefix={prefix}
            suffix={suffix}
            style={[styles.numericValue, { color: tintColor }]}
          />
        ) : (
          <Text style={[styles.numericValue, { color: tintColor }]} numberOfLines={1}>
            {prefix}{value}{suffix}
          </Text>
        )}

        {trend && (
          <View
            style={[
              styles.trendPill,
              {
                backgroundColor: trend.isPositive ? colors.greenSoft : colors.redSoft,
              },
            ]}
          >
            {trend.isPositive ? (
              <TrendingUp color={colors.green} size={12} />
            ) : (
              <TrendingDown color={colors.red} size={12} />
            )}
            <Text
              style={[
                styles.trendText,
                { color: trend.isPositive ? colors.green : colors.red },
              ]}
            >
              {trend.value}
            </Text>
          </View>
        )}
      </View>

      {sublabel ? <Caption numberOfLines={1} style={styles.sublabel}>{sublabel}</Caption> : null}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} scaleTarget={0.97}>
        {content}
      </AnimatedPressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    gap: Spacing.xs,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: '700',
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  numericValue: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sublabel: {
    marginTop: 2,
  },
});
