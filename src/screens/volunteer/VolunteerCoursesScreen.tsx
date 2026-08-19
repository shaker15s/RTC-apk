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
  Modal,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Repository, Batch, Course } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { SelectChips } from '../../components/common/SelectChips';
import { CustomButton } from '../../components/common/CustomButton';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import { GraduationCap, Calendar, MapPin, ChevronLeft, BookOpen, Search, PlusCircle, X } from 'lucide-react-native';
import { useT } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const VolunteerCoursesScreen: React.FC<{
  onNavigate: (screenId: string, params?: any) => void;
}> = ({ onNavigate }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { branches, profile } = useAuthStore();
  const { t } = useT();

  const [activeTab, setActiveTab] = useState<'my-batches' | 'all-courses'>('my-batches');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [targetCourse, setTargetCourse] = useState<Course | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupSchedule, setGroupSchedule] = useState('');
  const [groupLocation, setGroupLocation] = useState('');
  const [groupMeeting, setGroupMeeting] = useState('');
  const [creating, setCreating] = useState(false);

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

  const openCreate = (course: Course) => {
    setTargetCourse(course);
    setGroupName(course.title);
    setGroupSchedule('');
    setGroupLocation('');
    setGroupMeeting('');
    setCreateVisible(true);
  };

  const handleCreateGroup = async () => {
    if (!targetCourse || !groupName.trim()) {
      showToast(t('acGroupNameHint'), 'warn');
      return;
    }
    setCreating(true);
    try {
      await Repository.createBatch({
        course_id: targetCourse.id,
        name: groupName.trim(),
        schedule: groupSchedule.trim() || null,
        location: groupLocation.trim() || null,
        meeting_url: groupMeeting.trim() || null,
        instructor_id: profile?.id,
        branch_id: targetCourse.branch_id || profile?.branch_id || branches[0]?.id,
        is_active: true,
        capacity: 30,
      });
      RTCHaptics.success();
      showToast(t('acGroupCreated'), 'ok');
      setCreateVisible(false);
      setActiveTab('my-batches');
      await loadData();
    } catch (e: any) {
      showToast(e?.message || t('acGroupError'), 'err');
    } finally {
      setCreating(false);
    }
  };

  const tabChips = [
    { id: 'my-batches', label: 'مجموعاتي التدريبية' },
    { id: 'all-courses', label: 'استكشاف دورات التطوع' },
  ];

  const branchChips = [
    { id: 'all', label: t('acAllBranches') },
    ...branches.map((b) => ({ id: b.id, label: b.name_ar })),
  ];

  const filteredExploreCourses = allCourses.filter((c) => {
    if (selectedBranchId !== 'all' && c.branch_id && c.branch_id !== selectedBranchId) return false;
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
      <GlassHeader title={t('myCoursesTitle')} subtitle={t('vcSubtitle')} />

      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
        <SelectChips items={tabChips} selectedId={activeTab} onSelect={(id) => setActiveTab(id as any)} />
      </View>

      {activeTab === 'all-courses' ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 6, gap: 8 }}>
          <TextInputField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحث عن دورة للتطوع..."
            icon={<Search color={colors.mut} size={18} />}
          />
          <SelectChips
            items={branchChips}
            selectedId={selectedBranchId}
            onSelect={setSelectedBranchId}
          />
        </View>
      ) : null}

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
                  onNavigate('v-batches', { selectedBatchId: batch.id });
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
          filteredExploreCourses.length ? (
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
                          {course.branches?.name_ar || t('acAllBranches')}
                        </Text>
                      </View>
                    </View>

                    <CustomButton
                      title={t('newGroupCta')}
                      variant="primary"
                      size="sm"
                      icon={<PlusCircle color="#FFFFFF" size={14} />}
                      onPress={() => openCreate(course)}
                    />
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

      <Modal visible={createVisible} transparent animationType="slide" onRequestClose={() => setCreateVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>{t('createGroupTitle')}</Text>
              <TouchableOpacity onPress={() => setCreateVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.mut, fontSize: 12 }}>{targetCourse?.title}</Text>
            <TextInputField label={t('acGroupName')} value={groupName} onChangeText={setGroupName} />
            <TextInputField label={t('acSchedule')} value={groupSchedule} onChangeText={setGroupSchedule} />
            <TextInputField label={t('acVenue')} value={groupLocation} onChangeText={setGroupLocation} />
            <TextInputField label={t('meetingUrlLabel')} value={groupMeeting} onChangeText={setGroupMeeting} />
            <CustomButton title={t('acOpenRegistration')} onPress={handleCreateGroup} variant="teal" size="big" loading={creating} />
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    padding: 24,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
});
