/**
 * ProgressRing Component
 * Circular SVG progress indicator with animated stroke and optional center content.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import { useAppStore } from '../../state/appStore';
import { TimingConfigs } from '../../core/animations';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showPercent?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 72,
  strokeWidth = 6,
  color,
  bgColor,
  showPercent = true,
  children,
  style,
}) => {
  const { colors } = useAppStore();
  const activeColor = color || colors.primary;
  const trackColor = bgColor || (colors.line || 'rgba(0,0,0,0.08)');

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(
      Math.min(100, Math.max(0, progress)),
      TimingConfigs.smooth
    );
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset =
      circumference - (circumference * animatedProgress.value) / 100;
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>

      <View style={[StyleSheet.absoluteFillObject, styles.centerContent]}>
        {children ? (
          children
        ) : showPercent ? (
          <Text style={[styles.percentText, { color: colors.txt, fontSize: size * 0.22 }]}>
            {Math.round(progress)}%
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontWeight: '800',
  },
});
