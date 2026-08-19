/**
 * Core mission helpers — check-in, join, attendance, badges.
 * Works with the documented RPCs when they exist, and falls back to
 * direct table access so the student/volunteer/admin flows stay alive
 * even if a SQL function is missing or has a mismatched signature.
 */
import { supabase } from './supabaseClient';
import { t } from '../core/i18n';
import type { MyAttendanceItem } from './rpc';

export interface CheckInResult {
  success: boolean;
  already?: boolean;
  message: string;
  points: number;
  course_title?: string;
  instructor?: string;
  batch_id?: string;
  session_id?: string;
}

export interface JoinResult {
  success: boolean;
  status: 'enrolled' | 'waitlist';
  already?: boolean;
}

export interface SocialBadgeResult {
  success: boolean;
  already_claimed: boolean;
  points: number;
}

export interface ExtractedCode {
  code: string;
  meta: {
    courseTitle?: string;
    instructor?: string;
    sessionId?: string;
    batchId?: string;
    batchName?: string;
  } | null;
}

const ATTEND_POINTS = 15;
const SOCIAL_POINTS = 25;

export function extractCheckInCode(rawInput: string): ExtractedCode {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) return { code: '', meta: null };

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const code = String(parsed.code || parsed.checkin_code || parsed.checkinCode || '').trim();
      if (code) {
        return {
          code: normalizeCode(code),
          meta: {
            courseTitle: parsed.courseTitle || parsed.course_title,
            instructor: parsed.instructor,
            sessionId: parsed.sessionId || parsed.session_id,
            batchId: parsed.batchId || parsed.batch_id,
            batchName: parsed.batchName || parsed.batch_name,
          },
        };
      }
    } catch {
      // fall through
    }
  }

  const queryMatch = trimmed.match(/[?&#](?:code|checkin_code|c)=([^&]+)/i);
  if (queryMatch?.[1]) {
    return { code: normalizeCode(decodeURIComponent(queryMatch[1])), meta: null };
  }

  const pathMatch = trimmed.match(/(?:checkin|code)[/:]([A-Za-z0-9]{4,16})/i);
  if (pathMatch?.[1]) {
    return { code: normalizeCode(pathMatch[1]), meta: null };
  }

  return { code: normalizeCode(trimmed), meta: null };
}

export function normalizeCode(value: string): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function isAlreadyRecordedError(err: any): boolean {
  const msg = String(err?.message || err?.userMessage || err || '').toLowerCase();
  return (
    msg.includes('already') ||
    msg.includes('مسبق') ||
    msg.includes('مسجل') ||
    msg.includes('duplicate') ||
    msg.includes('unique') ||
    String(err?.code || '') === '23505'
  );
}

export function isMissingRpcError(err: any): boolean {
  const code = String(err?.code || '');
  const msg = String(err?.message || '');
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    msg.includes('Could not find the function') ||
    msg.includes('function') && msg.includes('does not exist')
  );
}

function generateCheckinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

export function normalizeCheckInPayload(raw: any, fallbackMessage: string): CheckInResult {
  let value = raw;
  if (Array.isArray(value)) value = value[0];
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return { success: true, message: value, points: ATTEND_POINTS };
    }
  }
  if (!value || typeof value !== 'object') {
    return { success: true, message: fallbackMessage, points: ATTEND_POINTS };
  }
  const already = !!(value.already || value.already_checked_in || value.duplicate);
  const points = Number(value.points ?? value.points_awarded ?? (already ? 0 : ATTEND_POINTS));
  return {
    success: value.success !== false,
    already,
    message: value.message || fallbackMessage,
    points: Number.isFinite(points) ? points : already ? 0 : ATTEND_POINTS,
    course_title: value.course_title || value.courseTitle,
    instructor: value.instructor,
    batch_id: value.batch_id || value.batchId,
    session_id: value.session_id || value.sessionId || value.id,
  };
}

