/**
 * Automated Test Suite for Masar RTC Mobile (rtc_mobile)
 * Tests RPC contract parity (all 29 functions exactly as documented in docs/RPC-CONTRACT.md),
 * Screen parity (all 34 screens), Navigation Layer, Reusable Components,
 * Security Sanitizers & Route Guards (Unit Suite), i18n Engine & Localization Parity (Unit Suite),
 * Design Tokens & WCAG Contrast Standards (Unit Suite), and App Configuration.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✘ FAIL:\x1b[0m ${message}`);
    failedTests++;
  }
}

console.log('\n======================================================');
console.log('🚀 Running Masar RTC Mobile (rtc_mobile) Test Suite');
console.log('======================================================\n');

// -------------------------------------------------------------
// 0. REAL COMPILATION CHECK (TypeScript strict)
// -------------------------------------------------------------
console.log('🧰 0. Compiling the REAL source with tsc --noEmit...');
const repoRoot = path.join(__dirname, '..');
const tscBin = path.join(repoRoot, 'node_modules/typescript/bin/tsc');

const tsc = spawnSync(process.execPath, [tscBin, '--noEmit'], {
  cwd: repoRoot,
  encoding: 'utf8',
  timeout: 180000,
});

if (tsc.status === 0) {
  console.log('  \x1b[32m✔ PASS:\x1b[0m TypeScript compilation succeeded with zero errors');
  passedTests++;
} else {
  console.error('  \x1b[31m✘ FAIL:\x1b[0m TypeScript compilation failed');
  console.error(tsc.stdout || '');
  console.error(tsc.stderr || '');
  failedTests++;
}

// -------------------------------------------------------------
// 1. RPC CONTRACT PARITY (Exact PostgreSQL Functions)
// -------------------------------------------------------------
console.log('\n📦 1. Testing RPC Functions Parity with docs/RPC-CONTRACT.md...');

const ALL_RPCS = [
  'get_my_profile',
  'ensure_my_profile',
  'batch_roster',
  'admin_list_profiles',
  'batch_seat_counts',
  'update_branch_directory',
  'join_batch',
  'start_session',
  'student_check_in',
  'record_session_attendance',
  'close_session',
  'issue_certificates',
  'change_user_role',
  'set_user_status',
  'assign_instructor',
  'verify_certificate',
  'get_leaderboard',
  'submit_excuse',
  'review_excuse',
  'submit_session_report',
  'submit_course_rating',
  'broadcast_notice',
  'add_private_note',
  'claim_social_badge',
  'disable_my_push_devices',
  'register_push_device',
  // v100.1.0 quality-fix RPCs (docs/RPC-CONTRACT.md #27, #28 & #29)
  'admin_award_points',
  'get_active_session',
  'get_my_next_session',
  // v100.2.0
  'get_my_attendance',
  'get_student_attendance',
];

const rpcFilePath = path.join(__dirname, '../src/data/rpc/index.ts');
assert(fs.existsSync(rpcFilePath), 'RPC index file exists at src/data/rpc/index.ts');

const rpcCode = fs.readFileSync(rpcFilePath, 'utf8');

ALL_RPCS.forEach((rpcName) => {
  assert(rpcCode.includes(rpcName), `RPC function declared: '${rpcName}'`);
});

// -------------------------------------------------------------
// 2. SCREEN PARITY (34 Screens & Sub-screens)
// -------------------------------------------------------------
console.log('\n📱 2. Testing 34 Screen Files and Route Coverage...');

const ALL_34_SCREENS = [
  // Public (4)
  'SplashScreen.tsx',
  'OnboardingScreen.tsx',
  'VerifyCertScreen.tsx',
  'ChangelogScreen.tsx',
  // Student (15)
  'StudentHomeScreen.tsx',
  'StudentCoursesScreen.tsx',
  'CourseDetailScreen.tsx',
  'CourseRatingScreen.tsx',
  'StudentPointsScreen.tsx',
  'PointsLedgerScreen.tsx',
  'StudentCertsScreen.tsx',
  'StudentProfileScreen.tsx',
  'EditProfileScreen.tsx',
  'ExploreCoursesScreen.tsx',
  'NotificationsScreen.tsx',
  'StudentCheckInScreen.tsx',
  'StudentExcuseScreen.tsx',
  'StudentAttendanceScreen.tsx',
  'LeaderboardScreen.tsx',
  'SupportScreen.tsx',
  // Volunteer (8)
  'VolunteerHomeScreen.tsx',
  'VolunteerBatchesScreen.tsx',
  'VolunteerAttendanceScreen.tsx',
  'VolunteerCoursesScreen.tsx',
  'VolunteerExcusesScreen.tsx',
  'SessionReportFormScreen.tsx',
  'VolunteerProfileScreen.tsx',
  'AnalyticsScreen.tsx',
  // Admin (7)
  'AdminHomeScreen.tsx',
  'AdminUsersScreen.tsx',
  'AdminCoursesScreen.tsx',
  'AdminCertsScreen.tsx',
  'AdminSettingsScreen.tsx',
  'AdminBranchesScreen.tsx',
  'AdminCommitteesScreen.tsx',
  'AdminBroadcastScreen.tsx',
  'AdminAnalyticsScreen.tsx',
  'AdminUserDetailScreen.tsx',
  'VolunteerStudentRecordScreen.tsx',
];

const screensBaseDir = path.join(__dirname, '../src/screens');

ALL_34_SCREENS.forEach((screenFileName) => {
  let found = false;
  ['public', 'student', 'volunteer', 'admin'].forEach((sub) => {
    const fullPath = path.join(screensBaseDir, sub, screenFileName);
    if (fs.existsSync(fullPath)) found = true;
  });
  assert(found, `Screen file created: ${screenFileName}`);
});

// -------------------------------------------------------------
// 3. REUSABLE COMPONENTS, NAVIGATION LAYER & DESIGN TOKENS
// -------------------------------------------------------------
console.log('\n🧩 3. Testing Navigation Layer & Reusable Components...');

const NAVIGATION_FILES = ['navigationRef.ts', 'AppNavigator.tsx', 'types.ts', 'linking.ts'];
const navigationBaseDir = path.join(__dirname, '../src/navigation');
NAVIGATION_FILES.forEach((file) => {
  assert(fs.existsSync(path.join(navigationBaseDir, file)), `Navigation file created: ${file}`);
});

const COMPONENTS_TO_CHECK = [
  'common/AnimatedPressable.tsx',
  'common/AnimatedNumber.tsx',
  'common/GradientCard.tsx',
  'common/EmptyState.tsx',
  'common/Avatar.tsx',
  'common/BadgeCounter.tsx',
  'common/ProgressRing.tsx',
  'common/ActionSheet.tsx',
  'common/SearchBar.tsx',
  'common/StatCard.tsx',
  'common/Typography.tsx',
  'common/SectionHeader.tsx',
  'common/StatusPill.tsx',
  'common/MetricCard.tsx',
  'common/PrimaryActionCard.tsx',
  'common/ListRow.tsx',
  'feedback/SuccessAnimation.tsx',
  'layout/BottomNavigationBar.tsx',
  'layout/GlassHeader.tsx',
  'layout/ScreenScaffold.tsx',
  'cert/CertificateCard.tsx',
];

const componentsBaseDir = path.join(__dirname, '../src/components');
COMPONENTS_TO_CHECK.forEach((cmpPath) => {
  const fullPath = path.join(componentsBaseDir, cmpPath);
  assert(fs.existsSync(fullPath), `Component created: ${cmpPath}`);
});

// -------------------------------------------------------------
// 4. MODULAR UNIT TEST SUITES (Unit Directory)
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('🔬 4. Running Modular Unit Test Suites (tests/unit/)');
console.log('======================================================');

// 4a. Security Sanitizers Unit Tests
const { runSanitizersTests } = require('./unit/sanitizers.test.js');
const sanitizersResult = runSanitizersTests();
passedTests += sanitizersResult.passed;
failedTests += sanitizersResult.failed;

// 4b. i18n Engine & Localization Parity Unit Tests
const { runI18nTests } = require('./unit/i18n.test.js');
const i18nResult = runI18nTests();
passedTests += i18nResult.passed;
failedTests += i18nResult.failed;

// 4c. Design Tokens, WCAG AA/AAA Contrast & Touch Targets Unit Tests
const { runDesignTokensTests } = require('./unit/designTokens.test.js');
const tokensResult = runDesignTokensTests();
passedTests += tokensResult.passed;
failedTests += tokensResult.failed;

// -------------------------------------------------------------
// 5. CONFIG & APP JSON AUDIT
// -------------------------------------------------------------
console.log('\n⚙️ 5. Testing App Configuration & Native Settings...');
const appJsonPath = path.join(__dirname, '../app.json');
assert(fs.existsSync(appJsonPath), 'app.json exists');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

assert(appJson.expo.android.package === 'org.resala.rtc.masar', 'Android package name is org.resala.rtc.masar');
assert(appJson.expo.ios.bundleIdentifier === 'org.resala.rtc.masar', 'iOS bundleIdentifier is org.resala.rtc.masar');
assert(appJson.expo.scheme === 'org.resala.rtc.masar', 'Deep link scheme is org.resala.rtc.masar');

console.log('\n======================================================');
console.log(`📊 Final Aggregated Test Results: ${passedTests} Passed, ${failedTests} Failed`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✨ All mobile tests and quality checks passed with 100% parity!\n');
  process.exit(0);
}
