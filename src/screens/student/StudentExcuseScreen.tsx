/**
 * Student Excuse Request Screen (s-excuse)
 * Submit absence excuse with reason text and optional proof document upload.
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
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAppStore } from '../../state/appStore';
import { Repository, Enrollment } from '../../data/repositories';
import { RPC } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomButton } from '../../components/common/CustomButton';
import { RTCHaptics } from '../../core/native/haptics';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  ChevronDown,
  Paperclip,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const StudentExcuseScreen: React.FC<{
  onBack: () => void;
  onNavigate?: (screenId: string) => void;
}> = ({ onBack, onNavigate }) => {
  const { colors, isDark, showToast } = useAppStore();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [reason, setReason] = useState('');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [batchModalVisible, setBranchModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  useEffect(() => {
    Repository.fetchMyEnrollments()
      .then((data) => {
        const active = data.filter((e) => e.status === 'enrolled');
        setEnrollments(active);
        if (active.length) {
          setSelectedBatchId(active[0].batch_id);
        }
      })
      .finally(() => setLoadingEnrollments(false));
  }, []);

  const handlePickDocument = async () => {
    RTCHaptics.light();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setFileUri(result.assets[0].uri);
        setFileName(result.assets[0].name);
        RTCHaptics.success();
        showToast('تم إرفاق المستند بنجاح', 'ok');
      }
    } catch (e) {
      showToast('تعذر اختيار الملف', 'err');
    }
  };

  const handleSubmitExcuse = async () => {
    if (!selectedBatchId) {
      showToast('يرجى اختيار الدورة التدريبية', 'warn');
      return;
    }

    if (reason.trim().length < 8) {
      showToast('يرجى كتابة سبب العذر بالتفصيل (8 أحرف على الأقل)', 'warn');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedFilePath: string | null = null;
      if (fileUri) {
        uploadedFilePath = await Repository.uploadExcuseFile(fileUri);
      }

      await RPC.submitExcuse({
        batchId: selectedBatchId,
        reason: reason.trim(),
        file: uploadedFilePath,
      });

      RTCHaptics.success();
      showToast('تم تقديم طلب العذر للمدرب بنجاح', 'ok');
      onBack();
    } catch (e: any) {
      showToast(e?.message || 'تعذر تقديم العذر', 'err');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEnrollment = enrollments.find((e) => e.batch_id === selectedBatchId);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title="طلب عذر غياب" subtitle="إرسال طلب للمدرب للمراجعة" showBack onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <CustomCard style={styles.formCard}>
          {/* Select Course/Batch */}
          <View style={{ marginBottom: 14 }}>
            <Text style={[styles.fieldLabel, { color: colors.txt }]}>الدورة التدريبية / المجموعة</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setBranchModalVisible(true)}
              style={[styles.pickerBtn, { backgroundColor: colors.card2, borderColor: colors.line }]}
            >
              <View style={styles.pickerInner}>
                <FileText color={colors.primary} size={18} />
                <Text
                  style={[
                    styles.pickerText,
                    { color: selectedEnrollment ? colors.txt : colors.mut },
                  ]}
                >
                  {selectedEnrollment?.batches?.courses?.title ||
                    selectedEnrollment?.batches?.name ||
                    'اختر الدورة التدريبية'}
                </Text>
              </View>
              <ChevronDown color={colors.mut} size={18} />
            </TouchableOpacity>
          </View>

          {/* Reason Input */}
          <TextInputField
            label="سبب الغياب بالتفصيل"
            value={reason}
            onChangeText={setReason}
            placeholder="اكتب سبب الغياب لتوضيح الظروف للمدرب..."
            multiline
            numberOfLines={4}
            required
          />

          {/* Document Upload */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.fieldLabel, { color: colors.txt }]}>مستند إثبات العذر (تقرير طبي / عمل - اختياري)</Text>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handlePickDocument}
              style={[styles.uploadBox, { backgroundColor: colors.card2, borderColor: colors.line }]}
            >
              {fileName ? (
                <View style={styles.fileAttachedRow}>
                  <Paperclip color={colors.teal} size={20} />
                  <Text style={[styles.fileNameText, { color: colors.txt }]} numberOfLines={1}>
                    {fileName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setFileUri(null);
                      setFileName(null);
                    }}
                  >
                    <X color={colors.red} size={18} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <UploadCloud color={colors.primary} size={28} />
                  <Text style={[styles.uploadText, { color: colors.txt }]}>اضغط لرفع ملف PDF أو صورة</Text>
                  <Text style={[styles.uploadSub, { color: colors.mut }]}>الحد الأقصى 4 ميجابايت</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <CustomButton
            title="إرسال طلب العذر"
            onPress={handleSubmitExcuse}
            variant="primary"
            size="big"
            loading={submitting}
            icon={<CheckCircle2 color="#FFFFFF" size={20} />}
          />
        </CustomCard>
      </ScrollView>

      {/* Batch Picker Modal */}
      <Modal visible={batchModalVisible} animationType="slide" transparent onRequestClose={() => setBranchModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>اختر الدورة التدريبية</Text>
              <TouchableOpacity onPress={() => setBranchModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={enrollments}
              keyExtractor={(item) => item.batch_id}
              renderItem={({ item }) => {
                const isSelected = item.batch_id === selectedBatchId;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedBatchId(item.batch_id);
                      setBranchModalVisible(false);
                    }}
                    style={[
                      styles.batchModalItem,
                      {
                        backgroundColor: isSelected ? colors.primarySoft : colors.card2,
                        borderColor: isSelected ? colors.primary : colors.line,
                      },
                    ]}
                  >
                    <Text style={[styles.batchModalItemText, { color: colors.txt }]}>
                      {item.batches?.courses?.title || item.batches?.name}
                    </Text>
                    {isSelected ? <CheckCircle2 color={colors.primary} size={20} /> : null}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingVertical: 12, gap: 8 }}
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  formCard: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'right',
  },
  pickerBtn: {
    height: 52,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  pickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pickerText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radii.lg,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '700',
  },
  uploadSub: {
    fontSize: 11,
  },
  fileAttachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  fileNameText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '70%',
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  batchModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  batchModalItemText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