export async function fallbackStudentCheckIn(code: string): Promise<CheckInResult> {
  const uid = await currentUserId();
  if (!uid) throw new Error(t('needLogin'));

  const clean = normalizeCode(code);
  if (!clean) throw new Error(t('emptyCodeWarn'));

  const sessionRes = await supabase
    .from('sessions')
    .select('id, batch_id, title, checkin_code, is_open, session_date, batches(id, name, instructor_id, courses(title), profiles:instructor_id(full_name))')
    .eq('checkin_code', clean)
    .eq('is_open', true)
    .order('created_at', { ascending: false })
    .limit(1);

  let session = sessionRes.data?.[0] as any;
  if (sessionRes.error || !session) {
    const alt = await supabase
      .from('sessions')
      .select('id, batch_id, title, checkin_code, is_open')
      .ilike('checkin_code', clean)
      .limit(3);
    session = (alt.data || []).find((s: any) => s.is_open !== false) || alt.data?.[0];
  }

  if (!session?.id) {
    throw new Error(t('invalidCodeError'));
  }

  const batchId = session.batch_id;
  if (batchId) {
    const enrolled = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', uid)
      .eq('batch_id', batchId)
      .maybeSingle();

    if (!enrolled.data) {
      await supabase.from('enrollments').insert({
        student_id: uid,
        batch_id: batchId,
        status: 'enrolled',
      });
    }
  }

  const existing = await supabase
    .from('attendance')
    .select('id, points, status')
    .eq('session_id', session.id)
    .eq('student_id', uid)
    .maybeSingle();

  const courseTitle =
    session.batches?.courses?.title ||
    session.title ||
    undefined;
  const instructor = session.batches?.profiles?.full_name;

  if (existing.data) {
    return {
      success: true,
      already: true,
      message: t('checkInAlready'),
      points: 0,
      course_title: courseTitle,
      instructor,
      batch_id: batchId,
      session_id: session.id,
    };
  }

  const insert = await supabase.from('attendance').insert({
    session_id: session.id,
    student_id: uid,
    status: 'present',
    points: ATTEND_POINTS,
  });

  if (insert.error) {
    if (isAlreadyRecordedError(insert.error)) {
      return {
        success: true,
        already: true,
        message: t('checkInAlready'),
        points: 0,
        course_title: courseTitle,
        instructor,
        batch_id: batchId,
        session_id: session.id,
      };
    }
    throw insert.error;
  }

  await awardAttendancePoints(uid, ATTEND_POINTS, session.title || courseTitle || 'محاضرة');

  return {
    success: true,
    already: false,
    message: t('checkInSuccessDefault'),
    points: ATTEND_POINTS,
    course_title: courseTitle,
    instructor,
    batch_id: batchId,
    session_id: session.id,
  };
}

async function awardAttendancePoints(userId: string, points: number, note: string) {
  try {
    const { data } = await supabase.from('profiles').select('points, streak, badge_ids').eq('id', userId).maybeSingle();
    const nextPoints = (Number(data?.points) || 0) + points;
    const nextStreak = (Number(data?.streak) || 0) + 1;
    const badges = Array.isArray(data?.badge_ids) ? [...data.badge_ids] : [];
    if (!badges.includes('firstAttend')) badges.push('firstAttend');
    await supabase
      .from('profiles')
      .update({ points: nextPoints, streak: nextStreak, badge_ids: badges, updated_at: new Date().toISOString() })
      .eq('id', userId);
  } catch {
    // non-fatal
  }
  try {
    await supabase.from('points_ledger').insert({
      student_id: userId,
      points,
      notes: `حضور: ${note}`,
    });
  } catch {
    // ledger optional
  }
}

