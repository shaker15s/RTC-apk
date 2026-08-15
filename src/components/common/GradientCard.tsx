/**
 * GradientCard Component
 * Elevated card with LinearGradient background and rounded corners.
 */
import React from 'react';
import { ViewStyle, StyleProp, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radii, Shadows } from '../../core/theme/tokens';
import { Gradients } from '../../core/theme/gradients';
import { useAppStore } from '../../state/appStore';

export interface GradientCardProps {
  children: React.ReactNode;
  variant?: 'hero' | 'gold' | 'teal' | 'danger' | 'card' | 'glass';
  style?: StyleProp<ViewStyle>;
  colors?: readonly [string, string, ...string[]];
}

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  variant = 'hero',
  style,
  colors,
}) => {
  const { isDark } = useAppStore();

  let gradColors: readonly [string, string, ...string[]];
  if (colors) {
    gradColors = colors;
  } else if (variant === 'hero') {
    gradColors = isDark ? Gradients.heroDark.colors : Gradients.hero.colors;
  } else if (variant === 'gold') {
    gradColors = Gradients.gold.colors;
  } else if (variant === 'teal') {
    gradColors = Gradients.teal.colors;
  } else if (variant === 'danger') {
    gradColors = Gradients.danger.colors;
  } else if (variant === 'glass') {
    gradColors = isDark ? Gradients.glassDark.colors : Gradients.glassLight.colors;
  } else {
    gradColors = Gradients.cardPrimary.colors;
  }

  return (
    <View
      style={[
        styles.outerHalo,
        {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 40, 142, 0.12)',
        },
        Shadows.soft,
        style,
      ]}
    >
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Top Specular Light */}
        <View style={styles.specular} />
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outerHalo: {
    borderRadius: Radii.xxl,
    padding: 1.5,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  card: {
    borderRadius: Radii.xl,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
