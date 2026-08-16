/**
 * Admin Courses & Batches Management Screen (a-courses)
 * Create and edit courses, create new batches, assign instructors, and set schedules.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Repository, Course, Batch, Profile } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomButton } from '../../components/common/CustomButton';
import { SelectChips } from '../../components/common/SelectChips';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import {
  BookOpen,
  PlusCircle,
  Calendar,
  MapPin,
  Users,
  Clock,
  Layers,
  ChevronLeft,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { useT, dateLocale } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const AdminCoursesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { t } = useT();
  const { branches } = useAuthStore();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Course Modal State
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState(t('acProgTech'));
  const [newSessions, setNewSessions] = useState('8');
  const [newDescription, setNewDescription] = useState('');
  const [creatingCourse, setCreatingCourse] = useState(false);

  // New Batch Modal State
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [selectedCourseForBatch, setSelectedCourseForBatch] = useState<Course | null>(null);
  const [batchName, setBatchName] = useState('');
  const [batchSchedule, setBatchSchedule] = useState('');
  const [batchLocation, setBatchLocation] = useState('');
  const [batchBranchId, setBatchBranchId] = useState(branches[0]?.id || '');
  const [creatingBatch, setCreatingBatch] = useState(false);

  const loadCourses = async () => {
    try {
      const data = await Repository.fetchCourses(true);
      setCourses(data);
    } catch (e) {
      showToast(t('coursesLoadError'), 'warn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
  };

  const handleCreateCourse = async () => {
    if (!newTitle.trim()) {
      showToast(t('acCourseNameHint'), 'warn');
      return;
    }

    setCreatingCourse(true);
    try {
      await Repository.createCourse({
        title: newTitle.trim(),
        category: newCategory,
        sessions_count: parseInt(newSessions, 10) || 8,
        description: newDescription.trim() || undefined,
        branch_id: branches[0]?.id,
      });

      RTCHaptics.success();
      showToast(t('acCourseCreated'), 'ok');
      setCourseModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      await loadCourses();
    } catch (e: any) {
      showToast(e?.message || t('acCourseError'), 'err');
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!selectedCourseForBatch || !batchName.trim()) {
      showToast(t('acGroupNameHint'), 'warn');
      return;
    }

    setCreatingBatch(true);
    try {
      await Repository.createBatch({
        course_id: selectedCourseForBatch.id,
        name: batchName.trim(),
        schedule: batchSchedule.trim() || undefined,
        location: batchLocation.trim() || undefined,
        branch_id: batchBranchId,
      });

      RTCHaptics.success();
      showToast(t('acGroupCreated'), 'ok');
      setBatchModalVisible(false);
      setBatchName('');
      setBatchSchedule('');
      setBatchLocation('');
    } catch (e: any) {
      showToast(e?.message || t('acGroupError'), 'err');
    } finally {
      setCreatingBatch(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title={t('acTitle')}
        subtitle={t('acSubtitle')}
        showBack
        onBack={onBack}
        rightAction={
          <TouchableOpacity
            onPress={() => {
              RTCHaptics.light();
              setCourseModalVisible(true);
            }}
            style={[styles.addHeaderBtn, { backgroundColor: colors.primarySoft }]}
          >
            <PlusCircle color={colors.primary} size={16} />
            <Text style={[styles.addHeaderText, { color: colors.primary }]}>{t('acNewCourse')}</Text>
          </TouchableOpacity>
        }
      />

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
        ) : courses.length ? (
          courses.map((course) => (
            <CustomCard key={course.id} style={styles.courseCard}>
              <View style={styles.cardHeader}>
                <View style={styles.titleWrap}>
                  <View style={[styles.catBadge, { backgroundColor: colors.teal + '18' }]}>
                    <Text style={[styles.catText, { color: colors.teal }]}>{course.category || t('acGeneral')}</Text>
                  </View>
                  <Text style={[styles.courseTitle, { color: colors.txt }]}>{course.title}</Text>
                </View>
              </View>

              {course.description ? (
                <Text style={[styles.descText, { color: colors.mut }]} numberOfLines={2}>
                  {course.description}
                </Text>
              ) : null}

              <View style={styles.specsRow}>
                <View style={styles.specItem}>
                  <Calendar color={colors.mut} size={14} />
                  <Text style={[styles.specText, { color: colors.mut }]}>{course.sessions_count} {t('lecturesSuffix')}</Text>
                </View>
                <View style={styles.specItem}>
                  <MapPin color={colors.mut} size={14} />
                  <Text style={[styles.specText, { color: colors.mut }]}>
                    {course.branches?.name_ar || t('acAllBranches')}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <CustomButton
                  title={t('acNewGroup')}
                  onPress={() => {
                    RTCHaptics.light();
                    setSelectedCourseForBatch(course);
                    setBatchName(t('acBatchPrefix', { d: new Date().toLocaleDateString(dateLocale(), { month: 'short', year: 'numeric' }) }));
                    setBatchModalVisible(true);
                  }}
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>
            </CustomCard>
          ))
        ) : (
          <EmptyStateView
            title={t('acEmptyTitle')}
            description={t('acEmptyDesc')}
            icon={<BookOpen color={colors.primary} size={32} />}
          />
        )}
      </ScrollView>

      {/* New Course Modal */}
      <Modal visible={courseModalVisible} transparent animationType="slide" onRequestClose={() => setCourseModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>{t('acNewCourseModal')}</Text>
              <TouchableOpacity onPress={() => setCourseModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <TextInputField
              label={t('acCourseName')}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder={t('acCoursePlaceholder')}
              required
            />

            <TextInputField
              label={t('acCategory')}
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder={t('acCategoryPlaceholder')}
            />

            <TextInputField
              label={t('acSessionsCount')}
              value={newSessions}
              onChangeText={setNewSessions}
              keyboardType="numeric"
              placeholder="8"
            />

            <TextInputField
              label={t('acDescription')}
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder={t('acDescriptionPlaceholder')}
              multiline
              numberOfLines={3}
            />

            <CustomButton
              title={t('acSaveCourse')}
              onPress={handleCreateCourse}
              variant="primary"
              size="big"
              loading={creatingCourse}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>

      {/* New Batch Modal */}
      <Modal visible={batchModalVisible} transparent animationType="slide" onRequestClose={() => setBatchModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>
                {t('acNewBatchTitle', { course: selectedCourseForBatch?.title })}
              </Text>
              <TouchableOpacity onPress={() => setBatchModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <TextInputField
              label={t('acGroupName')}
              value={batchName}
              onChangeText={setBatchName}
              placeholder={t('acGroupPlaceholder')}
              required
            />

            <TextInputField
              label={t('acSchedule')}
              value={batchSchedule}
              onChangeText={setBatchSchedule}
              placeholder={t('acSchedulePlaceholder')}
            />

            <TextInputField
              label={t('acVenue')}
              value={batchLocation}
              onChangeText={setBatchLocation}
              placeholder={t('acVenuePlaceholder')}
            />

            <CustomButton
              title={t('acOpenRegistration')}
              onPress={handleCreateBatch}
              variant="teal"
              size="big"
              loading={creatingBatch}
              style={{ marginTop: 8 }}
            />
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
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  addHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
  courseCard: {
    padding: 16,
    gap: 10,
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
  descText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 6,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  specText: {
    fontSize: 11.5,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
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
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
});
