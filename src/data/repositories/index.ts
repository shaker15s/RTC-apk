/**
 * Master Data Repositories with REST queries, storage uploads, and offline caching.
 */
import { supabase } from '../supabaseClient';
import { t } from '../../core/i18n';
import { RPC, UserProfile } from '../rpc';
import { mapSupabaseError, Result, AppError } from '../result';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

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
  instructor_name?: string;
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
  capacity?: number;
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

// Public data cache lives in AsyncStorage, NOT SecureStore (fixes SEC-3):
// public rows don't need hardware encryption, SecureStore is limited/slow,
// and iOS Keychain can outlive an app uninstall.
async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PUBLIC_CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data as T;
  } catch (e) {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PUBLIC_CACHE_PREFIX + key,
      JSON.stringify({ savedAt: Date.now(), data })
    );
  } catch (e) {}
}

// Clears ALL public cache entries — called on sign-out / reset.
async function clearPublicCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k: string) => k.startsWith(PUBLIC_CACHE_PREFIX));
    if (cacheKeys.length) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (e) {}
}

export const Repository = {
  // Cache management (exposed for sign-out cleanup — SEC-3)
  clearPublicCache,

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
      if (error) throw mapSupabaseError(error);
      const list = data || [];
      if (list.length) await writeCache('branches', list);
      return list;
    } catch (e) {
      const cached = await readCache<Branch[]>('branches');
      if (cached && cached.length) return cached;
      throw mapSupabaseError(e);
    }
  },

  async safeFetchBranches(force = false): Promise<Result<Branch[]>> {
    try {
      const data = await Repository.fetchBranches(force);
      return Result.ok(data);
    } catch (err: any) {
      return Result.err(mapSupabaseError(err));
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
        .or('is_active.eq.true,is_active.is.null')
        .order('created_at', { ascending: false });
      if (branchId) q = q.eq('branch_id', branchId);
      const { data, error } = await q;
      if (error) throw mapSupabaseError(error);
      const list = data || [];
      if (!branchId && list.length) await writeCache('courses', list);
      return list;
    } catch (e) {
      if (!branchId) {
        const cached = await readCache<Course[]>('courses');
        if (cached && cached.length) return cached;
      }
      throw mapSupabaseError(e);
    }
  },

  async safeFetchCourses(force = false, branchId?: string): Promise<Result<Course[]>> {
    try {
      const data = await Repository.fetchCourses(force, branchId);
      return Result.ok(data);
    } catch (err: any) {
      return Result.err(mapSupabaseError(err));
    }
  },

  // Batches
  async fetchBatches(branchId?: string): Promise<Batch[]> {
    try {
      let q = supabase
        .from('batches')
        .select(
          '*, courses(id, title, category, icon, color, sessions_count, max_students, description, start_date, interview_date, level), branches(name_ar, slug), profiles!instructor_id(full_name)'
        )
        .or('is_active.eq.true,is_active.is.null')
        .order('created_at', { ascending: false });
      if (branchId) q = q.eq('branch_id', branchId);
      const { data, error } = await q;
      if (error) throw mapSupabaseError(error);
      return data || [];
    } catch (e) {
      throw mapSupabaseError(e);
    }
  },

  async safeFetchBatches(branchId?: string): Promise<Result<Batch[]>> {
    try {
      const data = await Repository.fetchBatches(branchId);
      return Result.ok(data);
    } catch (err: any) {
      return Result.err(mapSupabaseError(err));
    }
  },

  // Enrollments
  async fetchMyEnrollments(): Promise<Enrollment[]> {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) return [];
      const { data, error } = await supabase
        .from('enrollments')
        .select(
          '*, batches(id, name, schedule, branch_id, sessions_done, starts_at, ends_at, timezone, delivery_mode, location, room, meeting_url, courses(id, title, category, icon, color, sessions_count, description), branches(name_ar))'
        )
        .eq('student_id', session.user.id)
        .order('joined_at', { ascending: false });
      if (error) throw mapSupabaseError(error);
      return data || [];
    } catch (e) {
      throw mapSupabaseError(e);
    }
  },

  async safeFetchMyEnrollments(): Promise<Result<Enrollment[]>> {
    try {
      const data = await Repository.fetchMyEnrollments();
      return Result.ok(data);
    } catch (err: any) {
      return Result.err(mapSupabaseError(err));
    }
  },

  // Volunteer Batches
  async fetchMyBatches(): Promise<Batch[]> {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) return [];
      const { data, error } = await supabase
        .from('batches')
        .select('*, courses(id, title, category, icon, color, sessions_count, max_students), branches(name_ar)')
        .eq('instructor_id', session.user.id)
        .or('is_active.eq.true,is_active.is.null');
      if (error) throw mapSupabaseError(error);
      return data || [];
    } catch (e) {
      throw mapSupabaseError(e);
    }
  },

  async safeFetchMyBatches(): Promise<Result<Batch[]>> {
    try {
      const data = await Repository.fetchMyBatches();
      return Result.ok(data);
    } catch (err: any) {
      return Result.err(mapSupabaseError(err));
    }
  },

  // Notifications
  async fetchNotifications(): Promise<NotificationItem[]> {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw mapSupabaseError(error);
      return data || [];
    } catch (e) {
      throw mapSupabaseError(e);
    }
  },

  async safeFetchNotifications(): Promise<Result<NotificationItem[]>> {
    try {
      const data = await Repository.fetchNotifications();
      return Result.ok(data);
    } catch (err: any) {
      return Result.err(mapSupabaseError(err));
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    } catch (e) {}
  },

  // Certificates
  async fetchCerts(mineOnly = true): Promise<CertItem[]> {
    try {
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
      if (error) throw mapSupabaseError(error);
      return data || [];
    } catch (e) {
      throw mapSupabaseError(e);
    }
  },

  async safeFetchCerts(mineOnly = true): Promise<Result<CertItem[]>> {
    try {
      const data = await Repository.fetchCerts(mineOnly);
      return Result.ok(data);
    } catch (err: any) {
      return Result.err(mapSupabaseError(err));
    }
  },

  // Points Ledger
  async fetchLedger(): Promise<PointsLedgerItem[]> {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) return [];
      const { data, error } = await supabase
        .from('points_ledger')
        .select('*, points_rules(code, title)')
        .eq('student_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw mapSupabaseError(error);
      return data || [];
    } catch (e) {
      throw mapSupabaseError(e);
    }
  },

  async safeFetchLedger(): Promise<Result<PointsLedgerItem[]>> {
    try {
      const data = await Repository.fetchLedger();
      return Result.ok(data);
    } catch (err: any) {
      return Result.err(mapSupabaseError(err));
    }
  },

  // Course Details
  async fetchCourseDetail(courseId: string) {
    const courseRes = await supabase.from('courses').select('*, branches(name_ar, slug)').eq('id', courseId).single();
    if (courseRes.error) throw courseRes.error;

    const batchesRes = await supabase
      .from('batches')
      .select('*, profiles!instructor_id(full_name), branches(name_ar)')
      .eq('course_id', courseId)
      .or('is_active.eq.true,is_active.is.null');

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
    const isVolunteer = userProfile?.role === 'volunteer';

    try {
      let profs: any[] = [];
      try {
        profs = (await RPC.adminListProfiles()) || [];
      } catch (e) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, role, branch_id, points, created_at, status');
        profs = data || [];
      }

      let batchQuery = supabase
        .from('batches')
        .select('id, name, branch_id, sessions_done, schedule, is_active, instructor_id')
        .eq('is_active', true);
      if (isVolunteer && userProfile?.id) {
        batchQuery = batchQuery.eq('instructor_id', userProfile.id);
      }

      const [coursesRes, batchesRes, certsRes, attRes, enrollRes] = await Promise.all([
        supabase.from('courses').select('id, title, is_active').eq('is_active', true),
        batchQuery,
        supabase.from('certs').select('id, student_id, course_id, issued_at'),
        supabase.from('attendance').select('id, status, created_at, student_id, session_id'),
        supabase.from('enrollments').select('id, student_id, batch_id, status'),
      ]);

      const courses = coursesRes.data || [];
      const batches = batchesRes.data || [];
      const certs = certsRes.data || [];
      const att = attRes.data || [];
      const enroll = enrollRes.data || [];

      return { profs, courses, batches, certs, att, enroll };
    } catch (e) {
      throw mapSupabaseError(e);
    }
  },

  // Profile Update
  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) throw mapSupabaseError(new Error('auth required'));

    const allowed = {
      full_name: patch.full_name,
      phone: patch.phone,
      branch_id: patch.branch_id,
      avatar_url: patch.avatar_url,
      lang: patch.lang,
      dark_mode: patch.dark_mode,
    };

    const { error } = await supabase.from('profiles').update(allowed).eq('id', session.user.id);
    if (error) throw mapSupabaseError(error);

    let updated = await RPC.getMyProfile();
    if (!updated) {
      await RPC.ensureMyProfile(allowed.full_name, allowed.phone, allowed.branch_id);
      updated = await RPC.getMyProfile();
    }
    if (!updated) throw mapSupabaseError(new Error('profile-missing'));
    return updated;
  },

  // Admin Users List with sanitized query and graceful fallback
  async fetchUsers(search?: string): Promise<UserProfile[]> {
    let allUsers: UserProfile[] = [];
    try {
      allUsers = (await RPC.adminListProfiles()) || [];
    } catch (e) {
      // Fallback: If adminListProfiles fails (e.g. role check in transit), query profiles directly
      const { data } = await supabase
        .from('profiles')
        .select('*, branches(name_ar)')
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        allUsers = data.map((p: any) => ({
          ...p,
          branch_name: p.branches?.name_ar || '',
        })) as UserProfile[];
      }
    }
    if (search) {
      const sanitized = search.replace(/[,.()%*]/g, '').trim().toLowerCase();
      if (sanitized.length > 0) {
        allUsers = allUsers.filter(u => 
          (u.full_name?.toLowerCase().includes(sanitized)) ||
          (u.phone?.includes(sanitized)) ||
          (u.email?.toLowerCase().includes(sanitized))
        );
      }
    }
    return allUsers;
  },

  // Storage Upload Avatar
  async uploadAvatar(fileUri: string, mimeType = 'image/jpeg'): Promise<string> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) throw new Error('auth required');

    // Size guard: max 5MB (fixes SEC-6)
    try {
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists && info.size && info.size > 5 * 1024 * 1024) {
        throw new Error(t('avatarSizeError'));
      }
    } catch (e: any) {
      if (e?.message?.includes('MB') || e?.message?.includes('ميجابايت')) throw e;
    }

    // Keep the real extension/mime instead of force-labelling everything
    // as webp (fixes the same class of bug as P1-6).
    const ext = (mimeType || '').includes('png') ? 'png' : 'jpg';
    const path = `${session.user.id}/avatar.${ext}`;
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      upsert: true,
      contentType: mimeType || 'image/jpeg',
    });
    if (error) throw error;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  },

  // Storage Upload Excuse Document
  async uploadExcuseFile(
    fileUri: string,
    extension = 'pdf',
    mimeType = 'application/pdf'
  ): Promise<string> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) throw new Error('auth required');

    // Whitelist + size guard (fixes P1-6 & SEC-6)
    const ext = String(extension || '').toLowerCase().replace('.', '');
    const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    if (!ALLOWED_EXT.includes(ext)) {
      throw new Error(t('fileTypeError'));
    }

    try {
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists && info.size && info.size > 8 * 1024 * 1024) {
        throw new Error(t('fileSizeError'));
      }
    } catch (e: any) {
      if (e?.message?.includes('MB') || e?.message?.includes('ميجابايت')) throw e;
    }

    const path = `${session.user.id}/${Date.now()}.${ext}`;
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { error } = await supabase.storage.from('excuses').upload(path, blob, {
      upsert: false,
      contentType: mimeType || 'application/pdf',
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
      .select('*, profiles(full_name, avatar_url, phone), batches(name), sessions(title, session_date)')
      .order('created_at', { ascending: false });
    if (batchId) {
      q = q.eq('batch_id', batchId);
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

  async updateBatch(id: string, payload: any) {
    const { data, error } = await supabase.from('batches').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async fetchUserDetail(userId: string) {
    const { fallbackUserDetail } = await import('../coreFlow');
    return fallbackUserDetail(userId);
  },
};
