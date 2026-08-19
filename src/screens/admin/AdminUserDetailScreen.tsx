/**
 * Admin user dossier — profile, enrollments, attendance, ledger.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Repository } from '../../data/repositories';
import { RPC } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { CustomButton } from '../../components/common/CustomButton';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { maskPhone } from '../../core/security/sanitizers';
import { useT, dateLocale } from '../../core/i18n';
import { User, BookOpen, CalendarCheck, Coins } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const AdminUserDetailScreen: React.FC<{
  userId: string;
  onBack: () => void;
  onNavigate?: (screenId: string, params?: any) => void;
}> = ({ userId, onBack, onNavigate }) => {
  const { colors, showToast } = useAppStore();
  const { t } = useT();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const loadData = async () => {
    try {
      const data = await Repository.fetchUserDetail(userId);
      setDetail(data);
    } catch (e: any) {
      showToast(e?.message || t('genericLoadError'), 'warn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const profile = detail?.profile;
  const toggleStatus = async () => {
    if (!profile) return;
    setStatusBusy(true);
    try {
      const next = profile.status === 'active' ? 'inactive' : 'active';
      await RPC.setUserStatus(profile.id, next);
      showToast(t('statusUpdated'), 'ok');
      await loadData();
    } catch (e: any) {
      showToast(e?.message || t('auRoleError'), 'err');
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('userDetailTitle')} subtitle={profile?.full_name || t('auNoName')} showBack onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            <SkeletonLoader height={160} borderRadius={Radii.xl} />
            <SkeletonLoader height={120} borderRadius={Radii.xl} />
          </View>
        ) : profile ? (
          <>
            <CustomCard style={styles.card}>
              <View style={styles.profileRow}>
                <View style={[styles.avatar, { backgroundColor: colors.card2 }]}>
                  <User color={colors.primary} size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.txt }]}>{profile.full_name || t('auNoName')}</Text>
                  <Text style={[styles.meta, { color: colors.mut }]}>{profile.email || '—'}</Text>
                  <Text style={[styles.meta, { color: colors.mut }]}>{maskPhone(profile.phone)}</Text>
                </View>
              </View>
              <View style={styles.stats}>
                <Text style={[styles.stat, { color: colors.gold }]}>⭐ {profile.points || 0}</Text>
                <Text style={[styles.stat, { color: colors.teal }]}>🔥 {profile.streak || 0}</Text>
                <Text style={[styles.stat, { color: colors.primary }]}>{profile.role}</Text>
                <Text style={[styles.stat, { color: colors.mut }]}>{profile.status || 'active'}</Text>
              </View>
              <Text style={[styles.meta, { color: colors.mut }]}>{t('branch')}: {profile.branch_name || profile.branches?.name_ar || '—'}</Text>
              <View style={styles.actions}>
                <CustomButton title={t('setStatus')} onPress={toggleStatus} variant="soft" size="sm" loading={statusBusy} style={{ flex: 1 }} />
                {onNavigate ? (
                  <CustomButton
                    title={t('viewStudentRecord')}
                    onPress={() => onNavigate('v-student-record', { studentId: profile.id, studentName: profile.full_name })}
                    variant="primary"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                ) : null}
              </View>
            </CustomCard>

            <Text style={[styles.section, { color: colors.txt }]}>{t('userEnrollments')}</Text>
            {(detail.enrollments || []).length ? (
              detail.enrollments.map((e: any) => (
                <CustomCard key={e.id} style={styles.item}>
                  <View style={styles.itemRow}>
                    <BookOpen color={colors.primary} size={16} />
                    <Text style={[styles.itemTitle, { color: colors.txt }]}>{e.batches?.courses?.title || e.batches?.name || t('trainingGeneral')}</Text>
                  </View>
                  <Text style={[styles.meta, { color: colors.mut }]}>{e.status} · {e.batches?.schedule || ''}</Text>
                </CustomCard>
              ))
            ) : (
              <Text style={[styles.meta, { color: colors.mut }]}>{t('emptyTabTitle')}</Text>
            )}

            <Text style={[styles.section, { color: colors.txt }]}>{t('userAttendance')}</Text>
            {(detail.attendance || []).slice(0, 12).map((a: any, idx: number) => (
              <View key={`${a.session_id}-${idx}`} style={[styles.attRow, { borderBottomColor: colors.line }]}>
                <CalendarCheck color={colors.teal} size={16} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: colors.txt }]}>{a.sessions?.title || a.sessions?.batches?.courses?.title || t('lectureWord')}</Text>
                  <Text style={[styles.meta, { color: colors.mut }]}>
                    {a.status} {a.sessions?.session_date ? `· ${new Date(a.sessions.session_date).toLocaleDateString(dateLocale())}` : ''}
                  </Text>
                </View>
              </View>
            ))}

            <Text style={[styles.section, { color: colors.txt }]}>{t('userLedger')}</Text>
            {(detail.ledger || []).slice(0, 10).map((row: any) => (
              <View key={row.id} style={[styles.attRow, { borderBottomColor: colors.line }]}>
                <Coins color={colors.gold} size={16} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: colors.txt }]}>{row.notes || t('plEntry')}</Text>
                  <Text style={[styles.meta, { color: colors.gold }]}>+{row.points}</Text>
                </View>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40, gap: 10 },
  card: { padding: 16, gap: 12 },
  profileRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 17, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 2 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { fontSize: 12.5, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8 },
  section: { fontSize: 15, fontWeight: '800', marginTop: 8 },
  item: { padding: 12, gap: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { fontSize: 13.5, fontWeight: '700', flex: 1 },
  attRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});
