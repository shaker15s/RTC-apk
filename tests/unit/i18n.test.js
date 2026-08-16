/**
 * Unit Tests: Internationalization (i18n) Engine & Localization
 * Tests: src/core/i18n/index.ts, src/core/i18n/locales/ar.ts, src/core/i18n/locales/en.ts
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadI18nModule() {
  const repoRoot = path.resolve(__dirname, '../..');
  const i18nDir = path.join(repoRoot, 'src/core/i18n');

  function transpileAndRun(filePath, customRequire) {
    const code = fs.readFileSync(filePath, 'utf8');
    const js = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText;

    const moduleObj = { exports: {} };
    const dirname = path.dirname(filePath);

    const localRequire = (id) => {
      if (customRequire && customRequire[id]) {
        return customRequire[id];
      }
      if (id.startsWith('./') || id.startsWith('../')) {
        const full = path.resolve(dirname, id);
        if (fs.existsSync(full + '.ts')) {
          return transpileAndRun(full + '.ts', customRequire);
        }
        if (fs.existsSync(full + '.js')) {
          return require(full + '.js');
        }
      }
      if (id === 'expo-secure-store') {
        return {
          getItemAsync: async () => null,
          setItemAsync: async () => {},
        };
      }
      if (id === 'react') {
        return require('react');
      }
      return require(id);
    };

    const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', js);
    fn(moduleObj, moduleObj.exports, localRequire, dirname, filePath);
    return moduleObj.exports;
  }

  const arModule = transpileAndRun(path.join(i18nDir, 'locales/ar.ts'));
  const enModule = transpileAndRun(path.join(i18nDir, 'locales/en.ts'));
  const indexModule = transpileAndRun(path.join(i18nDir, 'index.ts'));

  return {
    ar: arModule.ar || arModule.default || arModule,
    en: enModule.en || enModule.default || enModule,
    i18n: indexModule,
  };
}

function runI18nTests() {
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

  console.log('\n  🌐 [Unit] Internationalization (i18n) Engine & Parity Suite');

  const { ar, en, i18n } = loadI18nModule();
  const { t, setLanguage, getLanguage, subscribeLanguage, formatDateLocale, dateLocale, numberLocale, STRINGS } = i18n;

  // 1. Exported API integrity
  console.log('\n    --- 1. Module Exports Integrity ---');
  assert(typeof t === 'function', 't() translation function exported');
  assert(typeof setLanguage === 'function', 'setLanguage() exported');
  assert(typeof getLanguage === 'function', 'getLanguage() exported');
  assert(typeof subscribeLanguage === 'function', 'subscribeLanguage() exported');
  assert(typeof formatDateLocale === 'function', 'formatDateLocale() exported');
  assert(typeof dateLocale === 'function', 'dateLocale() exported');
  assert(typeof numberLocale === 'function', 'numberLocale() exported');
  assert(STRINGS && typeof STRINGS === 'object', 'STRINGS dictionary map exported');

  // 2. Dictionary parity & completeness
  console.log('\n    --- 2. Dictionary Keys Parity & Completeness ---');
  const arKeys = Object.keys(ar);
  const enKeys = Object.keys(en);

  assert(arKeys.length >= 200, `Arabic dictionary is comprehensive (${arKeys.length} keys >= 200)`);
  assert(enKeys.length >= 200, `English dictionary is comprehensive (${enKeys.length} keys >= 200)`);
  assert(arKeys.length === enKeys.length, `Key counts match exactly: ar=${arKeys.length}, en=${enKeys.length}`);

  const missingInEn = arKeys.filter((k) => !Object.prototype.hasOwnProperty.call(en, k));
  const missingInAr = enKeys.filter((k) => !Object.prototype.hasOwnProperty.call(ar, k));

  assert(missingInEn.length === 0, `All Arabic keys exist in English (missing: ${missingInEn.join(', ') || 'none'})`);
  assert(missingInAr.length === 0, `All English keys exist in Arabic (missing: ${missingInAr.join(', ') || 'none'})`);

  // Ensure no empty strings
  const emptyArKeys = arKeys.filter((k) => typeof ar[k] !== 'string' || ar[k].trim() === '');
  const emptyEnKeys = enKeys.filter((k) => typeof en[k] !== 'string' || en[k].trim() === '');
  assert(emptyArKeys.length === 0, `No empty translation values in Arabic (empty: ${emptyArKeys.length})`);
  assert(emptyEnKeys.length === 0, `No empty translation values in English (empty: ${emptyEnKeys.length})`);

  // 3. Domain Coverage Checks
  console.log('\n    --- 3. Domain Vocabulary Coverage ---');
  const criticalKeys = [
    'appName', 'tagline', 'org', 'loading', 'retry', 'save', 'cancel', 'confirm',
    'student', 'volunteer', 'admin', 'active', 'inactive', 'present', 'late', 'absent', 'excused',
    'home', 'myCourses', 'points', 'certs', 'account', 'groups', 'courses', 'analytics', 'users', 'settings',
    'explore', 'checkin', 'excuse', 'support', 'leaderboard', 'notifications', 'verifyCert',
    'welcomeBack', 'pointsToNext',
  ];

  criticalKeys.forEach((key) => {
    assert(typeof ar[key] === 'string' && ar[key].length > 0, `Critical key '${key}' defined in Arabic: "${ar[key]}"`);
    assert(typeof en[key] === 'string' && en[key].length > 0, `Critical key '${key}' defined in English: "${en[key]}"`);
  });

  // 4. Translation & Parameter Interpolation
  console.log('\n    --- 4. Translation & Parameter Interpolation ---');
  // Reset language to Arabic
  setLanguage('ar', false);
  assert(getLanguage() === 'ar', 'Initial language is Arabic (ar)');
  assert(t('appName') === 'مسار RTC', 't("appName") in Arabic returns "مسار RTC"');
  assert(t('student') === 'طالب', 't("student") in Arabic returns "طالب"');
  assert(t('volunteer') === 'متطوع', 't("volunteer") in Arabic returns "متطوع"');

  // Interpolation in Arabic
  const arPointsInterpolated = t('pointsToNext', { p: 50, n: 100 });
  assert(
    arPointsInterpolated.includes('50') && arPointsInterpolated.includes('100'),
    `Arabic interpolation replaces {p} and {n}: "${arPointsInterpolated}"`
  );

  // 5. Dynamic Language Switching
  console.log('\n    --- 5. Dynamic Language Switching ---');
  let listenerCalled = false;
  let notifiedLang = null;
  const unsubscribe = subscribeLanguage((lang) => {
    listenerCalled = true;
    notifiedLang = lang;
  });

  setLanguage('en', false);
  assert(getLanguage() === 'en', 'Language successfully switched to English (en)');
  assert(listenerCalled === true && notifiedLang === 'en', 'subscribeLanguage listener notified of change');
  assert(t('appName') === 'Masar RTC', 't("appName") in English returns "Masar RTC"');
  assert(t('student') === 'Student', 't("student") in English returns "Student"');
  assert(t('volunteer') === 'Volunteer', 't("volunteer") in English returns "Volunteer"');

  const enPointsInterpolated = t('pointsToNext', { p: 75, n: 150 });
  assert(
    enPointsInterpolated.includes('75') && enPointsInterpolated.includes('150'),
    `English interpolation replaces {p} and {n}: "${enPointsInterpolated}"`
  );

  // Switch back to Arabic
  listenerCalled = false;
  unsubscribe(); // Unsubscribe should prevent further notifications
  setLanguage('ar', false);
  assert(getLanguage() === 'ar', 'Language successfully switched back to Arabic (ar)');
  assert(listenerCalled === false, 'Unsubscribed listener was not called after unsubscribing');
  assert(t('home') === 'الرئيسية', 't("home") returns Arabic string after switching back');

  // 6. Safe Fallbacks & Edge Cases
  console.log('\n    --- 6. Safe Fallbacks & Resilient Lookups ---');
  assert(t('non_existent_random_key_12345') === 'non_existent_random_key_12345', 'Unknown key returns key string as fallback');
  assert(t('appName', { unusedParam: '123' }) === 'مسار RTC', 'Unused interpolation parameters ignored cleanly');

  // 7. Date & Number Locale Helpers
  console.log('\n    --- 7. Date & Number Locale Helpers ---');
  setLanguage('ar', false);
  assert(dateLocale() === 'ar-EG', 'Arabic dateLocale returns ar-EG');
  assert(numberLocale() === 'ar-EG', 'Arabic numberLocale returns ar-EG');

  const testIsoDate = '2026-08-16T12:00:00Z';
  const arFormattedDate = formatDateLocale(testIsoDate);
  assert(typeof arFormattedDate === 'string' && arFormattedDate.length > 0, `formatDateLocale() returns formatted date: ${arFormattedDate}`);
  assert(formatDateLocale(null, 'N/A') === 'N/A', 'formatDateLocale handles null with fallback');
  assert(formatDateLocale('invalid-date', 'Invalid') === 'Invalid', 'formatDateLocale handles invalid date with fallback');

  setLanguage('en', false);
  assert(dateLocale() === 'en-US', 'English dateLocale returns en-US');
  assert(numberLocale() === 'en-US', 'English numberLocale returns en-US');

  // Reset back to Arabic default
  setLanguage('ar', false);

  console.log(`\n  📊 i18n Suite: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

if (require.main === module) {
  const { failed } = runI18nTests();
  process.exit(failed > 0 ? 1 : 0);
}

module.exports = { runI18nTests };