export async function fallbackJoinBatch(batchId: string): Promise<JoinResult> {
  const uid = await currentUserId();
  if (!uid) throw new Error(t('needLogin'));

  const existing = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('student_id', uid)
    .eq('batch_id', batchId)
    .maybeSingle();

  if (existing.data) {
    const status = existing.data.status === 'waitlist' ? 'waitlist' : 'enrolled';
    return { success: true, status, already: true };
  }

  let capacity = 30;
  try {
    const batch = await supabase.from('batches').select('id, capacity, is_active').eq('id', batchId).maybeSingle();
    if (batch.data?.capacity) capacity = Number(batch.data.capacity) || 30;
  } catch {
    // default capacity
  }

  let enrolledCount = 0;
  try {
    const counts = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id', batchId)
      .eq('status', 'enrolled');
    enrolledCount = counts.count || 0;
  } catch {
    enrolledCount = 0;
  }

  const status: 'enrolled' | 'waitlist' = enrolledCount >= capacity ? 'waitlist' : 'enrolled';
  const inserted = await supabase.from('enrollments').insert({
    student_id: uid,
    batch_id: batchId,
    status,
  });

  if (inserted.error) {
    if (isAlreadyRecordedError(inserted.error)) {
      return { success: true, status: 'enrolled', already: true };
    }
    throw inserted.error;
  }

  try {
    const { data } = await supabase.from('profiles').select('badge_ids').eq('id', uid).maybeSingle();
    const badges = Array.isArray(data?.badge_ids) ? [...data.badge_ids] : [];
    if (!badges.includes('firstCourse')) {
      badges.push('firstCourse');
      await supabase.from('profiles').update({ badge_ids: badges }).eq('id', uid);
    }
  } catch {
    // optional
  }

  return { success: true, status };
}

export async function fallbackMyAttendance(): Promise<MyAttendanceItem[]> {
  const uid = await currentUserId();
  if (!uid) return [];

  const rich = await supabase
    .from('attendance')
    .select(
      'session_id, status, points, sessions(id, title, session_date, batch_id, batches(id, name, course_id, courses(id, title, sessions_count)))'
    )
    .eq('student_id', uid)
    .order('created_at', { ascending: false })
    .limit(200);

  if (!rich.error && rich.data) {
    return (rich.data as any[]).map(mapAttendanceRow);
  }

  const simple = await supabase
    .from('attendance')
    .select('session_id, status, points, created_at')
    .eq('student_id', uid)
    .order('created_at', { ascending: false })
    .limit(200);

  if (simple.error) throw simple.error;
  return (simple.data || []).map((row: any) => ({
    session_id: row.session_id,
    status: row.status || 'present',
    points: Number(row.points) || 0,
    session_date: row.created_at,
  }));
}

export async function fallbackStudentAttendance(studentId: string, batchId?: string): Promise<MyAttendanceItem[]> {
  let query = supabase
    .from('attendance')
    .select(
      'session_id, status, points, student_id, sessions(id, title, session_date, batch_id, batches(id, name, course_id, courses(id, title, sessions_count)))'
    )
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(200);

  const { data, error } = await query;
  if (error) throw error;

  const mapped = (data || []).map(mapAttendanceRow);
  if (!batchId) return mapped;
  return mapped.filter((row: any) => {
    const raw = ((data || []) as any[]).find((d: any) => d.session_id === row.session_id);
    const session = Array.isArray(raw?.sessions) ? raw.sessions[0] : raw?.sessions;
    return !session?.batch_id || session.batch_id === batchId;
  });
}

function mapAttendanceRow(row: any): MyAttendanceItem {
  const sessionRaw = row.sessions;
  const session = Array.isArray(sessionRaw) ? sessionRaw[0] || {} : sessionRaw || {};
  const batchRaw = session.batches;
  const batch = Array.isArray(batchRaw) ? batchRaw[0] || {} : batchRaw || {};
  const courseRaw = batch.courses;
  const course = Array.isArray(courseRaw) ? courseRaw[0] || {} : courseRaw || {};
  return {
    session_id: row.session_id || session.id,
    session_title: session.title,
    course_id: course.id || batch.course_id,
    course_title: course.title,
    course_sessions_count: course.sessions_count,
    batch_name: batch.name,
    session_date: session.session_date,
    status: row.status || 'present',
    points: Number(row.points) || 0,
    points_awarded: Number(row.points) || 0,
  };
}

export async function fallbackClaimSocialBadge(): Promise<SocialBadgeResult> {
  const uid = await currentUserId();
  if (!uid) throw new Error(t('needLogin'));

  const { data, error } = await supabase
    .from('profiles')
    .select('points, badge_ids')
    .eq('id', uid)
    .maybeSingle();
  if (error) throw error;

  const badges: string[] = Array.isArray(data?.badge_ids) ? [...data!.badge_ids] : [];
  if (badges.includes('social')) {
    return { success: true, already_claimed: true, points: 0 };
  }

  badges.push('social');
  const nextPoints = (Number(data?.points) || 0) + SOCIAL_POINTS;
  const updated = await supabase
    .from('profiles')
    .update({ badge_ids: badges, points: nextPoints, updated_at: new Date().toISOString() })
    .eq('id', uid);
  if (updated.error) throw updated.error;

  try {
    await supabase.from('points_ledger').insert({
      student_id: uid,
      points: SOCIAL_POINTS,
      notes: 'شارة نجم سوشيال — مرة واحدة فقط',
    });
  } catch {
    // optional
  }

  return { success: true, already_claimed: false, points: SOCIAL_POINTS };
}

