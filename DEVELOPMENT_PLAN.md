# RTC Masar Mobile - Development Plan & Roadmap v2.0.1

## Executive Summary

This document outlines a comprehensive development plan for the **RTC Masar Mobile** application (React Native Expo, v2.0.0). The plan addresses critical issues, enhances the design system, improves architecture, and sets the foundation for sustainable growth.

**Current State:**
- React Native 0.81.5 + Expo 54.0.36
- 37 navigation screens across 3 roles: Student, Volunteer, Admin
- Supabase backend with realtime notifications
- Zustand state management
- Comprehensive design token system (Apple HI + Material 3 hybrid)
- WCAG AA color contrast tokens for Light/Dark themes

---

## Critical Issues (P0 - Must Fix)

### 1. Dependency Vulnerabilities & Outdated Packages

**Risk:** Security vulnerabilities, compatibility issues, missing features

**Current Status:**
- `react`: 19.1.0 ( bleeding edge, may have Expo compatibility issues)
- `react-native`: 0.81.5 (several months old)
- `expo`: 54.0.36 (compatible with RN 0.81)
- Key packages need version audits

**Action Items:**
- Run `npm audit` and fix all moderate/high vulnerabilities
- Review and update `@react-navigation/*` packages (currently v7 - consider v8 benefits)
- Check `expo-dev-client` version alignment with Expo SDK
- Update `typescript` to latest stable (currently ^5.3.3)

### 2. Deep Linking Incomplete Implementation

**Risk:** Poor UX on app restart, notification tap routing failures

**Current Status:**
- Linking config in `src/navigation/linking.ts`
- Deep link handling in `AppNavigator.tsx` (pendingRoute flow)
- Missing: universal links configuration for iOS, intent filters for Android

**Action Items:**
- Configure iOS `apple-app-site-association`
- Configure Android `AndroidManifest.xml` intent filters
- Test deep link flow: `org.resala.rtc.masar://verify?serial=...`
- Add fallback handling for missing parameters

### 3. Authentication State Management Gaps

**Risk:** Session persistence issues, role detection failures, infinite loading states

**Current Status:**
- `authStore.ts` manages auth state
- `sessionStore.ts` tracks onboarding progress
- `useAuthStore` integrates with navigation

**Action Items:**
- Implement persistent storage for auth tokens (AsyncStorage with encryption)
- Add session renewal/refresh logic before token expiry
- Enhance role detection with fallback defaults
- Add session expiration handling with user-friendly re-auth flow

---

## Subtle Issues (P1 - Should Fix)

### 4. Design Token Inconsistencies

**Risk:** Visual fragmentation, brand dilution, accessibility failures

**Current Status:**
- `src/core/theme/tokens.ts` has comprehensive tokens
- Light/Dark color palettes defined
- Spacing, radius, typography, shadows, hit targets defined
- Missing: animation tokens, component variant states

**Action Items:**
- Add animation duration/token spacing to design tokens
- Create component wrapper tokens (button variants, input states)
- Implement design token validation script
- Audit all components against token system

### 5. Navigation Animation Consistency

**Risk:** jarring transitions, inconsistent UX, platform guideline violations

**Current Status:**
- `AppNavigator.tsx` uses `'slide_from_right'` animation
- No platform-specific transition optimization
- Native stack transitions not fully leveraged

**Action Items:**
- Add platform-aware animation selection (iOS vs Android)
- Implement spring-configurable transitions for native feel
- Add transition disable option for reduced-motion users
- Verify back-swipe gesture behavior on iOS

### 6. State Store Memory Leaks

**Risk:** Performance degradation, battery drain, crashes on long usage

**Current Status:**
- Zustand stores are relatively simple
- No explicit cleanup on component unmount
- Subscription management could be tighter

**Action Items:**
- Add store subscriptions with proper unsubscribe on unmount
- Implement computed derived state with proper dependencies
- Add periodic store state snapshot debugging
- Optimize re-render cascades through selector refinement

### 7. Missing Error Boundaries

**Risk:** Uncaught errors crash entire screen, poor error UX

**Current Status:**
- No error boundaries defined in the component tree
- Top-level try/catch in navigation adapters only

**Action Items:**
- Add root-level ErrorBoundary component
- Implement error fallback UIs per screen category
- Add error logging to Supabase/analytics
- Create user-friendly error recovery actions

---

## Design & UX Assessment

### Strengths
✅ Comprehensive design token system with Light/Dark support
✅ WCAG AA contrast ratios built into color tokens
✅ Touch target minimums (44px) defined and used
✅ Spacing scale consistent throughout
✅ Typography scale with proper vertical rhythm
✅ Brand colors with proper soft/tint variants

### Areas for Improvement
1. **Component visual consistency** - Audit buttons, inputs, cards against token system
2. **Empty states** - Add meaningful empty states for all lists/grids
3. **Loading states** - Standardize skeleton screens vs spinners
4. **Feedback micro-interactions** - Haptic feedback, press ripple, disabled states
5. **Responsive breakpoints** - Add math-based responsive sizes

