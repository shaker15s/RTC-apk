/**
 * Student Points & Badges Screen (s-points)
 * Displays total points, level progress, badges catalog, modal descriptions, and social badge claim.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { RPC } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { CustomButton } from '../../components/common/CustomButton';
import { RTCHaptics } from '../../core/native/haptics';
import { RTCSharing } from '../../core/native/sharing';
import {
  Award,
  Flame,
  Star,
  Lock,
  CheckCircle2,
  Share2,
  ListOrdered,
  Sparkles,
  BookOpen,
  CalendarCheck,
  Coins,
  Compass,
  GraduationCap,
  Heart,
  Trophy,
  X,
} from 'lucide-react-native';
import { useT, t } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const BADGES_CATALOG = [
  { id: 'welcome', name: t('bdWelcomeName'), icon: 'flag', color: '#00288E', desc: t('bdWelcomeDesc'), unlock: t('bdWelcomeUnlock') },
  { id: 'firstCourse', name: t('bdFirstCourseName'), icon: 'book', color: '#00554E', desc: t('bdFirstCourseDesc'), unlock: t('bdFirstCourseUnlock') },
  { id: 'firstAttend', name: t('bdFirstAttendName'), icon: 'check', color: '#0B6E63', desc: t('bdFirstAttendDesc'), unlock: t('bdFirstAttendUnlock') },
  { id: 'points100', name: t('bdPoints100Name'), icon: 'coins', color: '#D4AF37', desc: t('bdPoints100Desc'), unlock: t('bdPoints100Unlock') },
  { id: 'streak5', name: t('bdStreak5Name'), icon: 'fire', color: '#BA1A1A', desc: t('bdStreak5Desc'), unlock: t('bdStreak5Unlock') },
  { id: 'explorer', name: t('bdExplorerName'), icon: 'compass', color: '#7A30D8', desc: t('bdExplorerDesc'), unlock: t('bdExplorerUnlock') },
  { id: 'graduate', name: t('bdGraduateName'), icon: 'cert', color: '#1E40AF', desc: t('bdGraduateDesc'), unlock: t('bdGraduateUnlock') },
  { id: 'social', name: t('bdSocialName'), icon: 'heart', color: '#A8477A', desc: t('bdSocialDesc'), unlock: t('bdSocialUnlock') },
  { id: 'points500', name: t('bdPoints500Name'), icon: 'trophy', color: '#854D0E', desc: t('bdPoints500Desc'), unlock: t('bdPoints500Unlock') },
];

export const StudentPointsScreen: React.FC<{ onNavigate: (screenId: string) => void }> = ({ onNavigate }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { t } = useT();
  const { profile, refreshProfile } = useAuthStore();

  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [sharing, setSharing] = useState(false);

  const points = profile?.points || 0;
  const streak = profile?.streak || 0;
  const userBadgeIds = profile?.badge_ids || ['welcome'];

  const handleShareApp = async () => {
    setSharing(true);
    try {
      const shared = await RTCSharing.shareText(
        t('shareAppMessage'),
        t('shareAppBody')
      );
      if (shared) {
        await RPC.claimSocialBadge();
        RTCHaptics.success();
        // Points amount comes from the backend — no hardcoded claim (F-6)
        showToast('حصلت على شارة نجم سوشيال! 🎉', 'ok');
        await refreshProfile();
      }
    } catch (e) {
    } finally {
      setSharing(false);
    }
  };

  const getBadgeIcon = (iconName: string, color: string, isUnlocked: boolean) => {
    const iconColor = isUnlocked ? color : colors.mut;
    switch (iconName) {
      case 'flag':
        return <Sparkles color={iconColor} size={24} />;
      case 'book':
        return <BookOpen color={iconColor} size={24} />;
      case 'check':
        return <CalendarCheck color={iconColor} size={24} />;
      case 'coins':
        return <Coins color={iconColor} size={24} />;
      case 'fire':
        return <Flame color={iconColor} size={24} />;
      case 'compass':
        return <Compass color={iconColor} size={24} />;
      case 'cert':
        return <GraduationCap color={iconColor} size={24} />;
      case 'heart':
        return <Heart color={iconColor} size={24} />;
      case 'trophy':
        return <Trophy color={iconColor} size={24} />;
      default:
        return <Award color={iconColor} size={24} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('pointsTitle')} subtitle={t('achievementsSubtitle')} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Points Big Hero */}
        <LinearGradient colors={['#D4AF37', '#854D0E', '#00288E']} style={styles.pointsHero}>
          <View style={styles.heroInner}>
            <View style={styles.trophyCircle}>
              <Trophy color="#FFFFFF" size={32} />
            </View>
            <Text style={styles.totalPointsNum}>{points}</Text>
            <Text style={styles.totalPointsLabel}>{t('spTotalPoints')}</Text>

            <View style={styles.statsBar}>
              <View style={styles.statSubItem}>
                <Flame color="#FF8A00" size={16} />
                <Text style={styles.statSubText}>{t('spStreakSub', { n: streak })}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statSubItem}>
                <Award color="#FFD700" size={16} />
                <Text style={styles.statSubText}>{t('spBadgesSub', { n: userBadgeIds.length })}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <CustomButton
            title={t('spLedgerBtn')}
            onPress={() => onNavigate('s-ledger')}
            variant="soft"
            size="mid"
            icon={<ListOrdered color={colors.txt} size={18} />}
            style={{ flex: 1 }}
          />

          <CustomButton
            title={t('spShareBtn')}
            onPress={handleShareApp}
            variant="primary"
            size="mid"
            loading={sharing}
            icon={<Share2 color="#FFFFFF" size={18} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* Badges Matrix */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.txt }]}>{t('spCatalogTitle')}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mut }]}>{t('spCatalogSub')}</Text>
        </View>

        <View style={styles.badgesGrid}>
          {BADGES_CATALOG.map((badge) => {
            const isUnlocked = userBadgeIds.includes(badge.id);
            return (
              <TouchableOpacity
                key={badge.id}
                activeOpacity={0.75}
                onPress={() => {
                  RTCHaptics.selection();
                  setSelectedBadge({ ...badge, isUnlocked });
                }}
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isUnlocked ? badge.color + '60' : colors.line,
                  },
                ]}
              >
                <View
                  style={[
                    styles.badgeIconWrap,
                    {
                      backgroundColor: isUnlocked ? badge.color + '18' : colors.card2,
                    },
                  ]}
                >
                  {getBadgeIcon(badge.icon, badge.color, isUnlocked)}
                  {!isUnlocked ? (
                    <View style={styles.lockOverlay}>
                      <Lock color={colors.mut} size={13} />
                    </View>
                  ) : null}
                </View>

                <Text style={[styles.badgeName, { color: isUnlocked ? colors.txt : colors.mut }]} numberOfLines={1}>
                  {badge.name}
                </Text>

                <Text style={[styles.badgeUnlock, { color: colors.mut }]} numberOfLines={1}>
                  {isUnlocked ? t('spUnlocked') : badge.unlock}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Badge Details Modal */}
      <Modal visible={!!selectedBadge} transparent animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {selectedBadge ? (
              <>
                <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedBadge(null)}>
                  <X color={colors.mut} size={20} />
                </TouchableOpacity>

                <View
                  style={[
                    styles.bigBadgeIcon,
                    {
                      backgroundColor: selectedBadge.isUnlocked ? selectedBadge.color + '20' : colors.card2,
                    },
                  ]}
                >
                  {getBadgeIcon(selectedBadge.icon, selectedBadge.color, selectedBadge.isUnlocked)}
                </View>

                <Text style={[styles.modalBadgeTitle, { color: colors.txt }]}>{selectedBadge.name}</Text>
                <Text style={[styles.modalBadgeDesc, { color: colors.mut }]}>{selectedBadge.desc}</Text>

                <View style={[styles.unlockBox, { backgroundColor: colors.card2, borderColor: colors.line }]}>
                  <Text style={[styles.unlockBoxTitle, { color: colors.txt }]}>{t('spUnlockHow')}</Text>
                  <Text style={[styles.unlockBoxText, { color: colors.mut }]}>{selectedBadge.unlock}</Text>
                </View>

                {selectedBadge.isUnlocked ? (
                  <View style={styles.unlockedRow}>
                    <CheckCircle2 color={colors.teal} size={18} />
                    <Text style={{ color: colors.teal, fontWeight: '700', fontSize: 13 }}>{t('spUnlockedBadge')}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
    gap: 16,
  },
  pointsHero: {
    padding: 24,
    borderRadius: Radii.xxl,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  heroInner: {
    alignItems: 'center',
  },
  trophyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  totalPointsNum: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
  },
  totalPointsLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.full,
    marginTop: 16,
  },
  statSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statSubText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '31%',
    padding: 12,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    gap: 6,
  },
  badgeIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeUnlock: {
    fontSize: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radii.xxl,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    gap: 10,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 6,
  },
  bigBadgeIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  modalBadgeTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalBadgeDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  unlockBox: {
    width: '100%',
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginTop: 6,
    gap: 4,
  },
  unlockBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  unlockBoxText: {
    fontSize: 12,
    textAlign: 'right',
  },
  unlockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
});
