/**
 * Custom Native Button with Haptics and design system variants.
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { RTCHaptics } from '../../core/native/haptics';
import { Radii } from '../../core/theme/tokens';

export interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'teal' | 'soft' | 'danger' | 'ghost';
  size?: 'big' | 'mid' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'mid',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useAppStore();

  const handlePress = () => {
    if (disabled || loading) return;
    RTCHaptics.light();
    onPress();
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.mut + '40';
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'teal':
        return colors.teal;
      case 'soft':
        return colors.card2;
      case 'danger':
        return colors.red + '18';
      case 'ghost':
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.mut;
    switch (variant) {
      case 'primary':
      case 'teal':
        return '#FFFFFF';
      case 'soft':
        return colors.txt;
      case 'danger':
        return colors.red;
      case 'ghost':
        return colors.primary;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'big':
        return 54;
      case 'mid':
        return 46;
      case 'sm':
        return 38;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          height: getHeight(),
          borderColor: variant === 'soft' ? colors.line : variant === 'danger' ? colors.red + '40' : 'transparent',
          borderWidth: variant === 'soft' || variant === 'danger' ? 1 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === 'big' ? 15 : size === 'mid' ? 13.5 : 12.5,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
