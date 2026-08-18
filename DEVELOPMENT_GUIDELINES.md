# RTC Masar Mobile - Development Guidelines & Onboarding

## Getting Started

### 1. Immediate Setup
```bash
# 1. Install dependencies
npm ci

# 2. Verify TypeScript types
npx tsc --noEmit

# 3. Run lint check
npm run lint

# 4. Run unit tests
npm test

# 5. Verify environment with EAS
npx eas diagnose
```

### 2. Available Scripts
| Script | Purpose |
|--------|---------|
| `npm start` | Expo start (development server) |
| `npm run android` | Start Android app |
| `npm run ios` | Start iOS app (macOS only) |
| `npm run web` | Start web version |
| `npm test` | Run unit test suite |
| `npm run lint` | TypeScript + ESLint check |
| `npm run build:apk` | Build APK via EAS (local) |
| `npm run build:apk:local` | Build APK via EAS local |
| `npm run build:aab` | Build AAB via EAS (production) |

### 3. Project Structure Overview
```
rtc_mobile/
├── src/                    # Source code (all features)
│   ├── state/              # Zustand stores (auth, app, session)
│   ├── core/               # Core modules (theme, security, crypto, etc.)
│   ├── data/               # Data layer (Supabase, repos, RPC, realtime)
│   ├── navigation/         # React Navigation setup (37 screens, 3 roles)
│   ├── components/         # UI components (common, layout, screens)
│   ├── screens/            # Screen components (student/volunteer/admin/public)
│   └── assets/           # Images, fonts, icons
├── tests/                  # Unit tests (design tokens, i18n, sanitizers)
├── eas.json              # EAS CI/CD configuration
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

### 4. Key Conventions

#### Folder Structure (Feature-Based)
- **`src/screens/{student,volunteer,admin,public}`**: Screen components per role
- **`src/components/{common,layout,feedback}`**: Reusable UI components
- **`src/core/{theme,security,crypto,native,pdf,performance,storage,i18n,native}`**: Cross-cutting concerns
- **`src/data/{repositories,rpc,realtime}`**: Data access layer
- **`src/state/`**: Global state management (Zustand stores)

#### Naming Conventions
- **Files**: PascalCase for components (`CustomButton.tsx`), camelCase for utilities
- **Components**: `UCF` pattern - Uppercase first letter, descriptive name
- **Hooks**: `use` prefix (`useAppStore`, `useAuthStore`)
- **Constants**: UPPER_SNAKE_CASE (`RTC_CONFIG`, `PUBLIC_CACHE_PREFIX`)
- **Functions**: camelCase (`validateEgyptianPhone`, `maskPhone`)
- **Routes**: Lowercase with hyphens or `s-`/`v-`/`a-` prefixes

#### State Management (Zustand)
- **Store files**: `src/store/*Store.ts` (appStore, authStore, sessionStore)
- **Selector pattern**: `useStoreState((s) => s.value)`
- **Persist**: Auth tokens in SecureStore, not AsyncStorage
- **Derived state**: Computed from base state with proper dependencies
- **Never mutate state directly**: Always use setters

#### Navigation (React Navigation native-stack)
- **Single source of truth**: `RootStackParamList` in `src/navigation/types.ts`
- **Screen adapters**: `makeScreen()` in `AppNavigator.tsx` injects `onNavigate`/`onBack`
- **Role-based access**: `canAccess(screenId, role)` in `src/core/security/sanitizers.ts`
- **Tab bar**: Shown only on tab screens (`TAB_SCREENS` constant)
- **Deep linking**: Configured in `src/navigation/linking.ts`

#### Design System
- **Tokens**: `src/core/theme/tokens.ts` (Light/Dark, spacing, radii, typography, shadows)
- **Usage**: Import `{ Radii, Spacing, colors }` from `../../core/theme/tokens`
- **Compliance**: WCAG AA contrast, 44px minimum touch targets
- **Never hardcode colors**: Always use theme tokens
- **Component variants**: Use `variant` prop (primary/teal/soft/danger/ghost for buttons)

#### Security
- **Auth storage**: `RTCSecureStorage` (expo-secure-store with Keychain/Keystore)
- **Input validation**: Use sanitizers from `src/core/security/sanitizers.ts`
- **SQL injection prevention**: Parameterized Supabase queries (` .eq(), .select()`)
- **RPC calls**: Parameterized `supabase.rpc('function_name', { param: value })`
- **URL sanitization**: `safeUrl()` rejects javascript:, data:, suspicious patterns
- **File upload validation**: Type + size guards in `repositories/index.ts`

#### Error Handling
- **Result pattern**: `safeFetch*` functions return `Result< T >` (ok/err)
- **Error mapping**: `mapSupabaseError()` → user-friendly Arabic messages
- **AppError kinds**: `network`, `auth`, `permission`, `schema`, `not_found`, `validation`, `unknown`
- **User messages**: Always in Arabic, with clear recovery actions
- **Never expose stack traces** to end users

---

## Component Development Guidelines

### 1. Presentational Components
```tsx
// Good: Use React.memo for pure components with complex props
export const CustomButton = React.memo(({ title, onPress, variant = 'primary' }) => {
  // ... component logic
});

// Bad: Don't forget memoization when props are complex
export const CustomButton = ({ title, onPress, variant = 'primary }) => {
  // ... component logic
};
```

### 2. Component Prop Types
```tsx
// Good: Define explicit prop interfaces
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'teal' | 'soft' | 'danger' | 'ghost';
  size?: 'big' | 'mid' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// Bad: Avoid `any` props when possible
interface ButtonProps {
  title: string;
  onPress: () => void;
  props: any;  // ❌ Avoid
}
```

### 3. Styling Rules
```tsx
// Good: Use design tokens
import { Radii, Spacing, Colors } from '../../core/theme/tokens';

// Good: Use conditional classes
style={[
  styles.base,
  {
    backgroundColor: variant === 'primary' ? Colors.primary : Colors card2,
    borderRadius: Radii.md,
  },
]}

// Bad: Hardcoding values
style={{
  backgroundColor: '#00288E',  // ❌ Don't hardcode
  borderRadius: 10,            // ❌ Don't hardcode
}}
```

#### 4. Accessibility
```tsx
// Good: Always add accessibility props
<View
  accessibilityRole="button"
  accessibilityLabel={title}
  accessibilityState={{ disabled: disabled || loading }}
/>

// Good: Test with reduced-motion
const reducedMotion = useReducedMotionPreference();
const transitionAnimation = reducedMotion ? 'fade' : 'slide_from_right';

// Bad: Skip accessibility props
<View onPress={handlePress}>  // ❌ Missing accessibility
```

#### 5. Internationalization
```tsx
// Good: Use the `t` hook for all strings
import { useT } from '../../core/i18n';

const { t } = useT();

// Good: Include interpolation params when needed
const pointsText = t('pointsToNext', { p: 20, n: 100 });

// Good: Language switcher respects both language + direction
<Button title={t('langAR')} onPress={() => setLanguage('ar')} />

// Bad: Hardcoded strings without translation
<Text>Welcome back</Text>  // ❌ Only works for one language
```

---

## Branch & Workflow Guidelines

### 1. Branch Naming Convention
```
feature/short-description    # New feature
bug/issue-number-description # Bug fix
hotfix/short-description     # Production hotfix
chore/short-description      # Routine maintenance
docs/short-description       # Documentation update
```

### 2. Commit Message Format
```
<type>(<scope>): <description>

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # formatting, missing semicolons, etc. (no code change)
refactor: # Refactoring existing code
perf:     # Performance improvement
test:     # Adding missing tests
build:    # Build system changes
ci:       # CI configuration changes
chore:    # Routine maintenance

# Examples
feat(student): add course rating screen
fix(auth): handle token expiry UX
docs: update CONTRIBUTING.md
refactor(navigation): split navigator into sub-navigators
```

### 3. Pull Request Template
Every PR must:
- [ ] Link to issue (if applicable)
- [ ] Run `npm run lint` locally
- [ ] Run `npm test` (unit tests)
- [ ] Add/modify tests for new functionality
- [ ] Update documentation if API changes
- [ ] Screenshots for UI changes
- [ ] Test on both Android and iOS simulators

### 4. Code Review Checklist
- [ ] Follows project coding standards
- [ ] Uses design tokens (not hardcoded values)
- [ ] Handles errors properly (Result pattern or try/catch)
- [ ] No console.log statements in production code
- [ ] Accessibility props included
- [ ] i18n keys used for all strings
- [ ] Role-based access considered
- [ ] Performance implications addressed
- [ ] Backward compatible (or migration plan documented)

---

## Debugging & Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| App crashes on launch | Check `supabase` config in `app.json`, verify `EXPO_PUBLIC_SUPABASE_URL` |
| Navigation errors | Verify `RootStackParamList` has the route, check `makeScreen` adapter |
| Deep link not working | Check `linking.ts` config and `apple-app-site-association` (iOS) / `AndroidManifest.xml` (Android) |
| Theme not applying | Ensure `useAppStore()` is used, not direct token imports |
| i18n key not found | Check both `ar.ts` and `en.ts` dictionaries have the key |
| Performance lag | Check for missing `React.memo`, large list rendering without FlatList |
| SecureStore not working | Ensure `EXPO_PUBLIC_ALLOW_UNSECURE_STORE_DEBUG` not set in production |
| Camera permission denied | Add `"android.permission.CAMERA"` to `app.json` android permissions |
| Font not loading | Ensure `expo-font` is installed and `useFont` hook called before rendering |

### Debugging Commands
```bash
# Enable Expo debugging
npx expo start --dev-client

# Check Metro logs
# In Expo Go: shake device → "Dev Settings" → "Show JS Error Alert"

# Verify TypeScript errors
npx tsc --noEmit --strict

# Run tests with verbose output
npm test -- --verbose

# Expo diagnostics
npx eas diagnose
```

---

## Get Help

### 1. Check Existing Resources
- `tests/unit/` - Test suites as reference implementation
- `src/core/theme/tokens.ts` - Design token system reference
- `src/navigation/` - Navigation architecture reference
- `CI_DEPLOYMENT_PLAN.md` - CI/CD pipeline details

### 2. Ask the Team
- #general (Expo/React Native questions)
- #design (UI/UX, design tokens, accessibility)
- #backend (Supabase, RPC, data layer)
- #qa (testing, bug reports)

### 3. When Asking for Help
Provide:
1. **What you're trying to achieve**
2. **Steps to reproduce** (if bug)
3. **Expected vs actual behavior**
4. **Code snippet** causing the issue
5. **Environment** (OS, Expo version, device/iOS simulator/Android emulator)
6. **Error messages** (full text, not just summaries)

---

## Onboarding Checklist (First Week)

### Day 1: Environment & Setup
- [ ] `npm ci` completes successfully
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` runs without errors
- [ ] Expo Go/dev client installed and working
- [ ] Android Studio / Xcode installed (if targeting native)

### Day 2: Architecture Understanding
- [ ] Read `src/navigation/types.ts` - Param list explanation
- [ ] Read `src/core/theme/tokens.ts` - Design token system
- [ ] Read `src/core/security/sanitizers.ts` - Security layer
- [ ] Read `src/data/supabaseClient.ts` - Backend integration
- [ ] Read `src/state/` - State management overview

### Day 3: Code Contribution Firsts
- [ ] Fix a minor bug (good first issue)
- [ ] Add a new i18n key (both ar.ts and en.ts)
- [ ] Create a new component following the patterns
- [ ] Add unit tests for new component/function
- [ ] Submit first PR

### Day 4: Feature Development
- [ ] Work on assigned feature with mentor guidance
- [ ] Follow the component guidelines
- [ ] Use design tokens, not hardcoded values
- [ ] Write tests for new functionality
- [ ] Code review participation

### Day 5: Independence
- [ ] Work on small feature independently
- [ ] Run full test suite, fix any failures
- [ ] Participate in code review of teammate's PR
- [ ] Summarize learnings in team channel

### Day 6-7: Full Integration
- [ ] Complete a feature end-to-end (design → implementation → test)
- [ ] Deploy to Expo Go/dev client for testing
- [ ] Contribute to codebase documentation if needed
- [ ] Final review of week's contributions

---

## Code of Conduct

- **Be respectful** in all communications (written and verbal)
- **Assume positive intent** from teammates
- **Give and receive feedback** constructively
- **Ask questions** when uncertain (better to ask than assume)
- **Document decisions** that affect the codebase
- **Prioritize accessibility** in all UI work
- **Write tests** for new functionality (minimum critical path)
- **Follow the coding standards** in this document
- **Keep learning** - the mobile ecosystem evolves rapidly

---

*Document generated: 2025-01-21*
*Version: 1.0.0*
*Review cycle: With each major release (quarterly)*
*Maintained by: Development Team*