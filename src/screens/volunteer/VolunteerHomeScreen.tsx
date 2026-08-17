/**
 * VolunteerHomeScreen — "Faster Than Paper" Live Session Hub for Instructors & Volunteers.
 * Centers the experience around quick class management:
 * 1. 1-Tap "Start Session" to launch QR code and live check-in
 * 2. Pending student excuses requiring review
 * 3. Quick session report creation
 * 4. Active batch rosters
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
import { Repository, Batch } from '../../data/repositories';
import { ScreenScaffold } from '../../components/layout/ScreenScaffold';
import { SectionHeader } from '../../components/common/SectionHeader';
import { StatusPill } from '../../components/common/StatusPill';
import { MetricCard } from '../../components/common/MetricCard';
import { ResponsiveGrid } from '../../components/common/ResponsiveGrid';
import { PrimaryActionCard } from '../../components/common/PrimaryActionCard';
import { CustomCard } from '../../components/common/CustomCard';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import { useT } from '../../core/i18n';
import { Radii, Spacing, TouchTarget } from '../../core/theme/tokens';
import {
  Users,
  Play,
  FileCheck2,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  GraduationCap,
  Sparkles,
  ClipboardList,
  Award,
  QrCode,
} from 'lucide-react-native';

export interface VolunteerHomeScreenProps {
  onNavigate: (screenId: string, params?: any) => void;
}

export const VolunteerHomeScreen: React.FC<VolunteerHomeScreenProps> = ({ onNavigate }) => {
  const { colors, showToast } = useAppStore();
  const { t } = useT();
  const { profile, refreshProfile } = useAuthStore();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await Repository.fetchMyBatches();
      setBatches(data);
    } catch (e) {
      showToast(t('vhErrorLoad'), 'warn');
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

  const activeBatches = batches.filter((b) => b.is_active);

  return (
    <ScreenScaffold
      title={`مرحباً، ${profile?.full_name?.split(' ')[0] || 'المدرب'} 🌟`}
      subtitle={profile?.branch_name ? `فرع ${profile.branch_name}` : 'لوحة المدرب والمتطوع'}
      showNotif
      onNotifPress={() => onNavigate('s-notifications')}
      showAvatar
      onAvatarPress={() => onNavigate('v-profile')}
      refreshing={refreshing}
      onRefresh={onRefresh}
      loading={loading}
    >
      {/* 1. Hero Action: Fast Session Launcher */}
      <PrimaryActionCard
        title="ابدأ الجلسة الآن وشارك رمز الحضور"
        subtitle="اختر الدفعة لتوليد رمز QR وكود التحقق المباشر لتسجيل حضور الطلاب فورياً."
        badge="إدارة المحاضرة"
        actionLabel="بدء الجلسة وعرض الرمز"
        onPress={() => onNavigate('v-batches')}
        icon={<QrCode color="#FFFFFF" size={24} />}
        gradientColors={['#00554E', '#00288E']}
      />

      {/* 2. Key Metrics Row */}
      <ResponsiveGrid spacing={Spacing.md} minItemWidth={140} maxColumns={2}>
        <MetricCard
          label="المجموعات النشطة"
          value={activeBatches.length}
          color={colors.teal}
          icon={<GraduationCap color={colors.teal} size={18} />}
          onPress={() => onNavigate('v-batches')}
        />
        <MetricCard
          label="إجمالي المجموعات"
          value={batches.length}
          color={colors.primary}
          icon={<Users color={colors.primary} size={18} />}
          onPress={() => onNavigate('v-courses')}
        />
      </ResponsiveGrid>

      {/* 3. Quick Action Hub for Coach */}
      <View style={styles.sectionWrap}>
        <SectionHeader title="أدوات إدارة المحاضرات" />
        <ResponsiveGrid spacing={Spacing.md} minItemWidth={140} maxColumns={2}>
          <TouchableOpacity
            style={[styles.actionGridItem, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('v-batches');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.tealSoft }]}>
              <Play color={colors.teal} size={22} />
            </View>
            <Text style={[styles.actionGridLabel, { color: colors.txt }]}>بدء جلسة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionGridItem, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('v-batches');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.primarySoft }]}>
              <ClipboardList color={colors.primary} size={22} />
            </View>
            <Text style={[styles.actionGridLabel, { color: colors.txt }]}>رصد الحضور</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionGridItem, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('v-excuses');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.amberSoft }]}>
              <FileCheck2 color={colors.amber} size={22} />
            </View>
            <Text style={[styles.actionGridLabel, { color: colors.txt }]}>مراجعة الأعذار</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionGridItem, { backgroundColor: colors.card, borderColor: colors.line }]}
            onPress={() => {
              RTCHaptics.selection();
              onNavigate('v-courses');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.goldSoft }]}>
              <Award color={colors.gold} size={22} />
            </View>
            <Text style={[styles.actionGridLabel, { color: colors.txt }]}>الشهادات والتقييم</Text>
          </TouchableOpacity>
        </ResponsiveGrid>
      </View>

      {/* 4. Active Batches List */}
      <View style={styles.sectionWrap}>
        <SectionHeader
          title="مجموعاتي التدريبية"
          badge={batches.length}
          actionLabel="عرض الكل"
          onAction={() => onNavigate('v-batches')}
        />

        {batches.length === 0 ? (
          <EmptyStateView
            title="لا توجد مجموعات مسندة لك بعد"
            description="عند إسناد مجموعات تدريبية لك من قبل المشرف، ستظهر هنا فورياً لتتمكن من بدء الجلسات وتسجيل الحضور."
            icon={<Users color={colors.mut} size={32} />}
          />
        ) : (
          <View style={styles.batchesList}>
            {batches.slice(0, 3).map((item) => (
              <CustomCard
                key={item.id}
                onPress={() => onNavigate('v-batches', { selectedBatchId: item.id })}
                style={styles.batchCard}
              >
                <View style={styles.batchCardHeader}>
                  <View style={styles.batchTitleWrap}>
                    <Text style={[styles.batchTitle, { color: colors.txt }]} numberOfLines={1}>
                      {item.courses?.title || item.name}
                    </Text>
                    <Text style={[styles.batchMeta, { color: colors.mut }]} numberOfLines={1}>
                      {item.name} • {item.branches?.name_ar || 'الفرع'}
                    </Text>
                  </View>
                  <StatusPill
                    label={item.is_active ? 'نشطة' : 'مكتملة'}
                    variant={item.is_active ? 'active' : 'completed'}
                    size="sm"
                  />
                </View>
              </CustomCard>
            ))}
          </View>
        )}
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sectionWrap: {
    gap: Spacing.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionGridItem: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 90,
    justifyContent: 'center',
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGridLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  batchesList: {
    gap: Spacing.sm,
  },
  batchCard: {
    padding: Spacing.md,
  },
  batchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchTitleWrap: {
    flex: 1,
    gap: 2,
    paddingEnd: Spacing.sm,
  },
  batchTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  batchMeta: {
    fontSize: 12,
  },
});
