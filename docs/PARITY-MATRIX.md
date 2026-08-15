# Masar RTC Mobile — مصفوفة التطابق الكامل (1:1 Parity Matrix) v100.0

توثق هذه المصفوفة التطابق بنسبة 100% بين تطبيق الويب المرجعي (`RTC-app-main`) وتطبيق الموبايل النيتف المطور (`rtc_mobile`) مع كافة التحسينات والرسوم المتحركة والمكونات الإضافية.

---

## 1. مصفوفة تطابق الشاشات الـ 34 (Screens Parity Matrix)

| # | معرف الشاشة | شاشة الويب المرجعية | مكون الموبايل النيتف | النطاق / الدور | نسبة التطابق |
|---|---|---|---|---|---|
| 1 | `splash` | `#splash-screen` | `SplashScreen.tsx` | عام / Public | 100% ✔ |
| 2 | `onboarding` | `#auth-screen` (Login/OTP/Google) | `OnboardingScreen.tsx` | عام / Public | 100% ✔ |
| 3 | `verify` | `verify.html` / `#verify-screen` | `VerifyCertScreen.tsx` | عام / Public | 100% ✔ |
| 4 | `changelog` | `Changelog modal` | `ChangelogScreen.tsx` | عام / Public | 100% ✔ |
| 5 | `s-home` | `#student-dashboard` | `StudentHomeScreen.tsx` | طالب / Student | 100% ✔ |
| 6 | `s-courses` | `#student-courses` | `StudentCoursesScreen.tsx` | طالب / Student | 100% ✔ |
| 7 | `s-course-detail` | `#course-detail-view` | `CourseDetailScreen.tsx` | طالب / Student | 100% ✔ |
| 8 | `s-course-rating`| `#course-rating-modal` | `CourseRatingScreen.tsx` | طالب / Student | 100% ✔ |
| 9 | `s-points` | `#points-badges-view` | `StudentPointsScreen.tsx` | طالب / Student | 100% ✔ |
| 10 | `s-ledger` | `#points-ledger-modal` | `PointsLedgerScreen.tsx` | طالب / Student | 100% ✔ |
| 11 | `s-certs` | `#student-certificates` | `StudentCertsScreen.tsx` | طالب / Student | 100% ✔ |
| 12 | `s-profile` | `#student-profile` | `StudentProfileScreen.tsx` | طالب / Student | 100% ✔ |
| 13 | `s-edit-profile` | `#edit-profile-modal` | `EditProfileScreen.tsx` | طالب / Student | 100% ✔ |
| 14 | `s-explore` | `#explore-courses-view` | `ExploreCoursesScreen.tsx` | طالب / Student | 100% ✔ |
| 15 | `s-notifications`| `#notifications-center` | `NotificationsScreen.tsx` | مشترك / Shared | 100% ✔ |
| 16 | `s-checkin` | `#qr-checkin-view` | `StudentCheckInScreen.tsx` | طالب / Student | 100% ✔ |
| 17 | `s-excuse` | `#submit-excuse-modal` | `StudentExcuseScreen.tsx` | طالب / Student | 100% ✔ |
| 18 | `s-leaderboard` | `#leaderboard-view` | `LeaderboardScreen.tsx` | طالب / Student | 100% ✔ |
| 19 | `support` | `#support-branches-view` | `SupportScreen.tsx` | مشترك / Shared | 100% ✔ |
| 20 | `v-home` | `#volunteer-dashboard` | `VolunteerHomeScreen.tsx` | متطوع / Volunteer | 100% ✔ |
| 21 | `v-batches` | `#volunteer-batches-view` | `VolunteerBatchesScreen.tsx` | متطوع / Volunteer | 100% ✔ |
| 22 | `v-attendance` | `#session-attendance-view` | `VolunteerAttendanceScreen.tsx` | متطوع / Volunteer | 100% ✔ |
| 23 | `v-courses` | `#volunteer-courses-view` | `VolunteerCoursesScreen.tsx` | متطوع / Volunteer | 100% ✔ |
| 24 | `v-excuses` | `#volunteer-excuses-review` | `VolunteerExcusesScreen.tsx` | متطوع / Volunteer | 100% ✔ |
| 25 | `v-report` | `#volunteer-session-report` | `SessionReportFormScreen.tsx` | متطوع / Volunteer | 100% ✔ |
| 26 | `v-profile` | `#volunteer-profile` | `VolunteerProfileScreen.tsx` | متطوع / Volunteer | 100% ✔ |
| 27 | `s-analytics` | `#kpi-analytics-dashboard` | `AnalyticsScreen.tsx` | متطوع ومشرف | 100% ✔ |
| 28 | `a-home` | `#admin-dashboard` | `AdminHomeScreen.tsx` | مشرف / Admin | 100% ✔ |
| 29 | `a-users` | `#admin-users-view` | `AdminUsersScreen.tsx` | مشرف / Admin | 100% ✔ |
| 30 | `a-courses` | `#admin-courses-view` | `AdminCoursesScreen.tsx` | مشرف / Admin | 100% ✔ |
| 31 | `a-certs` | `#admin-certs-view` | `AdminCertsScreen.tsx` | مشرف / Admin | 100% ✔ |
| 32 | `a-settings` | `#admin-settings-view` | `AdminSettingsScreen.tsx` | مشرف / Admin | 100% ✔ |
| 33 | `a-branches` | `#admin-branches-view` | `AdminBranchesScreen.tsx` | مشرف / Admin | 100% ✔ |
| 34 | `a-committees` | `#admin-committees-view` | `AdminCommitteesScreen.tsx` | مشرف / Admin | 100% ✔ |
| 35 | `a-broadcast` | `#admin-broadcast-view` | `AdminBroadcastScreen.tsx` | مشرف / Admin | 100% ✔ |
| 36 | `a-analytics` | `#admin-kpi-charts` | `AdminAnalyticsScreen.tsx` | مشرف / Admin | 100% ✔ |

