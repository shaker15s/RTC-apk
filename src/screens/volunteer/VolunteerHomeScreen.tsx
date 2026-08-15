/**
 * Volunteer Home Screen (v-home)
 * Quick dashboard for instructors to start active sessions, review student rosters, and handle excuses.
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
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Repository, Batch } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import {
  Users,
  Play,
  FileCheck2,
  BarChart3,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  GraduationCap,
  Sparkles,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const VolunteerHomeScreen: React.FC<{ onNavigate: (screenId: string, params?: any) => void }> = ({
  onNavigate,
}) => {
  const { colors } = useAppStore();
  const { profile, refreshProfile } = useAuthStore();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await Repository.fetchMyBatches();
      setBatches(data);
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
    await Promise.all([refreshProfile(), loadData()]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title="لوحة المتطوع"
        subtitle="إدارة المجموعات والمحاضرات"
        showNotif
        onNotifPress={() => onNavigate('s-notifications')}
        showAvatar
        onAvatarPress={() => onNavigate('v-profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Volunteer Hero */}
        <LinearGradient colors={['#00554E', '#003C36', '#00288E']} style={styles.heroCard}>
          <View style={styles.heroGreeting}>
            <Text style={styles.heroSub}>أهلاً بعودتك يا مدرب</Text>
            <Text style={styles.heroName} numberOfLines={1}>
              {profile?.full_name || 'مدرب مسار'} 🌟
            </Text>
            <Text style={styles.heroBranch}>{profile?.branch_name || 'مراكز رسالة للتدريب'}</Text>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatVal}>{batches.length}</Text>
              <Text style={styles.heroStatLbl}>مجموعاتي</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatVal}>
                {batches.reduce((acc, b) => acc + (b.sessions_done || 0), 0)}
              </Text>
              <Text style={styles.heroStatLbl}>محاضرات منفذة</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatVal}>{profile?.points || 0}</Text>
              <Text style={styles.heroStatLbl}>نقاط التطوع</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions Grid */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate('v-batches')}
            style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.teal + '18' }]}>
              <Play color={colors.teal} size={22} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.txt }]}>بدء محاضرة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate('v-excuses')}
            style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.primarySoft }]}>
              <FileCheck2 color={colors.primary} size={22} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.txt }]}>مراجعة الأعذار</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate('s-analytics')}
            style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.gold + '18' }]}>
              <BarChart3 color={colors.gold} size={22} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.txt }]}>التحليلات</Text>
          </TouchableOpacity>
        </View>

        {/* My Batches List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.txt }]}>مجموعاتي التدريبية الحالية</Text>
          <TouchableOpacity onPress={() => onNavigate('v-batches')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>عرض الكل</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ gap: 10 }}>
            <SkeletonLoader height={120} borderRadius={Radii.xl} />
            <SkeletonLoader height={120} borderRadius={Radii.xl} />
          </View>
        ) : batches.length ? (
          batches.map((batch) => (
            <TouchableOpacity
              key={batch.id}
              activeOpacity={0.8}
              onPress={() => onNavigate('v-batches', { selectedBatchId: batch.id })}
            >
              <CustomCard style={styles.batchCard}>
                <View style={styles.batchHeader}>
                  <View>
                    <Text style={[styles.batchCourseTitle, { color: colors.txt }]}>
                      {batch.courses?.title || batch.name}
                    </Text>
                    <Text style={[styles.batchName, { color: colors.mut }]}>{batch.name}</Text>
                  </View>

                  <View style={[styles.sessionsBadge, { backgroundColor: colors.teal + '18' }]}>
                    <Text style={[styles.sessionsText, { color: colors.teal }]}>
                      الجلسة {batch.sessions_done + 1}
                    </Text>
                  </View>
                </View>

                <View style={styles.batchDetails}>
                  {batch.schedule ? (
                    <View style={styles.detailItem}>
                      <Clock color={colors.mut} size={14} />
                      <Text style={[styles.detailText, { color: colors.mut }]}>{batch.schedule}</Text>
                    </View>
                  ) : null}

                  {batch.branches?.name_ar ? (
                    <View style={styles.detailItem}>
                      <MapPin color={colors.mut} size={14} />
                      <Text style={[styles.detailText, { color: colors.mut }]}>{batch.branches.name_ar}</Text>
                    </View>
                  ) : null}
                </View>
              </CustomCard>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyStateView
            title="لا توجد مجموعات مسندة إليك حالياً"
            description="عندما يقوم المشرف بإسناد مجموعات تدريبية لك ستظهر في هذه اللوحة لإدارتها وبدء محاضراتها."
            icon={<GraduationCap color={colors.teal} size={32} />}
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
    paddingBottom: 90,
    gap: 16,
  },
  heroCard: {
    padding: 20,
    borderRadius: Radii.xxl,
    shadowColor: '#00554E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  heroGreeting: {
    gap: 2,
  },
  heroSub: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  heroBranch: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    marginTop: 2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderRadius: Radii.lg,
    paddingVertical: 12,
    marginTop: 16,
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  heroStatLbl: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10.5,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  batchCard: {
    padding: 16,
    gap: 10,
  },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  batchCourseTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  batchName: {
    fontSize: 12,
    marginTop: 2,
  },
  sessionsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  sessionsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  batchDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
  },
});
