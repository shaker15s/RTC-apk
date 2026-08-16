/**
 * Physics-inspired switch toggle for dark mode and options.
 */
import React from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useT, t } from '../../core/i18n';
import { RTCHaptics } from '../../core/native/haptics';

export interface SwitchToggleProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const SwitchToggle: React.FC<SwitchToggleProps> = ({ value, onValueChange, disabled = false, label }) => {
  const { colors } = useAppStore();
  const { t } = useT();
  const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      bounciness: 6,
      speed: 14,
    }).start();
  }, [value]);

  const handleToggle = () => {
    if (disabled) return;
    RTCHaptics.light();
    onValueChange(!value);
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleToggle}
      disabled={disabled}
      style={[
        styles.track,
        {
          backgroundColor: value ? colors.primary : colors.line,
        },
      ]}
      accessibilityRole="switch"
      accessibilityLabel={label || t('toggleDefault')}
      accessibilityState={{ checked: value }}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: '#FFFFFF',
            transform: [{ translateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 2,
    direction: 'ltr', // Explicit LTR guarantees physical coordinate stability in both RTL and LTR
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
