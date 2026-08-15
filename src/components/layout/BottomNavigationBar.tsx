import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { RTCHaptics } from '../../core/native/haptics';
import { BadgeCounter } from '../common/BadgeCounter';
import { Radii, Shadows } from '../../core/theme/tokens';
import {
  Home,
  BookOpen,
  Award,
  FileCheck,
  User,
  Users,
  BarChart3,
  Layers,
  GraduationCap,
} from 'lucide-react-native';

export interface BottomNavBarProps {
  currentScreen: string;
  onTabPress: (screenId: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: (color: string, size: number) => React.ReactNode;
}

export const BottomNavigationBar: React.FC<BottomNavBarProps> = ({
  currentScreen,
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, unreadNotificationsCount } = useAppStore();
  const { profile } = useAuthStore();

  const role = profile?.role || 'student';

  const studentTabs: NavItem[] = [
    { id: 's-home', label: 'الرئيسية', icon: (c, s) => <Home color={c} size={s} /> },
    { id: 's-courses', label: 'كورساتي', icon: (c, s) => <BookOpen color={c} size={s} /> },
    { id: 's-points', label: 'النقاط', icon: (c, s) => <Award color={c} size={s} /> },
    { id: 's-certs', label: 'شهاداتي', icon: (c, s) => <FileCheck color={c} size={s} /> },
    { id: 's-profile', label: 'حسابي', icon: (c, s) => <User color={c} size={s} /> },
  ];

  const volunteerTabs: NavItem[] = [
    { id: 'v-home', label: 'الرئيسية', icon: (c, s) => <Home color={c} size={s} /> },
    { id: 'v-batches', label: 'المجموعات', icon: (c, s) => <Users color={c} size={s} /> },
    { id: 'v-courses', label: 'الدورات', icon: (c, s) => <GraduationCap color={c} size={s} /> },
    { id: 's-analytics', label: 'التحليلات', icon: (c, s) => <BarChart3 color={c} size={s} /> },
    { id: 'v-profile', label: 'حسابي', icon: (c, s) => <User color={c} size={s} /> },
  ];

  const adminTabs: NavItem[] = [
    { id: 'a-home', label: 'الإدارة', icon: (c, s) => <Home color={c} size={s} /> },
    { id: 'a-users', label: 'المستخدمين', icon: (c, s) => <Users color={c} size={s} /> },
    { id: 'a-courses', label: 'الكورسات', icon: (c, s) => <Layers color={c} size={s} /> },
    { id: 's-analytics', label: 'التحليلات', icon: (c, s) => <BarChart3 color={c} size={s} /> },
    { id: 'a-settings', label: 'الإعدادات', icon: (c, s) => <User color={c} size={s} /> },
  ];

  const tabs = role === 'admin' ? adminTabs : role === 'volunteer' ? volunteerTabs : studentTabs;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          bottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View
        style={[
          styles.islandCard,
          {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 40, 142, 0.09)',
          },
          isDark ? Shadows.medium : Shadows.soft,
        ]}
      >
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = currentScreen === tab.id;
            const color = isActive ? colors.primary : isDark ? colors.mut : '#64748B';

            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.75}
                onPress={() => {
                  RTCHaptics.selection();
                  onTabPress(tab.id);
                }}
                style={styles.tabButton}
              >
                <View
                  style={[
                    styles.iconWrap,
                    isActive && {
                      backgroundColor: isDark ? 'rgba(60, 110, 255, 0.16)' : 'rgba(0, 40, 142, 0.08)',
                      borderRadius: Radii.lg,
                    },
                  ]}
                >
                  {tab.icon(color, 21)}
                  {tab.id === 's-home' && unreadNotificationsCount > 0 ? (
                    <View style={styles.badgeWrap}>
                      <BadgeCounter count={unreadNotificationsCount} size="sm" />
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color,
                      fontWeight: isActive ? '800' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 100,
    alignItems: 'center',
  },
  islandCard: {
    width: '100%',
    borderRadius: Radii.xxl,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconWrap: {
    position: 'relative',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  badgeWrap: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
});
