# RTC Masar Mobile - CI/CD & Deployment Plan

## Current CI/CD Status
The project already has **EAS (Expo Application Services)** configured via `eas.json` and `app.json`. This provides a solid foundation for automated builds and deployments.

### Existing EAS Configuration (`eas.json`)
- **Development builds**: Internal distribution for testing
- **Preview builds**: `preview` channel, Android APK distribution
- **Production builds**: `production` channel, auto-increment version, Android AAB

### App Configuration (`app.json`)
- **Platforms**: Android + iOS
- **Package/Bundle ID**: `org.resala.rtc.masar`
- **Permissions**: CAMERA, POST_NOTIFICATIONS, VIBRATE
- **Plugins**: expo-camera, expo-image-picker, expo-notifications, expo-font, expo-asset
- **Updates**: Managed via Expo update server
- **Ownership**: `shaker18ss-team`

---

## Phase 1: EAS Build Pipeline Enhancement

### 1.1 Add GitHub Actions for Local Build Validation
Create GitHub Actions workflow to validate builds locally before pushing to EAS.

```yaml
# .github/workflows/eas-build.yml
name: EAS Build Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: cd rtc_mobile && npm ci --silent
      
      - name: Lint check
        run: cd rtc_mobile && npm run lint
      
      - name: Type check
        run: cd rtc_mobile && npx tsc --noEmit
      
      - name: Test unit tests
        run: cd rtc_mobile && npm test 2>&1 | tail -20
      
      - name: Expo diagnostics
        run: cd rtc_mobile && npx eas diagnose --json
      
      - name: Build preview (dry run)
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
        run: |
          cd rtc_mobile
          eas build --platform android --profile preview --local --non-interactive --message "CI: Preview build validation"
```

### 1.2 Environment Variable Management
Add required environment variables for EAS builds:

| Variable | Purpose | Required |
|----------|---------|----------|
| `EAS_TOKEN` | Expo authentication token | ✅ |
| `EAS_PROJECT_ID` | Project ID from app.json | ✅ (`f48915ef-3b07-4855-9cf8-c2796e5c9c9e`) |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `GOOGLE_APP_ID` | iOS Google Services plist | ✅ (for iOS builds) |
| `APPLE_AUTH_KEY_ID` | Apple auth key for publishing | ✅ (for App Store submissions) |
| `APPLE_ISSUER_ID` | Apple issuer ID | ✅ (for App Store submissions) |
| `APPLE_KEY_PATH` | Path to Apple private key | ✅ (for App Store submissions) |

### 1.3 Branch Deployment Strategy
```
main branch  →  EAS Production build (AAB) → App Store + Play Store
develop branch → EAS Preview build   → Internal testing via TestFlight/Internal Testing
feature branches → EAS Development builds → Team testing
```

---

## Phase 2: Automated Testing Pipeline

### 2.1 Unit Test Gateway
Add GitHub Actions step to run unit tests on every PR:

```yaml
- name: Run unit tests
  run: |
    cd rtc_mobile
    npm test -- --testPathPattern='tests/unit' --verbose 2>&1 | tail -30
```

### 2.2 Test Coverage Threshold
Set minimum coverage thresholds:
- **Design tokens**: 100% (already covered)
- **i18n dictionaries**: 100% parity between ar/en
- **Sanitizers**: 100% edge case coverage
- **Critical components**: ≥80% coverage

---

## Phase 3: Release & Deployment Automation

