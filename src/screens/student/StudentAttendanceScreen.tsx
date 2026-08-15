/**
 * Student Attendance History Screen (s-attendance) — v100.2.0
 * Detailed per-session attendance record for the student (fixes F-10):
 * every session with status (present/late/absent/excused), date,
 * course/batch, and points earned. Data comes from the backend RPC
 * get_my_attendance (docs/sql/2026-08-15-quality-fixes.sql); the
 * screen degrades gracefully if the RPC is not deployed yet.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { RPC } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { CustomButton } from '../../components/common/CustomButton';
import { useT } from '../../core/i18n';
import { RTCHaptics } from '../../core/native/haptics';
import { CheckCircle2, Clock, XCircle, ShieldCheck, CalendarCheck, CalendarDays } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export interface AttendanceRecord {
  session_id: string;
  session_title?: string;
  course_title?: string;
  batch_name?: string;
  session_date?: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  points?: number;
}

const STATUS_CONFIG: Record<
  string,
  { labelKey: 'present' | 'late' | 'absent' | 'excused'; colorKey: 'teal' | 'amber' | 'red' | 'primary' }
> = {
  present: { labelKey: 'present', colorKey: 'teal' },
  late: { labelKey: 'late', colorKey: 'amber' },
  absent: { labelKey: 'absent', colorKey: 'red' },
  excused: { labelKey: 'excused', colorKey: 'primary' },
};

export const StudentAttendanceScreen: React.FC<{
  onBack: () => void;
  onNavigate?: (screenId: string) => void;
}> = ({ onBack, onNavigate }) => {
  const { colors, showToast } = useAppStore();
  const { t } = useT();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rpcMissing, setRpcMissing] = useState(false);

  const loadData = async () => {
    try {
      const list = await RPC.getMyAttendance();
      setRecords(list || []);
      setRpcMissing(false);
    } catch (e: any) {
      // Function not deployed yet? Show honest guidance instead of silence.
      if (e?.message?.includes('Could not find') || e?.code === 'PGRST202') {
        setRpcMissing(true);
      } else {
        showToast(t('attendanceLoadError'), 'warn');
      }
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

  const presentCount = records.filter((r) => r.status === 'present').length;
  const totalCount = records.length;
  const attendanceRate = totalCount
    ? Math.round(
        ((records.filter((r) => r.status === 'present' || r.status === 'late').length) / totalCount) * 100
      )
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('attendanceTitle')} subtitle={t('attendanceSubtitle')} showBack onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Summary card (real numbers, no fake stats) */}
        {records.length > 0 ? (
          <CustomCard style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <CalendarDays color={colors.primary} size={20} />
                <Text style={[styles.summaryVal, { color: colors.txt }]}>{totalCount}</Text>
                <Text style={[styles.summaryLbl, { color: colors.mut }]}>{t('recordedSessions')}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.line }]} />
              <View style={styles.summaryItem}>
                <CheckCircle2 color={colors.teal} size={20} />
                <Text style={[styles.summaryVal, { color: colors.teal }]}>{presentCount}</Text>
                <Text style={[styles.summaryLbl, { color: colors.mut }]}>{t('fullAttendance')}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.line }]} />
              <View style={styles.summaryItem}>
                <CalendarCheck color={colors.gold} size={20} />
                <Text style={[styles.summaryVal, { color: colors.gold }]}>{attendanceRate}%</Text>
                <Text style={[styles.summaryLbl, { color: colors.mut }]}>{t('commitmentRate')}</Text>
              </View>
            </View>
          </CustomCard>
        ) : null}

        {loading ? (
          <View style={{ gap: 10 }}>
            <SkeletonLoader height={72} borderRadius={Radii.lg} />
            <SkeletonLoader height={72} borderRadius={Radii.lg} />
            <SkeletonLoader height={72} borderRadius={Radii.lg} />
          </View>
        ) : rpcMissing ? (
          <EmptyStateView
            title={t('attendanceUnavailableTitle')}
            description={t('attendanceUnavailableDesc')}
            icon={<ShieldCheck color={colors.primary} size={32} />}
            action={
              onNavigate ? (
                <CustomButton
                  title={t('backToCourses')}
                  onPress={() => onNavigate('s-courses')}
                  variant="primary"
                  size="mid"
                />
              ) : undefined
            }
          />
        ) : records.length ? (
          records.map((rec) => {
            const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.absent;
            const color = colors[cfg.colorKey];
            const dateStr = rec.session_date
              ? new Date(rec.session_date).toLocaleDateString('ar-EG', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            const statusIcon = {
              present: <CheckCircle2 color={color} size={20} />,
              late: <Clock color={color} size={20} />,
              absent: <XCircle color={color} size={20} />,
              excused: <ShieldCheck color={color} size={20} />,
            }[rec.status];

            return (
              <CustomCard key={rec.session_id || `${rec.session_date}-${rec.status}`} style={styles.recordCard}>
                <View style={styles.recordRow}>
                  <View style={[styles.statusCircle, { backgroundColor: color + '18' }]}>
                    {statusIcon}
                  </View>

                  <View style={styles.recordInfo}>
                    <Text style={[styles.sessionTitle, { color: colors.txt }]}>
                      {rec.session_title || rec.course_title || t('lectureWord')}
                    </Text>
                    {rec.batch_name ? (
                      <Text style={[styles.batchName, { color: colors.mut }]}>{rec.batch_name}</Text>
                    ) : null}
                    {dateStr ? (
                      <Text style={[styles.dateText, { color: colors.mut }]}>{dateStr}</Text>
                    ) : null}
                  </View>

                  <View style={styles.recordRight}>
                    <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
                      <Text style={[styles.statusText, { color }]}>{t(cfg.labelKey)}</Text>
                    </View>
                    {typeof rec.points === 'number' && rec.points > 0 ? (
                      <Text style={[styles.pointsText, { color: colors.gold }]}>{t('plusPoints', { p: rec.points })}</Text>
                    ) : null}
                  </View>
                </View>
              </CustomCard>
            );
          })
        ) : (
          <EmptyStateView
            title={t('attendanceEmptyTitle')}
            description={t('attendanceEmptyDesc')}
            icon={<CalendarCheck color={colors.primary} size={32} />}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },
  summaryCard: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 36,
  },
  summaryVal: {
    fontSize: 17,
    fontWeight: '800',
  },
  summaryLbl: {
    fontSize: 10.5,
  },
  recordCard: {
    padding: 14,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInfo: {
    flex: 1,
    gap: 2,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  batchName: {
    fontSize: 11.5,
  },
  dateText: {
    fontSize: 11,
  },
  recordRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
