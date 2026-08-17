/**
 * Analytics Screen (s-analytics)
 * Branch and operational KPIs from analytics_kpis RPC with metric cards and attendance charts.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Repository } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { RTCHaptics } from '../../core/native/haptics';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Activity,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react-native';
import { useT } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const AnalyticsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors } = useAppStore();
  const { t } = useT();
  const { profile } = useAuthStore();

  const [kpis, setKpis] = useState<any>({
    active_students: 0,
    active_batches: 0,
    attendance_rate: 0,
    issued_certificates: 0,
    completion_rate: 0,
    excuse_rate: 100,
    satisfaction_score: '5.0',
    satisfaction_pct: 100,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await Repository.fetchAnalyticsBundle(profile);
      const profs = data.profs || [];
      const students = profs.filter((p: any) => p.role === 'student');
      const att = data.att || [];
      const certs = data.certs || [];
      const enrollments = data.enrollments || [];
      const excuses = data.excuses || [];
      const ratings = data.ratings || [];

      const presentAtt = att.filter((a: any) => a.status === 'present' || a.status === 'late').length;
      const realAttendanceRate = att.length > 0 ? Math.round((presentAtt / att.length) * 100) : 0;

      const completionRate = enrollments.length > 0
        ? Math.min(100, Math.round((certs.length / enrollments.length) * 100))
        : (students.length > 0 ? Math.min(100, Math.round((certs.length / students.length) * 100)) : 0);

      const reviewedExcuses = excuses.filter((e: any) => e.status === 'approved' || e.status === 'rejected').length;
      const excuseRate = excuses.length > 0 ? Math.round((reviewedExcuses / excuses.length) * 100) : 100;

      let satisfactionScore = '5.0';
      let satisfactionPct = 100;
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc: number, r: any) => acc + (r.rating || 5), 0);
        const avg = sum / ratings.length;
        satisfactionScore = avg.toFixed(1);
        satisfactionPct = Math.round((avg / 5) * 100);
      }

      setKpis({
        active_students: students.length,
        active_batches: data.batches?.length || 0,
        attendance_rate: realAttendanceRate,
        issued_certificates: certs.length,
        completion_rate: completionRate,
        excuse_rate: excuseRate,
        satisfaction_score: satisfactionScore,
        satisfaction_pct: satisfactionPct,
      });
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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('anTitle')} subtitle={t('anSubtitle')} showBack onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 14 }}>
            <View style={styles.kpiGrid}>
              <SkeletonLoader height={100} width="48%" borderRadius={Radii.lg} />
              <SkeletonLoader height={100} width="48%" borderRadius={Radii.lg} />
              <SkeletonLoader height={100} width="48%" borderRadius={Radii.lg} />
              <SkeletonLoader height={100} width="48%" borderRadius={Radii.lg} />
            </View>
            <SkeletonLoader height={160} borderRadius={Radii.xl} />
          </View>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              {/* Total Active Students */}
              <CustomCard style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: colors.primarySoft }]}>
                  <Users color={colors.primary} size={22} />
                </View>
                <Text style={[styles.kpiVal, { color: colors.txt }]}>{kpis.active_students || 0}</Text>
                <Text style={[styles.kpiLbl, { color: colors.mut }]}>{t('anActiveStudents')}</Text>
              </CustomCard>

              {/* Total Batches Running */}
              <CustomCard style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: colors.teal + '18' }]}>
                  <BookOpen color={colors.teal} size={22} />
                </View>
                <Text style={[styles.kpiVal, { color: colors.txt }]}>{kpis.active_batches || 0}</Text>
                <Text style={[styles.kpiLbl, { color: colors.mut }]}>{t('anRunningGroups')}</Text>
              </CustomCard>

              {/* Average Attendance Rate */}
              <CustomCard style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#7A30D818' }]}>
                  <CalendarCheck color="#7A30D8" size={22} />
                </View>
                <Text style={[styles.kpiVal, { color: colors.txt }]}>
                  {kpis.attendance_rate || 0}%
                </Text>
                <Text style={[styles.kpiLbl, { color: colors.mut }]}>{t('anAvgAttendance')}</Text>
              </CustomCard>

              {/* Issued Certificates */}
              <CustomCard style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: colors.gold + '18' }]}>
                  <Award color={colors.gold} size={22} />
                </View>
                <Text style={[styles.kpiVal, { color: colors.txt }]}>{kpis.issued_certificates || 0}</Text>
                <Text style={[styles.kpiLbl, { color: colors.mut }]}>{t('anCertified')}</Text>
              </CustomCard>
            </View>

            {/* Performance Indicators Card */}
            <CustomCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <TrendingUp color={colors.teal} size={20} />
                <Text style={[styles.summaryTitle, { color: colors.txt }]}>{t('anQuality')}</Text>
              </View>

              <View style={styles.indicatorRow}>
                <Text style={[styles.indLabel, { color: colors.mut }]}>{t('anCompletion')}</Text>
                <Text style={[styles.indValue, { color: colors.teal }]}>{kpis.completion_rate}%</Text>
              </View>
              <View style={[styles.progressBarTrack, { backgroundColor: colors.card2 }]}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, kpis.completion_rate))}%`, backgroundColor: colors.teal }]} />
              </View>

              <View style={[styles.indicatorRow, { marginTop: 12 }]}>
                <Text style={[styles.indLabel, { color: colors.mut }]}>{t('anExcuseRate')}</Text>
                <Text style={[styles.indValue, { color: colors.primary }]}>{kpis.excuse_rate}%</Text>
              </View>
              <View style={[styles.progressBarTrack, { backgroundColor: colors.card2 }]}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, kpis.excuse_rate))}%`, backgroundColor: colors.primary }]} />
              </View>

              <View style={[styles.indicatorRow, { marginTop: 12 }]}>
                <Text style={[styles.indLabel, { color: colors.mut }]}>{t('anSatisfaction')}</Text>
                <Text style={[styles.indValue, { color: colors.gold }]}>{kpis.satisfaction_score} / 5.0 ⭐</Text>
              </View>
              <View style={[styles.progressBarTrack, { backgroundColor: colors.card2 }]}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, kpis.satisfaction_pct))}%`, backgroundColor: colors.gold }]} />
              </View>
            </CustomCard>
          </>
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
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  kpiIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  kpiLbl: {
    fontSize: 12,
    textAlign: 'center',
  },
  summaryCard: {
    padding: 18,
    gap: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  indLabel: {
    fontSize: 12.5,
  },
  indValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
