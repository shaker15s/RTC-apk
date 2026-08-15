/**
 * Volunteer Batches & Roster Screen (v-batches)
 * Manage students roster, start live sessions with QR/Code broadcast, and track attendance.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useSessionStore, ActiveSession } from '../../state/sessionStore';
import { Repository, Batch } from '../../data/repositories';
import { RPC, BatchRosterStudent } from '../../data/rpc';
import { maskPhone } from '../../core/security/sanitizers';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { CustomButton } from '../../components/common/CustomButton';
import { TextInputField } from '../../components/common/TextInputField';
import { SelectChips } from '../../components/common/SelectChips';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import {
  Play,
  Users,
  CheckCircle2,
  Clock,
  UserCheck,
  Award,
  Phone,
  Flame,
  X,
  FileCheck,
  Calendar,
} from 'lucide-react-native';
import { useT } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const VolunteerBatchesScreen: React.FC<{
  onNavigate: (screenId: string, params?: any) => void;
  selectedBatchId?: string;
}> = ({ onNavigate, selectedBatchId: initialBatchId }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { t } = useT();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string>(initialBatchId || '');
  const [students, setStudents] = useState<BatchRosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Live session lives in the GLOBAL store (fixes P0-5): it survives
  // screen unmount/remount by the custom navigator and is persisted.
  const {
    activeSession,
    setActiveSession,
    clearActiveSession,
    restoreActiveSession,
  } = useSessionStore();
  const [startSessionModal, setStartSessionModal] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');

  const loadBatches = async () => {
    try {
      const list = await Repository.fetchMyBatches();
      setBatches(list);
      if (list.length && !activeBatchId) {
        setActiveBatchId(list[0].id);
      }
    } catch (e) {
      showToast(t('batchesLoadError'), 'warn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStudents = async (batchId: string) => {
    if (!batchId) return;
    setLoadingStudents(true);
    try {
      const roster = await RPC.batchRoster(batchId);
      setStudents(roster);
    } catch (e: any) {
      showToast(t('rosterLoadError'), 'err');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadBatches();
    restoreActiveSession().catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeBatchId) return;
    loadStudents(activeBatchId);

    // Re-sync with the backend when available: if a session is open for
    // this batch (started from another device), adopt it. If the RPC is
    // not deployed yet, fall back silently to the local store.
    RPC.getActiveSession(activeBatchId)
      .then((s) => {
        if (s?.id) {
          setActiveSession({
            id: s.id,
            batchId: activeBatchId,
            checkinCode: s.checkin_code,
            title: s.title || t('currentLecture'),
            startedAt: Date.now(),
          });
        }
      })
      .catch(() => {});
  }, [activeBatchId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBatches();
    if (activeBatchId) await loadStudents(activeBatchId);
  };

  const handleStartSession = async () => {
    if (!activeBatchId) return;
    setStarting(true);
    try {
      const res = await RPC.startSession(activeBatchId, sessionTitle.trim() || undefined);
      setActiveSession({
        id: res.id,
        batchId: activeBatchId,
        checkinCode: res.checkin_code,
        title: sessionTitle.trim() || t('currentLecture'),
        startedAt: Date.now(),
      });
      setStartSessionModal(false);
      setSessionTitle('');
      RTCHaptics.success();
      showToast(t('sessionStartedToast'), 'ok');
    } catch (e: any) {
      showToast(e?.message || t('sessionStartError'), 'err');
    } finally {
      setStarting(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      await RPC.closeSession(activeSession.id);
      clearActiveSession();
      RTCHaptics.success();
      showToast(t('sessionClosedToast'), 'ok');
      await onRefresh();
    } catch (e: any) {
      showToast(e?.message || t('sessionCloseError'), 'err');
    }
  };

  const currentBatch = batches.find((b) => b.id === activeBatchId);
  const batchChips = batches.map((b) => ({ id: b.id, label: b.name }));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('myBatchesTitle')} subtitle={t('myBatchesSubtitle')} />

      {/* Batch selector chips */}
      {batches.length > 1 ? (
        <View style={styles.chipsWrap}>
          <SelectChips items={batchChips} selectedId={activeBatchId} onSelect={setActiveBatchId} />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Active Session Broadcast Bar (If Session Running) */}
        {activeSession ? (
          <CustomCard style={[styles.liveSessionCard, { borderColor: colors.teal }]}>
            <View style={styles.liveSessionTop}>
              <View style={[styles.liveBadge, { backgroundColor: colors.teal }]}>
                <Text style={styles.liveBadgeText}>{t('liveSessionBadge')}</Text>
              </View>
              <Text style={[styles.liveTitle, { color: colors.txt }]}>{activeSession.title}</Text>
            </View>

            {/* Big Code & REAL QR Display (fixes P1-4) */}
            <View style={[styles.qrDisplayBox, { backgroundColor: colors.card2, borderColor: colors.line }]}>
              <Text style={[styles.qrCodeLabel, { color: colors.mut }]}>{t('checkinCodeLabel')}</Text>
              <Text style={[styles.qrBigCode, { color: colors.primary }]}>
                {activeSession.checkinCode}
              </Text>
              <View style={styles.qrBox}>
                <QRCode
                  value={activeSession.checkinCode}
                  size={180}
                  color="#001A6B"
                  backgroundColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.liveActionsRow}>
              <CustomButton
                title={t('manualAttendanceCta')}
                onPress={() =>
                  onNavigate('v-attendance', {
                    sessionId: activeSession.id,
                    batchId: activeBatchId,
                    // roster is loaded by the attendance screen itself
                  })
                }
                variant="primary"
                size="mid"
                style={{ flex: 1 }}
              />

              <CustomButton
                title={t('endSessionCta')}
                onPress={handleCloseSession}
                variant="danger"
                size="mid"
                style={{ flex: 1 }}
              />
            </View>
          </CustomCard>
        ) : null}

        {/* Batch Info Card */}
        {currentBatch ? (
          <CustomCard style={styles.batchInfoCard}>
            <View style={styles.batchInfoTop}>
              <View style={styles.batchTitleWrap}>
                <Text style={[styles.courseTitle, { color: colors.txt }]}>
                  {currentBatch.courses?.title || currentBatch.name}
                </Text>
                <Text style={[styles.batchSchedule, { color: colors.mut }]}>
                  {currentBatch.schedule || t('vbScheduleDefault')}
                </Text>
              </View>

              {!activeSession ? (
                <CustomButton
                  title={t('startSessionCta')}
                  onPress={() => {
                    RTCHaptics.light();
                    setStartSessionModal(true);
                  }}
                  variant="teal"
                  size="sm"
                  icon={<Play color="#FFFFFF" size={15} />}
                />
              ) : null}
            </View>

            <View style={styles.batchStatsRow}>
              <View style={styles.batchStat}>
                <Text style={[styles.batchStatVal, { color: colors.primary }]}>{students.length}</Text>
                <Text style={[styles.batchStatLbl, { color: colors.mut }]}>{t('enrolledStudents')}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.line }]} />
              <View style={styles.batchStat}>
                <Text style={[styles.batchStatVal, { color: colors.teal }]}>
                  {currentBatch.sessions_done || 0}
                </Text>
                <Text style={[styles.batchStatLbl, { color: colors.mut }]}>{t('sessionsDoneStat')}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.line }]} />
              <View style={styles.batchStat}>
                <Text style={[styles.batchStatVal, { color: colors.gold }]}>
                  {currentBatch.courses?.sessions_count || 8}
                </Text>
                <Text style={[styles.batchStatLbl, { color: colors.mut }]}>{t('totalSessionsStat')}</Text>
              </View>
            </View>
          </CustomCard>
        ) : null}

        {/* Students Roster Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.txt }]}>{t('rosterTitle')}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mut }]}>
            {t('rosterSubtitle')}
          </Text>
        </View>

        {loadingStudents ? (
          <View style={{ gap: 8 }}>
            <SkeletonLoader height={68} borderRadius={Radii.lg} />
            <SkeletonLoader height={68} borderRadius={Radii.lg} />
            <SkeletonLoader height={68} borderRadius={Radii.lg} />
          </View>
        ) : students.length ? (
          students.map((student) => (
            <CustomCard key={student.student_id} style={styles.studentCard}>
              <View style={styles.studentLeft}>
                <View style={[styles.studentAvatar, { backgroundColor: colors.card2 }]}>
                  {student.avatar_url ? (
                    <Image source={{ uri: student.avatar_url }} style={styles.studentAvatarImg} />
                  ) : (
                    <Users color={colors.mut} size={18} />
                  )}
                </View>

                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: colors.txt }]}>{student.full_name}</Text>
                  {student.phone ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        RTCHaptics.light();
                        Clipboard.setStringAsync(student.phone as string).catch(() => {});
                        showToast(t('phoneCopied'), 'info');
                      }}
                    >
                      {/* Privacy masking by default (fixes SEC-4): tap to copy full number */}
                      <Text style={[styles.studentPhone, { color: colors.mut }]}>
                        {maskPhone(student.phone)} 👆
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <View style={styles.studentRight}>
                <View style={[styles.attBadge, { backgroundColor: colors.teal + '18' }]}>
                  <Text style={[styles.attText, { color: colors.teal }]}>
                    {t('attendancePct', { p: student.attendance_pct || 0 })}
                  </Text>
                </View>
                <Text style={[styles.pointsText, { color: colors.gold }]}>
                  ⭐ {student.points || 0} {t('ptShort')}
                </Text>
              </View>
            </CustomCard>
          ))
        ) : (
          <EmptyStateView
            title={t('noStudentsTitle')}
            description={t('noStudentsDesc')}
            icon={<Users color={colors.primary} size={32} />}
          />
        )}
      </ScrollView>

      {/* Start Session Modal */}
      <Modal visible={startSessionModal} transparent animationType="slide" onRequestClose={() => setStartSessionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>{t('startSessionModalTitle')}</Text>
              <TouchableOpacity onPress={() => setStartSessionModal(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <TextInputField
              label={t('sessionTitleLabel')}
              value={sessionTitle}
              onChangeText={setSessionTitle}
              placeholder={t('sessionTitlePlaceholder')}
            />

            <Text style={[styles.modalNotice, { color: colors.mut }]}>
              {t('vbSessionNote')}
            </Text>

            <CustomButton
              title={t('vbConfirmStart')}
              onPress={handleStartSession}
              variant="teal"
              size="big"
              loading={starting}
              icon={<Play color="#FFFFFF" size={18} />}
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
  chipsWrap: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 90,
    gap: 14,
  },
  liveSessionCard: {
    padding: 18,
    borderWidth: 2,
    gap: 14,
  },
  liveSessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  liveTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  qrDisplayBox: {
    padding: 16,
    borderRadius: Radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  qrCodeLabel: {
    fontSize: 12,
  },
  qrBigCode: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
  },
  qrBox: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: Radii.lg,
    marginTop: 4,
  },
  liveActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  batchInfoCard: {
    padding: 18,
    gap: 14,
  },
  batchInfoTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  batchTitleWrap: {
    flex: 1,
    gap: 2,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  batchSchedule: {
    fontSize: 12,
  },
  batchStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  batchStat: {
    alignItems: 'center',
  },
  batchStatVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  batchStatLbl: {
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 24,
  },
  sectionHeader: {
    gap: 2,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11.5,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  studentAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  studentPhone: {
    fontSize: 11,
  },
  studentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  attBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  attText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '600',
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
  modalNotice: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
