import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { RTCHaptics } from '../../core/native/haptics';
import { BadgeCounter } from '../common/BadgeCounter';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { SpringConfigs } from '../../core/animations';
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
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: isDark ? 'rgba(16, 23, 38, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderTopColor: colors.line,
        },
      ]}
    >
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id;
          const color = isActive ? colors.primary : colors.mut;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
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
                    backgroundColor: colors.primarySoft,
                    borderRadius: 14,
                  },
                ]}
              >
                {tab.icon(color, 20)}
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
                    fontWeight: isActive ? '800' : '500',
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
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 6,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    textAlign: 'center',
  },
  badgeWrap: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
});

