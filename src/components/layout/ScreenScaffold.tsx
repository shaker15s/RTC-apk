/**
 * Standard ScreenScaffold Component for Masar RTC Native Mobile.
 * Unified layout engine providing safe areas, headers, pull-to-refresh, keyboard avoidance, and loading/error states.
 */
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/appStore';
import { GlassHeader } from './GlassHeader';
import { OfflineBanner } from './OfflineBanner';
import { SkeletonLoader } from '../feedback/SkeletonLoader';
import { EmptyStateView } from '../feedback/EmptyStateView';
import { CustomButton } from '../common/CustomButton';
import { Radii, Spacing } from '../../core/theme/tokens';
import { useT } from '../../core/i18n';
import { AlertCircle } from 'lucide-react-native';

export interface ScreenScaffoldProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotif?: boolean;
  onNotifPress?: () => void;
  showAvatar?: boolean;
  onAvatarPress?: () => void;
  rightAction?: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
}

export const ScreenScaffold: React.FC<ScreenScaffoldProps> = ({
  children,
  title,
  subtitle,
  showBack = false,
  onBack,
  showNotif = false,
  onNotifPress,
  showAvatar = false,
  onAvatarPress,
  rightAction,
  scrollable = true,
  refreshing = false,
  onRefresh,
  loading = false,
  error = null,
  onRetry,
  contentContainerStyle,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const colors = useAppStore((s) => s.colors);
  const { t } = useT();

  const renderHeader = () => {
    if (!title) return null;
    return (
      <GlassHeader
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        onBack={onBack}
        showNotif={showNotif}
        onNotifPress={onNotifPress}
        showAvatar={showAvatar}
        onAvatarPress={onAvatarPress}
        rightAction={rightAction}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <SkeletonLoader height={120} borderRadius={Radii.xl} />
          <SkeletonLoader height={80} borderRadius={Radii.lg} />
          <SkeletonLoader height={80} borderRadius={Radii.lg} />
          <SkeletonLoader height={140} borderRadius={Radii.xl} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <EmptyStateView
            title={t('errorTitle')}
            description={error}
            icon={<AlertCircle color={colors.red} size={36} />}
            action={
              onRetry ? (
                <CustomButton
                  title={t('retryCta')}
                  onPress={onRetry}
                  variant="primary"
                  size="mid"
                />
              ) : undefined
            }
          />
        </View>
      );
    }

    if (!scrollable) {
      return <View style={[styles.staticContent, contentContainerStyle]}>{children}</View>;
    }

    return (
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 110 },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }, style]}>
      {renderHeader()}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {renderContent()}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
});
