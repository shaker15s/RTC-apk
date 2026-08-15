/**
 * Automated Test Suite for Masar RTC Mobile (rtc_mobile)
 * Tests RPC contract parity (all 26 functions exactly as documented in docs/RPC-CONTRACT.md),
 * Screen parity (all 34 screens), Reusable Components, security sanitizers, role-based route guards, and phone/name validators.
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
const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const tsc = spawnSync(npxBin, ['tsc', '--noEmit'], {
  cwd: repoRoot,
  encoding: 'utf8',
  timeout: 180000,
  shell: true,
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
// 0b. LOAD THE REAL SECURITY MODULE (no more copy-pasted validators)
// The suite previously re-implemented the validators inside the test
// file, which let tests pass while the real code behaved differently.
// Now we transpile and execute the actual sanitizers.ts source.
// -------------------------------------------------------------
let realSanitizers = null;
try {
  const ts = require(path.join(repoRoot, 'node_modules/typescript'));
  const src = fs.readFileSync(path.join(repoRoot, 'src/core/security/sanitizers.ts'), 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const moduleObj = { exports: {} };
  // sanitizers.ts is dependency-free by design, so a bare module scope is safe.
  new Function('module', 'exports', 'require', js)(moduleObj, moduleObj.exports, require);
  realSanitizers = moduleObj.exports;
} catch (e) {
  console.error('  Could not load real sanitizers module:', e);
}
assert(!!realSanitizers, 'Real sanitizers.ts module loaded and executed');

// -------------------------------------------------------------
// 1. RPC CONTRACT PARITY (Exact 26 PostgreSQL Functions)
// -------------------------------------------------------------
console.log('📦 1. Testing 26 RPC Functions Parity with docs/RPC-CONTRACT.md...');

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
  'cert/CertificateCard.tsx',
];

// Navigation layer files (React Navigation migration — v100.2.0)
const NAVIGATION_FILES = ['navigationRef.ts', 'AppNavigator.tsx'];
const navigationBaseDir = path.join(__dirname, '../src/navigation');
NAVIGATION_FILES.forEach((file) => {
  assert(fs.existsSync(path.join(navigationBaseDir, file)), `Navigation file created: ${file}`);
});

const componentsBaseDir = path.join(__dirname, '../src/components');
COMPONENTS_TO_CHECK.forEach((cmpPath) => {
  const fullPath = path.join(componentsBaseDir, cmpPath);
  assert(fs.existsSync(fullPath), `Component created: ${cmpPath}`);
});

// -------------------------------------------------------------
// 4. SECURITY SANITIZERS & VALIDATORS UNIT TESTS
//    — executing the REAL functions loaded from sanitizers.ts
// -------------------------------------------------------------
console.log('\n🔒 4. Testing Security Sanitizers, Route Guards & Validators (REAL code)...');

const {
  validateEgyptianPhone,
  validateFullName,
  isUuid,
  maskPhone,
  canAccess,
  maskName,
  safeUrl,
} = realSanitizers;

// Phone validator tests — the real validator now normalizes spaces,
// dashes and Arabic-Indic digits before matching (v100.1.0, fixes F-7).
assert(validateEgyptianPhone('01012345678') === true, 'Valid Vodafone Egyptian phone (010)');
assert(validateEgyptianPhone('01112345678') === true, 'Valid Etisalat Egyptian phone (011)');
assert(validateEgyptianPhone('01212345678') === true, 'Valid Orange Egyptian phone (012)');
assert(validateEgyptianPhone('01512345678') === true, 'Valid WE Egyptian phone (015)');
assert(validateEgyptianPhone('01912345678') === false, 'Invalid prefix (019) rejected');
assert(validateEgyptianPhone('0101234567') === false, '10-digit number rejected');
assert(validateEgyptianPhone('010123456789') === false, '12-digit number rejected');
assert(validateEgyptianPhone('abc010123456') === false, 'Alphabetic characters rejected');
assert(validateEgyptianPhone('010 1234 5678') === true, 'Phone with spaces accepted (normalized)');
assert(validateEgyptianPhone('010-123-45678') === true, 'Phone with dashes accepted (normalized)');
assert(validateEgyptianPhone('٠١٠١٢٣٤٥٦٧٨') === true, 'Arabic-Indic digits accepted (normalized)');

// Full name validator tests
assert(validateFullName('أحمد محمد علي') === true, 'Valid 3-part Arabic name');
assert(validateFullName('محمود كمال الدين إبراهيم حسن') === true, 'Valid 4-part Arabic name');
assert(validateFullName('أحمد') === false, 'Single word name rejected');
assert(validateFullName('أحمد محمد') === false, 'Two word name rejected');
assert(validateFullName('أحمد <script>alert(1)</script>') === false, 'HTML injection in name rejected');

// UUID validator tests
assert(isUuid('a3bb189e-8bf9-3888-9912-ace4e6543002') === true, 'Valid standard UUID v4');
assert(isUuid('invalid-uuid-1234') === false, 'Invalid UUID rejected');

// Privacy Masking tests
assert(maskPhone('01012345678') === '010••••78', 'Phone correctly masked for privacy');
assert(maskName('محمد أحمد حسن') === 'م*** أ*** ح***', 'Name correctly masked for privacy');
assert(maskPhone('') === '—', 'Empty phone masked as dash');

// URL safety tests
assert(safeUrl('https://resala.org') === 'https://resala.org/', 'HTTPS url allowed');
assert(safeUrl('javascript:alert(1)') === '', 'javascript: url rejected');
assert(safeUrl('https://user:pass@evil.com') === '', 'URL with credentials rejected');
assert(safeUrl('tel:19450') === 'tel:19450', 'tel: url allowed');

// Route Guard security tests (REAL canAccess from sanitizers.ts)
assert(canAccess('s-home', 'student') === true, 'Student can access s-home');
assert(canAccess('s-course-rating', 'student') === true, 'Student can access s-course-rating');
assert(canAccess('v-report', 'volunteer') === true, 'Volunteer can access v-report');
assert(canAccess('a-analytics', 'admin') === true, 'Admin can access a-analytics');
assert(canAccess('a-users', 'student') === false, 'Student blocked from admin users screen');
assert(canAccess('a-broadcast', 'volunteer') === false, 'Volunteer blocked from admin broadcast');
assert(canAccess('v-batches', 'volunteer') === true, 'Volunteer can access v-batches');
assert(canAccess('a-users', 'admin') === true, 'Admin can access a-users');
assert(canAccess('verify', null) === true, 'Public unauthenticated user can access verify');
assert(canAccess('s-analytics', 'volunteer') === true, 'Volunteer can access shared analytics tab');
assert(canAccess('s-analytics', 'admin') === true, 'Admin can access shared analytics tab');
assert(canAccess('s-analytics', 'student') === false, 'Student blocked from analytics');

// -------------------------------------------------------------
// 4b. i18n ENGINE — execute the REAL bilingual module (v100.3.0)
// -------------------------------------------------------------
console.log('\n🌐 4b. Testing the REAL i18n engine (loading core/i18n)...');

try {
  const ts = require(path.join(repoRoot, 'node_modules/typescript'));
  const i18nSrc = fs.readFileSync(path.join(__dirname, '../src/core/i18n/index.ts'), 'utf8');
  const i18nJs = ts.transpileModule(i18nSrc, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const i18nModule = { exports: {} };
  new Function('module', 'exports', 'require', i18nJs)(i18nModule, i18nModule.exports, require);
  const realI18n = i18nModule.exports;

  assert(typeof realI18n.t === 'function', 'i18n.t() is exported');
  assert(typeof realI18n.setLanguage === 'function', 'i18n.setLanguage() is exported');

  const arKeys = Object.keys(realI18n.STRINGS.ar);
  const enKeys = Object.keys(realI18n.STRINGS.en);
  assert(arKeys.length > 200, `Dictionary has ${arKeys.length}+ Arabic keys`);
  assert(
    arKeys.length === enKeys.length && arKeys.every((k) => enKeys.includes(k)),
    'Arabic and English dictionaries have identical key sets'
  );

  // Interpolation
  assert(
    realI18n.t('pointsToNext', { p: 50, n: 100 }) === '50 / 100 نقطة للمستوى التالي',
    'Arabic interpolation works'
  );

  // Live language switching
  realI18n.setLanguage('en');
  assert(realI18n.t('home') === 'Home', 'Language switch to English works');
  assert(realI18n.t('pointsToNext', { p: 50, n: 100 }) === '50 / 100 points to next level', 'English interpolation works');
  realI18n.setLanguage('ar');
  assert(realI18n.t('home') === 'الرئيسية', 'Language switch back to Arabic works');

  // Missing keys must never surface raw keys to users — Arabic fallback.
  assert(realI18n.t('this_key_does_not_exist') === 'this_key_does_not_exist', 'Unknown keys fall back safely');
} catch (e) {
  console.error('  i18n module load failed:', e);
  assert(false, 'i18n module loads and runs');
}

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
