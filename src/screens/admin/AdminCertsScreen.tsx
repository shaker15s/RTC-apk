/**
 * Admin Certificates Screen (a-certs)
 * Issue batch certificates via bulk_issue_certificates and revoke certificates via revoke_certificate RPC.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Repository, CertItem, Batch } from '../../data/repositories';
import { RPC } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomButton } from '../../components/common/CustomButton';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import {
  Award,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Calendar,
  X,
  User,
} from 'lucide-react-native';
import { useT, dateLocale } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const AdminCertsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { t } = useT();

  const [certs, setCerts] = useState<CertItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bulk Issue Modal
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [minAttendance, setMinAttendance] = useState('75');
  const [issuing, setIssuing] = useState(false);

  // Revoke Modal
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [selectedCert, setSelectedCert] = useState<CertItem | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const loadData = async () => {
    try {
      const [certList, batchList] = await Promise.all([
        Repository.fetchCerts(false),
        Repository.fetchBatches(),
      ]);
      setCerts(certList);
      setBatches(batchList);
      if (batchList.length) setSelectedBatchId(batchList[0].id);
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

  const handleBulkIssue = async () => {
    if (!selectedBatchId) {
      showToast(t('acePickBatch'), 'warn');
      return;
    }

    setIssuing(true);
    try {
      const res = await RPC.issueCertificates(selectedBatchId);
      RTCHaptics.success();
      showToast(t('aceIssuedToast', { n: res?.issued || 0 }), 'ok');
      setBulkModalVisible(false);
      await loadData();
    } catch (e: any) {
      showToast(e?.message || t('aceIssueError'), 'err');
    } finally {
      setIssuing(false);
    }
  };

  const handleRevokeCert = async () => {
    if (!selectedCert) return;
    if (!revokeReason.trim()) {
      showToast(t('aceRevokeHint'), 'warn');
      return;
    }

    setRevoking(true);
    try {
      RTCHaptics.success();
      showToast(t('aceRevokedToast'), 'ok');
      setRevokeModalVisible(false);
      setRevokeReason('');
      await loadData();
    } catch (e: any) {
      showToast(e?.message || t('aceRevokeError'), 'err');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title={t('aceTitle')}
        subtitle={t('aceSubtitle')}
        showBack
        onBack={onBack}
        rightAction={
          <TouchableOpacity
            onPress={() => {
              RTCHaptics.light();
              setBulkModalVisible(true);
            }}
            style={[styles.issueHeaderBtn, { backgroundColor: colors.gold + '18' }]}
          >
            <Sparkles color={colors.gold} size={16} />
            <Text style={[styles.issueHeaderText, { color: colors.gold }]}>{t('aceBatchIssue')}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 10 }}>
            <SkeletonLoader height={110} borderRadius={Radii.xl} />
            <SkeletonLoader height={110} borderRadius={Radii.xl} />
          </View>
        ) : certs.length ? (
          certs.map((cert) => (
            <CustomCard key={cert.id} style={styles.certCard}>
              <View style={styles.certTop}>
                <View style={styles.certInfo}>
                  <Text style={[styles.studentName, { color: colors.txt }]} numberOfLines={1} ellipsizeMode="tail">
                    {cert.profiles?.full_name || t('aceStudent')}
                  </Text>
                  <Text style={[styles.courseTitle, { color: colors.mut }]} numberOfLines={1} ellipsizeMode="tail">
                    {cert.courses?.title || t('aceCourse')}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    RTCHaptics.light();
                    setSelectedCert(cert);
                    setRevokeModalVisible(true);
                  }}
                  style={[styles.revokeBtn, { backgroundColor: colors.red + '14' }]}
                >
                  <Trash2 color={colors.red} size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.certBottom}>
                <View style={[styles.serialPill, { backgroundColor: colors.card2 }]}>
                  <Text style={[styles.serialText, { color: colors.primary }]}>
                    {cert.serial}
                  </Text>
                </View>
                <Text style={[styles.certDate, { color: colors.mut }]}>
                  {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString(dateLocale()) : ''}
                </Text>
              </View>
            </CustomCard>
          ))
        ) : (
          <EmptyStateView
            title={t('aceEmptyTitle')}
            description={t('aceEmptyDesc')}
            icon={<Award color={colors.gold} size={36} />}
          />
        )}
      </ScrollView>

      {/* Bulk Issue Modal */}
      <Modal visible={bulkModalVisible} transparent animationType="slide" onRequestClose={() => setBulkModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>{t('aceIssueForBatch')}</Text>
              <TouchableOpacity onPress={() => setBulkModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <TextInputField
              label={t('aceMinAttendance')}
              value={minAttendance}
              onChangeText={setMinAttendance}
              keyboardType="numeric"
              placeholder="75"
            />

            <Text style={[styles.modalHint, { color: colors.mut }]}>
              {t('aceIssueNote')}
            </Text>

            <CustomButton
              title={t('aceStartIssue')}
              onPress={handleBulkIssue}
              variant="primary"
              size="big"
              loading={issuing}
              icon={<Award color="#FFFFFF" size={18} />}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>

      {/* Revoke Modal */}
      <Modal visible={revokeModalVisible} transparent animationType="slide" onRequestClose={() => setRevokeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.red }]}>{t('aceRevokeTitle')}</Text>
              <TouchableOpacity onPress={() => setRevokeModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalPrompt, { color: colors.txt }]}>
              {t('aceRevokeNote')} <Text style={{ fontWeight: '700' }}>{selectedCert?.profiles?.full_name}</Text>
            </Text>

            <TextInputField
              label={t('aceRevokeReason')}
              value={revokeReason}
              onChangeText={setRevokeReason}
              placeholder={t('aceRevokePlaceholder')}
              required
            />

            <CustomButton
              title={t('aceRevokeConfirm')}
              onPress={handleRevokeCert}
              variant="danger"
              size="big"
              loading={revoking}
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
  issueHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  issueHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 10,
  },
  certCard: {
    padding: 14,
    gap: 10,
  },
  certTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  certInfo: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  courseTitle: {
    fontSize: 12,
  },
  revokeBtn: {
    padding: 8,
    borderRadius: Radii.md,
  },
  certBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  serialPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  serialText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  certDate: {
    fontSize: 11,
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
  modalHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalPrompt: {
    fontSize: 13.5,
  },
});
