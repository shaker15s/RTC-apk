/**
 * Central Animation System for Masar RTC Mobile
 * Powered by react-native-reanimated for 60fps native-driven transitions and micro-interactions.
 */
import {
  Easing,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  WithSpringConfig,
  WithTimingConfig,
} from 'react-native-reanimated';

export const SpringConfigs = {
  snappy: {
    damping: 14,
    stiffness: 160,
    mass: 0.8,
  } as WithSpringConfig,
  gentle: {
    damping: 18,
    stiffness: 120,
    mass: 1,
  } as WithSpringConfig,
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.9,
  } as WithSpringConfig,
  sheet: {
    damping: 22,
    stiffness: 180,
    mass: 1,
  } as WithSpringConfig,
};

export const TimingConfigs = {
  fast: {
    duration: 150,
    easing: Easing.out(Easing.cubic),
  } as WithTimingConfig,
  standard: {
    duration: 250,
    easing: Easing.out(Easing.cubic),
  } as WithTimingConfig,
  smooth: {
    duration: 400,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } as WithTimingConfig,
  pulse: {
    duration: 1200,
    easing: Easing.inOut(Easing.ease),
  } as WithTimingConfig,
};

export const createPulseAnimation = (scaleMin = 0.95, scaleMax = 1.05) => {
  'worklet';
  return withRepeat(
    withSequence(
      withTiming(scaleMax, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      withTiming(scaleMin, { duration: 800, easing: Easing.inOut(Easing.ease) })
    ),
    -1,
    true
  );
};

export const createBounceTap = () => {
  'worklet';
  return withSequence(
    withSpring(0.92, SpringConfigs.snappy),
    withSpring(1, SpringConfigs.bouncy)
  );
};
