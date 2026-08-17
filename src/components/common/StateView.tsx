import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { CustomButton } from './CustomButton';
import { CustomCard } from './CustomCard';
import { AlertCircle, RefreshCw, Inbox, WifiOff, ShieldAlert } from 'lucide-react-native';
import { AppError } from '../../data/result';
import { Radii } from '../../core/theme/tokens';

export interface StateViewProps {
  isLoading?: boolean;
  error?: AppError | Error | string | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyActionTitle?: string;
  onEmptyAction?: () => void;
  emptyIcon?: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
  style?: any;
}

export const StateView: React.FC<StateViewProps> = ({
  isLoading,
  error,
  isEmpty,
  emptyTitle = 'لا توجد بيانات متاحة',
  emptySubtitle,
  emptyActionTitle,
  onEmptyAction,
  emptyIcon,
  onRetry,
  children,
  loadingMessage = 'جاري التحميل...',
  style,
}) => {
  const { colors } = useAppStore();

  // 1. Loading State
  if (isLoading) {
    return (
      <View style={[styles.centerContainer, style]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mut }]}>{loadingMessage}</Text>
      </View>
    );
  }

  // 2. Error State
  if (error) {
    const isAppErr = error instanceof AppError;
    const userMessage = isAppErr
      ? error.userMessage
      : typeof error === 'string'
      ? error
      : error.message || 'حدث خطأ أثناء تحميل البيانات.';
    const kind = isAppErr ? error.kind : 'unknown';

    const renderErrorIcon = () => {
      if (kind === 'network') return <WifiOff color={colors.red} size={36} />;
      if (kind === 'permission') return <ShieldAlert color={colors.red} size={36} />;
      return <AlertCircle color={colors.red} size={36} />;
    };

    return (
      <View style={[styles.centerContainer, style]}>
        <CustomCard style={styles.errorCard} innerStyle={{ padding: 24, alignItems: 'center', gap: 12 }}>
          {renderErrorIcon()}
          <Text style={[styles.errorTitle, { color: colors.txt }]}>تعذر إكمال الطلب</Text>
          <Text style={[styles.errorMessage, { color: colors.mut }]}>{userMessage}</Text>
          {onRetry && (
            <CustomButton
              title="إعادة المحاولة"
              variant="primary"
              size="mid"
              onPress={onRetry}
              icon={<RefreshCw color="#FFFFFF" size={16} />}
              style={{ marginTop: 8 }}
            />
          )}
        </CustomCard>
      </View>
    );
  }

  // 3. Empty State
  if (isEmpty) {
    return (
      <View style={[styles.centerContainer, style]}>
        <View style={[styles.emptyIconWrap, { backgroundColor: colors.card2, borderColor: colors.line }]}>
          {emptyIcon || <Inbox color={colors.mut} size={32} />}
        </View>
        <Text style={[styles.emptyTitle, { color: colors.txt }]}>{emptyTitle}</Text>
        {emptySubtitle && (
          <Text style={[styles.emptySubtitle, { color: colors.mut }]}>{emptySubtitle}</Text>
        )}
        {emptyActionTitle && onEmptyAction && (
          <CustomButton
            title={emptyActionTitle}
            variant="soft"
            size="mid"
            onPress={onEmptyAction}
            style={{ marginTop: 16 }}
          />
        )}
      </View>
    );
  }

  // 4. Success State
  return <>{children}</>;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 220,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Cairo-Medium',
  },
  errorCard: {
    width: '100%',
    maxWidth: 380,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 13,
    fontFamily: 'Cairo-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Cairo-Regular',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