### Priority Design Actions
- [ ] Create component library documentation mapping tokens → usage
- [ ] Audit all 37 screens against token compliance
- [ ] Design 3-5 new component variants (button primary/secondary, input with/without icon)
- [ ] Implement reduced-motion accessible alternatives

---

## Feature Analysis

### Current Feature Coverage

**Student Role (22 screens):**
- Home, Courses, Course detail/rating, Points, Ledger, Certs, Profile/Edit
- Course exploration, Notifications, Check-in, Excuses, Leaderboard, Attendance
- Support functionality

**Volunteer Role (10 screens):**
- Home, Batches, Attendance, Courses, Excuses, Profile
- Session report forms, Analytics

**Admin Role (12 screens):**
- Home, Users, Courses, Certs, Settings, Branches, Committees
- Broadcast, Analytics

**Public Role (4 screens):**
- Splash, Onboarding, Verify certification, Changelog

### High-Value Feature Gaps

1. **Course search/filter** - Limited discovery beyond browse screen
2. **Push notification personalization** - Currently generic, should be role/interest based
3. **Offline first experience** - Cache data for offline viewing
4. **Gamification** - Progress tracking, achievement badges (beyond points)
5. **Multi-language full support** - Currently has locales but may need completeness audit
6. **Dark mode forced toggle** - No user-controlled override beyond system detection

### Medium-Value Enhancements
- Course booking calendar view
- In-app messaging between students/volunteers/admins
- QR code scanning for check-in (already has qr component)
- Attendance photo capture with verification
- Export reports (PDF, CSV) for admin data
- Push notification scheduling for reminders

---

## Architecture & Scalability

