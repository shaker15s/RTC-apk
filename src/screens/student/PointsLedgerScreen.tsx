/**
 * Points Ledger Screen (s-ledger)
 * Displays chronological log of all point earnings, bonuses, attendance, and achievements.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Repository, PointsLedgerItem } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { PlusCircle, MinusCircle, Award, Calendar } from 'lucide-react-native';
import { useT, t, dateLocale } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const PointsLedgerScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors } = useAppStore();
  const { t } = useT();

  const [ledger, setLedger] = useState<PointsLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await Repository.fetchLedger();
      setLedger(data);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('plTitle')} subtitle={t('plSubtitle')} showBack onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 10 }}>
            <SkeletonLoader height={70} borderRadius={Radii.lg} />
            <SkeletonLoader height={70} borderRadius={Radii.lg} />
            <SkeletonLoader height={70} borderRadius={Radii.lg} />
            <SkeletonLoader height={70} borderRadius={Radii.lg} />
          </View>
        ) : ledger.length ? (
          ledger.map((item) => {
            const isPositive = item.points >= 0;
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString(dateLocale(), {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '';

            return (
              <CustomCard key={item.id} style={styles.ledgerCard}>
                <View style={styles.leftSide}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isPositive ? colors.teal + '18' : colors.red + '18',
                      },
                    ]}
                  >
                    {isPositive ? (
                      <PlusCircle color={colors.teal} size={20} />
                    ) : (
                      <MinusCircle color={colors.red} size={20} />
                    )}
                  </View>

                  <View style={styles.textWrap}>
                    <Text style={[styles.title, { color: colors.txt }]}>
                      {item.points_rules?.title || item.notes || t('plEntry')}
                    </Text>
                    <View style={styles.dateRow}>
                      <Calendar color={colors.mut} size={12} />
                      <Text style={[styles.dateText, { color: colors.mut }]}>{dateStr}</Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.pointsBadge,
                    {
                      backgroundColor: isPositive ? colors.teal + '14' : colors.red + '14',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pointsValue,
                      {
                        color: isPositive ? colors.teal : colors.red,
                      },
                    ]}
                  >
                    {isPositive ? `+${item.points}` : item.points}
                  </Text>
                </View>
              </CustomCard>
            );
          })
        ) : (
          <EmptyStateView
            title={t('plEmptyTitle')}
            description={t('plEmptyDesc')}
            icon={<Award color={colors.primary} size={32} />}
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
  ledgerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: '800',
  },
});
