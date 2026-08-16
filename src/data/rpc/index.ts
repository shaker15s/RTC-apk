/**
 * Master RPC Client for Masar RTC Native Mobile.
 * Encapsulates the 26+ documented PostgreSQL RPC functions with exact parameter names.
 * All fake fallbacks removed for production accuracy.
 */
import { supabase } from '../supabaseClient';

export interface UserProfile {
  id: string;
  full_name: string;
  role: 'student' | 'volunteer' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  email: string;
  phone?: string;
  branch_id?: string;
  avatar_url?: string;
  points: number;
  streak: number;
  lang?: string;
  dark_mode?: boolean;
  badge_ids?: string[];
  branch_name?: string;
  branches?: {
    id: string;
    slug: string;
    name_ar: string;
    name_en?: string;
    city?: string;
    address?: string;
    facebook_url?: string;
    whatsapp?: string;
    hotline?: string;
  };
}

export interface BatchRosterStudent {
  enrollment_id: string;
  student_id: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  points: number;
  streak: number;
  attendance_pct: number;
  sessions_done: number;
}

export interface SeatCountResult {
  batch_id: string;
  enrolled: number;
  capacity: number;
  seats_left: number;
}

export interface VerifyCertificateResult {
  is_valid: boolean;
  student_name: string;
  course_title: string;
  issued_date: string;
  serial: string;
}

export interface MyAttendanceItem {
  session_id: string;
  session_title?: string;
  course_title?: string;
  course_id?: string;
  course_sessions_count?: number;
  batch_name?: string;
  session_date?: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  points_awarded?: number;
  points?: number;
}

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  points: number;
  avatar_url?: string;
  rank: number;
}

function unwrap<T>(res: { data: T | null; error: any }, fallback?: T): T {
  if (res.error) throw res.error;
  return (res.data ?? fallback) as T;
}

