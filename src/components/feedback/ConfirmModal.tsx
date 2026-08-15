/**
 * Confirmation Modal for deletion, role changes, and critical actions.
 */
import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { CustomButton } from '../common/CustomButton';
import { Radii } from '../../core/theme/tokens';
import { AlertCircle } from 'lucide-react-native';
import { useT, t } from '../../core/i18n';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = t('confirm'),
  cancelLabel = t('cancel'),
  isDestructive = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { t } = useT();
  const { colors, isDark } = useAppStore();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? colors.card : colors.card,
              borderColor: colors.line,
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDestructive ? colors.red + '18' : colors.primarySoft,
              },
            ]}
          >
            <AlertCircle color={isDestructive ? colors.red : colors.primary} size={28} />
          </View>

          <Text style={[styles.title, { color: colors.txt }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.mut }]}>{message}</Text>

          <View style={styles.buttonRow}>
            <CustomButton
              title={cancelLabel}
              onPress={onCancel}
              variant="soft"
              size="mid"
              style={{ flex: 1 }}
              disabled={loading}
            />
            <CustomButton
              title={confirmLabel}
              onPress={onConfirm}
              variant={isDestructive ? 'danger' : 'primary'}
              size="mid"
              loading={loading}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radii.xxl,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
});
