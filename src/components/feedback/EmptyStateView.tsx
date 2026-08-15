/**
 * EmptyStateView Component
 * Reusable feedback view when lists or datasets are empty.
 * Compatible with both subtitle and description props, and action text or action Element.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { CustomButton } from '../common/CustomButton';
import { Radii } from '../../core/theme/tokens';

export interface EmptyStateViewProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  actionText?: string;
  action?: React.ReactNode;
  onAction?: () => void;
}

export const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  icon,
  title,
  subtitle,
  description,
  actionText,
  action,
  onAction,
}) => {
  const { colors } = useAppStore();
  const desc = subtitle || description;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.line }]}>
      {icon ? <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>{icon}</View> : null}
      <Text style={[styles.title, { color: colors.txt }]}>{title}</Text>
      {desc ? <Text style={[styles.subtitle, { color: colors.mut }]}>{desc}</Text> : null}
      {action ? (
        <View style={styles.btnWrap}>{action}</View>
      ) : actionText && onAction ? (
        <View style={styles.btnWrap}>
          <CustomButton title={actionText} onPress={onAction} variant="primary" size="sm" />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
    marginVertical: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 260,
  },
  btnWrap: {
    marginTop: 8,
  },
});
