/**
 * Master Data Repositories with REST queries, storage uploads, and offline caching.
 */
import { supabase } from '../supabaseClient';
import { RPC, UserProfile } from '../rpc';
import { RTCSecureStorage } from '../../core/storage/secureStorage';

export interface Branch {
  id: string;
  slug: string;
  name_ar: string;
  name_en?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  facebook_url?: string;
  whatsapp?: string;
  hotline?: string;
  is_active: boolean;
  sort_order: number;
}

export interface Committee {
  id: string;
  name: string;
  description?: string;
  branch_id?: string;
  is_active: boolean;
  created_at?: string;
  branches?: { name_ar: string };
}

export type Profile = UserProfile;

export interface Course {
  id: string;
  title: string;
  category: string;
  icon?: string;
  color?: string;
  sessions_count: number;
  max_students?: number;
  description?: string;
  start_date?: string;
  interview_date?: string;
  level?: string;
  branch_id?: string;
  is_active: boolean;
  branches?: { name_ar: string; slug: string };
}

export interface Batch {
  id: string;
  course_id: string;
  instructor_id?: string;
  branch_id?: string;
  name: string;
  schedule?: string;
  starts_at?: string;
  ends_at?: string;
  timezone?: string;
  delivery_mode?: string;
  location?: string;
  room?: string;
  meeting_url?: string;
  sessions_done: number;
  is_active: boolean;
  courses?: Course;
  branches?: { name_ar: string; slug: string };
  profiles?: { full_name: string };
}

export interface Enrollment {
  id: string;
  student_id: string;
  batch_id: string;
  status: 'enrolled' | 'waitlist' | 'completed' | 'dropped';
  joined_at: string;
  batches?: Batch;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read_at?: string | null;
  created_at: string;
}

export interface CertItem {
  id: string;
  student_id: string;
  course_id: string;
  serial: string;
  issued_at: string;
  qr_code?: string;
  pdf_url?: string;
  courses?: { title: string; icon?: string; color?: string };
  profiles?: { full_name: string };
}

export interface PointsLedgerItem {
  id: string;
  student_id: string;
  points: number;
  rule_id?: string;
  notes?: string;
  created_at: string;
  points_rules?: { code: string; title: string };
}

export interface VolunteerCommittee {
  id: string;
  slug: string;
  name_ar: string;
  icon?: string;
  description?: string;
  roles?: string[];
  branch_id?: string;
  is_accepting: boolean;
  application_url?: string;
  source_url?: string;
  data_status?: string;
  is_active: boolean;
}

const PUBLIC_CACHE_PREFIX = 'rtc_cache_';

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await RTCSecureStorage.getItem(PUBLIC_CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data as T;
  } catch (e) {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await RTCSecureStorage.setItem(
      PUBLIC_CACHE_PREFIX + key,
      JSON.stringify({ savedAt: Date.now(), data })
    );
  } catch (e) {}
}

