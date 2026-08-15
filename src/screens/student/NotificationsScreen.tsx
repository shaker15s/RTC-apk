/**
 * Notifications Screen (s-notifications)
 * List of operational alerts, course updates, and announcements with unread indicators.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Repository, NotificationItem } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import {
  Bell,
  Calendar,
  AlertCircle,
  Award,
  CheckCheck,
  Megaphone,
} from 'lucide-react-native';
import { useT, t } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const NotificationsScreen: React.FC<{
  onBack: () => void;
  onNavigate?: (screenId: string) => void;
}> = ({ onBack, onNavigate }) => {
  const { colors, resetUnread } = useAppStore();
  const { t } = useT();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifs = async () => {
    try {
      const data = await Repository.fetchNotifications();
      setNotifications(data);
      // Opening the notifications screen clears the unread badge (fixes F-3)
      resetUnread();
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifs();
  };

  const handlePressNotif = async (item: NotificationItem) => {
    RTCHaptics.light();
    if (!item.read_at) {
      await Repository.markNotificationRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle color={colors.red} size={20} />;
      case 'cert':
        return <Award color={colors.gold} size={20} />;
      case 'reminder':
        return <Calendar color={colors.teal} size={20} />;
      default:
        return <Megaphone color={colors.primary} size={20} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('notifTitle')} subtitle={t('notifSubtitle')} showBack onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 10 }}>
            <SkeletonLoader height={74} borderRadius={Radii.lg} />
            <SkeletonLoader height={74} borderRadius={Radii.lg} />
            <SkeletonLoader height={74} borderRadius={Radii.lg} />
          </View>
        ) : notifications.length ? (
          notifications.map((item) => {
            const isUnread = !item.read_at;
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString('ar-EG', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => handlePressNotif(item)}
              >
                <CustomCard
                  style={[
                    styles.notifCard,
                    isUnread && {
                      borderColor: colors.primary + '50',
                      backgroundColor: colors.card,
                    },
                  ] as any}
                >
                  <View style={styles.cardInner}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: isUnread ? colors.primarySoft : colors.card2,
                        },
                      ]}
                    >
                      {getNotifIcon(item.type)}
                    </View>

                    <View style={styles.contentWrap}>
                      <View style={styles.topRow}>
                        <Text style={[styles.notifTitle, { color: colors.txt, fontWeight: isUnread ? '800' : '600' }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.timeText, { color: colors.mut }]}>{dateStr}</Text>
                      </View>

                      <Text style={[styles.messageText, { color: colors.mut }]} numberOfLines={3}>
                        {item.message}
                      </Text>
                    </View>

                    {isUnread ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
                  </View>
                </CustomCard>
              </TouchableOpacity>
            );
          })
        ) : (
          <EmptyStateView
            title={t('nfEmptyTitle')}
            description={t('nfEmptyDesc')}
            icon={<Bell color={colors.primary} size={32} />}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 10,
  },
  notifCard: {
    padding: 14,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifTitle: {
    fontSize: 14,
    flex: 1,
  },
  timeText: {
    fontSize: 11,
  },
  messageText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});
