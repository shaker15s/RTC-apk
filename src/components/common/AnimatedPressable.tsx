/**
 * AnimatedPressable Component
 * Provides fluid micro-interactions with scale damping, opacity, and haptic feedback.
 */
import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { RTCHaptics } from '../../core/native/haptics';
import { SpringConfigs } from '../../core/animations';

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTarget?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'none';
  activeOpacity?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  scaleTarget = 0.96,
  haptic = 'selection',
  activeOpacity = 0.88,
  onPress,
  disabled,
  ...rest
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(scaleTarget, SpringConfigs.snappy);
    opacity.value = withSpring(activeOpacity, SpringConfigs.snappy);

    if (haptic === 'selection') RTCHaptics.selection();
    else if (haptic === 'light') RTCHaptics.light();
    else if (haptic === 'medium') RTCHaptics.medium();
    else if (haptic === 'heavy') RTCHaptics.heavy();
    else if (haptic === 'success') RTCHaptics.success();
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, SpringConfigs.bouncy);
    opacity.value = withSpring(1, SpringConfigs.snappy);
  };

  return (
    <AnimatedPress
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPress>
  );
};
