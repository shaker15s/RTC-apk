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
import { useAuthStore } from '../../state/authStore';
import { Repository, Enrollment, Course } from '../../data/repositories';
import { RPC } from '../../data/rpc';
import { useT } from '../../core/i18n';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { SelectChips } from '../../components/common/SelectChips';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { CustomButton } from '../../components/common/CustomButton';
import { RTCHaptics } from '../../core/native/haptics';
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  CheckCircle2,
  Clock3,
  MonitorPlay,
  CalendarCheck,
  Star,
  Search,
  Compass,
  Sparkles,
  Award,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export interface StudentCoursesScreenProps {
  onNavigate: (screenId: string, params?: any) => void;
}

export const StudentCoursesScreen: React.FC<StudentCoursesScreenProps> = ({ onNavigate }) => {
  const { colors, showToast } = useAppStore();
  const { branches } = useAuthStore();
  const { t } = useT();

  const [activeMainTab, setActiveMainTab] = useState<'my-courses' | 'explore'>('my-courses');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [attendanceByCourse, setAttendanceByCourse] = useState<Record<string, { committed: number; total: number }>>({});
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'waitlist' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [myEnrollments, courses, attendance] = await Promise.all([
        Repository.fetchMyEnrollments(),
        Repository.fetchCourses(true),
        RPC.getMyAttendance().catch(() => []),
      ]);
      setEnrollments(myEnrollments);
      setAllCourses(courses);
      const grouped: Record<string, { committed: number; total: number }> = {};
      (attendance || []).forEach((row) => {
        const key = row.course_id || row.course_title || 'unknown';
        if (!grouped[key]) grouped[key] = { committed: 0, total: 0 };
        grouped[key].total += 1;
        if (row.status === 'present' || row.status === 'late') grouped[key].committed += 1;
      });
      setAttendanceByCourse(grouped);
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

  const mainTabs = [
    { id: 'my-courses', label: 'دوراتي المسجل بها' },
    { id: 'explore', label: 'استكشاف الدورات والتسجيل 🚀' },
  ];

  // Branch filter chips
  const branchChips = [
    { id: 'all', label: t('acAllBranches') },
    ...branches.map((b) => ({ id: b.id, label: b.name_ar })),
  ];

  // Category list derived from courses
  const categories = Array.from(new Set(allCourses.map((c) => c.category).filter(Boolean)));
  const categoryChips = [
    { id: 'all', label: t('exAllCats') },
    ...categories.map((c) => ({ id: c, label: c })),
  ];

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

  const filteredExploreCourses = allCourses.filter((c) => {
    if (selectedBranchId !== 'all' && c.branch_id && c.branch_id !== selectedBranchId) return false;
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchCat = c.category?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCat;
    }
    return true;
  });

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

      {/* Main Mode Tabs */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
        <SelectChips
          items={mainTabs}
          selectedId={activeMainTab}
          onSelect={(id) => {
            RTCHaptics.selection();
            setActiveMainTab(id as any);
          }}
        />
      </View>

      {activeMainTab === 'my-courses' ? (
        <View style={styles.filterWrap}>
          <SelectChips items={filterChips} selectedId={filter} onSelect={(id) => setFilter(id as any)} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 6, gap: 8 }}>
          <TextInputField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحث عن دورة، تخصص، مهارة..."
            icon={<Search color={colors.mut} size={18} />}
          />
          <SelectChips
            items={branchChips}
            selectedId={selectedBranchId}
            onSelect={setSelectedBranchId}
          />
          {categories.length > 1 ? (
            <SelectChips
              items={categoryChips}
              selectedId={selectedCategory}
              onSelect={setSelectedCategory}
            />
          ) : null}
        </View>
      )}

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
        ) : activeMainTab === 'my-courses' ? (
          filteredEnrollments.length ? (
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

                  {/* Action buttons row: Rate course & Join online */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => {
                        RTCHaptics.light();
                        onNavigate('s-attendance');
                      }}
                      style={[styles.rateBtn, { backgroundColor: colors.teal + '14', borderColor: colors.teal + '40' }]}
                    >
                      <CalendarCheck color={colors.teal} size={14} />
                      <Text style={[styles.rateBtnText, { color: colors.teal }]}>{t('viewMyAttendance')}</Text>
                    </TouchableOpacity>
                    {course?.id ? (
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => {
                          RTCHaptics.light();
                          onNavigate('s-course-rating', { courseId: course.id, courseTitle: course.title });
                        }}
                        style={[styles.rateBtn, { backgroundColor: colors.goldSoft, borderColor: colors.gold + '40' }]}
                      >
                        <Star color={colors.gold} size={14} fill={colors.gold} />
                        <Text style={[styles.rateBtnText, { color: colors.gold }]}>تقييم الدورة</Text>
                      </TouchableOpacity>
                    ) : null}

                    {batch?.meeting_url ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          RTCHaptics.light();
                          Linking.openURL(batch.meeting_url as string);
                        }}
                        style={[styles.joinOnlineBtn, { backgroundColor: colors.primarySoft, flex: 1 }]}
                      >
                        <MonitorPlay color={colors.primary} size={15} />
                        <Text style={[styles.joinOnlineText, { color: colors.primary }]}>
                          {t('joinOnlineCta')}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </CustomCard>
              </TouchableOpacity>
            );
          })
        ) : (
          <EmptyStateView
            title="لا توجد دورات مسجل بها حالياً"
            description="لم تقم بالانضمام لأي دورة حتى الآن. يمكنك استكشاف الدورات التدريبية المتاحة والانضمام لدفعتك القادمة الآن!"
            icon={<BookOpen color={colors.primary} size={32} />}
            action={
              <CustomButton
                title="استكشاف الدورات والتسجيل 🚀"
                onPress={() => setActiveMainTab('explore')}
                variant="primary"
                size="mid"
              />
            }
          />
        )
      ) : filteredExploreCourses.length ? (
        filteredExploreCourses.map((course) => (
            <TouchableOpacity
              key={course.id}
              activeOpacity={0.85}
              onPress={() => {
                RTCHaptics.light();
                onNavigate('s-course-detail', { courseId: course.id });
              }}
            >
              <CustomCard style={styles.courseCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleWrap}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View style={[styles.categoryPill, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[styles.categoryText, { color: colors.primary }]}>
                          {course.category || t('trainingGeneral')}
                        </Text>
                      </View>
                      {course.branches?.name_ar ? (
                        <View style={[styles.categoryPill, { backgroundColor: colors.teal + '18' }]}>
                          <Text style={[styles.categoryText, { color: colors.teal }]}>
                            فرع {course.branches.name_ar}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.courseTitle, { color: colors.txt }]}>
                      {course.title}
                    </Text>
                    {course.description ? (
                      <Text style={{ fontSize: 12.5, color: colors.mut, lineHeight: 18 }} numberOfLines={2}>
                        {course.description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.footerRow}>
                  <View style={styles.footerLeft}>
                    <View style={styles.footerItem}>
                      <Calendar color={colors.mut} size={14} />
                      <Text style={[styles.footerItemText, { color: colors.mut }]}>
                        {course.sessions_count || 8} محاضرات
                      </Text>
                    </View>
                    {course.instructor_name ? (
                      <View style={styles.footerItem}>
                        <Text style={[styles.footerItemText, { color: colors.mut }]}>
                          المدرب: {course.instructor_name}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <CustomButton
                    title="التفاصيل والتسجيل 🚀"
                    variant="primary"
                    size="sm"
                    onPress={() => onNavigate('s-course-detail', { courseId: course.id })}
                  />
                </View>
              </CustomCard>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyStateView
            title="لا توجد نتائج مطابقة"
            description="جرب البحث بكلمات أخرى أو اختر فرعاً مختلفاً لاستعراض الدورات المتاحة."
            icon={<Search color={colors.primary} size={32} />}
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
    paddingBottom: 140,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    marginTop: 2,
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerItemText: {
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
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  rateBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
