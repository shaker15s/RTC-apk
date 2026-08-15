/**
 * Master App Navigator for Masar RTC Mobile
 * Orchestrates role-based tabs, screen stacks, route guards, hardware back handler, and toasts.
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { useAppStore } from '../state/appStore';
import { useAuthStore } from '../state/authStore';
import { canAccess } from '../core/security/sanitizers';
import { RTCHaptics } from '../core/native/haptics';

// Layout & Feedback Components
import { OfflineBanner } from '../components/layout/OfflineBanner';
import { BottomNavigationBar } from '../components/layout/BottomNavigationBar';
import { ToastContainer } from '../components/feedback/ToastContainer';

// Public Screens
import { SplashScreen } from '../screens/public/SplashScreen';
import { OnboardingScreen } from '../screens/public/OnboardingScreen';
import { VerifyCertScreen } from '../screens/public/VerifyCertScreen';

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

// Volunteer Screens
import { VolunteerHomeScreen } from '../screens/volunteer/VolunteerHomeScreen';
import { VolunteerBatchesScreen } from '../screens/volunteer/VolunteerBatchesScreen';
import { VolunteerAttendanceScreen } from '../screens/volunteer/VolunteerAttendanceScreen';
import { VolunteerCoursesScreen } from '../screens/volunteer/VolunteerCoursesScreen';
import { VolunteerExcusesScreen } from '../screens/volunteer/VolunteerExcusesScreen';
import { VolunteerProfileScreen } from '../screens/volunteer/VolunteerProfileScreen';
import { AnalyticsScreen } from '../screens/volunteer/AnalyticsScreen';

// Admin Screens
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminCoursesScreen } from '../screens/admin/AdminCoursesScreen';
import { AdminCertsScreen } from '../screens/admin/AdminCertsScreen';
import { AdminSettingsScreen } from '../screens/admin/AdminSettingsScreen';
import { AdminBranchesScreen } from '../screens/admin/AdminBranchesScreen';
import { AdminCommitteesScreen } from '../screens/admin/AdminCommitteesScreen';
import { AdminBroadcastScreen } from '../screens/admin/AdminBroadcastScreen';

// New Screens
import { CourseRatingScreen } from '../screens/student/CourseRatingScreen';
import { SessionReportFormScreen } from '../screens/volunteer/SessionReportFormScreen';
import { AdminAnalyticsScreen } from '../screens/admin/AdminAnalyticsScreen';
import { ChangelogScreen } from '../screens/public/ChangelogScreen';

export const AppNavigator: React.FC = () => {
  const { colors, showToast } = useAppStore();
  const { session, profile, isLoading, isInitialized, initAuth } = useAuthStore();

  const [currentScreen, setCurrentScreen] = useState<string>('splash');
  const [screenParams, setScreenParams] = useState<any>({});
  const [navigationStack, setNavigationStack] = useState<Array<{ screen: string; params: any }>>([]);

  // Initialize auth session on mount
  useEffect(() => {
    initAuth();
  }, []);

  // Handle default screen routing on auth state change
  useEffect(() => {
    // While initializing, stay on splash
    if (!isInitialized) {
      return;
    }

    // Not loading AND no session → go to onboarding (unless on public verify screen)
    if (!session) {
      if (currentScreen !== 'verify') {
        setCurrentScreen('onboarding');
      }
      return;
    }

    // Session exists — check if profile is complete
    // If profile has no phone or branch_id, stay on onboarding step 2
    if (session && (!profile?.phone || !profile?.branch_id)) {
      if (currentScreen === 'splash' || currentScreen !== 'onboarding') {
        setCurrentScreen('onboarding');
      }
      return;
    }

    // Session exists AND profile is complete → route to role-based home
    const role = profile?.role || 'student';
    if (currentScreen === 'splash' || currentScreen === 'onboarding') {
      if (role === 'admin') {
        setCurrentScreen('a-home');
      } else if (role === 'volunteer') {
        setCurrentScreen('v-home');
      } else {
        setCurrentScreen('s-home');
      }
    }
  }, [session, profile, isInitialized, isLoading]);

  // Android Hardware Back Button Handler
  useEffect(() => {
    const onBackPress = () => {
      if (navigationStack.length > 0) {
        handleBack();
        return true;
      }
      return false; // Exit app if at root
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigationStack]);

  const navigate = (screenId: string, params: any = {}) => {
    RTCHaptics.selection();
    const role = profile?.role || (session ? 'student' : 'public');

    // Route Guard Security check
    if (session && !canAccess(screenId, role)) {
      RTCHaptics.error();
      showToast('ليس لديك صلاحية الوصول لهذه الشاشة', 'warn');
      return;
    }

    setNavigationStack((prev) => [...prev, { screen: currentScreen, params: screenParams }]);
    setCurrentScreen(screenId);
    setScreenParams(params);
  };

  const handleBack = () => {
    RTCHaptics.light();
    if (navigationStack.length > 0) {
      const prev = navigationStack[navigationStack.length - 1];
      setNavigationStack((s) => s.slice(0, s.length - 1));
      setCurrentScreen(prev.screen);
      setScreenParams(prev.params || {});
    } else {
      const role = profile?.role || 'student';
      setCurrentScreen(role === 'admin' ? 'a-home' : role === 'volunteer' ? 'v-home' : 's-home');
    }
  };

  // Determine if Bottom Tab Bar should be visible
  const isTopTab = [
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
  ].includes(currentScreen);

  // Render Screen Content
  const renderScreen = () => {
    if (currentScreen === 'splash') {
      return (
        <SplashScreen
          onFinish={() => {
            const role = profile?.role || 'student';
            if (session) {
              setCurrentScreen(role === 'admin' ? 'a-home' : role === 'volunteer' ? 'v-home' : 's-home');
            } else {
              setCurrentScreen('onboarding');
            }
          }}
        />
      );
    }

    if (!session) {
      if (currentScreen === 'verify') {
        return <VerifyCertScreen onBack={() => setCurrentScreen('onboarding')} />;
      }
      return (
        <OnboardingScreen
          onLoginSuccess={() => {}}
          onOpenVerify={() => setCurrentScreen('verify')}
        />
      );
    }

    switch (currentScreen) {
      // Student Screens
      case 's-home':
        return <StudentHomeScreen onNavigate={navigate} />;
      case 's-courses':
        return <StudentCoursesScreen onNavigate={navigate} />;
      case 's-course-detail':
        return (
          <CourseDetailScreen
            courseId={screenParams.courseId}
            onBack={handleBack}
            onNavigate={navigate}
          />
        );
      case 's-course-rating':
        return (
          <CourseRatingScreen
            courseId={screenParams.courseId}
            courseTitle={screenParams.courseTitle}
            onBack={handleBack}
          />
        );
      case 's-points':
        return <StudentPointsScreen onNavigate={navigate} />;
      case 's-ledger':
        return <PointsLedgerScreen onBack={handleBack} />;
      case 's-certs':
        return <StudentCertsScreen onNavigate={navigate} />;
      case 's-profile':
        return <StudentProfileScreen onNavigate={navigate} />;
      case 's-edit-profile':
        return <EditProfileScreen onBack={handleBack} />;
      case 's-explore':
        return <ExploreCoursesScreen onNavigate={navigate} onBack={handleBack} />;
      case 's-notifications':
        return <NotificationsScreen onBack={handleBack} onNavigate={navigate} />;
      case 's-checkin':
        return <StudentCheckInScreen onBack={handleBack} onNavigate={navigate} />;
      case 's-excuse':
        return <StudentExcuseScreen onBack={handleBack} onNavigate={navigate} />;
      case 's-leaderboard':
        return <LeaderboardScreen onBack={handleBack} />;
      case 'support':
        return <SupportScreen onBack={handleBack} onNavigate={navigate} />;
      case 'changelog':
        return <ChangelogScreen onBack={handleBack} />;

      // Volunteer Screens
      case 'v-home':
        return <VolunteerHomeScreen onNavigate={navigate} />;
      case 'v-batches':
        return (
          <VolunteerBatchesScreen
            onNavigate={navigate}
            selectedBatchId={screenParams?.selectedBatchId}
          />
        );
      case 'v-attendance':
        return (
          <VolunteerAttendanceScreen
            sessionId={screenParams.sessionId}
            batchId={screenParams.batchId}
            students={screenParams.students || []}
            onBack={handleBack}
          />
        );
      case 'v-courses':
        return <VolunteerCoursesScreen onNavigate={navigate} />;
      case 'v-excuses':
        return <VolunteerExcusesScreen onBack={handleBack} />;
      case 'v-report':
        return (
          <SessionReportFormScreen
            sessionId={screenParams.sessionId}
            sessionTitle={screenParams.sessionTitle}
            onBack={handleBack}
          />
        );
      case 'v-profile':
        return <VolunteerProfileScreen onNavigate={navigate} />;
      case 's-analytics':
        return <AnalyticsScreen onBack={handleBack} />;

      // Admin Screens
      case 'a-home':
        return <AdminHomeScreen onNavigate={navigate} />;
      case 'a-users':
        return <AdminUsersScreen onBack={handleBack} />;
      case 'a-courses':
        return <AdminCoursesScreen onBack={handleBack} />;
      case 'a-certs':
        return <AdminCertsScreen onBack={handleBack} />;
      case 'a-settings':
        return <AdminSettingsScreen onNavigate={navigate} />;
      case 'a-branches':
        return <AdminBranchesScreen onBack={handleBack} />;
      case 'a-committees':
        return <AdminCommitteesScreen onBack={handleBack} />;
      case 'a-broadcast':
        return <AdminBroadcastScreen onBack={handleBack} />;
      case 'a-analytics':
        return <AdminAnalyticsScreen onBack={handleBack} />;

      // Fallback
      case 'verify':
        return <VerifyCertScreen onBack={handleBack} />;

      default:
        return <StudentHomeScreen onNavigate={navigate} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <OfflineBanner />
      <View style={styles.screenWrap}>{renderScreen()}</View>
      {session && isTopTab ? (
        <BottomNavigationBar
          currentScreen={currentScreen}
          onTabPress={(screenId) => {
            setNavigationStack([]);
            setCurrentScreen(screenId);
            setScreenParams({});
          }}
        />
      ) : null}
      <ToastContainer />
    </View>
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