export const Repository = {
  // Branches
  async fetchBranches(force = false): Promise<Branch[]> {
    if (!force) {
      const cached = await readCache<Branch[]>('branches');
      if (cached && cached.length) return cached;
    }
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      const list = data || [];
      await writeCache('branches', list);
      return list;
    } catch (e) {
      const cached = await readCache<Branch[]>('branches');
      return cached || [];
    }
  },

  // Courses
  async fetchCourses(force = false, branchId?: string): Promise<Course[]> {
    if (!force && !branchId) {
      const cached = await readCache<Course[]>('courses');
      if (cached && cached.length) return cached;
    }
    try {
      let q = supabase
        .from('courses')
        .select('*, branches(name_ar, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (branchId) q = q.eq('branch_id', branchId);
      const { data, error } = await q;
      if (error) throw error;
      const list = data || [];
      if (!branchId) await writeCache('courses', list);
      return list;
    } catch (e) {
      if (!branchId) {
        const cached = await readCache<Course[]>('courses');
        if (cached) return cached;
      }
      return [];
    }
  },

  // Batches
  async fetchBatches(branchId?: string): Promise<Batch[]> {
    let q = supabase
      .from('batches')
      .select(
        '*, courses(id, title, category, icon, color, sessions_count, max_students, description, start_date, interview_date, level), branches(name_ar, slug), profiles!instructor_id(full_name)'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (branchId) q = q.eq('branch_id', branchId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  // Enrollments
  async fetchMyEnrollments(): Promise<Enrollment[]> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) return [];
    const { data, error } = await supabase
      .from('enrollments')
      .select(
        '*, batches(id, name, schedule, branch_id, sessions_done, starts_at, ends_at, timezone, delivery_mode, location, room, meeting_url, courses(id, title, category, icon, color, sessions_count, description), branches(name_ar))'
      )
      .eq('student_id', session.user.id)
      .order('joined_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Volunteer Batches
  async fetchMyBatches(): Promise<Batch[]> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) return [];
    const { data, error } = await supabase
      .from('batches')
      .select('*, courses(id, title, category, icon, color, sessions_count, max_students), branches(name_ar)')
      .eq('instructor_id', session.user.id)
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  // Notifications
  async fetchNotifications(): Promise<NotificationItem[]> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async markNotificationRead(id: string): Promise<void> {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  },

  // Certificates
  async fetchCerts(mineOnly = true): Promise<CertItem[]> {
    let q = supabase
      .from('certs')
      .select('*, courses(title, icon, color), profiles!student_id(full_name)')
      .order('issued_at', { ascending: false })
      .limit(80);
    if (mineOnly) {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) return [];
      q = q.eq('student_id', session.user.id);
    }
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  // Points Ledger
  async fetchLedger(): Promise<PointsLedgerItem[]> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) return [];
    const { data, error } = await supabase
      .from('points_ledger')
      .select('*, points_rules(code, title)')
      .eq('student_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  // Course Details
  async fetchCourseDetail(courseId: string) {
    const courseRes = await supabase.from('courses').select('*, branches(name_ar, slug)').eq('id', courseId).single();
    if (courseRes.error) throw courseRes.error;

    const batchesRes = await supabase
      .from('batches')
      .select('*, profiles!instructor_id(full_name), branches(name_ar)')
      .eq('course_id', courseId)
      .eq('is_active', true);

    const ratingsRes = await supabase
      .from('course_ratings')
      .select('rating, comment, created_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      course: courseRes.data as Course,
      batches: (batchesRes.data || []) as Batch[],
      ratings: ratingsRes.data || [],
    };
  },

  // Volunteer Committees
  async fetchCommittees(): Promise<VolunteerCommittee[]> {
    const { data, error } = await supabase
      .from('volunteer_committees')
      .select('*')
      .eq('is_active', true)
      .order('name_ar');
    if (error) throw error;
    return data || [];
  },

  // Analytics Bundle
  async fetchAnalyticsBundle(userProfile: UserProfile | null) {
    const isAdmin = userProfile?.role === 'admin';
    const isVolunteer = userProfile?.role === 'volunteer';

    const profilesPromise = isAdmin
      ? RPC.adminListProfiles()
      : supabase
          .from('profiles')
          .select('id, full_name, role, branch_id, points, created_at, status')
          .then((r) => r.data || []);

    let batchQuery = supabase
      .from('batches')
      .select('id, name, branch_id, sessions_done, schedule, is_active')
      .eq('is_active', true);
    if (isVolunteer && userProfile?.id) {
      batchQuery = batchQuery.eq('instructor_id', userProfile.id);
    }

    const [profs, courses, batches, certs, att, enroll] = await Promise.all([
      profilesPromise,
      supabase.from('courses').select('id, title, is_active').eq('is_active', true).then((r) => r.data || []),
      batchQuery.then((r) => r.data || []),
      supabase.from('certs').select('id').then((r) => r.data || []),
      supabase.from('attendance').select('id, status, created_at').then((r) => r.data || []),
      supabase.from('enrollments').select('id').then((r) => r.data || []),
    ]);

    return { profs, courses, batches, certs, att, enroll };
  },

  // Profile Update
  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) throw new Error('auth required');

    const allowed = {
      full_name: patch.full_name,
      phone: patch.phone,
      branch_id: patch.branch_id,
      avatar_url: patch.avatar_url,
      lang: patch.lang,
      dark_mode: patch.dark_mode,
    };

    const { error } = await supabase.from('profiles').update(allowed).eq('id', session.user.id);
    if (error) throw error;

    let updated = await RPC.getMyProfile();
    if (!updated) {
      await RPC.ensureMyProfile(allowed.full_name, allowed.phone, allowed.branch_id);
      updated = await RPC.getMyProfile();
    }
    if (!updated) throw new Error('profile-missing');
    return updated;
  },

  // Admin Users List
  async fetchUsers(search?: string): Promise<UserProfile[]> {
    let q = supabase
      .from('profiles')
      .select('*, branches(name_ar)')
      .order('created_at', { ascending: false });
    if (search) {
      q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as UserProfile[];
  },

  // Storage Upload Avatar
  async uploadAvatar(fileUri: string, mimeType = 'image/jpeg'): Promise<string> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) throw new Error('auth required');

    const path = `${session.user.id}/avatar.webp`;
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      upsert: true,
      contentType: 'image/webp',
    });
    if (error) throw error;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  },

  // Storage Upload Excuse Document
  async uploadExcuseFile(fileUri: string, extension = 'pdf', mimeType = 'application/pdf'): Promise<string> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) throw new Error('auth required');

    const path = `${session.user.id}/${Date.now()}.${extension}`;
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { error } = await supabase.storage.from('excuses').upload(path, blob, {
      upsert: false,
      contentType: mimeType,
    });
    if (error) throw error;
    return path;
  },

  // Admin CRUD for Courses & Batches
  async createCourse(payload: any) {
    const { data, error } = await supabase.from('courses').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateCourse(id: string, payload: any) {
    const { error } = await supabase.from('courses').update(payload).eq('id', id);
    if (error) throw error;
  },

  async softDeleteCourse(id: string) {
    const { error } = await supabase.from('courses').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  },

  // Excuses for Volunteer / Instructor Review
  async fetchExcuses(batchId?: string) {
    let q = supabase
      .from('excuses')
      .select('*, profiles(full_name, avatar_url, phone), sessions(title, session_date, batches(name))')
      .order('created_at', { ascending: false });
    if (batchId) {
      q = q.eq('session.batch_id', batchId);
    }
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  async createBatch(payload: any) {
    const { data, error } = await supabase.from('batches').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
};
