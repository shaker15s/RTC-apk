import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Repository, Enrollment } from '../../data/repositories';
import { RPC } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { AnimatedPressable } from '../../components/common/AnimatedPressable';
import { AnimatedNumber } from '../../components/common/AnimatedNumber';
import { EmptyState } from '../../components/common/EmptyState';
import { RTCHaptics } from '../../core/native/haptics';
import { RTC_CONFIG } from '../../core/config';
import { useRealtimeNotifications } from '../../data/realtime/useRealtimeNotifications';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Compass,
  QrCode,
  Bell,
  LifeBuoy,
  Facebook,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  MonitorPlay,
} from 'lucide-react-native';
import { Radii, Shadows } from '../../core/theme/tokens';

export interface StudentHomeScreenProps {
  onNavigate: (screenId: string, params?: any) => void;
}

export const StudentHomeScreen: React.FC<StudentHomeScreenProps> = ({ onNavigate }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { profile, refreshProfile } = useAuthStore();
  const { notifications } = useRealtimeNotifications();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [nextSession, setNextSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const list = await Repository.fetchMyEnrollments();
      setEnrollments(list);
    } catch (e) {
      showToast('تعذر تحميل بياناتك — اسحب للتحديث', 'warn');
    }

    // Real upcoming session from the backend (fixes F-2). If the RPC is
    // not deployed yet or fails, we gracefully fall back to showing the
    // latest enrollment in the "next lecture" card.
    try {
      const upcoming = await RPC.getMyNextSession();
      setNextSession(upcoming);
    } catch (e) {
      setNextSession(null);
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

  // Calculate level based on points
  const points = profile?.points || 0;
  const level = Math.min(10, Math.floor(points / 100) + 1);
  const nextLevelPoints = level * 100;
  const currentLevelBase = (level - 1) * 100;
  const progressPercent = Math.min(100, Math.max(0, ((points - currentLevelBase) / 100) * 100));

  // Next session from active enrollments
  const activeEnrollments = enrollments.filter((e) => e.status === 'enrolled');
  const nextEnrollment = activeEnrollments[0];

  // Prefer the backend's real "next session" (F-2), fall back to the
  // latest enrollment when the RPC is unavailable.
  const upcomingTitle =
    nextSession?.course_title || nextSession?.title ||
    nextEnrollment?.batches?.courses?.title || nextEnrollment?.batches?.name || '';
  const upcomingSchedule = nextSession?.session_date
    ? new Date(nextSession.session_date).toLocaleDateString('ar-EG', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : nextEnrollment?.batches?.schedule || '';
  const upcomingLocation = nextSession?.location
    ? `${nextSession.location}${nextSession.room ? ` (${nextSession.room})` : ''}`
    : nextEnrollment?.batches?.location
    ? `${nextEnrollment.batches.location}${nextEnrollment.batches.room ? ` (${nextEnrollment.batches.room})` : ''}`
    : '';
  const upcomingMeetingUrl = nextSession?.meeting_url || nextEnrollment?.batches?.meeting_url || '';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title="الرئيسية"
        subtitle="مسار RTC"
        showNotif
        onNotifPress={() => onNavigate('s-notifications')}
        showAvatar
        onAvatarPress={() => onNavigate('s-profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Grad Hero */}
        <Animated.View entering={FadeInDown.duration(450).springify()}>
          <LinearGradient colors={['#00288E', '#1E40AF', '#00554E']} style={[styles.gradHero, Shadows.soft]}>
            <View style={styles.heroTop}>
              <View style={styles.heroGreeting}>
                <Text style={styles.greetingSub}>مرحباً بك يا</Text>
                <Text style={styles.greetingName} numberOfLines={1}>
                  {profile?.full_name || 'طالب RTC'} 👋
                </Text>
                <Text style={styles.greetingBranch}>{profile?.branch_name || 'مركز رسالة التدريبي'}</Text>
              </View>

              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeSub}>المستوى</Text>
                <Text style={styles.levelBadgeNum}>{level} ⭐</Text>
              </View>
            </View>

            {/* Level Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {points} / {nextLevelPoints} نقطة للمستوى التالي
            </Text>

            {/* Stat Pills */}
            {/* The fake "attendance %" (streak*20) was removed — it showed
                values >100% and lied to students (F-1). Real stats only. */}
            <View style={styles.statPillsRow}>
              <View style={styles.statPill}>
                <AnimatedNumber
                  value={activeEnrollments.length}
                  style={styles.statPillVal}
                />
                <Text style={styles.statPillLbl}>دورة جارية</Text>
              </View>
              <View style={styles.statPill}>
                <AnimatedNumber
                  value={points}
                  style={styles.statPillVal}
                />
                <Text style={styles.statPillLbl}>نقطة</Text>
              </View>
              <View style={styles.statPill}>
                <AnimatedNumber
                  value={profile?.streak || 0}
                  prefix="🔥 "
                  style={styles.statPillVal}
                />
                <Text style={styles.statPillLbl}>سلسلة</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions Grid */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.quickGrid}>
          <AnimatedPressable
            onPress={() => onNavigate('s-explore')}
            style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.primary + '18' }]}>
              <Compass color={colors.primary} size={22} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.txt }]}>استكشف</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => onNavigate('s-checkin')}
            style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.teal + '18' }]}>
              <QrCode color={colors.teal} size={22} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.txt }]}>سجّل حضورك</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => onNavigate('s-notifications')}
            style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.gold + '22' }]}>
              <Bell color={colors.gold} size={22} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.txt }]}>التنبيهات</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => onNavigate('support')}
            style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#7A30D818' }]}>
              <LifeBuoy color="#7A30D8" size={22} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.txt }]}>المساعدة</Text>
          </AnimatedPressable>
        </Animated.View>

        {/* Facebook Social Banner */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <AnimatedPressable
            onPress={() => {
              RTCHaptics.light();
              Linking.openURL(profile?.branches?.facebook_url || RTC_CONFIG.facebookPageUrl);
            }}
            style={[styles.socialBanner, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={styles.socialLeft}>
              <View style={styles.fbIcon}>
                <Facebook color="#FFFFFF" size={20} />
              </View>
              <View>
                <Text style={[styles.fbTitle, { color: colors.txt }]}>صفحة فرعك الرسمية</Text>
                <Text style={[styles.fbSub, { color: colors.mut }]}>تابع أحدث الجداول ومواعيد المقابلات</Text>
              </View>
            </View>
            <ExternalLink color="#1877F2" size={18} />
          </AnimatedPressable>
        </Animated.View>

        {/* Next Lecture Card */}
        {loading ? (
          <SkeletonLoader height={130} borderRadius={Radii.xl} />
        ) : upcomingTitle ? (
          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <CustomCard style={styles.nextLectureCard}>
              <View style={styles.nextHeader}>
                <View style={[styles.tagPill, { backgroundColor: colors.teal + '18' }]}>
                  <Calendar color={colors.teal} size={14} />
                  <Text style={[styles.tagText, { color: colors.teal }]}>المحاضرة القادمة</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onNavigate('s-courses')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>كورساتي</Text>
                  <ChevronLeft color={colors.primary} size={16} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.nextCourseTitle, { color: colors.txt }]}>
                {upcomingTitle}
              </Text>

              <View style={styles.nextDetails}>
                {upcomingSchedule ? (
                  <View style={styles.nextDetailItem}>
                    <Clock color={colors.mut} size={15} />
                    <Text style={[styles.nextDetailText, { color: colors.mut }]}>
                      {upcomingSchedule}
                    </Text>
                  </View>
                ) : null}

                {upcomingLocation ? (
                  <View style={styles.nextDetailItem}>
                    <MapPin color={colors.mut} size={15} />
                    <Text style={[styles.nextDetailText, { color: colors.mut }]}>
                      {upcomingLocation}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Online batches: show the real join link (fixes F-11) */}
              {upcomingMeetingUrl ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    RTCHaptics.light();
                    Linking.openURL(upcomingMeetingUrl);
                  }}
                  style={[styles.joinOnlineBtn, { backgroundColor: colors.primarySoft }]}
                >
                  <MonitorPlay color={colors.primary} size={16} />
                  <Text style={[styles.joinOnlineText, { color: colors.primary }]}>
                    انضم للمحاضرة أونلاين
                  </Text>
                </TouchableOpacity>
              ) : null}
            </CustomCard>
          </Animated.View>
        ) : (
          <EmptyState
            icon={<Compass color={colors.primary} size={32} />}
            title="لست منضماً لأي دورة تدريبية حالياً"
            subtitle="استكشف الدورات المتاحة في فرعك وسجّل مجاناً لتطوير مهاراتك"
            actionLabel="استكشاف الكورسات"
            onAction={() => onNavigate('s-explore')}
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
    paddingTop: 14,
    paddingBottom: 90,
    gap: 16,
  },
  gradHero: {
    padding: 20,
    borderRadius: Radii.xxl,
    shadowColor: '#00288E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroGreeting: {
    flex: 1,
  },
  greetingSub: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
  },
  greetingName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  greetingBranch: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11.5,
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  levelBadgeSub: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
  },
  levelBadgeNum: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#89F5E7',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10.5,
    marginTop: 5,
    textAlign: 'right',
  },
  statPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statPillVal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  statPillLbl: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    marginTop: 1,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    paddingVertical: 14,
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
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  socialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Radii.xl,
    borderWidth: 1,
  },
  socialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fbIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  fbSub: {
    fontSize: 11,
    marginTop: 1,
  },
  nextLectureCard: {
    gap: 10,
  },
  nextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  nextCourseTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  nextDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 4,
  },
  nextDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextDetailText: {
    fontSize: 12,
  },
  joinOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: Radii.md,
    marginTop: 2,
  },
  joinOnlineText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  noCoursesCard: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  noCoursesTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  noCoursesSub: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  exploreBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
