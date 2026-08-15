/**
 * Course Detail Screen (s-course-detail)
 * Shows course information, available batches with real-time seat counts, reviews, and Join/Waitlist action.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Repository, Course, Batch } from '../../data/repositories';
import { RPC } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { CustomButton } from '../../components/common/CustomButton';
import { TextInputField } from '../../components/common/TextInputField';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { RTCHaptics } from '../../core/native/haptics';
import { RTCNotifications } from '../../core/native/notifications';
import { withTimeout } from '../../core/performance/withTimeout';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  CheckCircle,
  GraduationCap,
  ShieldAlert,
  Award,
  X,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export interface CourseDetailScreenProps {
  courseId: string;
  onBack: () => void;
  onNavigate?: (screenId: string, params?: any) => void;
}

export const CourseDetailScreen: React.FC<CourseDetailScreenProps> = ({
  courseId,
  onBack,
  onNavigate,
}) => {
  const { colors, isDark, showToast } = useAppStore();
  const { profile } = useAuthStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [seatCounts, setSeatCounts] = useState<Record<string, { enrolled: number; capacity: number }>>({});
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningBatchId, setJoiningBatchId] = useState<string | null>(null);

  // Rating modal state
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const data = await Repository.fetchCourseDetail(courseId);
      setCourse(data.course);
      setBatches(data.batches);
      setRatings(data.ratings);

      if (data.batches.length) {
        const counts = await RPC.batchSeatCounts(data.batches.map((b) => b.id));
        setSeatCounts(counts);
      }
    } catch (e: any) {
      showToast('تعذر تحميل تفاصيل الدورة', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleJoinBatch = async (batchId: string) => {
    RTCHaptics.light();
    setJoiningBatchId(batchId);
    try {
      // Hard timeout so a hanging network never leaves a stuck spinner (A-7)
      const res = await withTimeout(RPC.joinBatch(batchId), 15000);
      if (res?.status === 'waitlist') {
        showToast('المجموعة مكتملة — تمت إضافتك لقائمة الانتظار', 'warn');
      } else {
        RTCHaptics.success();
        showToast('تم الانضمام للمجموعة بنجاح 🎉', 'ok');

        // Now is the RIGHT moment to ask for notification permission (U-1):
        // the user just gained a reason to want lecture reminders.
        RTCNotifications.requestPermissions().then((granted) => {
          if (!granted) return;

          // Schedule a lecture reminder if we know a future start time
          const batch = batches.find((b) => b.id === batchId);
          if (batch?.starts_at) {
            RTCNotifications.scheduleCourseReminder(
              batch.id,
              course?.title || batch.name,
              batch.starts_at,
              batch.location || undefined
            ).catch(() => {});
          }
        });
      }
      await loadData();
    } catch (e: any) {
      showToast(e?.message || 'تعذر الانضمام للمجموعة', 'err');
    } finally {
      setJoiningBatchId(null);
    }
  };

  const handleSubmitRating = async () => {
    if (!courseId) return;
    setRatingSubmitting(true);
    try {
      await RPC.submitCourseRating(courseId, ratingValue, ratingComment);
      RTCHaptics.success();
      showToast('شكراً لمشاركتك تقييم الدورة', 'ok');
      setRatingModalVisible(false);
      setRatingComment('');
      await loadData();
    } catch (e: any) {
      showToast(e?.message || 'تعذر إرسال التقييم (يجب أن تكون مسجلاً بالدورة)', 'err');
    } finally {
      setRatingSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={course?.title || 'تفاصيل الدورة'} subtitle="مسار التدريب" showBack onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ gap: 16 }}>
            <SkeletonLoader height={180} borderRadius={Radii.xl} />
            <SkeletonLoader height={120} borderRadius={Radii.xl} />
            <SkeletonLoader height={200} borderRadius={Radii.xl} />
          </View>
        ) : course ? (
          <>
            {/* Main Course Info Card */}
            <CustomCard style={styles.heroCard}>
              <View style={styles.categoryRow}>
                <View style={[styles.catBadge, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.catText, { color: colors.primary }]}>{course.category || 'تدريب عام'}</Text>
                </View>
                {course.level ? (
                  <View style={[styles.levelBadge, { backgroundColor: colors.teal + '18' }]}>
                    <Text style={[styles.levelText, { color: colors.teal }]}>{course.level}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.courseTitle, { color: colors.txt }]}>{course.title}</Text>

              {course.description ? (
                <Text style={[styles.description, { color: colors.mut }]}>{course.description}</Text>
              ) : null}

              {/* Quick Specs */}
              <View style={styles.specsRow}>
                <View style={styles.specItem}>
                  <Calendar color={colors.primary} size={18} />
                  <Text style={[styles.specVal, { color: colors.txt }]}>{course.sessions_count} محاضرات</Text>
                  <Text style={[styles.specLbl, { color: colors.mut }]}>مدة الدورة</Text>
                </View>
                <View style={styles.specItem}>
                  <MapPin color={colors.teal} size={18} />
                  <Text style={[styles.specVal, { color: colors.txt }]}>
                    {course.branches?.name_ar || 'فرع رسالة'}
                  </Text>
                  <Text style={[styles.specLbl, { color: colors.mut }]}>مكان الانعقاد</Text>
                </View>
                <View style={styles.specItem}>
                  <Award color={colors.gold} size={18} />
                  <Text style={[styles.specVal, { color: colors.txt }]}>شهادة معتمدة</Text>
                  <Text style={[styles.specLbl, { color: colors.mut }]}>عند إتمام ٧٥٪</Text>
                </View>
              </View>
            </CustomCard>

            {/* Available Batches Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.txt }]}>المجموعات المتاحة للتسجيل</Text>
            </View>

            {batches.length ? (
              batches.map((batch) => {
                const count = seatCounts[batch.id] || { enrolled: 0, capacity: course.max_students || 25 };
                const seatsLeft = Math.max(0, count.capacity - count.enrolled);
                const isFull = count.capacity > 0 && seatsLeft === 0;

                return (
                  <CustomCard key={batch.id} style={styles.batchCard}>
                    <View style={styles.batchTop}>
                      <Text style={[styles.batchName, { color: colors.txt }]}>{batch.name}</Text>
                      <View
                        style={[
                          styles.seatBadge,
                          {
                            backgroundColor: isFull ? colors.amber + '18' : colors.teal + '18',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.seatText,
                            {
                              color: isFull ? colors.amber : colors.teal,
                            },
                          ]}
                        >
                          {isFull ? 'المجموعة مكتملة' : `متبقي ${seatsLeft} مقعد`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.batchDetails}>
                      {batch.schedule ? (
                        <View style={styles.batchDetailItem}>
                          <Clock color={colors.mut} size={15} />
                          <Text style={[styles.batchDetailText, { color: colors.mut }]}>{batch.schedule}</Text>
                        </View>
                      ) : null}

                      {batch.profiles?.full_name ? (
                        <View style={styles.batchDetailItem}>
                          <GraduationCap color={colors.mut} size={15} />
                          <Text style={[styles.batchDetailText, { color: colors.mut }]}>
                            المدرب: {batch.profiles.full_name}
                          </Text>
                        </View>
                      ) : null}

                      {batch.location ? (
                        <View style={styles.batchDetailItem}>
                          <MapPin color={colors.mut} size={15} />
                          <Text style={[styles.batchDetailText, { color: colors.mut }]}>
                            {batch.location} {batch.room ? `(${batch.room})` : ''}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <CustomButton
                      title={isFull ? 'الانضمام لقائمة الانتظار' : 'الانضمام للمجموعة'}
                      onPress={() => handleJoinBatch(batch.id)}
                      variant={isFull ? 'soft' : 'primary'}
                      size="mid"
                      loading={joiningBatchId === batch.id}
                    />
                  </CustomCard>
                );
              })
            ) : (
              <CustomCard style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.mut, fontSize: 13 }}>لا توجد مجموعات مفتوحة للتسجيل حالياً في هذا الكورس.</Text>
              </CustomCard>
            )}

            {/* Ratings Section */}
            <View style={styles.ratingSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.txt }]}>تقييمات وآراء الطلاب</Text>
              <TouchableOpacity onPress={() => setRatingModalVisible(true)}>
                <Text style={[styles.addRatingBtn, { color: colors.primary }]}>+ تقييم الدورة</Text>
              </TouchableOpacity>
            </View>

            {ratings.length ? (
              ratings.map((r, idx) => (
                <CustomCard key={idx} style={styles.ratingCard}>
                  <View style={styles.ratingRow}>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          color={s <= r.rating ? colors.gold : colors.line}
                          fill={s <= r.rating ? colors.gold : 'transparent'}
                          size={14}
                        />
                      ))}
                    </View>
                    <Text style={[styles.ratingDate, { color: colors.mut }]}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : ''}
                    </Text>
                  </View>
                  {r.comment ? (
                    <Text style={[styles.ratingComment, { color: colors.txt }]}>{r.comment}</Text>
                  ) : null}
                </CustomCard>
              ))
            ) : (
              <Text style={{ color: colors.mut, fontSize: 12.5, textAlign: 'center', marginVertical: 8 }}>
                كن أول من يقيّم هذه الدورة التدريبية!
              </Text>
            )}
          </>
        ) : null}
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="slide" onRequestClose={() => setRatingModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>تقييم الدورة التدريبية</Text>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            {/* Stars Picker */}
            <View style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => {
                    RTCHaptics.selection();
                    setRatingValue(s);
                  }}
                  style={{ padding: 6 }}
                >
                  <Star
                    color={s <= ratingValue ? colors.gold : colors.line}
                    fill={s <= ratingValue ? colors.gold : 'transparent'}
                    size={32}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInputField
              label="رأيك وملاحظاتك (اختياري)"
              value={ratingComment}
              onChangeText={setRatingComment}
              placeholder="اكتب تقييمك للمدرب والمحتوى..."
              multiline
              numberOfLines={3}
            />

            <CustomButton
              title="إرسال التقييم"
              onPress={handleSubmitRating}
              variant="primary"
              size="big"
              loading={ratingSubmitting}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  heroCard: {
    padding: 20,
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  description: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  specItem: {
    alignItems: 'center',
    gap: 2,
  },
  specVal: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 2,
  },
  specLbl: {
    fontSize: 10.5,
  },
  sectionHeader: {
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  batchCard: {
    padding: 16,
    gap: 12,
  },
  batchTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchName: {
    fontSize: 15,
    fontWeight: '700',
  },
  seatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  seatText: {
    fontSize: 11,
    fontWeight: '700',
  },
  batchDetails: {
    gap: 6,
  },
  batchDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batchDetailText: {
    fontSize: 12,
  },
  ratingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  addRatingBtn: {
    fontSize: 13,
    fontWeight: '700',
  },
  ratingCard: {
    padding: 14,
    gap: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingDate: {
    fontSize: 11,
  },
  ratingComment: {
    fontSize: 13,
    lineHeight: 18,
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
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 6,
  },
});
