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

  // Branch filter for courses
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // New Course Modal State
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState(t('acProgTech'));
  const [newSessions, setNewSessions] = useState('8');
  const [newDescription, setNewDescription] = useState('');
  const [newBranchId, setNewBranchId] = useState(branches[0]?.id || '');
  const [newInstructor, setNewInstructor] = useState('');
  const [creatingCourse, setCreatingCourse] = useState(false);

  // New Batch Modal State
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [selectedCourseForBatch, setSelectedCourseForBatch] = useState<Course | null>(null);
  const [batchName, setBatchName] = useState('');
  const [batchSchedule, setBatchSchedule] = useState('');
  const [batchLocation, setBatchLocation] = useState('');
  const [batchBranchId, setBatchBranchId] = useState(branches[0]?.id || '');
  const [batchInstructor, setBatchInstructor] = useState('');
  const [creatingBatch, setCreatingBatch] = useState(false);

  // Edit Course Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editSessions, setEditSessions] = useState('8');
  const [updatingCourse, setUpdatingCourse] = useState(false);

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
      const slug = newTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `course-${Date.now()}`;
      await Repository.createCourse({
        title: newTitle.trim(),
        slug: `${slug}-${Date.now().toString(36)}`,
        category: newCategory,
        sessions_count: parseInt(newSessions, 10) || 8,
        description: newDescription.trim() || undefined,
        instructor_name: newInstructor.trim() || undefined,
        branch_id: newBranchId || branches[0]?.id,
      });

      RTCHaptics.success();
      showToast(t('acCourseCreated'), 'ok');
      setCourseModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      setNewInstructor('');
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
        name: batchInstructor.trim() ? `${batchName.trim()} (${batchInstructor.trim()})` : batchName.trim(),
        schedule: batchSchedule.trim() || undefined,
        location: batchLocation.trim() || undefined,
        branch_id: batchBranchId || selectedCourseForBatch.branch_id || branches[0]?.id,
      });

      RTCHaptics.success();
      showToast(t('acGroupCreated'), 'ok');
      setBatchModalVisible(false);
      setBatchName('');
      setBatchSchedule('');
      setBatchLocation('');
      setBatchInstructor('');
      await loadCourses();
    } catch (e: any) {
      showToast(e?.message || t('acGroupError'), 'err');
    } finally {
      setCreatingBatch(false);
    }
  };

  const handleUpdateCourseSessions = async () => {
    if (!editingCourse) return;
    const count = parseInt(editSessions, 10);
    if (!count || count < 1) {
      showToast('يرجى إدخال عدد محاضرات صحيح', 'warn');
      return;
    }
    setUpdatingCourse(true);
    try {
      await Repository.updateCourse(editingCourse.id, {
        sessions_count: count,
      });
      RTCHaptics.success();
      showToast('تم تحديث عدد محاضرات المقرر بنجاح! 🚀', 'ok');
      setEditModalVisible(false);
      await loadCourses();
    } catch (e: any) {
      showToast(e?.message || 'تعذر تعديل المقرر', 'err');
    } finally {
      setUpdatingCourse(false);
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

      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
        <SelectChips
          items={[
            { id: 'all', label: 'كل الفروع' },
            ...branches.map((b) => ({ id: b.id, label: b.name_ar })),
          ]}
          selectedId={selectedBranchFilter}
          onSelect={setSelectedBranchFilter}
        />
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
        ) : courses.filter(c => selectedBranchFilter === 'all' || !c.branch_id || c.branch_id === selectedBranchFilter).length ? (
          courses
            .filter(c => selectedBranchFilter === 'all' || !c.branch_id || c.branch_id === selectedBranchFilter)
            .map((course) => (
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
              <View style={[styles.actionsRow, { gap: 8 }]}>
                <CustomButton
                  title="✏️ تعديل المقرر"
                  onPress={() => {
                    RTCHaptics.light();
                    setEditingCourse(course);
                    setEditSessions(String(course.sessions_count || 8));
                    setEditModalVisible(true);
                  }}
                  variant="soft"
                  size="sm"
                  style={{ flex: 1 }}
                />
                <CustomButton
                  title={t('acNewGroup')}
                  onPress={() => {
                    RTCHaptics.light();
                    setSelectedCourseForBatch(course);
                    setBatchName(t('acBatchPrefix', { d: new Date().toLocaleDateString(dateLocale(), { month: 'short', year: 'numeric' }) }));
                    setBatchBranchId(course.branch_id || branches[0]?.id || '');
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
              label="اسم المدرب المسؤول (اختياري)"
              value={newInstructor}
              onChangeText={setNewInstructor}
              placeholder="مثال: أ. أحمد سامي"
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

            {branches.length > 0 ? (
              <View style={{ gap: 6, marginVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.txt }}>الفرع:</Text>
                <SelectChips
                  items={branches.map(b => ({ id: b.id, label: b.name_ar }))}
                  selectedId={newBranchId}
                  onSelect={setNewBranchId}
                />
              </View>
            ) : null}

            <TextInputField
              label={t('acDescription')}
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder={t('acDescriptionPlaceholder')}
              multiline
              numberOfLines={2}
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
                {t('acNewBatchTitle', { course: selectedCourseForBatch?.title || '' })}
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
              label="مدرب المجموعة"
              value={batchInstructor}
              onChangeText={setBatchInstructor}
              placeholder="اسم المدرب"
            />

            <TextInputField
              label={t('acSchedule')}
              value={batchSchedule}
              onChangeText={setBatchSchedule}
              placeholder="مثال: السبت والثلاثاء 6:00 م"
            />

            <TextInputField
              label={t('acVenue')}
              value={batchLocation}
              onChangeText={setBatchLocation}
              placeholder="القاعة أو الرابط"
            />

            {branches.length > 0 ? (
              <View style={{ gap: 6, marginVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.txt }}>الفرع:</Text>
                <SelectChips
                  items={branches.map(b => ({ id: b.id, label: b.name_ar }))}
                  selectedId={batchBranchId}
                  onSelect={setBatchBranchId}
                />
              </View>
            ) : null}

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

      {/* Edit Course Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>تعديل المقرر ({editingCourse?.title})</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <TextInputField
              label="عدد المحاضرات الإجمالي للمقرر"
              value={editSessions}
              onChangeText={setEditSessions}
              placeholder="8"
              keyboardType="numeric"
            />

            <CustomButton
              title="حفظ التعديلات"
              onPress={handleUpdateCourseSessions}
              variant="primary"
              size="big"
              loading={updatingCourse}
              style={{ marginTop: 12 }}
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
