/**
 * Custom Card Component with theme surface tokens and rounded corners.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Radii, Shadows } from '../../core/theme/tokens';

export interface CustomCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'elevated' | 'flat';
}

export const CustomCard: React.FC<CustomCardProps> = ({ children, style, variant = 'elevated' }) => {
  const { colors, isDark } = useAppStore();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.card : colors.card,
          borderColor: colors.line,
          borderWidth: 1,
        },
        variant === 'elevated' && (isDark ? Shadows.medium : Shadows.soft),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    padding: 16,
    overflow: 'hidden',
  },
});
