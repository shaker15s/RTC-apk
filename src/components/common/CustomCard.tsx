/**
 * Custom Card Component with Double-Bezel (Doppelrand) nested architecture,
 * 1px hairline border highlights, and tactile spring motion.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Radii, Shadows } from '../../core/theme/tokens';

export interface CustomCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'elevated' | 'flat' | 'glass';
}

export const CustomCard: React.FC<CustomCardProps> = ({ children, style, variant = 'elevated' }) => {
  const { colors, isDark } = useAppStore();

  return (
    <View
      style={[
        styles.outerHalo,
        {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 40, 142, 0.08)',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 40, 142, 0.02)',
        },
        variant === 'elevated' && (isDark ? Shadows.medium : Shadows.soft),
        style,
      ]}
    >
      <View
        style={[
          styles.innerCore,
          {
            backgroundColor: isDark ? colors.card : colors.card,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.9)',
          },
        ]}
      >
        {/* Subtle Top Specular Glass Highlight */}
        <View
          style={[
            styles.specularHighlight,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.85)',
            },
          ]}
        />
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerHalo: {
    borderRadius: Radii.xxl,
    padding: 1.5,
    borderWidth: 1,
    overflow: 'hidden',
  },
  innerCore: {
    borderRadius: Radii.xl,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 1,
  },
});
