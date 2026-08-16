/**
 * Standard ListRow Component for Masar RTC Native Mobile.
 * Unified list row for menus, preferences, items, and rosters with strict RTL support.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { BodyLarge, Caption } from './Typography';
import { RTCHaptics } from '../../core/native/haptics';
import { Radii, Spacing, TouchTarget } from '../../core/theme/tokens';
import { ChevronLeft } from 'lucide-react-native';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  style?: ViewStyle;
}

export const ListRow: React.FC<ListRowProps> = ({
  title,
  subtitle,
  icon,
  iconBg,
  trailing,
  showChevron = true,
  onPress,
  destructive = false,
  style,
}) => {
  const colors = useAppStore((s) => s.colors);

  const handlePress = () => {
    if (onPress) {
      RTCHaptics.light();
      onPress();
    }
  };

  const titleColor = destructive ? colors.red : colors.txt;

  const content = (
    <View style={[styles.container, style]}>
      <View style={styles.leadingWrap}>
        {icon ? (
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: iconBg || (destructive ? colors.redSoft : colors.primarySoft),
              },
            ]}
          >
            {icon}
          </View>
        ) : null}

        <View style={styles.textWrap}>
          <BodyLarge style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {title}
          </BodyLarge>
          {subtitle ? <Caption numberOfLines={1}>{subtitle}</Caption> : null}
        </View>
      </View>

      <View style={styles.trailingWrap}>
        {trailing}
        {showChevron && onPress ? (
          <ChevronLeft color={destructive ? colors.red : colors.mut} size={18} />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.minHeight,
    gap: Spacing.md,
  },
  leadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '700',
  },
  trailingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
