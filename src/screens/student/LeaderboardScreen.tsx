/**
 * Leaderboard Screen (s-leaderboard)
 * Top ranking students across RTC branches from get_leaderboard RPC.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { RPC, LeaderboardEntry } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { Trophy, Medal, Award, User, Flame } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const LeaderboardScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors, isDark } = useAppStore();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await RPC.getLeaderboard();
      setLeaderboard(data);
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

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title="لوحة الصدارة" subtitle="أوائل المتدربين" showBack onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            <SkeletonLoader height={180} borderRadius={Radii.xl} />
            <SkeletonLoader height={64} borderRadius={Radii.lg} />
            <SkeletonLoader height={64} borderRadius={Radii.lg} />
          </View>
        ) : leaderboard.length ? (
          <>
            {/* Top 3 Podium Card */}
            <CustomCard style={styles.podiumCard}>
              <View style={styles.podiumRow}>
                {/* 2nd Place (Silver) */}
                {top3[1] ? (
                  <View style={styles.podiumItem}>
                    <View style={[styles.podiumAvatar, { borderColor: '#A0AEC0' }]}>
                      {top3[1].avatar_url ? (
                        <Image source={{ uri: top3[1].avatar_url }} style={styles.avatarImg} />
                      ) : (
                        <User color="#A0AEC0" size={24} />
                      )}
                      <View style={[styles.podiumRankBadge, { backgroundColor: '#A0AEC0' }]}>
                        <Text style={styles.podiumRankText}>2</Text>
                      </View>
                    </View>
                    <Text style={[styles.podiumName, { color: colors.txt }]} numberOfLines={1}>
                      {top3[1].full_name}
                    </Text>
                    <Text style={[styles.podiumPoints, { color: colors.mut }]}>{top3[1].points} ن</Text>
                  </View>
                ) : null}

                {/* 1st Place (Gold) */}
                {top3[0] ? (
                  <View style={[styles.podiumItem, { marginBottom: 16 }]}>
                    <View style={styles.crownWrap}>
                      <Trophy color="#FFD700" size={24} />
                    </View>
                    <View style={[styles.podiumAvatar, styles.goldAvatar, { borderColor: '#FFD700' }]}>
                      {top3[0].avatar_url ? (
                        <Image source={{ uri: top3[0].avatar_url }} style={styles.avatarImg} />
                      ) : (
                        <User color="#FFD700" size={28} />
                      )}
                      <View style={[styles.podiumRankBadge, { backgroundColor: '#FFD700' }]}>
                        <Text style={[styles.podiumRankText, { color: '#000' }]}>1</Text>
                      </View>
                    </View>
                    <Text style={[styles.podiumName, { color: colors.txt, fontWeight: '800' }]} numberOfLines={1}>
                      {top3[0].full_name}
                    </Text>
                    <Text style={[styles.podiumPoints, { color: colors.gold, fontWeight: '700' }]}>
                      {top3[0].points} نقطة
                    </Text>
                  </View>
                ) : null}

                {/* 3rd Place (Bronze) */}
                {top3[2] ? (
                  <View style={styles.podiumItem}>
                    <View style={[styles.podiumAvatar, { borderColor: '#CD7F32' }]}>
                      {top3[2].avatar_url ? (
                        <Image source={{ uri: top3[2].avatar_url }} style={styles.avatarImg} />
                      ) : (
                        <User color="#CD7F32" size={24} />
                      )}
                      <View style={[styles.podiumRankBadge, { backgroundColor: '#CD7F32' }]}>
                        <Text style={styles.podiumRankText}>3</Text>
                      </View>
                    </View>
                    <Text style={[styles.podiumName, { color: colors.txt }]} numberOfLines={1}>
                      {top3[2].full_name}
                    </Text>
                    <Text style={[styles.podiumPoints, { color: colors.mut }]}>{top3[2].points} ن</Text>
                  </View>
                ) : null}
              </View>
            </CustomCard>

            {/* Rest of Top List */}
            <View style={styles.listSection}>
              {rest.map((entry, idx) => {
                const rankNum = idx + 4;
                return (
                  <CustomCard key={entry.id || idx} style={styles.rankCard}>
                    <View style={styles.rankLeft}>
                      <View style={[styles.rankBadge, { backgroundColor: colors.card2 }]}>
                        <Text style={[styles.rankText, { color: colors.txt }]}>{rankNum}</Text>
                      </View>

                      <View style={[styles.smallAvatar, { backgroundColor: colors.card2 }]}>
                        {entry.avatar_url ? (
                          <Image source={{ uri: entry.avatar_url }} style={styles.avatarImg} />
                        ) : (
                          <User color={colors.mut} size={16} />
                        )}
                      </View>

                      <Text style={[styles.entryName, { color: colors.txt }]} numberOfLines={1}>
                        {entry.full_name}
                      </Text>
                    </View>

                    <View style={[styles.pointsPill, { backgroundColor: colors.primarySoft }]}>
                      <Text style={[styles.pointsPillText, { color: colors.primary }]}>{entry.points} نقطة</Text>
                    </View>
                  </CustomCard>
                );
              })}
            </View>
          </>
        ) : (
          <EmptyStateView
            title="لا توجد بيانات متوفرة حالياً"
            description="احرص على حضور المحاضرات والتفاعل لتصدر قائمة الأوائل."
            icon={<Trophy color={colors.gold} size={36} />}
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
    gap: 14,
  },
  podiumCard: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  podiumItem: {
    alignItems: 'center',
    width: 90,
  },
  crownWrap: {
    marginBottom: 4,
  },
  podiumAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  goldAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    resizeMode: 'cover',
  },
  podiumRankBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRankText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: 11,
    marginTop: 2,
  },
  listSection: {
    gap: 8,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  entryName: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  pointsPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  pointsPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
