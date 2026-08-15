/**
 * Avatar Component
 * Handles image rendering with fallback initials, online status badge, and size variants.
 */
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { User } from 'lucide-react-native';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
}

const SizeMap: Record<AvatarSize, { size: number; radius: number; fontSize: number; iconSize: number }> = {
  xs: { size: 28, radius: 10, fontSize: 11, iconSize: 14 },
  sm: { size: 36, radius: 12, fontSize: 13, iconSize: 18 },
  md: { size: 48, radius: 16, fontSize: 17, iconSize: 24 },
  lg: { size: 64, radius: 22, fontSize: 22, iconSize: 32 },
  xl: { size: 88, radius: 28, fontSize: 30, iconSize: 42 },
};

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = '',
  size = 'md',
  showOnlineStatus = false,
  isOnline = true,
  style,
  borderColor,
}) => {
  const { colors } = useAppStore();
  const [imageError, setImageError] = useState(false);

  const dim = SizeMap[size];

  const getInitials = (text: string) => {
    if (!text) return '';
    const parts = text.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatarWrap,
          {
            width: dim.size,
            height: dim.size,
            borderRadius: dim.radius,
            backgroundColor: colors.card2,
            borderColor: borderColor || colors.line,
          },
        ]}
      >
        {uri && !imageError ? (
          <Image
            source={{ uri }}
            style={{ width: dim.size, height: dim.size, borderRadius: dim.radius }}
            onError={() => setImageError(true)}
          />
        ) : initials ? (
          <Text
            style={[
              styles.initialsText,
              { fontSize: dim.fontSize, color: colors.primary },
            ]}
          >
            {initials}
          </Text>
        ) : (
          <User color={colors.primary} size={dim.iconSize} />
        )}
      </View>

      {showOnlineStatus ? (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isOnline ? '#22C55E' : '#94A3B8',
              borderColor: colors.card,
              right: size === 'xs' || size === 'sm' ? -2 : 0,
              bottom: size === 'xs' || size === 'sm' ? -2 : 0,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarWrap: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initialsText: {
    fontWeight: '800',
  },
  statusDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
