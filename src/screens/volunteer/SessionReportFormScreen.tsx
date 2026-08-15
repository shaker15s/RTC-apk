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
import { Radii } from '../../core/theme/tokens';
import { FileText, Sparkles, Smile, MessageSquare } from 'lucide-react-native';

export interface SessionReportFormScreenProps {
  sessionId: string;
  sessionTitle?: string;
  onBack: () => void;
}

export const SessionReportFormScreen: React.FC<SessionReportFormScreenProps> = ({
  sessionId,
  sessionTitle = 'المحاضرة',
  onBack,
}) => {
  const { colors, showToast } = useAppStore();
  const [understandingRate, setUnderstandingRate] = useState<number>(85);
  const [engagementRate, setEngagementRate] = useState<number>(90);
  const [summary, setSummary] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (summary.trim().length < 5) {
      showToast('يرجى كتابة ملخص المحاضرة (5 أحرف على الأقل)', 'warn');
      return;
    }

    setSubmitting(true);
    try {
      await RPC.submitSessionReport(sessionId, summary.trim(), understandingRate, engagementRate);
      setShowSuccess(true);
    } catch (e: any) {
      showToast(e?.message || 'فشل حفظ تقرير المحاضرة', 'err');
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
        title="تقرير المحاضرة"
        subtitle={sessionTitle}
        showBack
        onBack={onBack}
        showNotif={false}
        showAvatar={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <CustomCard style={styles.card}>
          <Text style={[styles.heading, { color: colors.txt }]}>توثيق إنجاز المحاضرة</Text>
          <Text style={[styles.subheading, { color: colors.mut }]}>
            سجّل انطباعك عن استيعاب الطلاب وتفاعلهم لتوثيق الجودة والمتابعة
          </Text>

          {/* Understanding Rate Selector */}
          <View style={styles.sliderSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.labelRow}>
                <Sparkles size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.txt }]}>معدل استيعاب الطلاب</Text>
              </View>
              <Text style={[styles.rateValue, { color: colors.primary }]}>{understandingRate}%</Text>
            </View>
            <View style={styles.ratePillsRow}>
              {[50, 70, 85, 95, 100].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => {
                    RTCHaptics.selection();
                    setUnderstandingRate(val);
                  }}
                  style={[
                    styles.ratePill,
                    {
                      backgroundColor: understandingRate === val ? colors.primary : colors.card2,
                      borderColor: understandingRate === val ? colors.primary : colors.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.ratePillText,
                      { color: understandingRate === val ? '#FFFFFF' : colors.txt },
                    ]}
                  >
                    {val}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Engagement Rate Selector */}
          <View style={styles.sliderSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.labelRow}>
                <Smile size={16} color={colors.teal} />
                <Text style={[styles.sectionTitle, { color: colors.txt }]}>معدل الحماس والتفاعل</Text>
              </View>
              <Text style={[styles.rateValue, { color: colors.teal }]}>{engagementRate}%</Text>
            </View>
            <View style={styles.ratePillsRow}>
              {[50, 70, 85, 95, 100].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => {
                    RTCHaptics.selection();
                    setEngagementRate(val);
                  }}
                  style={[
                    styles.ratePill,
                    {
                      backgroundColor: engagementRate === val ? colors.teal : colors.card2,
                      borderColor: engagementRate === val ? colors.teal : colors.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.ratePillText,
                      { color: engagementRate === val ? '#FFFFFF' : colors.txt },
                    ]}
                  >
                    {val}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Summary Input */}
          <View style={styles.inputWrap}>
            <View style={styles.labelRow}>
              <MessageSquare size={16} color={colors.mut} />
              <Text style={[styles.inputLabel, { color: colors.txt }]}>ملخص ما تم شرحه والنقاط البارزة</Text>
            </View>
            <TextInput
              value={summary}
              onChangeText={setSummary}
              placeholder="اكتب المحاور والموضوعات التي تم تغطيتها في الجلسة والواجبات المطلوبة..."
              placeholderTextColor={colors.mut}
              multiline
              numberOfLines={5}
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
            title="حفظ وإرسال التقرير"
            onPress={handleSubmit}
            loading={submitting}
            variant="primary"
            size="big"
            style={{ marginTop: 10 }}
          />
        </CustomCard>
      </ScrollView>

      <SuccessAnimation
        visible={showSuccess}
        title="تم حفظ التقرير!"
        subtitle="شكراً لجهودك وإخلاصك في تدريب وتطوير الطلاب"
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
    padding: 22,
    borderRadius: Radii.xxl,
    gap: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  subheading: {
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 4,
  },
  sliderSection: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  rateValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  ratePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  ratePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrap: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  textArea: {
    width: '100%',
    height: 120,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: 12,
    fontSize: 13.5,
    textAlign: 'right',
  },
});
