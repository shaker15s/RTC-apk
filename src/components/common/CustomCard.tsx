/**
 * Custom Card Component — clean single-layer card.
 * Subtle shadow, crisp border, and tactile spring motion.
 * No double-bezel / no grey outer halo padding.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Radii, Shadows } from '../../core/theme/tokens';

import { AnimatedPressable } from './AnimatedPressable';

export interface CustomCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  innerStyle?: ViewStyle | ViewStyle[];
  variant?: 'elevated' | 'flat' | 'glass';
  onPress?: () => void;
  scaleTarget?: number;
}

export const CustomCard: React.FC<CustomCardProps> = ({
  children,
  style,
  innerStyle,
  variant = 'elevated',
  onPress,
  scaleTarget = 0.98,
}) => {
  const { colors, isDark } = useAppStore();

  const cardContent = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        },
        variant === 'elevated' && (isDark ? Shadows.medium : Shadows.soft),
        style,
        innerStyle,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} scaleTarget={scaleTarget}>
        {cardContent}
      </AnimatedPressable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
