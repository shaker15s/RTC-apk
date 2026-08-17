-- ═══════════════════════════════════════════════════════════════════
--  Masar RTC — Master Database Migration (v100.5.0 Apple-Grade Upgrade)
--  Fixes all function return signatures, RLS policies, RBAC roles,
--  and table columns safely with explicit CASCADE drops.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Explicitly DROP all old functions to prevent return type collision errors
DROP FUNCTION IF EXISTS public.admin_award_points(uuid, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_award_points(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.change_user_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.set_user_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_list_profiles() CASCADE;
DROP FUNCTION IF EXISTS public.get_active_session(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_next_session() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_attendance() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_staff() CASCADE;
DROP FUNCTION IF EXISTS public.write_audit(text, text, text, jsonb) CASCADE;

-- 2. Add columns if missing (Idempotent)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_name TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 30;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS sessions_done INT DEFAULT 0;
ALTER TABLE public.course_ratings ADD COLUMN IF NOT EXISTS instructor_rating INT DEFAULT 5;
ALTER TABLE public.course_ratings ADD COLUMN IF NOT EXISTS org_rating INT DEFAULT 5;
ALTER TABLE public.course_ratings ADD COLUMN IF NOT EXISTS venue_rating INT DEFAULT 5;

-- 3. Create Security Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'volunteer') AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.write_audit(
  p_action text,
  p_target_table text,
  p_target_id text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    INSERT INTO public.audit_logs (user_id, action, target_table, target_id, payload, created_at)
    VALUES (auth.uid(), p_action, p_target_table, p_target_id, p_payload, now());
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 4. Create Master RPC Functions

-- A) Admin List Profiles
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'صلاحية غير كافية: المشرفون فقط';
  END IF;
  RETURN QUERY
  SELECT * FROM public.profiles
  ORDER BY created_at DESC;
END;
$$;

-- B) Change User Role (Admin only)
CREATE OR REPLACE FUNCTION public.change_user_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'صلاحية غير كافية: المشرفون فقط';
  END IF;

  IF p_role NOT IN ('student', 'volunteer', 'admin') THEN
    RAISE EXCEPTION 'نوع الصلاحية غير صالح: %', p_role;
  END IF;

  UPDATE public.profiles
     SET role = p_role,
         updated_at = now()
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;

  PERFORM public.write_audit('change_role', 'profiles', p_user_id::text, jsonb_build_object('role', p_role));
END;
$$;

-- C) Admin Award Points (Admin only)
CREATE OR REPLACE FUNCTION public.admin_award_points(
  p_user_id uuid,
  p_points integer,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'صلاحية غير كافية: المشرفون فقط';
  END IF;

  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'عدد النقاط يجب أن يكون أكبر من الصفر';
  END IF;

  UPDATE public.profiles
     SET points = COALESCE(points, 0) + p_points,
         updated_at = now()
   WHERE id = p_user_id
  RETURNING points INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;

  -- Notify user in app
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      p_user_id,
      'مكافأة نقاط تميز ⭐',
      COALESCE(p_reason, 'حصلت على ' || p_points || ' نقطة إضافية من إدارة المركز!'),
      'success'
    );
  END IF;

  -- Record in points_ledger if present
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'points_ledger') THEN
    INSERT INTO public.points_ledger (student_id, points, notes)
    VALUES (
      p_user_id,
      p_points,
      COALESCE(p_reason, 'منحة يدوية من الإدارة')
    );
  END IF;

  PERFORM public.write_audit('award_points', 'profiles', p_user_id::text, jsonb_build_object('points', p_points, 'reason', p_reason));

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- D) Get Active Session (Instructor / Admin)
CREATE OR REPLACE FUNCTION public.get_active_session(p_batch_id uuid)
RETURNS TABLE (
  id uuid,
  checkin_code text,
  title text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.batches b
    WHERE b.id = p_batch_id AND b.instructor_id = auth.uid()
  )) THEN
    RAISE EXCEPTION 'صلاحية غير كافية';
  END IF;

  RETURN QUERY
  SELECT s.id, s.checkin_code, COALESCE(s.title, 'المحاضرة الحالية')
  FROM public.sessions s
  WHERE s.batch_id = p_batch_id
    AND s.is_open = true
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- E) Get My Next Session (Student)
CREATE OR REPLACE FUNCTION public.get_my_next_session()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
BEGIN
  SELECT jsonb_build_object(
    'session_id', s.id,
    'title', COALESCE(s.title, c.title),
    'course_title', c.title,
    'batch_name', b.name,
    'session_date', s.session_date,
    'location', COALESCE(b.location, ''),
    'room', COALESCE(b.room, ''),
    'meeting_url', COALESCE(b.meeting_url, '')
  )
  INTO v_row
  FROM public.sessions s
  JOIN public.enrollments e ON e.batch_id = s.batch_id AND e.student_id = auth.uid() AND e.status = 'enrolled'
  JOIN public.batches b ON b.id = s.batch_id
  JOIN public.courses c ON c.id = b.course_id
  WHERE s.session_date >= (now() - interval '2 hours')
  ORDER BY s.session_date ASC
  LIMIT 1;

  RETURN COALESCE(v_row, 'null'::jsonb);
