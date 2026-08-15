/**
 * Student Attendance History Screen (s-attendance) — v100.4.0 (SMART)
 * ---------------------------------------------------------------
 * Detailed, intelligent attendance record for the student (fixes F-10):
 *  - Summary hero: commitment rate ring + attendance points earned
 *  - Certificate eligibility logic per course: 75% threshold with a
 *    clear "you need N more lectures" message (real math, not guesses)
 *  - Filter chips by status (all / present / late / absent / excused)
 *  - Sessions grouped by course with per-course progress bars
 * Data: RPC get_my_attendance (docs/sql/2026-08-16-attendance-v2.sql).
 * Degrades gracefully when the RPC is missing or an older version is
 * deployed (falls back to recorded-session math).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { RPC } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { CustomButton } from '../../components/common/CustomButton';
import { ProgressRing } from '../../components/common/ProgressRing';
import { RTCHaptics } from '../../core/native/haptics';
import { useT, dateLocale } from '../../core/i18n';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  CalendarCheck,
  CalendarDays,
  Trophy,
  Award,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export interface AttendanceRecord {
  session_id: string;
  session_title?: string;
  course_title?: string;
  course_id?: string;
  course_sessions_count?: number;
  batch_name?: string;
  session_date?: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  points?: number;
}

type StatusKey = 'present' | 'late' | 'absent' | 'excused';
type FilterKey = 'all' | StatusKey;

const STATUS_COLORS: Record<StatusKey, 'teal' | 'amber' | 'red' | 'primary'> = {
  present: 'teal',
  late: 'amber',
  absent: 'red',
  excused: 'primary',
};

/** Sessions that count toward commitment: present + late */
const COMMITTED: StatusKey[] = ['present', 'late'];

const CERT_THRESHOLD = 0.75;

