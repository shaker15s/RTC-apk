import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = ['#FFD700', '#FF3B30', '#00288E', '#00A896', '#FF9500', '#AF52DE', '#5856D6', '#FF2D55'];

interface ConfettiPiece {
  x: number;
  animY: Animated.Value;
  animRotate: Animated.Value;
  animScale: Animated.Value;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
}

export const ConfettiCelebration: React.FC<{ active?: boolean; count?: number }> = ({
  active = true,
  count = 45,
}) => {
  const pieces = useRef<ConfettiPiece[]>(
    Array.from({ length: count }).map(() => ({
      x: Math.random() * (SCREEN_WIDTH - 20),
      animY: new Animated.Value(-50),
      animRotate: new Animated.Value(0),
      animScale: new Animated.Value(Math.random() * 0.6 + 0.7),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.floor(Math.random() * 8) + 8,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    }))
  ).current;

  useEffect(() => {
    if (!active) return;

    const animations = pieces.map((p, idx) => {
      const delay = idx * 20;
      const duration = 2400 + Math.random() * 1000;
      p.animY.setValue(-50);
      p.animRotate.setValue(0);

      return Animated.parallel([
        Animated.timing(p.animY, {
          toValue: SCREEN_HEIGHT + 80,
          duration,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p.animRotate, {
          toValue: 6,
          duration,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(15, animations).start();
  }, [active]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {pieces.map((p, i) => {
        const rotate = p.animRotate.interpolate({
          inputRange: [0, 10],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.piece,
              {
                left: p.x,
                width: p.size,
                height: p.shape === 'rect' ? p.size * 1.5 : p.size,
                borderRadius: p.shape === 'circle' ? p.size / 2 : 2,
                backgroundColor: p.color,
                transform: [
                  { translateY: p.animY },
                  { rotate },
                  { scale: p.animScale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    zIndex: 9999,
  },
});
