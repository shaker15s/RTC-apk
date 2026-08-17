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
import { Star, MessageSquare, UserCheck, Calendar, Building } from 'lucide-react-native';
import { useT, t } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export interface CourseRatingScreenProps {
  courseId: string;
  courseTitle?: string;
  onBack: () => void;
}

export const CourseRatingScreen: React.FC<CourseRatingScreenProps> = ({
  courseId,
  courseTitle = t('certCourseFallback'),
  onBack,
}) => {
  const { colors, showToast } = useAppStore();
  const { t } = useT();

  const [instructorRating, setInstructorRating] = useState<number>(5);
  const [orgRating, setOrgRating] = useState<number>(5);
  const [venueRating, setVenueRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const renderStarPicker = (
    title: string,
    icon: React.ReactNode,
    value: number,
    onChange: (val: number) => void
  ) => (
    <View style={styles.dimensionSection}>
      <View style={styles.dimensionHeader}>
        {icon}
        <Text style={[styles.dimensionTitle, { color: colors.txt }]}>{title}</Text>
      </View>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            activeOpacity={0.7}
            onPress={() => {
              RTCHaptics.selection();
              onChange(star);
            }}
            style={styles.starButton}
          >
            <Star
              size={32}
              color={star <= value ? '#F59E0B' : colors.line}
              fill={star <= value ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const overallRating = Math.round((instructorRating + orgRating + venueRating) / 3);
      const detailedComment = `[المدرب: ${instructorRating}/5 | التنظيم: ${orgRating}/5 | المكان: ${venueRating}/5]\n${comment.trim()}`;
      await RPC.submitCourseRating(courseId, overallRating, detailedComment);
      setShowSuccess(true);
    } catch (e: any) {
      showToast(e?.message || t('crError'), 'err');
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
        title={t('rateCourse')}
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
          <Text style={[styles.heading, { color: colors.txt }]}>تقييم تجربة الدورة التدريبية</Text>
          <Text style={[styles.subheading, { color: colors.mut }]}>
            رأيك يهمنا لمساعدتنا في تطوير بيئة التدريب والمتطوعين بمركز رسالة
          </Text>

          {/* 1. Instructor Rating */}
          {renderStarPicker(
            'أداء المدرب وأسلوب الشرح',
            <UserCheck size={18} color={colors.primary} />,
            instructorRating,
            setInstructorRating
          )}

          {/* 2. Organization Rating */}
          {renderStarPicker(
            'التنظيم وإدارة المواعيد',
            <Calendar size={18} color={colors.teal} />,
            orgRating,
            setOrgRating
          )}

          {/* 3. Venue & Environment Rating */}
          {renderStarPicker(
            'المكان، القاعة والتجهيزات',
            <Building size={18} color={colors.gold} />,
            venueRating,
            setVenueRating
          )}

          {/* Review Text Input */}
          <View style={styles.inputWrap}>
            <View style={styles.inputLabelRow}>
              <MessageSquare size={16} color={colors.mut} />
              <Text style={[styles.inputLabel, { color: colors.txt }]}>{t('crNotesLabel')}</Text>
            </View>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder={t('crNotesPlaceholder')}
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
            title={t('submitRating')}
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
        title={t('crThanksTitle')}
        subtitle={t('crThanksSub')}
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
  dimensionSection: {
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    gap: 6,
  },
  dimensionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dimensionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  starButton: {
    padding: 4,
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
