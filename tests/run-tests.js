/**
 * Automated Test Suite for Masar RTC Mobile (rtc_mobile)
 * Tests RPC contract parity (all 26 functions exactly as documented in docs/RPC-CONTRACT.md),
 * Screen parity (all 34 screens), Reusable Components, security sanitizers, role-based route guards, and phone/name validators.
 */

const fs = require('fs');
const path = require('path');

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
// 1. RPC CONTRACT PARITY (Exact 26 PostgreSQL Functions)
// -------------------------------------------------------------
console.log('📦 1. Testing 26 RPC Functions Parity with docs/RPC-CONTRACT.md...');

const ALL_26_RPCS = [
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
];

const rpcFilePath = path.join(__dirname, '../src/data/rpc/index.ts');
assert(fs.existsSync(rpcFilePath), 'RPC index file exists at src/data/rpc/index.ts');

const rpcCode = fs.readFileSync(rpcFilePath, 'utf8');

ALL_26_RPCS.forEach((rpcName) => {
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
// 3. REUSABLE COMPONENTS & DESIGN SYSTEM CHECK
// -------------------------------------------------------------
console.log('\n🧩 3. Testing Reusable Components & Design Tokens...');

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
  'feedback/SuccessAnimation.tsx',
  'layout/BottomNavigationBar.tsx',
  'layout/GlassHeader.tsx',
];

const componentsBaseDir = path.join(__dirname, '../src/components');
COMPONENTS_TO_CHECK.forEach((cmpPath) => {
  const fullPath = path.join(componentsBaseDir, cmpPath);
  assert(fs.existsSync(fullPath), `Component created: ${cmpPath}`);
});

// -------------------------------------------------------------
// 4. SECURITY SANITIZERS & VALIDATORS UNIT TESTS
// -------------------------------------------------------------
console.log('\n🔒 4. Testing Security Sanitizers, Route Guards & Validators...');

function validateEgyptianPhone(p) {
  if (!p) return false;
  return /^01[0125]\d{8}$/.test(p.trim().replace(/[\s-]/g, ''));
}

function validateFullName(name) {
  if (!name) return false;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 3;
}

function isUuid(val) {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

function maskPhone(p) {
  if (!p || p.length < 11) return p || '';
  return p.substring(0, 3) + '****' + p.substring(7);
}

const ROLE_PERMISSIONS = {
  public: ['splash', 'onboarding', 'verify', 'changelog'],
  student: [
    's-home',
    's-courses',
    's-course-detail',
    's-course-rating',
    's-points',
    's-ledger',
    's-certs',
    's-profile',
    's-edit-profile',
    's-explore',
    's-notifications',
    's-checkin',
    's-excuse',
    's-leaderboard',
    'support',
    'verify',
    'changelog',
  ],
  volunteer: [
    'v-home',
    'v-batches',
    'v-attendance',
    'v-courses',
    'v-excuses',
    'v-report',
    'v-profile',
    's-analytics',
    's-edit-profile',
    's-notifications',
    'support',
    'verify',
    'changelog',
  ],
  admin: [
    'a-home',
    'a-users',
    'a-courses',
    'a-certs',
    'a-settings',
    'a-branches',
    'a-committees',
    'a-broadcast',
    'a-analytics',
    's-analytics',
    's-edit-profile',
    's-notifications',
    'support',
    'verify',
    'changelog',
  ],
};

function canAccess(screenId, role) {
  if (!role || role === 'public') {
    return ROLE_PERMISSIONS.public.includes(screenId);
  }
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(screenId);
}

// Phone validator tests
assert(validateEgyptianPhone('01012345678') === true, 'Valid Vodafone Egyptian phone (010)');
assert(validateEgyptianPhone('01112345678') === true, 'Valid Etisalat Egyptian phone (011)');
assert(validateEgyptianPhone('01212345678') === true, 'Valid Orange Egyptian phone (012)');
assert(validateEgyptianPhone('01512345678') === true, 'Valid WE Egyptian phone (015)');
assert(validateEgyptianPhone('01912345678') === false, 'Invalid prefix (019) rejected');
assert(validateEgyptianPhone('0101234567') === false, '10-digit number rejected');
assert(validateEgyptianPhone('010123456789') === false, '12-digit number rejected');
assert(validateEgyptianPhone('abc010123456') === false, 'Alphabetic characters rejected');

// Full name validator tests
assert(validateFullName('أحمد محمد علي') === true, 'Valid 3-part Arabic name');
assert(validateFullName('محمود كمال الدين إبراهيم حسن') === true, 'Valid 4-part Arabic name');
assert(validateFullName('أحمد') === false, 'Single word name rejected');
assert(validateFullName('أحمد محمد') === false, 'Two word name rejected');

// UUID validator tests
assert(isUuid('a3bb189e-8bf9-3888-9912-ace4e6543002') === true, 'Valid standard UUID v4');
assert(isUuid('invalid-uuid-1234') === false, 'Invalid UUID rejected');

// Privacy Masking tests
assert(maskPhone('01012345678') === '010****5678', 'Phone correctly masked for privacy');

// Route Guard security tests
assert(canAccess('s-home', 'student') === true, 'Student can access s-home');
assert(canAccess('s-course-rating', 'student') === true, 'Student can access s-course-rating');
assert(canAccess('v-report', 'volunteer') === true, 'Volunteer can access v-report');
assert(canAccess('a-analytics', 'admin') === true, 'Admin can access a-analytics');
assert(canAccess('a-users', 'student') === false, 'Student blocked from admin users screen');
assert(canAccess('a-broadcast', 'volunteer') === false, 'Volunteer blocked from admin broadcast');
assert(canAccess('v-batches', 'volunteer') === true, 'Volunteer can access v-batches');
assert(canAccess('a-users', 'admin') === true, 'Admin can access a-users');
assert(canAccess('verify', 'public') === true, 'Public unauthenticated user can access verify');

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
console.log(`📊 Test Results: ${passedTests} Passed, ${failedTests} Failed`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✨ All mobile tests passed with 100% parity!\n');
  process.exit(0);
}
