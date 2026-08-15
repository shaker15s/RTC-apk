/**
 * Volunteer Excuses Review Screen (v-excuses)
 * Review student absence excuses, view attached proof documents, and approve or reject via review_excuse RPC.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Modal,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Repository } from '../../data/repositories';
import { RPC } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { CustomButton } from '../../components/common/CustomButton';
import { TextInputField } from '../../components/common/TextInputField';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Paperclip,
  Calendar,
  User,
  ExternalLink,
  X,
} from 'lucide-react-native';
import { useT } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const VolunteerExcusesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { t } = useT();

  const [excuses, setExcuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Review Modal State
  const [activeExcuse, setActiveExcuse] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadExcuses = async () => {
    try {
      const list = await Repository.fetchExcuses();
      setExcuses(list);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExcuses();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExcuses();
  };

  const handleReviewAction = (excuse: any, status: 'approved' | 'rejected') => {
    RTCHaptics.light();
    setActiveExcuse(excuse);
    setReviewStatus(status);
    setReviewNote('');
  };

  const handleConfirmReview = async () => {
    if (!activeExcuse) return;
    setSubmitting(true);
    try {
      await RPC.reviewExcuse(activeExcuse.id, reviewStatus, reviewNote.trim());
      RTCHaptics.success();
      showToast(
        reviewStatus === 'approved' ? t('veApprovedToast') : t('veRejectedToast'),
        'ok'
      );
      setActiveExcuse(null);
      await loadExcuses();
    } catch (e: any) {
      showToast(e?.message || t('veReviewError'), 'err');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('veTitle')} subtitle={t('veSubtitle')} showBack onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 10 }}>
            <SkeletonLoader height={140} borderRadius={Radii.xl} />
            <SkeletonLoader height={140} borderRadius={Radii.xl} />
          </View>
        ) : excuses.length ? (
          excuses.map((item) => {
            const isPending = item.status === 'pending' || !item.status;
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString('ar-EG', {
                  month: 'short',
                  day: 'numeric',
                })
              : '';

            return (
              <CustomCard key={item.id} style={styles.excuseCard}>
                <View style={styles.cardTop}>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.txt }]}>
                      {item.profiles?.full_name || t('veStudent')}
                    </Text>
                    <Text style={[styles.batchName, { color: colors.mut }]}>
                      {item.batches?.name || t('veGroup')}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          item.status === 'approved'
                            ? colors.teal + '18'
                            : item.status === 'rejected'
                            ? colors.red + '18'
                            : colors.amber + '18',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            item.status === 'approved'
                              ? colors.teal
                              : item.status === 'rejected'
                              ? colors.red
                              : colors.amber,
                        },
                      ]}
                    >
                      {item.status === 'approved'
                        ? t('veApproved')
                        : item.status === 'rejected'
                        ? t('veRejected')
                        : t('vePending')}
                    </Text>
                  </View>
                </View>

                {/* Reason Text */}
                <View style={[styles.reasonBox, { backgroundColor: colors.card2 }]}>
                  <Text style={[styles.reasonLabel, { color: colors.mut }]}>{t('veReason')}</Text>
                  <Text style={[styles.reasonText, { color: colors.txt }]}>{item.reason}</Text>
                </View>

                {/* Attached File if available */}
                {item.file_url ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(item.file_url)}
                    style={[styles.fileBtn, { backgroundColor: colors.card2, borderColor: colors.line }]}
                  >
                    <Paperclip color={colors.primary} size={16} />
                    <Text style={[styles.fileBtnText, { color: colors.primary }]}>{t('veViewDoc')}</Text>
                    <ExternalLink color={colors.mut} size={14} />
                  </TouchableOpacity>
                ) : null}

                {/* Actions for pending excuses */}
                {isPending ? (
                  <View style={styles.actionsRow}>
                    <CustomButton
                      title={t('veReject')}
                      onPress={() => handleReviewAction(item, 'rejected')}
                      variant="danger"
                      size="sm"
                      style={{ flex: 1 }}
                    />
                    <CustomButton
                      title={t('veAccept')}
                      onPress={() => handleReviewAction(item, 'approved')}
                      variant="teal"
                      size="sm"
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : null}
              </CustomCard>
            );
          })
        ) : (
          <EmptyStateView
            title={t('veEmptyTitle')}
            description={t('veEmptyDesc')}
            icon={<FileText color={colors.teal} size={32} />}
          />
        )}
      </ScrollView>

      {/* Review Confirmation Modal */}
      <Modal visible={!!activeExcuse} transparent animationType="slide" onRequestClose={() => setActiveExcuse(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>
                {reviewStatus === 'approved' ? t('veConfirmAcceptTitle') : t('veConfirmRejectTitle')}
              </Text>
              <TouchableOpacity onPress={() => setActiveExcuse(null)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalPrompt, { color: colors.txt }]}>
              {t('veStudentLabel')} <Text style={{ fontWeight: '700' }}>{activeExcuse?.profiles?.full_name}</Text>
            </Text>

            <TextInputField
              label={t('veNoteLabel')}
              value={reviewNote}
              onChangeText={setReviewNote}
              placeholder={t('veNotePlaceholder')}
            />

            <CustomButton
              title={reviewStatus === 'approved' ? t('veConfirmAccept') : t('veConfirmReject')}
              onPress={handleConfirmReview}
              variant={reviewStatus === 'approved' ? 'teal' : 'danger'}
              size="big"
              loading={submitting}
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
    gap: 12,
  },
  excuseCard: {
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '800',
  },
  batchName: {
    fontSize: 11.5,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reasonBox: {
    padding: 12,
    borderRadius: Radii.md,
    gap: 4,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
  },
  fileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  fileBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
    marginHorizontal: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
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
    gap: 14,
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
  modalPrompt: {
    fontSize: 13.5,
  },
});
