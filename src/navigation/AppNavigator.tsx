/**
 * Master App Navigator for Masar RTC Mobile — v100.2.0
 * ---------------------------------------------------------------
 * Rebuilt on React Navigation (native-stack) replacing the hand-rolled
 * state navigator. This fixes (A-1):
 *   - native screen transitions + iOS swipe-back gesture
 *   - screens stay mounted (no data loss on navigation)
 *   - real deep linking (org.resala.rtc.masar://verify?serial=...)
 *   - notification tap routing via navigationRef
 *
 * Every existing screen keeps its exact prop interface (onNavigate /
 * onBack) through thin adapters, so no screen code needed rewriting.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import {
  NavigationContainer,
  useNavigation,
  useRoute,
  StackActions,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../state/appStore';
import { useAuthStore } from '../state/authStore';
import { useSessionStore } from '../state/sessionStore';
import { canAccess } from '../core/security/sanitizers';
import { RTCHaptics } from '../core/native/haptics';
import { navigationRef } from './navigationRef';
import { RootStackParamList } from './types';
import { linking } from './linking';
import { t } from '../core/i18n';
import { Platform } from 'react-native';

// Layout & Feedback Components
import { OfflineBanner } from '../components/layout/OfflineBanner';
import { BottomNavigationBar } from '../components/layout/BottomNavigationBar';
import { ToastContainer } from '../components/feedback/ToastContainer';

// Public Screens
import { SplashScreen } from '../screens/public/SplashScreen';
import { OnboardingScreen } from '../screens/public/OnboardingScreen';
import { VerifyCertScreen } from '../screens/public/VerifyCertScreen';
import { ChangelogScreen } from '../screens/public/ChangelogScreen';

// Student Screens
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { StudentCoursesScreen } from '../screens/student/StudentCoursesScreen';
import { CourseDetailScreen } from '../screens/student/CourseDetailScreen';
import { StudentPointsScreen } from '../screens/student/StudentPointsScreen';
import { PointsLedgerScreen } from '../screens/student/PointsLedgerScreen';
import { StudentCertsScreen } from '../screens/student/StudentCertsScreen';
import { StudentProfileScreen } from '../screens/student/StudentProfileScreen';
import { EditProfileScreen } from '../screens/student/EditProfileScreen';
import { ExploreCoursesScreen } from '../screens/student/ExploreCoursesScreen';
import { NotificationsScreen } from '../screens/student/NotificationsScreen';
import { StudentCheckInScreen } from '../screens/student/StudentCheckInScreen';
import { StudentExcuseScreen } from '../screens/student/StudentExcuseScreen';
import { LeaderboardScreen } from '../screens/student/LeaderboardScreen';
import { SupportScreen } from '../screens/student/SupportScreen';
import { CourseRatingScreen } from '../screens/student/CourseRatingScreen';
import { StudentAttendanceScreen } from '../screens/student/StudentAttendanceScreen';

// Volunteer Screens
import { VolunteerHomeScreen } from '../screens/volunteer/VolunteerHomeScreen';
import { VolunteerBatchesScreen } from '../screens/volunteer/VolunteerBatchesScreen';
import { VolunteerAttendanceScreen } from '../screens/volunteer/VolunteerAttendanceScreen';
import { VolunteerCoursesScreen } from '../screens/volunteer/VolunteerCoursesScreen';
import { VolunteerExcusesScreen } from '../screens/volunteer/VolunteerExcusesScreen';
import { VolunteerProfileScreen } from '../screens/volunteer/VolunteerProfileScreen';
import { AnalyticsScreen } from '../screens/volunteer/AnalyticsScreen';
import { SessionReportFormScreen } from '../screens/volunteer/SessionReportFormScreen';

// Admin Screens
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminCoursesScreen } from '../screens/admin/AdminCoursesScreen';
import { AdminCertsScreen } from '../screens/admin/AdminCertsScreen';
import { AdminSettingsScreen } from '../screens/admin/AdminSettingsScreen';
import { AdminBranchesScreen } from '../screens/admin/AdminBranchesScreen';
import { AdminCommitteesScreen } from '../screens/admin/AdminCommitteesScreen';
import { AdminBroadcastScreen } from '../screens/admin/AdminBroadcastScreen';
import { AdminAnalyticsScreen } from '../screens/admin/AdminAnalyticsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ---------------------------------------------------------------
// Determine platform-aware animation configuration
// ---------------------------------------------------------------
// Honor system reduced-motion preference by switching to fade transition
const prefersReducedMotion = false; // TODO: integrate with Appearance.reduceMotion
const transitionAnimation = prefersReducedMotion
  ? 'fade'
  : Platform.OS === 'ios'
    ? 'slide_from_right_ios'
    : 'scale_from_center';

// ---------------------------------------------------------------
// Screen adapter: injects onNavigate / onBack into every screen so
// the existing components work unchanged on top of React Navigation.
// ---------------------------------------------------------------
function makeScreen(Screen: React.ComponentType<any>, extraProps?: (props: any) => Record<string, any>) {
  return function ScreenWithNav(props: any) {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const profile = useAuthStore((s) => s.profile);
    const showToast = useAppStore((s) => s.showToast);

    const navigate = (screenId: string, params?: any) => {
      RTCHaptics.selection();
      const role = profile?.role || 'student';
      if (!canAccess(screenId, role)) {
        RTCHaptics.error();
        showToast(t('routeDenied'), 'warn');
        return;
      }
      navigation.push(screenId, params || {});
    };

    const onBack = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    };

    return <Screen onNavigate={navigate} onBack={onBack} {...(route.params || {})} {...(extraProps ? extraProps({ navigate }) : {})} />;
  };
}

// Special adapters
function OnboardingWithNav() {
  const navigation = useNavigation<any>();
  return (
    <OnboardingScreen
      onOpenVerify={() => navigation.push('verify')}
      onLoginSuccess={() => {}}
    />
  );
}

// Registered route table (single source of truth)
type RouteDef = { name: keyof RootStackParamList; component: React.ComponentType<any> };

const PUBLIC_SCREENS: RouteDef[] = [
  { name: 'onboarding', component: OnboardingWithNav },
  { name: 'verify', component: makeScreen(VerifyCertScreen) },
  { name: 'changelog', component: makeScreen(ChangelogScreen) },
];

const AUTHED_SCREENS: RouteDef[] = [
  // Shared / public-reachable
  { name: 'onboarding', component: OnboardingWithNav },
  { name: 'verify', component: makeScreen(VerifyCertScreen) },
  { name: 'changelog', component: makeScreen(ChangelogScreen) },

  // Student
  { name: 's-home', component: makeScreen(StudentHomeScreen) },
  { name: 's-courses', component: makeScreen(StudentCoursesScreen) },
  { name: 's-course-detail', component: makeScreen(CourseDetailScreen) },
  { name: 's-course-rating', component: makeScreen(CourseRatingScreen) },
  { name: 's-points', component: makeScreen(StudentPointsScreen) },
  { name: 's-ledger', component: makeScreen(PointsLedgerScreen) },
  { name: 's-certs', component: makeScreen(StudentCertsScreen) },
  { name: 's-profile', component: makeScreen(StudentProfileScreen) },
  { name: 's-edit-profile', component: makeScreen(EditProfileScreen) },
  { name: 's-explore', component: makeScreen(ExploreCoursesScreen) },
  { name: 's-notifications', component: makeScreen(NotificationsScreen) },
  { name: 's-checkin', component: makeScreen(StudentCheckInScreen) },
  { name: 's-excuse', component: makeScreen(StudentExcuseScreen) },
  { name: 's-leaderboard', component: makeScreen(LeaderboardScreen) },
  { name: 's-attendance', component: makeScreen(StudentAttendanceScreen) },
  { name: 'support', component: makeScreen(SupportScreen) },

  // Volunteer
  { name: 'v-home', component: makeScreen(VolunteerHomeScreen) },
  { name: 'v-batches', component: makeScreen(VolunteerBatchesScreen) },
  { name: 'v-attendance', component: makeScreen(VolunteerAttendanceScreen) },
  { name: 'v-courses', component: makeScreen(VolunteerCoursesScreen) },
  { name: 'v-excuses', component: makeScreen(VolunteerExcusesScreen) },
  { name: 'v-report', component: makeScreen(SessionReportFormScreen) },
  { name: 'v-profile', component: makeScreen(VolunteerProfileScreen) },
  { name: 's-analytics', component: makeScreen(AnalyticsScreen) },

  // Admin
  { name: 'a-home', component: makeScreen(AdminHomeScreen) },
  { name: 'a-users', component: makeScreen(AdminUsersScreen) },
  { name: 'a-courses', component: makeScreen(AdminCoursesScreen) },
  { name: 'a-certs', component: makeScreen(AdminCertsScreen) },
  { name: 'a-settings', component: makeScreen(AdminSettingsScreen) },
  { name: 'a-branches', component: makeScreen(AdminBranchesScreen) },
  { name: 'a-committees', component: makeScreen(AdminCommitteesScreen) },
  { name: 'a-broadcast', component: makeScreen(AdminBroadcastScreen) },
  { name: 'a-analytics', component: makeScreen(AdminAnalyticsScreen) },
];

// Screens that show the floating bottom tab bar
const TAB_SCREENS: (keyof RootStackParamList)[] = [
  's-home',
  's-courses',
  's-points',
  's-certs',
  's-profile',
  'v-home',
  'v-batches',
  'v-courses',
  'v-profile',
  'a-home',
  'a-users',
  'a-courses',
  'a-certs',
  'a-settings',
  'a-analytics',
  's-analytics',
];

function RootFlow() {
  const { session, profile, isInitialized } = useAuthStore();
  const { pendingRoute, setPendingRoute } = useSessionStore();

  // Consume notification/deep-link targets once signed in (F-12)
  useEffect(() => {
    if (!pendingRoute || !session || !profile || !isInitialized) return;
    // Incomplete profile? Finish onboarding first and keep the target.
    if (!profile?.phone || !profile?.branch_id) return;
    setPendingRoute(null);
    if (canAccess(pendingRoute, profile.role || 'student')) {
      navigationRef.navigate(pendingRoute as never);
    }
  }, [pendingRoute, session, profile, isInitialized]);

  // Auto-route to the role home once the profile is completed
  // (mirrors the old navigator's behaviour: onboarding → home).
  useEffect(() => {
    if (!session || !profile || !isInitialized) return;
    if (!profile?.phone || !profile?.branch_id) return;
    const role = profile.role || 'student';
    const home = role === 'admin' ? 'a-home' : role === 'volunteer' ? 'v-home' : 's-home';
    if (navigationRef.isReady() && navigationRef.getCurrentRoute()?.name === 'onboarding') {
      navigationRef.navigate(home as never);
      // For new students: also push s-explore so they can browse and join courses immediately
      if (role === 'student') {
        setTimeout(() => {
          navigationRef.navigate('s-explore' as never);
        }, 300);
      }
    }
  }, [session, profile, isInitialized]);

  // Splash while auth initializes
  if (!isInitialized) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  // Signed out: public stack
  if (!session) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {PUBLIC_SCREENS.map((r) => (
          <Stack.Screen key={r.name} name={r.name} component={r.component} />
        ))}
      </Stack.Navigator>
    );
  }

  // Signed in: role-based stack. New users with incomplete profiles
  // start at onboarding (step 2) until phone + branch are set.
  const role = profile?.role || 'student';
  const incomplete = !profile?.phone || !profile?.branch_id;
  const home = role === 'admin' ? 'a-home' : role === 'volunteer' ? 'v-home' : 's-home';

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: transitionAnimation }}
      initialRouteName={incomplete ? 'onboarding' : home}
    >
      {AUTHED_SCREENS.map((r) => (
        <Stack.Screen key={r.name} name={r.name} component={r.component} />
      ))}
    </Stack.Navigator>
  );
}

function RootShell({ currentRoute, setCurrentRoute }: { currentRoute: string; setCurrentRoute: (r: string) => void }) {
  const { colors } = useAppStore();
  const { session, profile } = useAuthStore();
  const showToast = useAppStore((s) => s.showToast);

  // Double-press-to-exit at the stack root (U-5). Native-stack handles
  // its own back behaviour when there is history.
  useEffect(() => {
    let lastPressAt = 0;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        return false; // let the stack pop
      }
      const now = Date.now();
      if (now - lastPressAt < 2000) {
        return false; // second press → exit app
      }
      lastPressAt = now;
      showToast(t('exitToast'), 'info');
      return true;
    });
    return () => sub.remove();
  }, [showToast]);

  const showTabBar = !!session && TAB_SCREENS.includes(currentRoute as keyof RootStackParamList);

  const handleTabPress = (screenId: string) => {
    const role = profile?.role || 'student';
    if (!canAccess(screenId, role)) {
      RTCHaptics.error();
      showToast(t('routeDenied'), 'warn');
      return;
    }
    if (!navigationRef.isReady()) return;
    if (screenId === currentRoute) return;
    // Tab switch = reset stack to the tab (mimics old tab behaviour)
    navigationRef.dispatch(StackActions.popToTop());
    navigationRef.navigate(screenId as never);
    setCurrentRoute(screenId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <OfflineBanner />
      <View style={styles.screenWrap}>
        <RootFlow />
      </View>
      {showTabBar ? (
        <BottomNavigationBar currentScreen={currentRoute} onTabPress={handleTabPress} />
      ) : null}
      <ToastContainer />
    </View>
  );
}

export const AppNavigator: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>('splash');

  const updateCurrentRoute = () => {
    if (navigationRef.isReady()) {
      const route = navigationRef.getCurrentRoute();
      if (route?.name) {
        setCurrentRoute(route.name);
      }
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={updateCurrentRoute}
      onStateChange={updateCurrentRoute}
    >
      <RootShell currentRoute={currentRoute} setCurrentRoute={setCurrentRoute} />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenWrap: {
    flex: 1,
  },
});
