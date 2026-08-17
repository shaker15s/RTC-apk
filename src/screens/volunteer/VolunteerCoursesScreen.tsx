/**
 * Volunteer Courses Screen (v-courses)
 * Displays courses and curriculums managed by the volunteer.
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
import { Repository, Batch, Course } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SelectChips } from '../../components/common/SelectChips';
import { CustomButton } from '../../components/common/CustomButton';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import { GraduationCap, Calendar, Users, MapPin, ChevronLeft, BookOpen, PlusCircle } from 'lucide-react-native';
import { useT } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const VolunteerCoursesScreen: React.FC<{
  onNavigate: (screenId: string, params?: any) => void;
}> = ({ onNavigate }) => {
  const { colors } = useAppStore();
  const { t } = useT();

  const [activeTab, setActiveTab] = useState<'my-batches' | 'all-courses'>('my-batches');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [myBatches, courses] = await Promise.all([
        Repository.fetchMyBatches(),
        Repository.fetchCourses(true),
      ]);
      setBatches(myBatches);
      setAllCourses(courses);
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

  const tabChips = [
    { id: 'my-batches', label: 'مجموعاتي التدريبية' },
    { id: 'all-courses', label: 'استكشاف دورات التطوع' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('myCoursesTitle')} subtitle={t('vcSubtitle')} />

      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
        <SelectChips items={tabChips} selectedId={activeTab} onSelect={(id) => setActiveTab(id as any)} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            <SkeletonLoader height={130} borderRadius={Radii.xl} />
            <SkeletonLoader height={130} borderRadius={Radii.xl} />
          </View>
        ) : activeTab === 'my-batches' ? (
          batches.length ? (
            batches.map((batch) => (
              <TouchableOpacity
                key={batch.id}
                activeOpacity={0.85}
                onPress={() => {
                  RTCHaptics.light();
                  if (batch.courses?.id) {
                    onNavigate('s-course-detail', { courseId: batch.courses.id });
                  }
                }}
              >
                <CustomCard style={styles.courseCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleWrap}>
                      <View style={[styles.catBadge, { backgroundColor: colors.teal + '18' }]}>
                        <Text style={[styles.catText, { color: colors.teal }]}>
                          {batch.courses?.category || t('vcCertified')}
                        </Text>
                      </View>
                      <Text style={[styles.courseTitle, { color: colors.txt }]}>
                        {batch.courses?.title || batch.name}
                      </Text>
                      <Text style={[styles.batchName, { color: colors.mut }]}>{batch.name}</Text>
                    </View>
                  </View>

                  <View style={styles.footerRow}>
                    <View style={styles.footerLeft}>
                      <View style={styles.footerItem}>
                        <Calendar color={colors.mut} size={14} />
                        <Text style={[styles.footerItemText, { color: colors.mut }]}>
                          {batch.courses?.sessions_count || 8} {t('lecturesSuffix')}
                        </Text>
                      </View>
                      {batch.branches?.name_ar ? (
                        <View style={styles.footerItem}>
                          <MapPin color={colors.mut} size={14} />
                          <Text style={[styles.footerItemText, { color: colors.mut }]}>{batch.branches.name_ar}</Text>
                        </View>
                      ) : null}
                    </View>

                    <ChevronLeft color={colors.primary} size={18} />
                  </View>
                </CustomCard>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyStateView
              title={t('vcEmptyTitle')}
              description={t('vcEmptyDesc')}
              icon={<GraduationCap color={colors.primary} size={32} />}
            />
          )
        ) : (
          allCourses.length ? (
            allCourses.map((course) => (
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
                      <View style={[styles.catBadge, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[styles.catText, { color: colors.primary }]}>
                          {course.category || 'دورة تدريبية'}
                        </Text>
                      </View>
                      <Text style={[styles.courseTitle, { color: colors.txt }]}>
                        {course.title}
                      </Text>
                      {course.description ? (
                        <Text style={[styles.batchName, { color: colors.mut }]} numberOfLines={2}>
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
                          {course.sessions_count || 8} {t('lecturesSuffix')}
                        </Text>
                      </View>
                      <View style={styles.footerItem}>
                        <MapPin color={colors.mut} size={14} />
                        <Text style={[styles.footerItemText, { color: colors.mut }]}>
                          {course.branches?.name_ar || 'جميع الفروع'}
                        </Text>
                      </View>
                    </View>

                    <ChevronLeft color={colors.primary} size={18} />
                  </View>
                </CustomCard>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyStateView
              title="لا توجد دورات متاحة حالياً"
              description="سيتم إدراج الدورات التدريبية المتاحة فور اعتمادها من إدارة المركز."
              icon={<BookOpen color={colors.primary} size={32} />}
            />
          )
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
    gap: 12,
  },
  courseCard: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  catText: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  batchName: {
    fontSize: 12,
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
    gap: 14,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerItemText: {
    fontSize: 11.5,
  },
});
