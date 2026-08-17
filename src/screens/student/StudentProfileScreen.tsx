/**
 * Student Profile Screen (s-profile)
 * Profile card, preferences (dark mode + language), shortcuts and logout.
 * Fully bilingual via the reactive i18n engine.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, Linking, Alert } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { SwitchToggle } from '../../components/common/SwitchToggle';
import { ConfirmModal } from '../../components/feedback/ConfirmModal';
import { RTCHaptics } from '../../core/native/haptics';
import { RTC_CONFIG } from '../../core/config';
import { useT, t } from '../../core/i18n';
import { layoutNeedsReload, applyLayoutDirection, reloadApp } from '../../core/i18n/direction';
import { maskPhone } from '../../core/security/sanitizers';
import { RTCSharing } from '../../core/native/sharing';
import { EasterEggModal } from '../../components/feedback/EasterEggModal';
import {
  Moon,
  Globe,
  ChevronLeft,
  Edit3,
  ShieldCheck,
  User,
  LifeBuoy,
  LogOut,
  MapPin,
  Phone,
  ExternalLink,
  Users,
  Shield,
  GraduationCap,
  Share2,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

let verTaps = 0;
let lastVerTap = 0;

export const StudentProfileScreen: React.FC<{ onNavigate: (screenId: string) => void }> = ({ onNavigate }) => {
  const { colors, isDark, toggleDarkMode, language, setAppLanguage, showToast } = useAppStore();
  const { t } = useT();
  const { profile, signOut } = useAuthStore();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [eggModalVisible, setEggModalVisible] = useState(false);

  const handleLogout = async () => {
    RTCHaptics.light();
    setLogoutModalVisible(false);
    await signOut();
  };

  const getRoleLabel = () => {
    switch (profile?.role) {
      case 'admin':
        return t('roleSysAdmin');
      case 'volunteer':
        return t('auVolunteerRole');
      default:
        return t('spfStudentRole');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('profileTitle')} subtitle={t('spfSubtitle')} showAvatar={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <CustomCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarWrap, { borderColor: colors.primary }]}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
              ) : (
                <User color={colors.primary} size={36} />
              )}
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRoleRow}>
                <Text style={[styles.fullName, { color: colors.txt }]} numberOfLines={1}>
                  {profile?.full_name || t('spfUserFallback')}
                </Text>
                <View style={[styles.roleBadge, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{getRoleLabel()}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MapPin color={colors.mut} size={14} />
                <Text style={[styles.infoText, { color: colors.mut }]}>
                  {profile?.branch_name || t('vpBranchFallback')}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Phone color={colors.mut} size={14} />
                <Text style={[styles.infoText, { color: colors.mut }]}>
                  {maskPhone(profile?.phone)}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Bar */}
          <View style={[styles.statsRow, { backgroundColor: colors.card2 }]}>
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.primary }]}>{profile?.points || 0}</Text>
              <Text style={[styles.statLbl, { color: colors.mut }]}>{t('points')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.teal }]}>🔥 {profile?.streak || 0}</Text>
              <Text style={[styles.statLbl, { color: colors.mut }]}>{t('streakStat')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.gold }]}>
                {profile?.badge_ids?.length || 1}
              </Text>
              <Text style={[styles.statLbl, { color: colors.mut }]}>{t('spfBadges')}</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              RTCHaptics.light();
              onNavigate('s-edit-profile');
            }}
            style={[styles.editProfileBtn, { backgroundColor: colors.card2, borderColor: colors.line }]}
          >
            <Edit3 color={colors.primary} size={16} />
            <Text style={[styles.editProfileText, { color: colors.primary }]}>{t('editProfileCta')}</Text>
          </TouchableOpacity>
        </CustomCard>

        {/* Preferences Section */}
        <CustomCard style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primarySoft }]}>
                <Moon color={colors.primary} size={18} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.txt }]}>{t('darkTitle')}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.mut }]}>{t('darkSubtitle')}</Text>
              </View>
            </View>
            <SwitchToggle value={isDark} onValueChange={toggleDarkMode} label={t('darkSwitchLabel')} />
          </View>

          <View style={[styles.menuDivider, { backgroundColor: colors.line }]} />

          {/* LIVE language toggle (v100.3.0): switches the whole
              translated UI instantly via the reactive i18n engine. */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              RTCHaptics.selection();
              const next = language === 'ar' ? 'en' : 'ar';
              // Instant switch when direction stays the same; otherwise
              // confirm, apply the new direction and reload (v100.4.0d).
              if (!layoutNeedsReload(next)) {
                setAppLanguage(next);
                return;
              }
              Alert.alert(t('dirSwitchTitle'), t('dirSwitchMessage'), [
                { text: t('cancel'), style: 'cancel' },
                {
                  text: t('dirSwitchConfirm'),
                  onPress: () => {
                    setAppLanguage(next);
                    applyLayoutDirection(next);
                    reloadApp();
                  },
                },
              ]);
            }}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.teal + '18' }]}>
                <Globe color={colors.teal} size={18} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.txt }]}>{t('langTitle')}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.mut }]}>
                  {language === 'ar' ? t('langArabic') : t('langEnglish')}
                </Text>
              </View>
            </View>
            <ChevronLeft color={colors.mut} size={18} />
          </TouchableOpacity>
        </CustomCard>

        {/* Shortcuts Section */}
        <CustomCard style={styles.menuCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              RTCHaptics.selection();
              await RTCSharing.shareText(t('shareAppMessage'), t('shareAppBody'));
            }}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.teal + '18' }]}>
                <Share2 color={colors.teal} size={18} />
              </View>
              <Text style={[styles.menuTitle, { color: colors.txt }]}>{t('shareAppCta')}</Text>
            </View>
            <ChevronLeft color={colors.mut} size={18} />
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: colors.line }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigate('verify')}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.gold + '18' }]}>
                <ShieldCheck color={colors.gold} size={18} />
              </View>
              <Text style={[styles.menuTitle, { color: colors.txt }]}>{t('verifyShortcut')}</Text>
            </View>
            <ChevronLeft color={colors.mut} size={18} />
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: colors.line }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigate('support')}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#7A30D818' }]}>
                <LifeBuoy color="#7A30D8" size={18} />
              </View>
              <Text style={[styles.menuTitle, { color: colors.txt }]}>{t('spfSupport')}</Text>
            </View>
            <ChevronLeft color={colors.mut} size={18} />
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: colors.line }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL(RTC_CONFIG.resalaActivityUrl)}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primarySoft }]}>
                <ExternalLink color={colors.primary} size={18} />
              </View>
              <Text style={[styles.menuTitle, { color: colors.txt }]}>{t('spfAbout')}</Text>
            </View>
            <ChevronLeft color={colors.mut} size={18} />
          </TouchableOpacity>
        </CustomCard>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setLogoutModalVisible(true)}
          style={[styles.logoutBtn, { backgroundColor: colors.red + '14', borderColor: colors.red + '30' }]}
        >
          <LogOut color={colors.red} size={18} />
          <Text style={[styles.logoutText, { color: colors.red }]}>{t('logoutCta')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            const now = Date.now();
            if (now - lastVerTap < 450) {
              verTaps += 1;
            } else {
              verTaps = 1;
            }
            lastVerTap = now;
            RTCHaptics.light();

            if (verTaps === 7) {
              verTaps = 0;
              setEggModalVisible(true);
            }
          }}
        >
          <Text style={[styles.versionText, { color: colors.mut }]}>
            {t('versionLine', { v: RTC_CONFIG.version })}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <EasterEggModal
        visible={eggModalVisible}
        type="lucky_biscuit"
        onClose={() => setEggModalVisible(false)}
      />

      {/* Logout Confirm Modal */}
      <ConfirmModal
        visible={logoutModalVisible}
        title={t('logout')}
        message={t('vpLogoutConfirm')}
        confirmLabel={t('logout')}
        cancelLabel={t('stay')}
        isDestructive
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
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
    paddingBottom: 90,
    gap: 14,
  },
  profileCard: {
    padding: 20,
    gap: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  nameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: Radii.lg,
  },
  statCell: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleSwitchCard: {
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
  },
  roleSwitchTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  roleSwitchSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  roleSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  roleSwitchBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  menuCard: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radii.xl,
    borderWidth: 1,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
