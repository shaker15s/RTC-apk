/**
 * AdminHomeScreen — Action Center & Decision Management for System Administrators.
 * Built with Apple HIG & Google Material 3 standards:
 * 1. Global KPIs & Real-time Metrics (Students, Coaches, Batches, Issued Certs)
 * 2. High-impact Action Hero (Broadcast Notifications & System Governance)
 * 3. Quick Administrative Modules (Users, Courses, Certs, Branches, Committees)
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Repository } from '../../data/repositories';
import { ScreenScaffold } from '../../components/layout/ScreenScaffold';
import { SectionHeader } from '../../components/common/SectionHeader';
import { MetricCard } from '../../components/common/MetricCard';
import { ResponsiveGrid } from '../../components/common/ResponsiveGrid';
import { PrimaryActionCard } from '../../components/common/PrimaryActionCard';
import { RTCHaptics } from '../../core/native/haptics';
import { useT } from '../../core/i18n';
import { Radii, Spacing } from '../../core/theme/tokens';
import {
  ShieldCheck,
  Users,
  BookOpen,
  Award,
  Settings,
  Building2,
  Send,
  BarChart3,
  Layers,
  ChevronLeft,
} from 'lucide-react-native';

export interface AdminHomeScreenProps {
  onNavigate: (screenId: string, params?: any) => void;
}

export const AdminHomeScreen: React.FC<AdminHomeScreenProps> = ({ onNavigate }) => {
  const { colors, showToast } = useAppStore();
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
      showToast(t('ahErrorLoad'), 'warn');
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
    <ScreenScaffold
      title="مركز إدارة مسار RTC 🛡️"
      subtitle={profile?.full_name ? `المسؤول: ${profile.full_name}` : 'لوحة الإدارة والتحكم'}
      showNotif
      onNotifPress={() => onNavigate('s-notifications')}
      showAvatar
      onAvatarPress={() => onNavigate('a-settings')}
      refreshing={refreshing}
      onRefresh={onRefresh}
      loading={loading}
    >
      {/* 1. Admin Grand Hero */}
      <PrimaryActionCard
        title="بث إشعار أو تعميم رسمي"
        subtitle="أرسل إشعارات وتنبيهات فورية لجميع الطلاب أو المدربين أو فروع محددة بضغطة زر."
        badge="التعميمات الفورية"
        actionLabel="إرسال إشعار عام"
        onPress={() => onNavigate('a-broadcast')}
        icon={<Send color="#FFFFFF" size={24} />}
        gradientColors={['#00288E', '#00554E']}
      />

      {/* 2. Key System KPIs Grid */}
      <ResponsiveGrid spacing={Spacing.md} minItemWidth={140} maxColumns={2}>
        <MetricCard
          label="الطلاب النشطون"
          value={kpis.active_students}
          color={colors.primary}
          icon={<Users color={colors.primary} size={18} />}
          onPress={() => onNavigate('a-users', { initialRole: 'student' })}
        />
        <MetricCard
          label="المدربون والمتطوعون"
          value={kpis.active_volunteers}
          color={colors.teal}
          icon={<ShieldCheck color={colors.teal} size={18} />}
          onPress={() => onNavigate('a-users', { initialRole: 'volunteer' })}
        />
        <MetricCard
          label="الدفعات النشطة"
          value={kpis.active_batches}
          color={colors.amber}
          icon={<Layers color={colors.amber} size={18} />}
          onPress={() => onNavigate('a-courses')}
        />
        <MetricCard
          label="الشهادات الصادرة"
          value={kpis.issued_certificates}
          color={colors.gold}
          icon={<Award color={colors.gold} size={18} />}
          onPress={() => onNavigate('a-certs')}
        />
      </ResponsiveGrid>

      {/* 3. Fast Administrative Modules */}
      <View style={styles.sectionWrap}>
        <SectionHeader title="وحدات النظام والإدارة" />
        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('a-users');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: colors.primarySoft }]}>
              <Users color={colors.primary} size={22} />
            </View>
            <View style={styles.moduleTextWrap}>
              <Text style={[styles.moduleTitle, { color: colors.txt }]}>إدارة المستخدمين والأدوار</Text>
              <Text style={[styles.moduleSub, { color: colors.mut }]}>تعديل الصلاحيات والأدوار</Text>
            </View>
            <ChevronLeft color={colors.mut} size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('a-courses');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: colors.tealSoft }]}>
              <BookOpen color={colors.teal} size={22} />
            </View>
            <View style={styles.moduleTextWrap}>
              <Text style={[styles.moduleTitle, { color: colors.txt }]}>الدورات والمجموعات</Text>
              <Text style={[styles.moduleSub, { color: colors.mut }]}>إضافة دفعات وتعيين مدربين</Text>
            </View>
            <ChevronLeft color={colors.mut} size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('a-certs');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: colors.goldSoft }]}>
              <Award color={colors.gold} size={22} />
            </View>
            <View style={styles.moduleTextWrap}>
              <Text style={[styles.moduleTitle, { color: colors.txt }]}>إصدار وتوثيق الشهادات</Text>
              <Text style={[styles.moduleSub, { color: colors.mut }]}>اعتماد الشهادات الرقمية</Text>
            </View>
            <ChevronLeft color={colors.mut} size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('a-branches');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: colors.amberSoft }]}>
              <Building2 color={colors.amber} size={22} />
            </View>
            <View style={styles.moduleTextWrap}>
              <Text style={[styles.moduleTitle, { color: colors.txt }]}>فروع رسالة</Text>
              <Text style={[styles.moduleSub, { color: colors.mut }]}>بيانات الفروع والقاعات</Text>
            </View>
            <ChevronLeft color={colors.mut} size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('a-analytics');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: colors.greenSoft }]}>
              <BarChart3 color={colors.green} size={22} />
            </View>
            <View style={styles.moduleTextWrap}>
              <Text style={[styles.moduleTitle, { color: colors.txt }]}>التقارير والإحصائيات</Text>
              <Text style={[styles.moduleSub, { color: colors.mut }]}>معدلات الحضور والإنجاز</Text>
            </View>
            <ChevronLeft color={colors.mut} size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('a-committees');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: colors.tealSoft }]}>
              <Users color={colors.teal} size={22} />
            </View>
            <View style={styles.moduleTextWrap}>
              <Text style={[styles.moduleTitle, { color: colors.txt }]}>لجان التطوع</Text>
              <Text style={[styles.moduleSub, { color: colors.mut }]}>إدارة وتنسيق اللجان التطوعية</Text>
            </View>
            <ChevronLeft color={colors.mut} size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('a-settings');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: colors.card2 }]}>
              <Settings color={colors.txt} size={22} />
            </View>
            <View style={styles.moduleTextWrap}>
              <Text style={[styles.moduleTitle, { color: colors.txt }]}>إعدادات النظام العامة</Text>
              <Text style={[styles.moduleSub, { color: colors.mut }]}>الأمان والنسخ الاحتياطي</Text>
            </View>
            <ChevronLeft color={colors.mut} size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  metricsGrid: {
    gap: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sectionWrap: {
    gap: Spacing.sm,
  },
  modulesGrid: {
    gap: Spacing.sm,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.xl,
    borderWidth: 1,
    gap: Spacing.md,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTextWrap: {
    flex: 1,
    gap: 2,
  },
  moduleTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  moduleSub: {
    fontSize: 12,
  },
});
