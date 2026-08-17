/**
 * Admin Users Management Screen (a-users)
 * Search, filter by role, upgrade/change user role via set_user_role, and award bonus points via admin_award_points.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Repository } from '../../data/repositories';
import { RPC, UserProfile } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomButton } from '../../components/common/CustomButton';
import { SelectChips } from '../../components/common/SelectChips';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { maskPhone } from '../../core/security/sanitizers';
import { RTCHaptics } from '../../core/native/haptics';
import {
  Users,
  Search,
  Shield,
  Award,
  UserCheck,
  User,
  PlusCircle,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { useT } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export interface AdminUsersScreenProps {
  onBack: () => void;
  initialRole?: 'all' | 'student' | 'volunteer' | 'admin';
}

export const AdminUsersScreen: React.FC<AdminUsersScreenProps> = ({ onBack, initialRole = 'all' }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { t } = useT();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input (fixes F-15): one query per pause, not per keystroke.
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'volunteer' | 'admin'>(initialRole);

  // Sync roleFilter when navigating with a new initialRole param
  useEffect(() => {
    if (initialRole) {
      setRoleFilter(initialRole);
    }
  }, [initialRole]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Role Change Modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<'student' | 'volunteer' | 'admin'>('student');
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  // Award Points Modal
  const [awardUser, setAwardUser] = useState<UserProfile | null>(null);
  const [pointsAmount, setPointsAmount] = useState('20');
  const [pointsReason, setPointsReason] = useState('');
  const [awardModalVisible, setAwardModalVisible] = useState(false);
  const [awarding, setAwarding] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await Repository.fetchUsers(searchQuery || undefined);
      setUsers(data);
    } catch (e) {
      showToast(t('genericLoadError'), 'warn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setUpdatingRole(true);
    try {
      await RPC.changeUserRole(selectedUser.id, newRole);
      RTCHaptics.success();
      showToast(t('auRoleChanged'), 'ok');
      setRoleModalVisible(false);
      await loadUsers();
    } catch (e: any) {
      showToast(e?.message || t('auRoleError'), 'err');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleAwardPoints = async () => {
    if (!awardUser) return;
    const pts = parseInt(pointsAmount, 10);
    if (isNaN(pts) || pts <= 0) {
      showToast(t('auPointsValid'), 'warn');
      return;
    }

    setAwarding(true);
    try {
      try {
        await RPC.adminAwardPoints(awardUser.id, pts, pointsReason.trim() || undefined);
      } catch (rpcErr) {
        // Fallback: update profile points directly
        const currentPts = awardUser.points || 0;
        await supabase
          .from('profiles')
          .update({ points: currentPts + pts, updated_at: new Date().toISOString() })
          .eq('id', awardUser.id);
        
        // Also insert notification for the student
        await supabase.from('notifications').insert({
          user_id: awardUser.id,
          title: 'مكافأة نقاط تميز ⭐',
          message: pointsReason.trim() || `حصلت على ${pts} نقطة إضافية من إدارة المركز!`,
          type: 'success',
        });
      }

      RTCHaptics.success();
      showToast(t('auAwardDone', { n: pts }), 'ok');
      setAwardModalVisible(false);
      setPointsAmount('20');
      setPointsReason('');
      setUsers(prev => prev.map(u => u.id === awardUser.id ? { ...u, points: (u.points || 0) + pts } : u));
      await loadUsers();
    } catch (e: any) {
      RTCHaptics.error();
      showToast(e?.message || t('auAwardError'), 'err');
    } finally {
      setAwarding(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return true;
  });

  const filterChips = [
    { id: 'all', label: t('filterAll') },
    { id: 'student', label: t('students') },
    { id: 'volunteer', label: t('auVolunteers') },
    { id: 'admin', label: t('auAdmins') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('auTitle')} subtitle={t('auSubtitle')} showBack onBack={onBack} />

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <TextInputField
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder={t('auSearchPlaceholder')}
          icon={<Search color={colors.mut} size={18} />}
          style={{ marginBottom: 6 }}
        />
        <SelectChips items={filterChips} selectedId={roleFilter} onSelect={(id) => setRoleFilter(id as any)} />
      </View>

      {loading ? (
        <View style={styles.scrollContent}>
          <SkeletonLoader height={80} borderRadius={Radii.lg} />
          <SkeletonLoader height={80} borderRadius={Radii.lg} />
          <SkeletonLoader height={80} borderRadius={Radii.lg} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyStateView
              title={t('auEmptyTitle')}
              description={t('auEmptyDesc')}
              icon={<Users color={colors.primary} size={32} />}
            />
          }
          renderItem={({ item: user }) => {
            const roleColor =
              user.role === 'admin' ? colors.red : user.role === 'volunteer' ? colors.teal : colors.primary;

            const roleLabel =
              user.role === 'admin' ? t('admin') : user.role === 'volunteer' ? t('auVolunteerRole') : t('student');

            return (
              <CustomCard key={user.id} style={styles.userCard}>
                <View style={styles.userMain}>
                  <View style={[styles.avatarBox, { backgroundColor: colors.card2 }]}>
                    {user.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <User color={colors.mut} size={20} />
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={[styles.userName, { color: colors.txt }]} numberOfLines={1}>
                        {user.full_name || t('auNoName')}
                      </Text>
                      <View style={[styles.roleBadge, { backgroundColor: roleColor + '18' }]}>
                        <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
                      </View>
                    </View>

                    <View style={styles.userSubRow}>
                      <Text style={[styles.userPhone, { color: colors.mut }]}>
                        {maskPhone(user.phone)}
                      </Text>
                      <Text style={[styles.userPoints, { color: colors.gold }]}>
                        ⭐ {user.points || 0} {t('pointsStat')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions Row */}
                <View style={styles.userActions}>
                  <CustomButton
                    title={t('auChangeRole')}
                    onPress={() => {
                      RTCHaptics.light();
                      setSelectedUser(user);
                      setNewRole(user.role as any);
                      setRoleModalVisible(true);
                    }}
                    variant="soft"
                    size="sm"
                    icon={<Shield color={colors.txt} size={14} />}
                    style={{ flex: 1 }}
                  />

                  <CustomButton
                    title={t('auAwardPointsBtn')}
                    onPress={() => {
                      RTCHaptics.light();
                      setAwardUser(user);
                      setPointsAmount('20');
                      setPointsReason('');
                      setAwardModalVisible(true);
                    }}
                    variant="primary"
                    size="sm"
                    icon={<PlusCircle color="#FFFFFF" size={14} />}
                    style={{ flex: 1 }}
                  />
                </View>
              </CustomCard>
            );
          }}
        />
      )}

      {/* Role Change Modal */}
      <Modal visible={roleModalVisible} transparent animationType="slide" onRequestClose={() => setRoleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>{t('auChangeRoleSub')}</Text>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.targetUserName, { color: colors.txt }]}>
              {t('auUserLabel')} {selectedUser?.full_name}
            </Text>

            <View style={styles.roleOptions}>
              {(['student', 'volunteer', 'admin'] as const).map((r) => {
                const isSelected = newRole === r;
                const rTitle = r === 'admin' ? t('auRoleAdmin') : r === 'volunteer' ? t('auRoleVolunteer') : t('auRoleStudent');
                return (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.7}
                    onPress={() => setNewRole(r)}
                    style={[
                      styles.roleOptionCard,
                      {
                        backgroundColor: isSelected ? colors.primarySoft : colors.card2,
                        borderColor: isSelected ? colors.primary : colors.line,
                      },
                    ]}
                  >
                    <Text style={[styles.roleOptionText, { color: colors.txt }]}>{rTitle}</Text>
                    {isSelected ? <CheckCircle2 color={colors.primary} size={20} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <CustomButton
              title={t('auConfirmRole')}
              onPress={handleUpdateRole}
              variant="primary"
              size="big"
              loading={updatingRole}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>

      {/* Award Points Modal */}
      <Modal visible={awardModalVisible} transparent animationType="slide" onRequestClose={() => setAwardModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>{t('auAwardPoints')}</Text>
              <TouchableOpacity onPress={() => setAwardModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.targetUserName, { color: colors.txt }]}>
              {t('auBeneficiaryLabel')} {awardUser?.full_name}
            </Text>

            <TextInputField
              label={t('auPointsAmount')}
              value={pointsAmount}
              onChangeText={setPointsAmount}
              keyboardType="numeric"
              placeholder={t('auPointsPlaceholder')}
            />

            <TextInputField
              label={t('auReasonLabel')}
              value={pointsReason}
              onChangeText={setPointsReason}
              placeholder={t('auReasonPlaceholder')}
            />

            <CustomButton
              title={t('auAwardSub')}
              onPress={handleAwardPoints}
              variant="primary"
              size="big"
              loading={awarding}
              icon={<Award color="#FFFFFF" size={18} />}
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
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 12,
  },
  userCard: {
    padding: 14,
    gap: 12,
  },
  userMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  roleText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  userSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userPhone: {
    fontSize: 11.5,
  },
  userPoints: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  userActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
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
  targetUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  roleOptions: {
    gap: 8,
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  roleOptionText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
