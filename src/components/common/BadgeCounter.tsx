/**
 * BadgeCounter Component
 * Animated notification pill with spring scale and pulse effect.
 */
import React from 'react';
import { Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SpringConfigs } from '../../core/animations';

export interface BadgeCounterProps {
  count: number;
  max?: number;
  color?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

export const BadgeCounter: React.FC<BadgeCounterProps> = ({
  count,
  max = 99,
  color = '#E04848',
  textColor = '#FFFFFF',
  style,
  size = 'md',
}) => {
  if (count <= 0) return null;

  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(1.25, SpringConfigs.bouncy, () => {
      scale.value = withSpring(1, SpringConfigs.snappy);
    });
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const displayCount = count > max ? `${max}+` : count.toString();
  const isSm = size === 'sm';

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: color,
          height: isSm ? 18 : 22,
          minWidth: isSm ? 18 : 22,
          borderRadius: isSm ? 9 : 11,
          paddingHorizontal: isSm ? 5 : 6,
        },
        animatedStyle,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: textColor, fontSize: isSm ? 10 : 11.5 },
        ]}
      >
        {displayCount}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
