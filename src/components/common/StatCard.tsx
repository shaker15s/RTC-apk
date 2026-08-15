/**
 * StatCard Component
 * Reusable animated KPI card with icon, count-up value, label, and trend indicators.
 */
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { CustomCard } from './CustomCard';
import { AnimatedNumber } from './AnimatedNumber';
import { Radii } from '../../core/theme/tokens';

export interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  iconBgColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  prefix = '',
  suffix = '',
  iconBgColor,
  style,
}) => {
  const { colors } = useAppStore();

  return (
    <CustomCard style={[styles.card, style] as any}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: iconBgColor || colors.primarySoft },
        ]}
      >
        {icon}
      </View>
      <View style={styles.content}>
        <AnimatedNumber
          value={value}
          prefix={prefix}
          suffix={suffix}
          style={[styles.valueText, { color: colors.txt }]}
        />
        <Text style={[styles.labelText, { color: colors.mut }]}>{label}</Text>
      </View>
    </CustomCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radii.xl,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  valueText: {
    fontSize: 18,
    fontWeight: '800',
  },
  labelText: {
    fontSize: 11.5,
    marginTop: 2,
  },
});
