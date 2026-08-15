/**
 * EmptyState Component
 * Consistent and delightful empty state representation across lists and screens.
 */
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { CustomButton } from './CustomButton';
import { Radii } from '../../core/theme/tokens';
import Animated, { FadeInDown } from 'react-native-reanimated';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors } = useAppStore();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.line },
        style,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        {icon}
      </View>
      <Text style={[styles.title, { color: colors.txt }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mut }]}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <CustomButton
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="sm"
          />
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 28,
    borderRadius: Radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 10,
    marginVertical: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionWrap: {
    marginTop: 8,
  },
});
