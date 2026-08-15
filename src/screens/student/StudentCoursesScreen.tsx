/**
 * Student Courses Screen (s-courses)
 * Displays enrolled courses with filters, attendance progress, and session details.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Repository, Enrollment } from '../../data/repositories';
import { useT } from '../../core/i18n';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SelectChips } from '../../components/common/SelectChips';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { CustomButton } from '../../components/common/CustomButton';
import { RTCHaptics } from '../../core/native/haptics';
import { BookOpen, Calendar, Clock, MapPin, ChevronLeft, CheckCircle2, Clock3, MonitorPlay, CalendarCheck } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export interface StudentCoursesScreenProps {
  onNavigate: (screenId: string, params?: any) => void;
}

export const StudentCoursesScreen: React.FC<StudentCoursesScreenProps> = ({ onNavigate }) => {
  const { colors, showToast } = useAppStore();
  const { t } = useT();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'waitlist' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await Repository.fetchMyEnrollments();
      setEnrollments(data);
    } catch (e) {
      showToast(t('coursesLoadError'), 'warn');
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

  const filteredEnrollments = enrollments.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const filterChips = [
    { id: 'all', label: t('filterAll'), count: enrollments.length },
    { id: 'enrolled', label: t('filterOngoing'), count: enrollments.filter((e) => e.status === 'enrolled').length },
    { id: 'waitlist', label: t('filterWaitlist'), count: enrollments.filter((e) => e.status === 'waitlist').length },
    { id: 'completed', label: t('filterCompleted'), count: enrollments.filter((e) => e.status === 'completed').length },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title={t('myCoursesTitle')}
        subtitle={t('myCoursesSubtitle')}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              RTCHaptics.light();
              onNavigate('s-attendance');
            }}
            style={[styles.attendanceBtn, { backgroundColor: colors.card2, borderColor: colors.line }]}
          >
            <CalendarCheck color={colors.primary} size={15} />
            <Text style={[styles.attendanceBtnText, { color: colors.primary }]}>{t('attendanceLog')}</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.filterWrap}>
        <SelectChips items={filterChips} selectedId={filter} onSelect={(id) => setFilter(id as any)} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            <SkeletonLoader height={140} borderRadius={Radii.xl} />
            <SkeletonLoader height={140} borderRadius={Radii.xl} />
            <SkeletonLoader height={140} borderRadius={Radii.xl} />
          </View>
        ) : filteredEnrollments.length ? (
          filteredEnrollments.map((item) => {
            const course = item.batches?.courses;
            const batch = item.batches;
            const sessionsDone = batch?.sessions_done || 0;
            const totalSessions = course?.sessions_count || 8;
            const progress = Math.min(100, Math.round((sessionsDone / totalSessions) * 100));

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => {
                  RTCHaptics.light();
                  if (course?.id) {
                    onNavigate('s-course-detail', { courseId: course.id });
                  }
                }}
              >
                <CustomCard style={styles.courseCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleWrap}>
                      <View style={[styles.categoryPill, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[styles.categoryText, { color: colors.primary }]}>
                          {course?.category || t('trainingGeneral')}
                        </Text>
                      </View>
                      <Text style={[styles.courseTitle, { color: colors.txt }]}>
                        {course?.title || batch?.name}
                      </Text>
                    </View>

                    {item.status === 'enrolled' ? (
                      <View style={[styles.statusBadge, { backgroundColor: colors.teal + '18' }]}>
                        <CheckCircle2 color={colors.teal} size={13} />
                        <Text style={[styles.statusText, { color: colors.teal }]}>{t('statusActive')}</Text>
                      </View>
                    ) : item.status === 'waitlist' ? (
                      <View style={[styles.statusBadge, { backgroundColor: colors.amber + '18' }]}>
                        <Clock3 color={colors.amber} size={13} />
                        <Text style={[styles.statusText, { color: colors.amber }]}>{t('statusWaiting')}</Text>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: colors.mut + '18' }]}>
                        <Text style={[styles.statusText, { color: colors.mut }]}>{t('statusDone')}</Text>
                      </View>
                    )}
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={[styles.progressLabel, { color: colors.mut }]}>
                        {t('lecturesProgress', { done: sessionsDone, total: totalSessions })}
                      </Text>
                      <Text style={[styles.progressPercent, { color: colors.primary }]}>{progress}%</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.card2 }]}>
                      <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: colors.teal }]} />
                    </View>
                  </View>

                  {/* Batch Schedule & Location */}
                  <View style={styles.detailsRow}>
                    {batch?.schedule ? (
                      <View style={styles.detailItem}>
                        <Clock color={colors.mut} size={14} />
                        <Text style={[styles.detailText, { color: colors.mut }]}>{batch.schedule}</Text>
                      </View>
                    ) : null}

                    {batch?.location ? (
                      <View style={styles.detailItem}>
                        <MapPin color={colors.mut} size={14} />
                        <Text style={[styles.detailText, { color: colors.mut }]}>
                          {batch.location} {batch.room ? `(${batch.room})` : ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Online batch join link (fixes F-11) */}
                  {batch?.meeting_url ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        RTCHaptics.light();
                        Linking.openURL(batch.meeting_url as string);
                      }}
                      style={[styles.joinOnlineBtn, { backgroundColor: colors.primarySoft }]}
                    >
                      <MonitorPlay color={colors.primary} size={15} />
                      <Text style={[styles.joinOnlineText, { color: colors.primary }]}>
                        {t('joinOnlineCta')}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </CustomCard>
              </TouchableOpacity>
            );
          })
        ) : (
          <EmptyStateView
            title={t('emptyTabTitle')}
            description={t('emptyTabDesc')}
            icon={<BookOpen color={colors.primary} size={32} />}
            action={
              <CustomButton
                title={t('exploreCoursesCta')}
                onPress={() => onNavigate('s-explore')}
                variant="primary"
                size="mid"
              />
            }
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
  filterWrap: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  attendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  attendanceBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
    gap: 12,
  },
  courseCard: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressSection: {
    gap: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11.5,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 11.5,
  },
  joinOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 9,
    borderRadius: Radii.md,
  },
  joinOnlineText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
