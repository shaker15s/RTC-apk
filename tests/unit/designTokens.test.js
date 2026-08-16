/**
 * Unit Tests: Design Tokens, WCAG AA Accessibility Contrast, Touch Targets & Typography
 * Tests: src/core/theme/tokens.ts
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadTokensModule() {
  const repoRoot = path.resolve(__dirname, '../..');
  const filePath = path.join(repoRoot, 'src/core/theme/tokens.ts');
  const code = fs.readFileSync(filePath, 'utf8');
  const js = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  new Function('module', 'exports', 'require', js)(moduleObj, moduleObj.exports, require);
  return moduleObj.exports;
}

/**
 * WCAG 2.1 relative luminance calculation
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  let r, g, b;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6 || clean.length === 8) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [r, g, b];
}

function getLuminance(hex) {
  const [r8, g8, b8] = hexToRgb(hex);
  const [rs, gs, bs] = [r8 / 255, g8 / 255, b8 / 255];
  const rLin = rs <= 0.04045 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const gLin = gs <= 0.04045 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const bLin = bs <= 0.04045 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function runDesignTokensTests() {
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

  console.log('\n  🎨 [Unit] Design Tokens, WCAG Contrast & Touch Targets Suite');

  const {
    LightColors,
    DarkColors,
    Spacing,
    Radii,
    TouchTarget,
    TypographyTokens,
    Typography,
    Shadows,
    HitSlop,
    IconSizes,
    Transitions,
  } = loadTokensModule();

  // 1. Theme Colors Completeness & Symmetry
  console.log('\n    --- 1. Theme Color Tokens Symmetry & Completeness ---');
  const requiredColorKeys = [
    'primary', 'primary2', 'primarySoft', 'teal', 'teal2', 'tealFix', 'tealSoft',
    'gold', 'goldSoft', 'red', 'redSoft', 'amber', 'amberSoft', 'green', 'greenSoft',
    'bg', 'card', 'card2', 'txt', 'txtSecondary', 'mut', 'line', 'glass', 'border', 'isDark',
  ];

  requiredColorKeys.forEach((key) => {
    assert(key in LightColors, `LightColors contains '${key}'`);
    assert(key in DarkColors, `DarkColors contains '${key}'`);
  });

  assert(LightColors.isDark === false, 'LightColors.isDark is false');
  assert(DarkColors.isDark === true, 'DarkColors.isDark is true');

  // 2. WCAG 2.1 AA & AAA Contrast Ratios (Minimum 4.5:1 for standard text, 7:1 for AAA)
  console.log('\n    --- 2. WCAG 2.1 AA & AAA Contrast Compliance ---');

  // Light theme contrasts
  const lightTxtOnBg = getContrastRatio(LightColors.txt, LightColors.bg);
  assert(
    lightTxtOnBg >= 7.0,
    `Light theme text on background achieves WCAG AAA (Ratio: ${lightTxtOnBg.toFixed(2)}:1 >= 7:1)`
  );

  const lightTxtOnCard = getContrastRatio(LightColors.txt, LightColors.card);
  assert(
    lightTxtOnCard >= 7.0,
    `Light theme text on card achieves WCAG AAA (Ratio: ${lightTxtOnCard.toFixed(2)}:1 >= 7:1)`
  );

  const lightSecOnBg = getContrastRatio(LightColors.txtSecondary, LightColors.bg);
  assert(
    lightSecOnBg >= 4.5,
    `Light theme secondary text on background achieves WCAG AA (Ratio: ${lightSecOnBg.toFixed(2)}:1 >= 4.5:1)`
  );

  const lightSecOnCard = getContrastRatio(LightColors.txtSecondary, LightColors.card);
  assert(
    lightSecOnCard >= 4.5,
    `Light theme secondary text on card achieves WCAG AA (Ratio: ${lightSecOnCard.toFixed(2)}:1 >= 4.5:1)`
  );

  const lightPrimaryOnCard = getContrastRatio(LightColors.primary, LightColors.card);
  assert(
    lightPrimaryOnCard >= 4.5,
    `Light theme primary brand color on white card achieves WCAG AA (Ratio: ${lightPrimaryOnCard.toFixed(2)}:1 >= 4.5:1)`
  );

  const lightTealOnCard = getContrastRatio(LightColors.teal, LightColors.card);
  assert(
    lightTealOnCard >= 4.5,
    `Light theme teal on white card achieves WCAG AA (Ratio: ${lightTealOnCard.toFixed(2)}:1 >= 4.5:1)`
  );

  // Dark theme contrasts
  const darkTxtOnBg = getContrastRatio(DarkColors.txt, DarkColors.bg);
  assert(
    darkTxtOnBg >= 7.0,
    `Dark theme text on background achieves WCAG AAA (Ratio: ${darkTxtOnBg.toFixed(2)}:1 >= 7:1)`
  );

  const darkTxtOnCard = getContrastRatio(DarkColors.txt, DarkColors.card);
  assert(
    darkTxtOnCard >= 7.0,
    `Dark theme text on card achieves WCAG AAA (Ratio: ${darkTxtOnCard.toFixed(2)}:1 >= 7:1)`
  );

  const darkSecOnBg = getContrastRatio(DarkColors.txtSecondary, DarkColors.bg);
  assert(
    darkSecOnBg >= 4.5,
    `Dark theme secondary text on background achieves WCAG AA (Ratio: ${darkSecOnBg.toFixed(2)}:1 >= 4.5:1)`
  );

  const darkSecOnCard = getContrastRatio(DarkColors.txtSecondary, DarkColors.card);
  assert(
    darkSecOnCard >= 4.5,
    `Dark theme secondary text on card achieves WCAG AA (Ratio: ${darkSecOnCard.toFixed(2)}:1 >= 4.5:1)`
  );

  const darkPrimaryOnBg = getContrastRatio(DarkColors.primary, DarkColors.bg);
  assert(
    darkPrimaryOnBg >= 4.5,
    `Dark theme primary accent on dark background achieves WCAG AA (Ratio: ${darkPrimaryOnBg.toFixed(2)}:1 >= 4.5:1)`
  );

  const darkTealOnBg = getContrastRatio(DarkColors.teal, DarkColors.bg);
  assert(
    darkTealOnBg >= 4.5,
    `Dark theme teal accent on dark background achieves WCAG AA (Ratio: ${darkTealOnBg.toFixed(2)}:1 >= 4.5:1)`
  );

  // 3. Touch Target Dimensions & Apple HIG / Material Standards
  console.log('\n    --- 3. Touch Target Standards (Apple HIG & Material 3) ---');
  assert(TouchTarget.minWidth >= 44, `TouchTarget.minWidth is ${TouchTarget.minWidth}pt (>= 44pt HIG minimum)`);
  assert(TouchTarget.minHeight >= 44, `TouchTarget.minHeight is ${TouchTarget.minHeight}pt (>= 44pt HIG minimum)`);

  assert(HitSlop.sm.top >= 8 && HitSlop.sm.bottom >= 8, 'HitSlop.sm provides >= 8pt padding');
  assert(HitSlop.md.top >= 12 && HitSlop.md.bottom >= 12, 'HitSlop.md provides >= 12pt padding');
  assert(HitSlop.lg.top >= 16 && HitSlop.lg.bottom >= 16, 'HitSlop.lg provides >= 16pt padding');

  // 4. Typography Scale & Hierarchical Integrity
  console.log('\n    --- 4. Typography Hierarchy & Metrics ---');
  const typeVariants = ['display', 'titleLarge', 'titleMedium', 'titleSmall', 'bodyLarge', 'bodyMedium', 'caption', 'numeric'];

  typeVariants.forEach((variant) => {
    const token = TypographyTokens[variant];
    assert(token && typeof token.fontSize === 'number', `TypographyTokens.${variant} has fontSize (${token?.fontSize}px)`);
    assert(token && typeof token.lineHeight === 'number', `TypographyTokens.${variant} has lineHeight (${token?.lineHeight}px)`);
    assert(token && token.lineHeight >= token.fontSize, `TypographyTokens.${variant} lineHeight (${token?.lineHeight}) >= fontSize (${token?.fontSize})`);
    assert(token && ['400', '500', '600', '700', '800'].includes(token.fontWeight), `TypographyTokens.${variant} has valid fontWeight (${token?.fontWeight})`);
  });

  assert(TypographyTokens.display.fontSize > TypographyTokens.titleLarge.fontSize, 'Display fontSize > titleLarge');
  assert(TypographyTokens.titleLarge.fontSize > TypographyTokens.titleMedium.fontSize, 'TitleLarge fontSize > titleMedium');
  assert(TypographyTokens.titleMedium.fontSize > TypographyTokens.titleSmall.fontSize, 'TitleMedium fontSize > titleSmall');
  assert(TypographyTokens.bodyLarge.fontSize > TypographyTokens.bodyMedium.fontSize, 'BodyLarge fontSize > bodyMedium');
  assert(TypographyTokens.bodyMedium.fontSize > TypographyTokens.caption.fontSize, 'BodyMedium fontSize > caption');

  assert(Typography.fontFamily === 'System', 'Base font family is System');
  assert(Typography.lineHeightScale >= 1.4, 'Line height scale provides comfortable readability (>= 1.4)');

  // 5. Spacing Scale Monotonicity
  console.log('\n    --- 5. Spacing Scale System ---');
  const spacingKeys = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'huge', 'massive'];
  for (let i = 0; i < spacingKeys.length; i++) {
    const key = spacingKeys[i];
    const val = Spacing[key];
    assert(typeof val === 'number' && val > 0, `Spacing.${key} is positive (${val}px)`);
    if (i > 0) {
      const prevKey = spacingKeys[i - 1];
      assert(val > Spacing[prevKey], `Spacing.${key} (${val}) > Spacing.${prevKey} (${Spacing[prevKey]})`);
    }
  }

  // 6. Corner Radii Tokens
  console.log('\n    --- 6. Corner Radii Tokens ---');
  const radiiKeys = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'full'];
  radiiKeys.forEach((k) => {
    assert(typeof Radii[k] === 'number' && Radii[k] > 0, `Radii.${k} is defined (${Radii[k]}px)`);
  });
  assert(Radii.full >= 9999, 'Radii.full is pill radius (9999)');

  // 7. Icon Sizes & Animation Transitions
  console.log('\n    --- 7. Icon Sizes & Transitions ---');
  assert(IconSizes.xs < IconSizes.sm, 'IconSizes.xs < sm');
  assert(IconSizes.sm < IconSizes.md, 'IconSizes.sm < md');
  assert(IconSizes.md < IconSizes.lg, 'IconSizes.md < lg');
  assert(IconSizes.lg < IconSizes.xl, 'IconSizes.lg < xl');
  assert(IconSizes.xl < IconSizes.hero, 'IconSizes.xl < hero');

  assert(Transitions.fast < Transitions.normal, 'Transitions fast < normal');
  assert(Transitions.normal < Transitions.slow, 'Transitions normal < slow');

  // 8. Shadows Definition
  console.log('\n    --- 8. Shadows & Elevation ---');
  assert(Shadows.none && typeof Shadows.none === 'object', 'Shadows.none defined');
  assert(Shadows.soft.elevation === 2, 'Shadows.soft elevation is 2');
  assert(Shadows.medium.elevation === 4, 'Shadows.medium elevation is 4');
  assert(Shadows.strong.elevation === 8, 'Shadows.strong elevation is 8');

  console.log(`\n  📊 Design Tokens Suite: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

if (require.main === module) {
  const { failed } = runDesignTokensTests();
  process.exit(failed > 0 ? 1 : 0);
}

module.exports = { runDesignTokensTests };
