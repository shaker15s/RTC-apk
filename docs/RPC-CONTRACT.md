# RPC Contract — مسار RTC (PostgreSQL Functions)

> عقد الدوال الـ 26 الأصلية + دالتين إضافيتين (27-28) من حزمة إصلاحات الجودة.
> هذا الملف كان مستشهداً به في README ولم يكن موجوداً — تم إنشاؤه الآن كمرجع وحيد للعقد.

## الدوال الأصلية الـ 26

| # | اسم الدالة | المعاملات | الصلاحية | الاستخدام في العميل |
|---|---|---|---|---|
| 1 | `get_my_profile` | — | authenticated | `RPC.getMyProfile()` |
| 2 | `ensure_my_profile` | `p_full_name`, `p_phone`, `p_branch` | authenticated | `RPC.ensureMyProfile()` |
| 3 | `batch_roster` | `p_batch_id` | instructor/admin | `RPC.batchRoster()` |
| 4 | `admin_list_profiles` | — | admin | `RPC.adminListProfiles()` |
| 5 | `batch_seat_counts` | `p_batch_ids` | authenticated | `RPC.batchSeatCounts()` |
| 6 | `update_branch_directory` | `p_branch_id`, `p_payload` | admin | `RPC.updateBranchDirectory()` |
| 7 | `join_batch` | `p_batch_id` | authenticated | `RPC.joinBatch()` |
| 8 | `start_session` | `p_batch_id`, `p_title` | instructor/admin | `RPC.startSession()` |
| 9 | `student_check_in` | `p_code` | authenticated | `RPC.studentCheckIn()` |
| 10 | `record_session_attendance` | `p_session_id`, `p_records` | instructor/admin | `RPC.recordSessionAttendance()` |
| 11 | `close_session` | `p_session_id` | instructor/admin | `RPC.closeSession()` |
| 12 | `issue_certificates` | `p_batch_id` | instructor/admin | `RPC.issueCertificates()` |
| 13 | `change_user_role` | `p_user_id`, `p_role` | admin | `RPC.changeUserRole()` |
| 14 | `set_user_status` | `p_user_id`, `p_status` | admin | `RPC.setUserStatus()` |
| 15 | `assign_instructor` | `p_batch_id`, `p_instructor_id` | admin | `RPC.assignInstructor()` |
| 16 | `verify_certificate` | `p_serial` | anon/authenticated | `RPC.verifyCertificate()` |
| 17 | `get_leaderboard` | — | authenticated | `RPC.getLeaderboard()` |
| 18 | `submit_excuse` | `p_batch_id`, `p_session_id`, `p_reason`, `p_file` | authenticated | `RPC.submitExcuse()` |
| 19 | `review_excuse` | `p_excuse_id`, `p_status`, `p_note` | instructor/admin | `RPC.reviewExcuse()` |
| 20 | `submit_session_report` | `p_session_id`, `p_summary`, `p_und`, `p_eng` | instructor/admin | `RPC.submitSessionReport()` |
| 21 | `submit_course_rating` | `p_course_id`, `p_rating`, `p_comment` | authenticated | `RPC.submitCourseRating()` |
| 22 | `broadcast_notice` | `p_scope`, `p_scope_id`, `p_type`, `p_title`, `p_message` | instructor/admin | `RPC.broadcastNotice()` |
| 23 | `add_private_note` | `p_student_id`, `p_body` | instructor/admin | `RPC.addPrivateNote()` |
| 24 | `claim_social_badge` | — | authenticated | `RPC.claimSocialBadge()` |
| 25 | `disable_my_push_devices` | — | authenticated | `RPC.disableMyPushDevices()` |
| 26 | `register_push_device` | `p_token`, `p_platform`, `p_version` | authenticated | `RPC.registerPushDevice()` |

## دوال الإصلاحات الإضافية (v100.1.0)

| # | اسم الدالة | المعاملات | الصلاحية | الغرض |
|---|---|---|---|---|
| 27 | `admin_award_points` | `p_user_id`, `p_points`, `p_reason` | admin | منح نقاط يدوية حقيقية (كان الزر وهمياً — P0-1) |
| 28 | `get_active_session` | `p_batch_id` | instructor/admin | استرجاع الجلسة النشطة للمدرب (P0-5) |
| 29 | `get_my_next_session` | — | authenticated | أقرب محاضرة قادمة حقيقية للطالب (F-2) |

> 🔴 SQL المقترح للدالتين 27 و 28 موجود في `docs/sql/2026-08-15-quality-fixes.sql`.
> العميل يتعامل مع غيابهما بشكل آمن (fallback محلي) حتى يتم نشرهما على الداتابيز.