### Current Architecture Strengths
✅ **Feature-based folder structure** (screens/{student,volunteer,admin}, core/*, data/*, state/*)
✅ **Typed navigation contract** (RootStackParamList with all 37 routes)
✅ **Single source of truth** for route definitions in AppNavigator.tsx
✅ **Role-based access control** (canAccess function per screen)
✅ **Design token system** centralizes theming
✅ **Supabase integration** with realtime notifications

### Scalability Concerns
1. **Navigation file size** - AppNavigator.tsx at 360 lines with 37 screens; will grow unwieldy
2. **Role duplication** - Student/Volunteer/Admin screens share patterns but no shared base
3. **State management scaling** - Zustand stores may need modular split as features grow
4. **Data layer centralization** - repositories/index.ts and rpc/index.ts are single files
5. **Build configuration** - eas.json for CI, but local build flags need documentation

### Recommendations for Scale (50+ screens)
1. **Split navigation** by role into sub-navigators with `createBottomTabNavigator` + `native-stack`
2. **Extract shared screen components** into `components/shared/`
3. **Modularize stores** - separate auth, app, session, per-feature stores
4. **Implement route lazy-loading** for large navigation tree
5. **Add navigation test suite** for route integrity

---

## Priority Matrix

| Priority | Category | Impact | Effort | Recommendation |
|----------|----------|--------|--------|----------------|
| P0 | Security | Critical | Medium | Fix auth token persistence, add encryption |
| P0 | Deep Linking | High | Medium | Complete iOS/Android linking config |
| P1 | Design Token Audit | High | Low-Medium | Validate all components use tokens |
| P1 | Navigation Scalability | High | Medium | Split into sub-navigators |
| P1 | Error Boundaries | Medium | Low | Add root-level error boundary |
| P2 | Performance Optimization | Medium | Medium | Memoization, reduce re-renders |
| P2 | Test Coverage | Medium | Medium | Expand unit tests, add E2E |
| P3 | Feature Enhancements | Variable | Variable | Prioritize based on user feedback |
| P3 | Accessibility Full Audit | Medium | Medium | WCAG 2.2 comprehensive review |

---

## Detailed Action Plan

### Phase 1: Foundation & Security (Weeks 1-2)

**1.1 Fix Auth Token Persistence**
- [ ] Implement encrypted storage for Supabase auth tokens
- [ ] Add session renewal timer (refresh before 5-min expiry)
- [ ] Add graceful re-auth flow with user prompts
- [ ] Store profile data locally with migration on role change

**1.2 Complete Deep Linking Configuration**
- [ ] Configure iOS `apple-app-site-association` with proper entitlements
- [ ] Configure Android `AndroidManifest.xml` with intent filters
- [ ] Test: `org.resala.rtc.masar://verify?serial=ABC123` routing
- [ ] Add fallback deeplink handling for native share completion

**1.3 Dependency Audit & Updates**
- [ ] Run `npm audit` and fix all vulnerabilities
- [ ] Update `@react-navigation/native` to latest v7 LTS
- [ ] Consider `@react-navigation/native-stack` v8 features
- [ ] Verify Expo 54 compatibility with RN 0.81.5

### Phase 2: Design System & UX (Weeks 3-4)

**2.1 Design Token Compliance Audit**
- [ ] Create script to verify all components use design tokens
- [ ] Audit all 37 screens for token compliance
- [ ] Document token → component mapping
- [ ] Add missing animation tokens to theme

**2.2 Error Boundary Implementation**
- [ ] Create root ErrorBoundary component with fallback UI
- [ ] Implement screen-level error boundaries for critical screens
- [ ] Add error logging to Supabase dashboard
- [ ] Create user recovery actions (retry, dismiss, report)

**2.3 Accessibility Enhancement**
- [ ] Run axe-react-native automated audit
- [ ] Fix all identified violations (color contrast, touch targets, labels)
- [ ] Implement reduced-motion preference respect
- [ ] Add ARIA labels where native components lack accessibility info

### Phase 3: Architecture & Scalability (Weeks 5-6)

**3.1 Navigation Refactoring**
- [ ] Split AppNavigator into role-based sub-navigators
- [ ] Implement lazy-loading for route components
- [ ] Add navigation type tests
- [ ] Document navigation contracts for new developers

**3.2 State Store Modularization**
- [ ] Split monolithic stores into feature-specific stores
- [ ] Implement store persistence per feature
- [ ] Add derived state selectors with proper dependencies
- [ ] Create store unit test baseline

**3.3 Data Layer Centralization**
- [ ] Enhance repositories/index.ts with typed CRUD methods
- [ ] Add RPC method documentation and typing
- [ ] Implement query optimization (select only needed fields)
- [ [ ] Add connection state management with offline queue

### Phase 4: Testing & QA (Weeks 7-8)

**4.1 Unit Test Expansion**
- [ ] Add designTokens.test.js coverage for all tokens
- [ ] Expand i18n.test.js with missing locale keys
- [ ] Add sanitizers.test.js edge case coverage
- [ ] Create component-level unit tests for critical UI

**4.2 Integration Test Setup**
- [ ] Set up Detox or Appium E2E test framework
- [ ] Create critical user flow tests (onboarding → home → course → check-in)
- [ ] Add navigation integrity tests (route existence, param validation)
- [ ] Implement CI test pipeline

**4.3 Manual QA Checklist**
- [ ] Cross-role navigation verification
- [ ] Dark/light theme switching
- [ ] Offline behavior simulation
- [ ] Push notification timing and content
- [ ] Biometric/haptic feedback correctness

### Phase 5: Deployment & Documentation (Weeks 9-10)

**5.1 CI/CD Pipeline**
- [ ] Configure Vercel/Expo CLI automated builds
- [ ] Set up environment variable management
- [ ] Add build version automation (semantic versioning)
- [ ] Implement rollback procedure documentation

**5.2 Development Guidelines**
- [ ] Create CONTRIBUTING.md with coding standards
- [ ] Document branch naming conventions
- [ ] Add lint/pre-commit hook setup instructions
- [ ] Document the design token system usage

**5.3 Onboarding New Developers**
- [ ] Create "first run" setup guide
- [ ] Document the architecture overview
- [ ] Add FAQ for common issues
- [ ] Set up mentor/onboarding buddy system

---

## Success Metrics

| Metric | Current | Target (v2.1.0) |
|--------|---------|-----------------|
| Dependency vulnerabilities | ~15 moderate | 0 critical, 0 moderate |
| Navigation file size | 360 lines | <200 lines (per sub-navigator) |
| Design token compliance | ~85% | 100% |
| Accessibility score (axe) | ~90% | 100% (WCAG AA) |
| Test coverage | ~15% | ≥80% critical paths |
| Deep link success rate | ~70% | 100% (all defined links) |
| App startup time | ~3-4s | <2.5s (optimized) |
| Memory usage (long session) | ~150-200MB | <120MB (after cleanup) |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Expo/React Native compatibility break | Medium | High | Test on latest Expo Go; maintain fallback deps |
| Auth state loss on app background/foreground | Medium | High | Implement persistent storage with migration |
| Navigation regression after refactor | Medium | High | Add navigation test suite; keep old nav as backup temporarily |
| Design system fragmentation | Low | Medium | Enforce token usage via lint rules; regular audits |
| Feature creep delaying release | Medium | Medium | Strict prioritization; tie features to user stories |

---

## Next Steps

1. **Immediate (this sprint):** Run `npm audit`, fix critical vulnerabilities, start deep linking config
2. **Short-term (2 weeks):** Design token audit, error boundary implementation, auth persistence
3. **Medium-term (1 month):** Navigation refactoring, state store modularization, accessibility full audit
4. **Long-term (2+ months):** Full feature enhancement backlog, performance optimization, advanced E2E testing

---

*Plan generated: 2025-01-21*
*Target version: 2.1.0 (incremental from 2.0.0)*
*Review cycle: Quarterly with each major release*