END;
$$;

-- F) Get My Attendance History with Course Sessions (Student)
CREATE OR REPLACE FUNCTION public.get_my_attendance()
RETURNS TABLE (
  session_id uuid,
  session_title text,
  course_id uuid,
  course_title text,
  course_sessions_count integer,
  batch_name text,
  session_date timestamptz,
  status text,
  points integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.session_id,
    s.title AS session_title,
    c.id AS course_id,
    c.title AS course_title,
    c.sessions_count AS course_sessions_count,
    b.name AS batch_name,
    s.session_date,
    a.status,
    COALESCE(a.points, 0) AS points
  FROM public.attendance a
  JOIN public.sessions s ON s.id = a.session_id
  JOIN public.batches b ON b.id = s.batch_id
  JOIN public.courses c ON c.id = b.course_id
  WHERE a.student_id = auth.uid()
  ORDER BY s.session_date DESC
  LIMIT 200;
END;
$$;

-- 5. Grant Permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_award_points(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_next_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_attendance() TO authenticated;

-- 6. Enable RLS and Configure Master Policies
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS profiles_read ON public.profiles;
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Courses Policies
DROP POLICY IF EXISTS courses_read ON public.courses;
DROP POLICY IF EXISTS courses_admin_ins ON public.courses;
DROP POLICY IF EXISTS courses_admin_upd ON public.courses;
DROP POLICY IF EXISTS courses_admin_del ON public.courses;
CREATE POLICY courses_read ON public.courses FOR SELECT TO authenticated, anon USING (is_active = true OR public.is_staff());
CREATE POLICY courses_admin_ins ON public.courses FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY courses_admin_upd ON public.courses FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY courses_admin_del ON public.courses FOR DELETE TO authenticated USING (public.is_admin());

-- Batches Policies
DROP POLICY IF EXISTS batches_read ON public.batches;
DROP POLICY IF EXISTS batches_insert ON public.batches;
DROP POLICY IF EXISTS batches_update ON public.batches;
DROP POLICY IF EXISTS batches_delete ON public.batches;
CREATE POLICY batches_read ON public.batches FOR SELECT TO authenticated USING (is_active = true OR public.is_staff());
CREATE POLICY batches_insert ON public.batches FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY batches_update ON public.batches FOR UPDATE TO authenticated USING (public.is_admin() OR instructor_id = auth.uid()) WITH CHECK (public.is_admin() OR instructor_id = auth.uid());
CREATE POLICY batches_delete ON public.batches FOR DELETE TO authenticated USING (public.is_admin());

-- Enrollments Policies
DROP POLICY IF EXISTS enrollments_read ON public.enrollments;
DROP POLICY IF EXISTS enrollments_insert ON public.enrollments;
DROP POLICY IF EXISTS enrollments_update ON public.enrollments;
CREATE POLICY enrollments_read ON public.enrollments FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_staff());
CREATE POLICY enrollments_insert ON public.enrollments FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() OR public.is_staff());
CREATE POLICY enrollments_update ON public.enrollments FOR UPDATE TO authenticated USING (student_id = auth.uid() OR public.is_staff());

-- Course Ratings Policies
DROP POLICY IF EXISTS ratings_read ON public.course_ratings;
DROP POLICY IF EXISTS ratings_insert ON public.course_ratings;
DROP POLICY IF EXISTS ratings_update ON public.course_ratings;
CREATE POLICY ratings_read ON public.course_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY ratings_insert ON public.course_ratings FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY ratings_update ON public.course_ratings FOR UPDATE TO authenticated USING (student_id = auth.uid());

-- Force PostgREST to reload the schema cache immediately
NOTIFY pgrst, 'reload schema';