interface CourseGroup {
  key: string;
  title: string;
  sessionsCount: number; // from backend; fallback to recorded
  committed: number;
  records: AttendanceRecord[];
  pct: number;
  eligible: boolean;
  needed: number;
}

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
  const [filter, setFilter] = useState<FilterKey>('all');

  const loadData = async () => {
    try {
      const list = await RPC.getMyAttendance();
      setRecords(list || []);
      setRpcMissing(false);
    } catch (e: any) {
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

  // ---------------- Smart aggregation ----------------
  const stats = useMemo(() => {
    const recorded = records.length;
    const committed = records.filter((r) => COMMITTED.includes(r.status)).length;
    const rate = recorded ? Math.round((committed / recorded) * 100) : 0;
    const points = records.reduce((sum, r) => sum + (r.points || 0), 0);

    // Group by course (fallback: group key = course id / title)
    const groupsMap = new Map<string, CourseGroup>();
    for (const r of records) {
      const key = r.course_id || r.course_title || 'unknown';
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          title: r.course_title || t('lectureWord'),
          sessionsCount: 0,
          committed: 0,
          records: [],
          pct: 0,
          eligible: false,
          needed: 0,
        });
      }
      const g = groupsMap.get(key)!;
      g.records.push(r);
      if (COMMITTED.includes(r.status)) g.committed += 1;
    }

    const groups: CourseGroup[] = [];
    for (const g of groupsMap.values()) {
      // Real math: use backend course total when available, else recorded.
      g.sessionsCount = Math.max(
        g.records[0]?.course_sessions_count || 0,
        g.records.length
      );
      g.pct = g.sessionsCount
        ? Math.min(100, Math.round((g.committed / g.sessionsCount) * 100))
        : 0;
      g.eligible = g.sessionsCount > 0 && g.committed / g.sessionsCount >= CERT_THRESHOLD;
      g.needed = Math.max(0, Math.ceil(CERT_THRESHOLD * g.sessionsCount) - g.committed);
      groups.push(g);
    }
    // Course with the most recorded sessions first
    groups.sort((a, b) => b.records.length - a.records.length);

    return { recorded, committed, rate, points, groups };
  }, [records, t]);

  // Overall eligibility: at least one course group eligible
  const overallEligible = stats.groups.some((g) => g.eligible);

  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter);

  const filterChips: Array<{ id: FilterKey; label: string; count: number }> = [
    { id: 'all', label: t('filterAll'), count: records.length },
    { id: 'present', label: t('present'), count: records.filter((r) => r.status === 'present').length },
    { id: 'late', label: t('late'), count: records.filter((r) => r.status === 'late').length },
    { id: 'absent', label: t('absent'), count: records.filter((r) => r.status === 'absent').length },
    { id: 'excused', label: t('excused'), count: records.filter((r) => r.status === 'excused').length },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('attendanceTitle')} subtitle={t('attendanceSubtitle')} showBack onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 10 }}>
            <SkeletonLoader height={170} borderRadius={Radii.xl} />
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
                <CustomButton title={t('backToCourses')} onPress={() => onNavigate('s-courses')} variant="primary" size="mid" />
              ) : undefined
            }
          />
        ) : records.length === 0 ? (
          <EmptyStateView
            title={t('attendanceEmptyTitle')}
            description={t('attendanceEmptyDesc')}
            icon={<CalendarCheck color={colors.primary} size={32} />}
          />
        ) : (
          <>
            {/* ---- Summary hero: rate ring + points + eligibility ---- */}
            <CustomCard style={styles.heroCard}>
              <View style={styles.heroRow}>
                <ProgressRing
                  progress={stats.rate}
                  size={104}
                  strokeWidth={9}
                  color={overallEligible ? colors.teal : colors.amber}
                  bgColor={colors.card2}
                  showPercent
                >
                  <Text style={[styles.ringLabel, { color: colors.txt }]}>{t('commitmentRate')}</Text>
                </ProgressRing>

                <View style={styles.heroStats}>
                  <View style={styles.heroStatRow}>
                    <CalendarDays color={colors.primary} size={16} />
                    <Text style={[styles.heroStatText, { color: colors.mut }]}>
                      {t('attSessions', { attended: stats.committed, total: stats.recorded })}
                    </Text>
                  </View>
                  <View style={styles.heroStatRow}>
                    <Trophy color={colors.gold} size={16} />
                    <Text style={[styles.heroStatText, { color: colors.mut }]}>
                      {t('attTotalPoints', { p: stats.points })}
                    </Text>
                  </View>

                  {/* Certificate eligibility (smart 75% logic) */}
                  {overallEligible ? (
                    <View style={[styles.eligibilityBadge, { backgroundColor: colors.teal + '18' }]}>
                      <Award color={colors.teal} size={14} />
                      <Text style={[styles.eligibilityText, { color: colors.teal }]}>
                        {t('attEligible')} — {t('attEligibleSub')}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.eligibilityBadge, { backgroundColor: colors.amber + '18' }]}>
                      <Award color={colors.amber} size={14} />
                      <Text style={[styles.eligibilityText, { color: colors.amber }]}>
                        {t('attAtRisk', { n: Math.max(...stats.groups.map((g) => g.needed), 0) })} — {t('attAtRiskSub')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </CustomCard>

            {/* ---- Filter chips ---- */}
            <View style={styles.chipsRow}>
              {filterChips.map((chip) => {
                const active = filter === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    activeOpacity={0.75}
                    onPress={() => {
                      RTCHaptics.selection();
                      setFilter(chip.id);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.card2,
                        borderColor: active ? colors.primary : colors.line,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.mut }]}>
                      {chip.label} ({chip.count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ---- Per-course sections ---- */}
            {filter === 'all' ? (
              stats.groups.map((g) => (
                <View key={g.key} style={styles.courseSection}>
                  {/* Course header with real progress */}
                  <View style={styles.courseHeader}>
                    <Text style={[styles.courseTitle, { color: colors.txt }]} numberOfLines={1}>
                      {g.title}
                    </Text>
                    <View style={styles.courseHeaderRight}>
                      <Text style={[styles.courseSessions, { color: colors.mut }]}>
                        {t('attSessions', { attended: g.committed, total: g.sessionsCount })}
                      </Text>
                      {g.eligible ? (
                        <View style={[styles.miniBadge, { backgroundColor: colors.teal + '18' }]}>
                          <Text style={[styles.miniBadgeText, { color: colors.teal }]}>{t('attEligible')}</Text>
                        </View>
                      ) : (
                        <View style={[styles.miniBadge, { backgroundColor: colors.amber + '18' }]}>
                          <Text style={[styles.miniBadgeText, { color: colors.amber }]}>
                            {t('attAtRisk', { n: g.needed })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={[styles.progressTrack, { backgroundColor: colors.card2 }]}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${g.pct}%`, backgroundColor: g.eligible ? colors.teal : colors.amber },
                      ]}
                    />
                  </View>

                  {/* Session rows for this course */}
                  {g.records.map((rec) => {
                    const color = colors[STATUS_COLORS[rec.status] || 'red'];
                    const dateStr = rec.session_date
                      ? new Date(rec.session_date).toLocaleDateString(dateLocale(), {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';
                    const statusIcon = {
                      present: <CheckCircle2 color={color} size={18} />,
                      late: <Clock color={color} size={18} />,
                      absent: <XCircle color={color} size={18} />,
                      excused: <ShieldCheck color={color} size={18} />,
                    }[rec.status];

                    return (
                      <View
                        key={rec.session_id || `${rec.session_date}-${rec.status}`}
                        style={[styles.sessionRow, { borderBottomColor: colors.line }]}
                      >
                        <View style={[styles.statusCircle, { backgroundColor: color + '18' }]}>
                          {statusIcon}
                        </View>
                        <View style={styles.sessionInfo}>
                          <Text style={[styles.sessionTitle, { color: colors.txt }]} numberOfLines={1}>
                            {rec.session_title || t('lectureWord')}
                          </Text>
                          {dateStr ? <Text style={[styles.dateText, { color: colors.mut }]}>{dateStr}</Text> : null}
                        </View>
                        <View style={styles.sessionRight}>
                          <Text style={[styles.statusText, { color }]}>{t(rec.status)}</Text>
                          {typeof rec.points === 'number' && rec.points > 0 ? (
                            <Text style={[styles.pointsText, { color: colors.gold }]}>
                              {t('plusPoints', { p: rec.points })}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            ) : (
              /* Filtered view: flat list without course grouping */
              <View style={styles.courseSection}>
                {filtered.map((rec) => {
                  const color = colors[STATUS_COLORS[rec.status] || 'red'];
                  const dateStr = rec.session_date
                    ? new Date(rec.session_date).toLocaleDateString(dateLocale(), {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '';
                  return (
                    <View
                      key={rec.session_id || `${rec.session_date}-${rec.status}`}
                      style={[styles.sessionRow, { borderBottomColor: colors.line }]}
                    >
                      <View style={[styles.statusCircle, { backgroundColor: color + '18' }]}>
                        {rec.status === 'present' ? (
                          <CheckCircle2 color={color} size={18} />
                        ) : rec.status === 'late' ? (
                          <Clock color={color} size={18} />
                        ) : rec.status === 'excused' ? (
                          <ShieldCheck color={color} size={18} />
                        ) : (
                          <XCircle color={color} size={18} />
                        )}
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text style={[styles.sessionTitle, { color: colors.txt }]} numberOfLines={1}>
                          {rec.course_title || rec.session_title || t('lectureWord')}
                        </Text>
                        {dateStr ? <Text style={[styles.dateText, { color: colors.mut }]}>{dateStr}</Text> : null}
                      </View>
                      <View style={styles.sessionRight}>
                        <Text style={[styles.statusText, { color }]}>{t(rec.status)}</Text>
                        {typeof rec.points === 'number' && rec.points > 0 ? (
                          <Text style={[styles.pointsText, { color: colors.gold }]}>
                            {t('plusPoints', { p: rec.points })}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40, gap: 14 },
  heroCard: { padding: 18 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  ringLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  heroStats: { flex: 1, gap: 8 },
  heroStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroStatText: { fontSize: 12, fontWeight: '600' },
  eligibilityBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radii.md },
  eligibilityText: { fontSize: 11, fontWeight: '800', flex: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radii.full, borderWidth: 1 },
  chipText: { fontSize: 11.5, fontWeight: '700' },
  courseSection: { gap: 8 },
  courseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  courseTitle: { fontSize: 14.5, fontWeight: '800', flex: 1 },
  courseHeaderRight: { alignItems: 'flex-end', gap: 4 },
  courseSessions: { fontSize: 11, fontWeight: '600' },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full },
  miniBadgeText: { fontSize: 10, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: Radii.md,
    paddingHorizontal: 6,
  },
  statusCircle: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sessionInfo: { flex: 1, gap: 2 },
  sessionTitle: { fontSize: 13.5, fontWeight: '700' },
  dateText: { fontSize: 11 },
  sessionRight: { alignItems: 'flex-end', gap: 3 },
  statusText: { fontSize: 12, fontWeight: '800' },
  pointsText: { fontSize: 11, fontWeight: '700' },
});
