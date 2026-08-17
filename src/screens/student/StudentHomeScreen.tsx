/**
 * StudentHomeScreen — Mission Control / Today View for Masar RTC Students.
 * Built according to Apple HIG & Google Material 3 standards.
 * Centers the experience around the student's next immediate action:
 * 1. Is there an active session right now? -> Instant Check-in CTA
 * 2. When is my next lecture? -> Upcoming session card with location & time
 * 3. What is my certificate eligibility progress?
 * 4. Key learning metrics (Points, Level, Attendance Rate)
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Repository, Enrollment } from '../../data/repositories';
import { RPC } from '../../data/rpc';
import { ScreenScaffold } from '../../components/layout/ScreenScaffold';
import { SectionHeader } from '../../components/common/SectionHeader';
import { StatusPill } from '../../components/common/StatusPill';
import { MetricCard } from '../../components/common/MetricCard';
import { ResponsiveGrid } from '../../components/common/ResponsiveGrid';
import { PrimaryActionCard } from '../../components/common/PrimaryActionCard';
import { ListRow } from '../../components/common/ListRow';
import { CustomCard } from '../../components/common/CustomCard';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import { RTC_CONFIG } from '../../core/config';
import { useT, dateLocale } from '../../core/i18n';
import { useRealtimeNotifications } from '../../data/realtime/useRealtimeNotifications';
import { Radii, Spacing, Shadows, TouchTarget } from '../../core/theme/tokens';
import {
  Compass,
  QrCode,
  Award,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Flame,
  FileQuestion,
  ChevronLeft,
  GraduationCap,
  Layers,
  Facebook,
  ExternalLink,
  CalendarCheck,
} from 'lucide-react-native';

export interface StudentHomeScreenProps {
  onNavigate: (screenId: string, params?: any) => void;
}

export const StudentHomeScreen: React.FC<StudentHomeScreenProps> = ({ onNavigate }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { t } = useT();
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
      showToast(t('homeLoadError'), 'warn');
    }

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

  // Gamification stats
  const points = profile?.points || 0;
  const level = Math.min(10, Math.floor(points / 100) + 1);
  const nextLevelPoints = level * 100;
  const currentLevelBase = (level - 1) * 100;
  const progressPercent = Math.min(100, Math.max(0, ((points - currentLevelBase) / 100) * 100));

  const activeEnrollments = enrollments.filter((e) => e.status === 'enrolled');
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed');

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : 'مساء الخير';
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'يا بطل';

  return (
    <ScreenScaffold
      title={`${greeting}، ${firstName} 👋`}
      subtitle={profile?.branch_name ? `فرع ${profile.branch_name}` : 'مسار للتدريب'}
      showNotif
      onNotifPress={() => onNavigate('s-notifications')}
      showAvatar
      onAvatarPress={() => onNavigate('s-profile')}
      refreshing={refreshing}
      onRefresh={onRefresh}
      loading={loading}
    >
      {/* 1. Hero Next Action: Active Session OR Upcoming Lecture OR Explore */}
      {nextSession ? (
        <PrimaryActionCard
          title={nextSession.course_title || 'محاضرتك القادمة'}
          subtitle={`${nextSession.branch_name || profile?.branch_name || 'الفرع'} • ${nextSession.date || 'اليوم'} ${nextSession.time ? `• ${nextSession.time}` : ''}`}
          badge={nextSession.is_active ? '🔴 الجلسة نشطة الآن' : 'المحاضرة القادمة'}
          actionLabel={nextSession.is_active ? 'تسجيل الحضور بالرمز' : 'عرض التفاصيل'}
          onPress={() => {
            if (nextSession.is_active) {
              onNavigate('s-checkin');
            } else if (nextSession.course_id) {
              onNavigate('s-course-detail', { courseId: nextSession.course_id });
            }
          }}
          icon={<QrCode color="#FFFFFF" size={24} />}
          gradientColors={nextSession.is_active ? ['#00554E', '#00288E'] : undefined}
        />
      ) : activeEnrollments.length > 0 ? (
        <PrimaryActionCard
          title={activeEnrollments[0]?.batches?.courses?.title || 'دوراتي النشطة'}
          subtitle={`أنت مسجل في ${activeEnrollments.length} ${activeEnrollments.length === 1 ? 'دورة تدريبية' : 'دورات تدريبية'}`}
          badge="مسار التعلم"
          actionLabel="متابعة الدورات"
          onPress={() => onNavigate('s-courses')}
          icon={<GraduationCap color="#FFFFFF" size={24} />}
        />
      ) : (
        <PrimaryActionCard
          title="ابدأ مسار تدريبك اليوم!"
          subtitle="استكشف الدورات المتاحة في فروع رسالة وطوّر مهاراتك مجاناً."
          badge="فرصة تدريبية"
          actionLabel="استكشف الدورات"
          onPress={() => onNavigate('s-explore')}
          icon={<Compass color="#FFFFFF" size={24} />}
        />
      )}

      {/* 2. Key Metrics Grid */}
      <ResponsiveGrid spacing={Spacing.md} minItemWidth={140} maxColumns={2}>
        <MetricCard
          label="النقاط"
          value={points}
          suffix=" نقطة"
          color={colors.primary}
          icon={<Flame color={colors.primary} size={18} />}
          onPress={() => onNavigate('s-points')}
        />
        <MetricCard
          label="المستوى"
          value={`المستوى ${level}`}
          sublabel={`${Math.max(0, nextLevelPoints - points)} نقطة للمستوى القادم`}
          color={colors.gold}
          icon={<Sparkles color={colors.gold} size={18} />}
          onPress={() => onNavigate('s-points')}
        />
      </ResponsiveGrid>

      {/* 3. Quick Action Hub */}
      <View style={styles.sectionWrap}>
        <SectionHeader title="الإجراءات السريعة" />
        <ResponsiveGrid spacing={Spacing.md} minItemWidth={140} maxColumns={2}>
          <TouchableOpacity
            style={[styles.actionGridItem, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('s-checkin');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.primarySoft }]}>
              <QrCode color={colors.primary} size={22} />
            </View>
            <Text style={[styles.actionGridLabel, { color: colors.txt }]}>تسجيل الحضور</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionGridItem, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('s-attendance');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.tealSoft }]}>
              <CalendarCheck color={colors.teal} size={22} />
            </View>
            <Text style={[styles.actionGridLabel, { color: colors.txt }]}>سجل حضوري</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionGridItem, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('s-explore');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.tealSoft }]}>
              <Compass color={colors.teal} size={22} />
            </View>
            <Text style={[styles.actionGridLabel, { color: colors.txt }]}>استكشاف الدورات</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionGridItem, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('s-certs');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.goldSoft }]}>
              <Award color={colors.gold} size={22} />
            </View>
            <Text style={[styles.actionGridLabel, { color: colors.txt }]}>شهاداتي</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionGridItem, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('s-excuse');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.amberSoft }]}>
              <FileQuestion color={colors.amber} size={22} />
            </View>
            <Text style={[styles.actionGridLabel, { color: colors.txt }]}>تقديم عذر</Text>
          </TouchableOpacity>
        </ResponsiveGrid>
      </View>

      {/* 4. Active Enrollments List */}
      <View style={styles.sectionWrap}>
        <SectionHeader
          title="دوراتي الحالية"
          badge={activeEnrollments.length}
          actionLabel="عرض الكل"
          onAction={() => onNavigate('s-courses')}
        />

        {activeEnrollments.length === 0 ? (
          <EmptyStateView
            title="لا توجد دورات نشطة حالياً"
            description="لم تقم بالانضمام إلى أي دورة بعد. تصفح الدورات التدريبية المتاحة وانضم إلى دفعتك القادمة."
            icon={<BookOpen color={colors.mut} size={32} />}
          />
        ) : (
          <View style={styles.coursesList}>
            {activeEnrollments.slice(0, 3).map((item) => (
              <CustomCard
                key={item.id}
                onPress={() => {
                  if (item.batches?.course_id) {
                    onNavigate('s-course-detail', { courseId: item.batches.course_id });
                  }
                }}
                style={styles.courseCard}
              >
                <View style={styles.courseCardHeader}>
                  <View style={styles.courseTitleWrap}>
                    <Text style={[styles.courseTitle, { color: colors.txt }]} numberOfLines={1}>
                      {item.batches?.courses?.title || 'دورة تدريبية'}
                    </Text>
                    <Text style={[styles.courseMeta, { color: colors.mut }]} numberOfLines={1}>
                      {item.batches?.name || item.batches?.branches?.name_ar || 'مسار التدريب'}
                    </Text>
                  </View>
                  <StatusPill label="قيد الدراسة" variant="enrolled" size="sm" />
                </View>
              </CustomCard>
            ))}
          </View>
        )}
      </View>

      {/* 5. Official Social & Community Links */}
      <View style={styles.communityCardWrap}>
        <CustomCard style={[styles.communityCard, { backgroundColor: colors.card2, borderColor: colors.line }]}>
          <View style={styles.communityRow}>
            <View style={styles.communityText}>
              <Text style={[styles.communityTitle, { color: colors.txt }]}>مجتمع مراكز رسالة للتدريب</Text>
              <Text style={[styles.communityDesc, { color: colors.mut }]}>
                تابع مواعيد الدورات الجديدة والإعلانات الرسمية على صفحتنا
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.facebookBtn, { backgroundColor: '#1877F2' }]}
              onPress={() => {
                RTCHaptics.selection();
                Linking.openURL(RTC_CONFIG.facebookPageUrl);
              }}
              accessibilityRole="button"
              accessibilityLabel="صفحة فيسبوك"
            >
              <Facebook color="#FFFFFF" size={18} />
              <Text style={styles.facebookBtnText}>متابعة</Text>
            </TouchableOpacity>
          </View>
        </CustomCard>
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sectionWrap: {
    gap: Spacing.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionGridItem: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 90,
    justifyContent: 'center',
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGridLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  coursesList: {
    gap: Spacing.sm,
  },
  courseCard: {
    padding: Spacing.md,
  },
  courseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseTitleWrap: {
    flex: 1,
    gap: 2,
    paddingEnd: Spacing.sm,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  courseMeta: {
    fontSize: 12,
  },
  communityCardWrap: {
    marginTop: Spacing.xs,
  },
  communityCard: {
    padding: Spacing.lg,
    borderWidth: 1,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  communityText: {
    flex: 1,
    gap: 2,
  },
  communityTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  communityDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  facebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    minHeight: TouchTarget.minHeight,
  },
  facebookBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
