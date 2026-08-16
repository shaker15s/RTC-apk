/**
 * Unit Tests: Security Sanitizers, Validators, Route Guards & Privacy Masking
 * Tests: src/core/security/sanitizers.ts
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule() {
  const repoRoot = path.resolve(__dirname, '../..');
  const filePath = path.join(repoRoot, 'src/core/security/sanitizers.ts');
  const src = fs.readFileSync(filePath, 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const moduleObj = { exports: {} };
  new Function('module', 'exports', 'require', js)(moduleObj, moduleObj.exports, require);
  return moduleObj.exports;
}

function runSanitizersTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`    \x1b[32m✔ PASS:\x1b[0m ${message}`);
      passed++;
    } else {
      console.error(`    \x1b[31m✘ FAIL:\x1b[0m ${message}`);
      failed++;
    }
  }

  console.log('\n  🧪 [Unit] Security Sanitizers & Route Guards Suite');

  const {
    validateEgyptianPhone,
    validateFullName,
    isUuid,
    safeUrl,
    escapeHtml,
    safeColor,
    safeIcon,
    maskPhone,
    maskName,
    canAccess,
  } = loadModule();

  // 1. Egyptian Phone Validator & Normalizer
  console.log('\n    --- 1. Egyptian Phone Validator & Normalizer ---');
  assert(validateEgyptianPhone('01012345678') === true, 'Vodafone (010) prefix accepted');
  assert(validateEgyptianPhone('01112345678') === true, 'Etisalat (011) prefix accepted');
  assert(validateEgyptianPhone('01212345678') === true, 'Orange (012) prefix accepted');
  assert(validateEgyptianPhone('01512345678') === true, 'WE (015) prefix accepted');
  assert(validateEgyptianPhone('010 1234 5678') === true, 'Phone with spaces normalized and accepted');
  assert(validateEgyptianPhone('011-9876-5432') === true, 'Phone with dashes normalized and accepted');
  assert(validateEgyptianPhone('(012) 3456-7890') === true, 'Phone with parentheses normalized and accepted');
  assert(validateEgyptianPhone('015.1111.2223') === true, 'Phone with dots normalized and accepted');
  assert(validateEgyptianPhone('٠١٠١٢٣٤٥٦٧٨') === true, 'Arabic-Indic digits normalized and accepted');
  assert(validateEgyptianPhone('٠١١-٩٨٧٦-٥٤٣٢') === true, 'Arabic-Indic digits with dashes normalized');
  assert(validateEgyptianPhone('01912345678') === false, 'Invalid prefix (019) rejected');
  assert(validateEgyptianPhone('01312345678') === false, 'Invalid prefix (013) rejected');
  assert(validateEgyptianPhone('01412345678') === false, 'Invalid prefix (014) rejected');
  assert(validateEgyptianPhone('0101234567') === false, '10-digit number rejected (< 11 digits)');
  assert(validateEgyptianPhone('010123456789') === false, '12-digit number rejected (> 11 digits)');
  assert(validateEgyptianPhone('abc010123456') === false, 'Alphabetic characters rejected');
  assert(validateEgyptianPhone('') === false, 'Empty phone string rejected');
  assert(validateEgyptianPhone(null) === false, 'Null phone input safely rejected');
  assert(validateEgyptianPhone(undefined) === false, 'Undefined phone input safely rejected');

  // 2. Full Name Validator & XSS Sanitizer
  console.log('\n    --- 2. Full Name Validator & Anti-XSS ---');
  assert(validateFullName('أحمد محمد علي') === true, '3-part Arabic name accepted');
  assert(validateFullName('محمود كمال الدين إبراهيم حسن') === true, '5-part Arabic name accepted');
  assert(validateFullName('Ahmed Mohamed Ali') === true, '3-part English name accepted');
  assert(validateFullName('   أحمد    محمد   علي   ') === true, 'Extra whitespace handled cleanly');
  assert(validateFullName('أحمد') === false, 'Single word name rejected (< 3 parts)');
  assert(validateFullName('أحمد محمد') === false, 'Two word name rejected (< 3 parts)');
  assert(validateFullName('John Doe') === false, 'Two word English name rejected (< 3 parts)');
  assert(validateFullName('أحمد <script>alert(1)</script>') === false, 'Script tag injection in name rejected');
  assert(validateFullName('<b>علي</b> محمد حسن') === false, 'HTML bold tag injection rejected');
  assert(validateFullName('<img src=x onerror=alert(1)>') === false, 'Image XSS tag injection rejected');
  assert(validateFullName('') === false, 'Empty name rejected');
  assert(validateFullName(null) === false, 'Null name safely rejected');
  assert(validateFullName(undefined) === false, 'Undefined name safely rejected');

  // 3. UUID Validator
  console.log('\n    --- 3. UUID Validator ---');
  assert(isUuid('a3bb189e-8bf9-3888-9912-ace4e6543002') === true, 'Valid lowercase UUID v4 accepted');
  assert(isUuid('A3BB189E-8BF9-3888-9912-ACE4E6543002') === true, 'Valid uppercase UUID v4 accepted');
  assert(isUuid('00000000-0000-0000-0000-000000000000') === true, 'Valid nil UUID accepted');
  assert(isUuid('invalid-uuid-1234') === false, 'Malformed UUID string rejected');
  assert(isUuid('a3bb189e-8bf9-3888-9912-ace4e654300') === false, 'Short UUID rejected');
  assert(isUuid('z3bb189e-8bf9-3888-9912-ace4e6543002') === false, 'Non-hex UUID character rejected');
  assert(isUuid('') === false, 'Empty string rejected as UUID');
  assert(isUuid(null) === false, 'Null rejected as UUID');
  assert(isUuid(undefined) === false, 'Undefined rejected as UUID');

  // 4. URL Safety Sanitizer
  console.log('\n    --- 4. URL Safety Sanitizer ---');
  assert(safeUrl('https://resala.org') === 'https://resala.org/', 'Valid HTTPS URL permitted');
  assert(safeUrl('https://resala.org/masar/courses?id=10') === 'https://resala.org/masar/courses?id=10', 'HTTPS URL with query permitted');
  assert(safeUrl('tel:19450') === 'tel:19450', 'Valid tel: URI permitted');
  assert(safeUrl('tel:+201012345678') === 'tel:+201012345678', 'Valid international tel: URI permitted');
  assert(safeUrl('javascript:alert(1)') === '', 'javascript: scheme rejected');
  assert(safeUrl('javascript:void(0)') === '', 'javascript:void rejected');
  assert(safeUrl('data:text/html;base64,PHNjcmlwdD4=') === '', 'data: URI rejected');
  assert(safeUrl('https://user:pass@evil.com') === '', 'URL with embedded credentials rejected');
  assert(safeUrl('https://resala.org\x00malicious') === '', 'URL with null byte rejected');
  assert(safeUrl('invalid-url', 'https://fallback.com') === 'https://fallback.com', 'Custom fallback returned for invalid URL');
  assert(safeUrl('', 'https://fallback.com') === 'https://fallback.com', 'Custom fallback returned for empty URL');
  assert(safeUrl(null) === '', 'Null URL returns default fallback');
  assert(safeUrl(undefined) === '', 'Undefined URL returns default fallback');

  // 5. HTML Escaping
  console.log('\n    --- 5. HTML Escaping ---');
  assert(escapeHtml('<script>alert("xss")</script>') === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', 'HTML tags and quotes escaped');
  assert(escapeHtml("Tom & Jerry's") === 'Tom &amp; Jerry&#39;s', 'Ampersand and single quote escaped');
  assert(escapeHtml('Hello World') === 'Hello World', 'Plain text unaffected');
  assert(escapeHtml('') === '', 'Empty string returns empty string');
  assert(escapeHtml(null) === '', 'Null returns empty string');
  assert(escapeHtml(undefined) === '', 'Undefined returns empty string');

  // 6. Color & Icon Sanitizers
  console.log('\n    --- 6. Color & Icon Sanitizers ---');
  assert(safeColor('#00288E') === '#00288E', '6-digit hex color allowed');
  assert(safeColor('#fff') === '#fff', '3-digit hex color allowed');
  assert(safeColor('#00288EAA') === '#00288EAA', '8-digit hex color with alpha allowed');
  assert(safeColor('rgb(0,0,0)') === '#00288E', 'RGB functional notation falls back to default');
  assert(safeColor('red', '#1E40AF') === '#1E40AF', 'Named color falls back to custom fallback');
  assert(safeColor(null) === '#00288E', 'Null color falls back to default');
  assert(safeIcon('ph-book-open') === 'ph-book-open', 'Single valid Phosphor icon allowed');
  assert(safeIcon('ph-user ph-bold') === 'ph-user ph-bold', 'Multi-class valid Phosphor icon allowed');
  assert(safeIcon('evil-class <script>', 'ph-user') === 'ph-user', 'Invalid icon falls back to custom fallback');
  assert(safeIcon(null) === 'ph-book-open', 'Null icon falls back to default');

  // 7. Privacy Masking
  console.log('\n    --- 7. Privacy Masking ---');
  assert(maskPhone('01012345678') === '010••••78', '11-digit phone masked as 010••••78');
  assert(maskPhone('01198765432') === '011••••32', '11-digit phone masked with exact prefix & suffix');
  assert(maskPhone('12345') === '—', 'Short phone string masked as dash');
  assert(maskPhone('') === '—', 'Empty phone string returns dash');
  assert(maskPhone(null) === '—', 'Null phone returns dash');
  assert(maskPhone(undefined) === '—', 'Undefined phone returns dash');
  assert(maskName('محمد أحمد حسن') === 'م*** أ*** ح***', '3-part Arabic name masked');
  assert(maskName('Ahmed Mohamed Ali') === 'A*** M*** A***', '3-part English name masked');
  assert(maskName('مي أحمد حسن') === 'مي أ*** ح***', 'Short 2-char name token preserved while others masked');
  assert(maskName('') === '—', 'Empty name returns dash');
  assert(maskName(null) === '—', 'Null name returns dash');

  // 8. Route Guard Access Control
  console.log('\n    --- 8. Route Guard Access Control ---');
  // Public screens
  assert(canAccess('splash', null) === true, 'Public splash screen accessible unauthenticated');
  assert(canAccess('onboarding', undefined) === true, 'Public onboarding screen accessible unauthenticated');
  assert(canAccess('verify', null) === true, 'Public verify screen accessible unauthenticated');
  assert(canAccess('changelog', null) === true, 'Public changelog screen accessible unauthenticated');

  // Unauthenticated blocked from protected screens
  assert(canAccess('s-home', null) === false, 'Unauthenticated user blocked from s-home');
  assert(canAccess('v-home', null) === false, 'Unauthenticated user blocked from v-home');
  assert(canAccess('a-home', null) === false, 'Unauthenticated user blocked from a-home');
  assert(canAccess('', 'student') === false, 'Empty screen ID returns false');

  // Student permissions & boundaries
  assert(canAccess('s-home', 'student') === true, 'Student can access s-home');
  assert(canAccess('s-courses', 'student') === true, 'Student can access s-courses');
  assert(canAccess('s-course-rating', 'student') === true, 'Student can access s-course-rating');
  assert(canAccess('s-points', 'student') === true, 'Student can access s-points');
  assert(canAccess('s-certs', 'student') === true, 'Student can access s-certs');
  assert(canAccess('support', 'student') === true, 'Student can access support');
  assert(canAccess('s-analytics', 'student') === false, 'Student blocked from s-analytics (privilege leak guard)');
  assert(canAccess('v-batches', 'student') === false, 'Student blocked from volunteer batches');
  assert(canAccess('v-report', 'student') === false, 'Student blocked from volunteer report');
  assert(canAccess('a-users', 'student') === false, 'Student blocked from admin users');
  assert(canAccess('a-broadcast', 'student') === false, 'Student blocked from admin broadcast');

  // Volunteer permissions & boundaries
  assert(canAccess('v-home', 'volunteer') === true, 'Volunteer can access v-home');
  assert(canAccess('v-batches', 'volunteer') === true, 'Volunteer can access v-batches');
  assert(canAccess('v-attendance', 'volunteer') === true, 'Volunteer can access v-attendance');
  assert(canAccess('v-report', 'volunteer') === true, 'Volunteer can access v-report');
  assert(canAccess('s-analytics', 'volunteer') === true, 'Volunteer can access shared s-analytics');
  assert(canAccess('s-notifications', 'volunteer') === true, 'Volunteer can access s-notifications');
  assert(canAccess('s-edit-profile', 'volunteer') === true, 'Volunteer can access s-edit-profile');
  assert(canAccess('a-users', 'volunteer') === false, 'Volunteer blocked from admin users');
  assert(canAccess('a-broadcast', 'volunteer') === false, 'Volunteer blocked from admin broadcast');
  assert(canAccess('a-settings', 'volunteer') === false, 'Volunteer blocked from admin settings');

  // Admin permissions
  assert(canAccess('a-home', 'admin') === true, 'Admin can access a-home');
  assert(canAccess('a-users', 'admin') === true, 'Admin can access a-users');
  assert(canAccess('a-courses', 'admin') === true, 'Admin can access a-courses');
  assert(canAccess('a-certs', 'admin') === true, 'Admin can access a-certs');
  assert(canAccess('a-branches', 'admin') === true, 'Admin can access a-branches');
  assert(canAccess('a-broadcast', 'admin') === true, 'Admin can access a-broadcast');
  assert(canAccess('a-analytics', 'admin') === true, 'Admin can access a-analytics');
  assert(canAccess('s-analytics', 'admin') === true, 'Admin can access s-analytics');

  console.log(`\n  📊 Sanitizers Suite: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

if (require.main === module) {
  const { failed } = runSanitizersTests();
  process.exit(failed > 0 ? 1 : 0);
}

module.exports = { runSanitizersTests };
