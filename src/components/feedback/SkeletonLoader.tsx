/**
 * Skeleton Loader & Empty State Components.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Radii } from '../../core/theme/tokens';
import { Inbox } from 'lucide-react-native';

export const SkeletonLoader: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}> = ({ width = '100%', height = 20, borderRadius = Radii.md, style }) => {
  const { colors } = useAppStore();

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.card2,
        },
        style,
      ]}
    />
  );
};

export const EmptyStateView: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  style?: ViewStyle;
}> = ({ title, description, icon, action, style }) => {
  const { colors } = useAppStore();

  return (
    <View style={[styles.emptyContainer, style]}>
      <View style={[styles.iconBox, { backgroundColor: colors.card2, borderColor: colors.line }]}>
        {icon || <Inbox color={colors.mut} size={32} />}
      </View>
      <Text style={[styles.title, { color: colors.txt }]}>{title}</Text>
      {description ? <Text style={[styles.desc, { color: colors.mut }]}>{description}</Text> : null}
      {action ? <View style={styles.actionWrap}>{action}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  actionWrap: {
    marginTop: 18,
  },
});
