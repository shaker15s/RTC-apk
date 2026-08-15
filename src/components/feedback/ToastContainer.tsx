/**
 * Toast Container displaying alert notifications with appropriate colors and icons.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useAppStore, ToastItem } from '../../state/appStore';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast, colors } = useAppStore();

  if (!toasts.length) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => hideToast(toast.id)} />
      ))}
    </View>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const { colors, isDark } = useAppStore();

  const getIcon = () => {
    switch (toast.type) {
      case 'ok':
        return <CheckCircle2 color={colors.teal} size={20} />;
      case 'err':
        return <XCircle color={colors.red} size={20} />;
      case 'warn':
        return <AlertTriangle color={colors.amber} size={20} />;
      case 'info':
        return <Info color={colors.primary} size={20} />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'ok':
        return colors.teal;
      case 'err':
        return colors.red;
      case 'warn':
        return colors.amber;
      case 'info':
        return colors.primary;
    }
  };

  return (
    <View
      style={[
        styles.toast,
        {
          backgroundColor: isDark ? 'rgba(21, 30, 50, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderColor: getBorderColor(),
        },
      ]}
    >
      <View style={styles.iconWrap}>{getIcon()}</View>
      <Text style={[styles.message, { color: colors.txt }]}>{toast.message}</Text>
      <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
        <X color={colors.mut} size={16} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 84,
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
    gap: 8,
  },
  toast: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    gap: 10,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  closeBtn: {
    padding: 4,
  },
});
