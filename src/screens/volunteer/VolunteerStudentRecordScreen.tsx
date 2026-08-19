/**
 * Volunteer / admin view of a single student's attendance history.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { RPC, MyAttendanceItem } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { ProgressRing } from '../../components/common/ProgressRing';
import { useT, dateLocale } from '../../core/i18n';
import { CheckCircle2, Clock, ShieldCheck, XCircle, CalendarCheck, Trophy } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const VolunteerStudentRecordScreen: React.FC<{
  studentId: string;
  studentName?: string;
  batchId?: string;
  onBack: () => void;
}> = ({ studentId, studentName, batchId, onBack }) => {
  const { colors, showToast } = useAppStore();
  const { t } = useT();
  const [records, setRecords] = useState<MyAttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const list = await RPC.getStudentAttendance(studentId, batchId);
      setRecords(list || []);
    } catch (e: any) {
      showToast(e?.message || t('attendanceLoadError'), 'warn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId, batchId]);

  const stats = useMemo(() => {
    const committed = records.filter((r) => r.status === 'present' || r.status === 'late').length;
    const points = records.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
    const rate = records.length ? Math.round((committed / records.length) * 100) : 0;
    return { committed, points, rate, total: records.length };
  }, [records]);

  const statusIcon = (status: string, color: string) => {
    if (status === 'present') return <CheckCircle2 color={color} size={18} />;
    if (status === 'late') return <Clock color={color} size={18} />;
    if (status === 'excused') return <ShieldCheck color={color} size={18} />;
    return <XCircle color={color} size={18} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title={studentName || t('studentRecordTitle')}
        subtitle={t('studentRecordSubtitle')}
        showBack
        onBack={onBack}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 10 }}>
            <SkeletonLoader height={140} borderRadius={Radii.xl} />
            <SkeletonLoader height={72} borderRadius={Radii.lg} />
          </View>
        ) : records.length === 0 ? (
          <EmptyStateView
            title={t('noStudentAttendance')}
            description={t('noStudentAttendanceDesc')}
            icon={<CalendarCheck color={colors.primary} size={32} />}
          />
        ) : (
          <>
            <CustomCard style={styles.hero}>
              <ProgressRing progress={stats.rate} size={96} strokeWidth={8} color={colors.teal} bgColor={colors.card2} showPercent />
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={[styles.heroLine, { color: colors.mut }]}>
                  {t('attSessions', { attended: stats.committed, total: stats.total })}
                </Text>
                <View style={styles.pointsRow}>
                  <Trophy color={colors.gold} size={16} />
                  <Text style={[styles.heroLine, { color: colors.gold }]}>{t('attTotalPoints', { p: stats.points })}</Text>
                </View>
              </View>
            </CustomCard>

            {records.map((rec) => {
              const color =
                rec.status === 'present' ? colors.teal : rec.status === 'late' ? colors.amber : rec.status === 'excused' ? colors.primary : colors.red;
              const dateStr = rec.session_date
                ? new Date(rec.session_date).toLocaleDateString(dateLocale(), { weekday: 'short', month: 'short', day: 'numeric' })
                : '';
              return (
                <View key={rec.session_id} style={[styles.row, { borderBottomColor: colors.line }]}>
                  <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>{statusIcon(rec.status, color)}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.txt }]} numberOfLines={1}>
                      {rec.session_title || rec.course_title || t('lectureWord')}
                    </Text>
                    {dateStr ? <Text style={[styles.rowMeta, { color: colors.mut }]}>{dateStr}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.status, { color }]}>{t((rec.status as any) || 'present')}</Text>
                    {Number(rec.points) > 0 ? (
                      <Text style={[styles.pts, { color: colors.gold }]}>{t('plusPoints', { p: rec.points || 0 })}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40, gap: 12 },
  hero: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroLine: { fontSize: 13, fontWeight: '700' },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  iconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowMeta: { fontSize: 11.5, marginTop: 2 },
  status: { fontSize: 12, fontWeight: '800' },
  pts: { fontSize: 11, fontWeight: '700', marginTop: 2 },
});