export async function fallbackStartSession(batchId: string, title?: string | null) {
  const uid = await currentUserId();
  if (!uid) throw new Error(t('needLogin'));

  const existing = await supabase
    .from('sessions')
    .select('id, checkin_code, title')
    .eq('batch_id', batchId)
    .eq('is_open', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    return {
      id: existing.data.id,
      checkin_code: existing.data.checkin_code,
      title: existing.data.title || title || t('currentLecture'),
    };
  }

  const code = generateCheckinCode();
  const inserted = await supabase
    .from('sessions')
    .insert({
      batch_id: batchId,
      title: title || t('currentLecture'),
      checkin_code: code,
      is_open: true,
      session_date: new Date().toISOString(),
    })
    .select('id, checkin_code, title')
    .single();

  if (inserted.error || !inserted.data) throw inserted.error || new Error(t('sessionStartError'));
  return inserted.data;
}

export async function fallbackGetActiveSession(batchId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, checkin_code, title')
    .eq('batch_id', batchId)
    .eq('is_open', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fallbackBatchRoster(batchId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id, student_id, status, profiles:student_id(id, full_name, avatar_url, phone, points, streak)')
    .eq('batch_id', batchId)
    .in('status', ['enrolled', 'waitlist', 'completed']);
  if (error) throw error;

  const students = (data || []).map((row: any) => {
    const p = row.profiles || {};
    return {
      enrollment_id: row.id,
      student_id: row.student_id || p.id,
      full_name: p.full_name || t('veStudent'),
      avatar_url: p.avatar_url,
      phone: p.phone,
      points: Number(p.points) || 0,
      streak: Number(p.streak) || 0,
      attendance_pct: 0,
      sessions_done: 0,
    };
  });

  try {
    const ids = students.map((s) => s.student_id).filter(Boolean);
    if (!ids.length) return students;
    const att = await supabase
      .from('attendance')
      .select('student_id, status, sessions!inner(batch_id)')
      .in('student_id', ids)
      .eq('sessions.batch_id', batchId);
    const byStudent: Record<string, { done: number; committed: number }> = {};
    (att.data || []).forEach((row: any) => {
      const sid = row.student_id;
      if (!byStudent[sid]) byStudent[sid] = { done: 0, committed: 0 };
      byStudent[sid].done += 1;
      if (row.status === 'present' || row.status === 'late') byStudent[sid].committed += 1;
    });
    return students.map((s) => {
      const stats = byStudent[s.student_id];
      const pct = stats?.done ? Math.round((stats.committed / stats.done) * 100) : 0;
      return { ...s, attendance_pct: pct, sessions_done: stats?.committed || 0 };
    });
  } catch {
    return students;
  }
}

export async function fallbackUserDetail(userId: string) {
  const profileRes = await supabase
    .from('profiles')
    .select('*, branches(name_ar, city, slug)')
    .eq('id', userId)
    .maybeSingle();
  if (profileRes.error) throw profileRes.error;

  const [enrollRes, attRes, ledgerRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id, status, joined_at, batch_id, batches(id, name, schedule, courses(id, title, sessions_count))')
      .eq('student_id', userId)
      .order('joined_at', { ascending: false }),
    supabase
      .from('attendance')
      .select('session_id, status, points, sessions(title, session_date, batches(name, courses(title)))')
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('points_ledger')
      .select('id, points, notes, created_at')
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .limit(40),
  ]);

  return {
    profile: profileRes.data
      ? { ...profileRes.data, branch_name: (profileRes.data as any).branches?.name_ar }
      : null,
    enrollments: enrollRes.data || [],
    attendance: attRes.data || [],
    ledger: ledgerRes.data || [],
  };
}
