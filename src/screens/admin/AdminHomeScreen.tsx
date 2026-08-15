/**
 * Admin Home Dashboard Screen (a-home)
 * Global overview, system shortcuts, branch status, and key management actions.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Repository } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { RTCHaptics } from '../../core/native/haptics';
import {
  ShieldCheck,
  Users,
  BookOpen,
  Award,
  Settings,
  Building2,
  Send,
  BarChart3,
  Sparkles,
  Layers,
  ChevronLeft,
} from 'lucide-react-native';
import { useT } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const AdminHomeScreen: React.FC<{ onNavigate: (screenId: string, params?: any) => void }> = ({
  onNavigate,
}) => {
  const { colors } = useAppStore();
  const { t } = useT();
  const { profile, refreshProfile } = useAuthStore();

  const [kpis, setKpis] = useState<any>({
    active_students: 0,
    active_volunteers: 0,
    active_batches: 0,
    issued_certificates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await Repository.fetchAnalyticsBundle(profile);
      const profs = data.profs || [];
      const students = profs.filter((p: any) => p.role === 'student');
      const volunteers = profs.filter((p: any) => p.role === 'volunteer');
      setKpis({
        active_students: students.length,
        active_volunteers: volunteers.length,
        active_batches: data.batches?.length || 0,
        issued_certificates: data.certs?.length || 0,
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
    await Promise.all([refreshProfile(), loadData()]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title={t('ahTitle')}
        subtitle={t('ahSubtitle')}
        showNotif
        onNotifPress={() => onNavigate('s-notifications')}
        showAvatar
        onAvatarPress={() => onNavigate('a-settings')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Admin Grand Hero */}
        <LinearGradient colors={['#00288E', '#001655', '#00554E']} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.adminBadge}>
              <ShieldCheck color="#FFD700" size={16} />
              <Text style={styles.adminBadgeText}>{t('ahRole')}</Text>
            </View>
            <Text style={styles.heroName}>{profile?.full_name || t('ahRoleAlt')}</Text>
            <Text style={styles.heroBranch}>{profile?.branch_name || t('ahBranch')}</Text>
          </View>

          {/* KPI Mini Bar */}
          <View style={styles.kpiMiniRow}>
            <View style={styles.kpiMiniItem}>
              <Text style={styles.kpiMiniVal}>{kpis?.active_students || 0}</Text>
              <Text style={styles.kpiMiniLbl}>{t('students')}</Text>
            </View>
            <View style={styles.kpiMiniDivider} />
            <View style={styles.kpiMiniItem}>
              <Text style={styles.kpiMiniVal}>{kpis?.active_batches || 0}</Text>
              <Text style={styles.kpiMiniLbl}>{t('groups')}</Text>
            </View>
            <View style={styles.kpiMiniDivider} />
            <View style={styles.kpiMiniItem}>
              <Text style={styles.kpiMiniVal}>{kpis?.issued_certs || 0}</Text>
              <Text style={styles.kpiMiniLbl}>{t('certs')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Management Actions Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.txt }]}>{t('ahSections')}</Text>
        </View>

        <View style={styles.adminGrid}>
          {/* Users Management */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate('a-users')}
            style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.gridIcon, { backgroundColor: colors.primarySoft }]}>
              <Users color={colors.primary} size={24} />
            </View>
            <Text style={[styles.gridTitle, { color: colors.txt }]}>{t('users')}</Text>
            <Text style={[styles.gridSub, { color: colors.mut }]}>{t('ahRolesSearch')}</Text>
          </TouchableOpacity>

          {/* Courses Management */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate('a-courses')}
            style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.gridIcon, { backgroundColor: colors.teal + '18' }]}>
              <BookOpen color={colors.teal} size={24} />
            </View>
            <Text style={[styles.gridTitle, { color: colors.txt }]}>{t('ahCourses')}</Text>
            <Text style={[styles.gridSub, { color: colors.mut }]}>{t('ahContent')}</Text>
          </TouchableOpacity>

          {/* Certificates Management */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate('a-certs')}
            style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.gridIcon, { backgroundColor: colors.gold + '18' }]}>
              <Award color={colors.gold} size={24} />
            </View>
            <Text style={[styles.gridTitle, { color: colors.txt }]}>{t('certs')}</Text>
            <Text style={[styles.gridSub, { color: colors.mut }]}>{t('ahIssue')}</Text>
          </TouchableOpacity>

          {/* Broadcast Alerts */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate('a-broadcast')}
            style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.gridIcon, { backgroundColor: colors.red + '18' }]}>
              <Send color={colors.red} size={24} />
            </View>
            <Text style={[styles.gridTitle, { color: colors.txt }]}>{t('ahNotif')}</Text>
            <Text style={[styles.gridSub, { color: colors.mut }]}>{t('ahBroadcastSub')}</Text>
          </TouchableOpacity>

          {/* Branches */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate('a-branches')}
            style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#7A30D818' }]}>
              <Building2 color="#7A30D8" size={24} />
            </View>
            <Text style={[styles.gridTitle, { color: colors.txt }]}>{t('branches')}</Text>
            <Text style={[styles.gridSub, { color: colors.mut }]}>{t('ahBranchesManage')}</Text>
          </TouchableOpacity>

          {/* Committees */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate('a-committees')}
            style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.gridIcon, { backgroundColor: colors.teal + '18' }]}>
              <Layers color={colors.teal} size={24} />
            </View>
            <Text style={[styles.gridTitle, { color: colors.txt }]}>{t('ahCommittees')}</Text>
            <Text style={[styles.gridSub, { color: colors.mut }]}>{t('ahTeams')}</Text>
          </TouchableOpacity>
        </View>

        {/* Global Analytics Preview */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => onNavigate('s-analytics')}>
          <CustomCard style={styles.analyticsBanner}>
            <View style={styles.analyticsBannerLeft}>
              <View style={[styles.analyticsIcon, { backgroundColor: colors.primarySoft }]}>
                <BarChart3 color={colors.primary} size={22} />
              </View>
              <View>
                <Text style={[styles.analyticsBannerTitle, { color: colors.txt }]}>
                  {t('ahReportTitle')}
                </Text>
                <Text style={[styles.analyticsBannerSub, { color: colors.mut }]}>
                  {t('ahReportSub')}
                </Text>
              </View>
            </View>
            <ChevronLeft color={colors.primary} size={18} />
          </CustomCard>
        </TouchableOpacity>
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
    paddingBottom: 90,
    gap: 16,
  },
  heroCard: {
    padding: 22,
    borderRadius: Radii.xxl,
    shadowColor: '#00288E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  heroHeader: {
    gap: 4,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    marginBottom: 4,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  heroBranch: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  kpiMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: Radii.lg,
    paddingVertical: 12,
    marginTop: 18,
  },
  kpiMiniItem: {
    alignItems: 'center',
  },
  kpiMiniVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  kpiMiniLbl: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 1,
  },
  kpiMiniDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    padding: 16,
    borderRadius: Radii.xl,
    borderWidth: 1,
    gap: 8,
  },
  gridIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  gridSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  analyticsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  analyticsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  analyticsIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  analyticsBannerSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
});