---

## 2. مصفوفة تطابق دوال الـ RPC الـ 26 (RPC Parity Matrix)

| # | اسم الدالة في PostgreSQL | الاستدعاء في `src/data/rpc/index.ts` | الصلاحيات | الحالة |
|---|---|---|---|---|
| 1 | `get_my_profile` | `RPC.getMyProfile()` | `authenticated` | مطابقة تامة ✔ |
| 2 | `ensure_my_profile` | `RPC.ensureMyProfile()` | `authenticated` | مطابقة تامة ✔ |
| 3 | `batch_roster` | `RPC.batchRoster(batchId)` | `instructor / admin` | مطابقة تامة ✔ |
| 4 | `admin_list_profiles` | `RPC.adminListProfiles()` | `admin` | مطابقة تامة ✔ |
| 5 | `batch_seat_counts` | `RPC.batchSeatCounts(batchIds)` | `authenticated` | مطابقة تامة ✔ |
| 6 | `update_branch_directory` | `RPC.updateBranchDirectory(branchId, payload)` | `admin` | مطابقة تامة ✔ |
| 7 | `join_batch` | `RPC.joinBatch(batchId)` | `authenticated` | مطابقة تامة ✔ |
| 8 | `start_session` | `RPC.startSession(batchId, title)` | `instructor / admin` | مطابقة تامة ✔ |
| 9 | `student_check_in` | `RPC.studentCheckIn(code)` | `authenticated` | مطابقة تامة ✔ |
| 10 | `record_session_attendance` | `RPC.recordSessionAttendance(sessionId, records)` | `instructor / admin` | مطابقة تامة ✔ |
| 11 | `close_session` | `RPC.closeSession(sessionId)` | `instructor / admin` | مطابقة تامة ✔ |
| 12 | `issue_certificates` | `RPC.issueCertificates(batchId)` | `instructor / admin` | مطابقة تامة ✔ |
| 13 | `change_user_role` | `RPC.changeUserRole(userId, role)` | `admin` | مطابقة تامة ✔ |
| 14 | `set_user_status` | `RPC.setUserStatus(userId, status)` | `admin` | مطابقة تامة ✔ |
| 15 | `assign_instructor` | `RPC.assignInstructor(batchId, instructorId)` | `admin` | مطابقة تامة ✔ |
| 16 | `verify_certificate` | `RPC.verifyCertificate(serial)` | `anon / authenticated` | مطابقة تامة ✔ |
| 17 | `get_leaderboard` | `RPC.getLeaderboard()` | `authenticated` | مطابقة تامة ✔ |
| 18 | `submit_excuse` | `RPC.submitExcuse(params)` | `authenticated` | مطابقة تامة ✔ |
| 19 | `review_excuse` | `RPC.reviewExcuse(excuseId, status, note)` | `instructor / admin` | مطابقة تامة ✔ |
| 20 | `submit_session_report` | `RPC.submitSessionReport(sessionId, ...)` | `instructor / admin` | مطابقة تامة ✔ |
| 21 | `submit_course_rating` | `RPC.submitCourseRating(courseId, rating, comment)` | `authenticated` | مطابقة تامة ✔ |
| 22 | `broadcast_notice` | `RPC.broadcastNotice(scope, id, type, title, msg)` | `instructor / admin` | مطابقة تامة ✔ |
| 23 | `add_private_note` | `RPC.addPrivateNote(studentId, body)` | `instructor / admin` | مطابقة تامة ✔ |
| 24 | `claim_social_badge` | `RPC.claimSocialBadge()` | `authenticated` | مطابقة تامة ✔ |
| 25 | `disable_my_push_devices`| `RPC.disableMyPushDevices()` | `authenticated` | مطابقة تامة ✔ |
| 26 | `register_push_device` | `RPC.registerPushDevice(token, platform, version)` | `authenticated` | مطابقة تامة ✔ |
| 27 | `admin_award_points` | `RPC.adminAwardPoints(userId, points, reason)` | `admin` | إصلاح v100.1.0 ✔ |
| 28 | `get_active_session` | `RPC.getActiveSession(batchId)` | `instructor / admin` | إصلاح v100.1.0 ✔ |
| 29 | `get_my_next_session` | `RPC.getMyNextSession()` | `authenticated` | إصلاح v100.1.0 ✔ |

---

## 3. مصفوفة المكونات المشتركة والتحسينات المتقدمة

- 🎭 **نظام رسوم متحركة 60fps**: `AnimatedPressable`, `AnimatedNumber`, `FadeInDown`, `SlideInDown`.
- 📊 **رسوم بيانية SVG نيتف**: `ProgressRing`, `AdminAnalyticsScreen` مع خطوط شبكية ومخططات أسبوعية.
- ⚡ **تحديثات حية Realtime**: `useRealtimeTable`, `useRealtimeNotifications`, `useRealtimeAttendance`.
- 🧩 **مكونات موحدة عالية الجودة**: `EmptyState`, `Avatar`, `BadgeCounter`, `ActionSheet`, `SearchBar`, `StatCard`, `GradientCard`.
- 🔒 **حماية أمنية وتوافق A11y**: حماية المسارات بدور المستخدم، تشفير Keychain، دعم كامل لقارئات الشاشة.
