import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { CustomCard } from '../../components/common/CustomCard';
import { CustomButton } from '../../components/common/CustomButton';
import { SuccessAnimation } from '../../components/feedback/SuccessAnimation';
import { RTCHaptics } from '../../core/native/haptics';
import { RPC } from '../../data/rpc';
import { Star, MessageSquare } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export interface CourseRatingScreenProps {
  courseId: string;
  courseTitle?: string;
  onBack: () => void;
}

export const CourseRatingScreen: React.FC<CourseRatingScreenProps> = ({
  courseId,
  courseTitle = 'الدورة التدريبية',
  onBack,
}) => {
  const { colors, showToast } = useAppStore();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (rating < 1) {
      showToast('يرجى تحديد التقييم بالنجوم', 'warn');
      return;
    }

    setSubmitting(true);
    try {
      await RPC.submitCourseRating(courseId, rating, comment.trim());
      setShowSuccess(true);
    } catch (e: any) {
      showToast(e?.message || 'فشل إرسال التقييم', 'err');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <GlassHeader
        title="تقييم الدورة"
        subtitle={courseTitle}
        showBack
        onBack={onBack}
        showNotif={false}
        showAvatar={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CustomCard style={styles.card}>
          <Text style={[styles.heading, { color: colors.txt }]}>كيف كانت تجربتك التعليمية؟</Text>
          <Text style={[styles.subheading, { color: colors.mut }]}>
            رأيك يساعدنا في تحسين جودة التدريب واختيار أفضل المتطوعين
          </Text>

          {/* Stars Selection */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                activeOpacity={0.7}
                onPress={() => {
                  RTCHaptics.selection();
                  setRating(star);
                }}
                style={styles.starButton}
              >
                <Star
                  size={36}
                  color={star <= rating ? '#F59E0B' : colors.line}
                  fill={star <= rating ? '#F59E0B' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.ratingLabel, { color: colors.primary }]}>
            {rating === 5
              ? 'ممتاز جداً 🌟'
              : rating === 4
              ? 'جيد جداً 👍'
              : rating === 3
              ? 'متوسط 👌'
              : rating === 2
              ? 'يحتاج تحسين ⚠️'
              : 'ضعيف ❌'}
          </Text>

          {/* Review Text Input */}
          <View style={styles.inputWrap}>
            <View style={styles.inputLabelRow}>
              <MessageSquare size={16} color={colors.mut} />
              <Text style={[styles.inputLabel, { color: colors.txt }]}>ملاحظاتك ومقترحاتك (اختياري)</Text>
            </View>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="اكتب تقييمك للمدرب والمحتوى والتنظيم..."
              placeholderTextColor={colors.mut}
              multiline
              numberOfLines={4}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card2,
                  borderColor: colors.line,
                  color: colors.txt,
                },
              ]}
              textAlignVertical="top"
            />
          </View>

          <CustomButton
            title="إرسال التقييم"
            onPress={handleSubmit}
            loading={submitting}
            variant="primary"
            size="big"
            style={{ marginTop: 8 }}
          />
        </CustomCard>
      </ScrollView>

      <SuccessAnimation
        visible={showSuccess}
        title="شكراً لتقييمك!"
        subtitle="رأيك يساعدنا على تطوير جودة التدريب في مراكز رسالة"
        onFinish={() => {
          setShowSuccess(false);
          onBack();
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    padding: 24,
    borderRadius: Radii.xxl,
    alignItems: 'center',
    gap: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  subheading: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  inputWrap: {
    width: '100%',
    gap: 8,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  textArea: {
    width: '100%',
    height: 110,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: 12,
    fontSize: 13.5,
    textAlign: 'right',
  },
});
