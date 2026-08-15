/**
 * Custom Native Button with Button-in-Button Architecture, Haptics, and Kinetic Spring Dynamics.
 */
import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { RTCHaptics } from '../../core/native/haptics';
import { Radii } from '../../core/theme/tokens';
import { AnimatedPressable } from './AnimatedPressable';

export interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'teal' | 'soft' | 'danger' | 'ghost';
  size?: 'big' | 'mid' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
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
  trailingIcon,
  style,
  textStyle,
}) => {
  const { colors, isDark } = useAppStore();

  const handlePress = () => {
    if (disabled || loading) return;
    RTCHaptics.light();
    onPress();
  };

  const getBackgroundColor = () => {
    if (disabled) return isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'teal':
        return colors.teal;
      case 'soft':
        return isDark ? 'rgba(255, 255, 255, 0.06)' : colors.card2;
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
        return 56;
      case 'mid':
        return 48;
      case 'sm':
        return 40;
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled || loading}
      scaleTarget={0.97}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          height: getHeight(),
          borderColor:
            variant === 'soft'
              ? colors.line
              : variant === 'danger'
              ? colors.red + '40'
              : variant === 'primary' || variant === 'teal'
              ? 'rgba(255, 255, 255, 0.2)'
              : 'transparent',
          borderWidth: variant === 'ghost' ? 0 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.leadingIconWrap}>{icon}</View> : null}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === 'big' ? 15.5 : size === 'mid' ? 14 : 12.5,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {trailingIcon ? (
            <View
              style={[
                styles.trailingBadge,
                {
                  backgroundColor:
                    variant === 'primary' || variant === 'teal'
                      ? 'rgba(255, 255, 255, 0.18)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              {trailingIcon}
            </View>
          ) : null}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  leadingIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailingBadge: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