### 3.1 Production Release Workflow
```yaml
name: Release to Stores

on:
  push:
    tags: [ 'v*' ]
  workflow_dispatch:
    inputs:
      version:
        description: 'Manual version override'
        required: false
        default: ''

jobs:
  release:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd rtc_mobile && npm ci --silent
      
      - name: Lint + Type check
        run: |
          cd rtc_mobile
          npm run lint
          npx tsc --noEmit
      
      - name: Run tests
        run: |
          cd rtc_mobile
          npm test -- --testPathPattern='tests/unit' --verbose 2>&1 | tail -30
      
      - name: Build production Android AAB
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
        run: |
          cd rtc_mobile
          eas build -p android --profile production --non-interactive --message "Release: v${{ github.ref_name }}"
      
      - name: Submit to Play Store
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
          GOOGLE_PLAY_JSON: ${{ secrets.GOOGLE_PLAY_JSON }}
        run: |
          cd rtc_mobile
          eas submit -p android --release-channel production
      
      - name: Submit to App Store (iOS)
        if: env.APPLE_AUTH_KEY_ID != ''
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
          APPLE_AUTH_KEY_ID: ${{ secrets.APPLE_AUTH_KEY_ID }}
          APPLE_ISSUER_ID: ${{ secrets.APPLE_ISSUER_ID }}
          APPLE_KEY_PATH: ${{ secrets.APPLE_KEY_PATH }}
        run: |
          cd rtc_mobile
          eas submit -p ios --release-channel production
```

### 3.2 Post-Release Verification
- Verify build installation on test devices
- Check analytics for crash reports
- Validate deep linking functionality
- Confirm push notification delivery
- Test onboarding flow for new users

---

## Phase 4: Deployment Checklist

### 4.1 Pre-Deployment
- [ ] All unit tests passing (≥90% coverage on critical paths)
- [ ] Design token WCAG AA contrast audit passed
- [ ] Navigation integrity test suite passed
- [ ] Security sanitizer tests passed
- [ ] No critical `npm audit` vulnerabilities
- [ ] Code review completed
- [ ] Release notes drafted
- [ ] Feature flags documented (if applicable)

### 4.2 Deployment
- [ ] EAS build initiated for target platform(s)
- [ ] Environment variables configured
- [ ] App Store Connect / Google Play Console ready
- [ ] Release notes prepared in both Arabic and English
- [ ] Screenshots updated (if UI changes)
- [ ] Version incremented in `app.json` and `eas.json`

### 4.3 Post-Deployment
- [ ] Install build on test devices (both iOS and Android)
- [ ] Verify deep links: `org.resala.rtc.masar://verify?serial=...`
- [ ] Test push notification reception
- [ ] Test offline behavior
- [ ] Verify role-based access (student/volunteer/admin)
- [ ] Check app startup time
- [ ] Monitor Firebase/Crashlytics for errors (first 24h)
- [ ] Collect user feedback on first-run experience

---

## Phase 5: Monitoring & Continuous Improvement

### 5.1 Build Metrics to Track
- Build time (target: < 10 minutes for Android AAB)
- Binary size (target: < 100 MB for AAB)
- Test flight test duration
- Crash free sessions (target: > 99%)
- App startup time (target: < 3 seconds)

### 5.2 Feedback Loop
1. **Daily**: Check EAS build logs for warnings/errors
2. **Weekly**: Review crash reports and user feedback
3. **Monthly**: Run full test suite, update dependencies
4. **Quarterly**: Review and update the CI/CD pipeline itself

### 5.3 Rollback Procedure
1. If production build has critical issue:
   - EAS: `eas update:rollback`
   - Or submit hotfix via `eas submit`
   - Communicate to users via in-app update or push notification

---

## Quick Start Checklist

### For New Developers:
1. `npm ci` to install dependencies
2. `npm run lint` to verify code style
3. `npx tsc --noEmit` to check TypeScript types
4. `npm test` to run unit test suite
5. `npx eas diagnose` to verify environment

### For Release Preparation:
1. Update version in `app.json` (`version`: "2.1.0")
2. Update `buildNumber`/`versionCode` as needed
3. Run `npm run lint && npm run type-check`
4. Run full test suite
5. Commit and push to trigger EAS builds
6. Monitor build progress on Expo Dashboard

---

*Plan generated: 2025-01-21*
*Current EAS version: ✅ Configured*
*Test suite: ✅ Comprehensive (700+ test cases across 3 suites)*
*Next review: Quarterly with each major release*