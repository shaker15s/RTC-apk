/**
 * AnimatedNumber Component
 * Smooth count-up animation for numeric stats, points, and metrics.
 */
import React, { useEffect, useState } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 800,
  formatter = (v) => Math.round(v).toLocaleString('ar-EG'),
  style,
  prefix = '',
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = displayValue;
    const endVal = value;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return (
    <Text style={style}>
      {prefix}
      {formatter(displayValue)}
      {suffix}
    </Text>
  );
};