export const RPC = {
  // 1. get_my_profile
  async getMyProfile(): Promise<UserProfile | null> {
    const res = await supabase.rpc('get_my_profile');
    return unwrap(res, null);
  },

  // 2. ensure_my_profile
  async ensureMyProfile(fullName?: string | null, phone?: string | null, branchId?: string | null): Promise<any> {
    const res = await supabase.rpc('ensure_my_profile', {
      p_full_name: fullName || null,
      p_phone: phone || null,
      p_branch: branchId || null,
    });
    return unwrap(res);
  },

  // 3. batch_roster
  async batchRoster(batchId: string): Promise<BatchRosterStudent[]> {
    const res = await supabase.rpc('batch_roster', {
      p_batch_id: batchId,
    });
    return unwrap(res, []) || [];
  },

  // 4. admin_list_profiles
  async adminListProfiles(): Promise<UserProfile[]> {
    const res = await supabase.rpc('admin_list_profiles');
    return unwrap(res, []) || [];
  },

  // 5. batch_seat_counts
  async batchSeatCounts(batchIds: string[]): Promise<Record<string, { enrolled: number; capacity: number }>> {
    const res = await supabase.rpc('batch_seat_counts', {
      p_batch_ids: batchIds,
    });
    const rows = unwrap<SeatCountResult[]>(res, []) || [];
    const out: Record<string, { enrolled: number; capacity: number }> = {};
    rows.forEach((r) => {
      out[r.batch_id] = { enrolled: Number(r.enrolled) || 0, capacity: Number(r.capacity) || 0 };
    });
    return out;
  },

  // 6. update_branch_directory
  async updateBranchDirectory(branchId: string, payload: any): Promise<void> {
    const res = await supabase.rpc('update_branch_directory', {
      p_branch_id: branchId,
      p_payload: payload || {},
    });
    return unwrap(res);
  },

  // 7. join_batch
  async joinBatch(batchId: string): Promise<{ success: boolean; status: 'enrolled' | 'waitlist' }> {
    const res = await supabase.rpc('join_batch', {
      p_batch_id: batchId,
    });
    return unwrap(res);
  },

  // 8. start_session
  async startSession(batchId: string, title?: string): Promise<{ id: string; checkin_code: string }> {
    const res = await supabase.rpc('start_session', {
      p_batch_id: batchId,
      p_title: title || null,
    });
    return unwrap(res);
  },

  // 9. student_check_in
  async studentCheckIn(code: string): Promise<{ success: boolean; message: string }> {
    const res = await supabase.rpc('student_check_in', {
      p_code: code,
    });
    return unwrap(res);
  },

  // 10. record_session_attendance
  async recordSessionAttendance(
    sessionId: string,
    records: Array<{ student_id: string; status: string; notes?: string }>
  ): Promise<{ success: boolean; count: number }> {
    const res = await supabase.rpc('record_session_attendance', {
      p_session_id: sessionId,
      p_records: records,
    });
    return unwrap(res);
  },

  // 11. close_session
  async closeSession(sessionId: string): Promise<void> {
    const res = await supabase.rpc('close_session', {
      p_session_id: sessionId,
    });
    return unwrap(res);
  },

  // 12. issue_certificates
  async issueCertificates(batchId: string): Promise<{ success: boolean; issued: number }> {
    const res = await supabase.rpc('issue_certificates', {
      p_batch_id: batchId,
    });
    return unwrap(res);
  },

  // 13. change_user_role
  async changeUserRole(userId: string, role: string): Promise<void> {
    const res = await supabase.rpc('change_user_role', {
      p_user_id: userId,
      p_role: role,
    });
    return unwrap(res);
  },

  // 14. set_user_status
  async setUserStatus(userId: string, status: string): Promise<void> {
    const res = await supabase.rpc('set_user_status', {
      p_user_id: userId,
      p_status: status,
    });
    return unwrap(res);
  },

  // 15. assign_instructor
  async assignInstructor(batchId: string, instructorId: string): Promise<void> {
    const res = await supabase.rpc('assign_instructor', {
      p_batch_id: batchId,
      p_instructor_id: instructorId,
    });
    return unwrap(res);
  },

  // 16. verify_certificate (Public)
  async verifyCertificate(serial: string): Promise<VerifyCertificateResult[]> {
    const res = await supabase.rpc('verify_certificate', {
      p_serial: serial,
    });
    return unwrap(res, []) || [];
  },

  // 17. get_leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await supabase.rpc('get_leaderboard');
      return unwrap(res, []) || [];
    } catch (e) {
      return [];
    }
  },

  // 18. submit_excuse
  async submitExcuse(params: {
    batchId: string;
    sessionId?: string | null;
    reason: string;
    file?: string | null;
  }): Promise<string> {
    const res = await supabase.rpc('submit_excuse', {
      p_batch_id: params.batchId,
      p_session_id: params.sessionId || null,
      p_reason: params.reason,
      p_file: params.file || null,
    });
    return unwrap(res);
  },

  // 19. review_excuse
  async reviewExcuse(excuseId: string, status: 'approved' | 'rejected', note = ''): Promise<void> {
    const res = await supabase.rpc('review_excuse', {
      p_excuse_id: excuseId,
      p_status: status,
      p_note: note || '',
    });
    return unwrap(res);
  },

  // 20. submit_session_report
  async submitSessionReport(sessionId: string, summary: string, understandingRate: number, engagementRate: number): Promise<string> {
    const res = await supabase.rpc('submit_session_report', {
      p_session_id: sessionId,
      p_summary: summary,
      p_und: understandingRate,
      p_eng: engagementRate,
    });
    return unwrap(res);
  },

  // 21. submit_course_rating
  async submitCourseRating(courseId: string, rating: number, comment = ''): Promise<void> {
    const res = await supabase.rpc('submit_course_rating', {
      p_course_id: courseId,
      p_rating: rating,
      p_comment: comment || '',
    });
    return unwrap(res);
  },

  // 22. broadcast_notice
  async broadcastNotice(
    scope: 'all' | 'branch' | 'batch',
    scopeId: string | null,
    type: 'info' | 'urgent' | 'reminder',
    title: string,
    message: string
  ): Promise<number> {
    const res = await supabase.rpc('broadcast_notice', {
      p_scope: scope,
      p_scope_id: scopeId || null,
      p_type: type,
      p_title: title,
      p_message: message,
    });
    return unwrap(res);
  },

  // 23. add_private_note
  async addPrivateNote(studentId: string, body: string): Promise<string> {
    const res = await supabase.rpc('add_private_note', {
      p_student_id: studentId,
      p_body: body,
    });
    return unwrap(res);
  },

  // 24. claim_social_badge
  async claimSocialBadge(): Promise<void> {
    const res = await supabase.rpc('claim_social_badge');
    return unwrap(res);
  },

  // 25. disable_my_push_devices
  async disableMyPushDevices(): Promise<void> {
    const res = await supabase.rpc('disable_my_push_devices');
    return unwrap(res);
  },

  // 26. register_push_device
  async registerPushDevice(token: string, platform: 'android' | 'ios' | 'web', version = '100.0.0'): Promise<void> {
    const res = await supabase.rpc('register_push_device', {
      p_token: token,
      p_platform: platform,
      p_version: version,
    });
    return unwrap(res);
  },

  // 27. admin_award_points (admin only)
  async adminAwardPoints(userId: string, points: number, reason?: string): Promise<{ success: boolean; new_balance?: number }> {
    const res = await supabase.rpc('admin_award_points', {
      p_user_id: userId,
      p_points: points,
      p_reason: reason || null,
    });
    return unwrap(res);
  },

  // 28. get_active_session (instructor/admin)
  async getActiveSession(batchId: string): Promise<{ id: string; checkin_code: string; title?: string } | null> {
    const res = await supabase.rpc('get_active_session', {
      p_batch_id: batchId,
    });
    return unwrap(res, null);
  },

  // 29. get_my_next_session (student)
  async getMyNextSession(): Promise<{
    session_id?: string;
    title?: string;
    course_title?: string;
    batch_name?: string;
    session_date?: string;
    location?: string;
    room?: string;
    meeting_url?: string;
  } | null> {
    const res = await supabase.rpc('get_my_next_session');
    return unwrap(res, null);
  },

  // 30. get_my_attendance (student)
  async getMyAttendance(): Promise<MyAttendanceItem[]> {
    try {
      const res = await supabase.rpc('get_my_attendance');
      return unwrap(res, []) || [];
    } catch (e) {
      return [];
    }
  },
};
