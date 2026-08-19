-- ═══════════════════════════════════════════════════════════════════
--  Masar RTC — Core Mission Fix (2026-08-19)
--  Makes the real student / volunteer / admin loop work:
--    join a course → scan QR → attendance is saved once →
--    student sees history & points → volunteer sees each student
--    → badges cannot be claimed twice.
--  Safe to re-run. Review in staging if column names differ.
-- ═══════════════════════════════════════════════════════════════════

-- 1) Columns used by the mobile client
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_name TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS sessions_count INT DEFAULT 8;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 30;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS sessions_done INT DEFAULT 0;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS meeting_url TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS checkin_code TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_date TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'present';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badge_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0;

UPDATE public.courses SET is_active = true WHERE is_active IS NULL;
UPDATE public.batches SET is_active = true WHERE is_active IS NULL;

-- 2) Uniqueness so scan / share cannot double-award
CREATE UNIQUE INDEX IF NOT EXISTS attendance_session_student_uidx
  ON public.attendance (session_id, student_id);
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_student_batch_uidx
  ON public.enrollments (student_id, batch_id);
CREATE INDEX IF NOT EXISTS sessions_open_code_idx
  ON public.sessions (checkin_code, is_open);
CREATE INDEX IF NOT EXISTS attendance_student_idx
  ON public.attendance (student_id, session_id);

-- 3) Drop old signatures so return types can change safely
DROP FUNCTION IF EXISTS public.student_check_in(text) CASCADE;
DROP FUNCTION IF EXISTS public.join_batch(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.claim_social_badge() CASCADE;
DROP FUNCTION IF EXISTS public.get_student_attendance(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.start_session(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_attendance() CASCADE;

-- 4) Join a group (idempotent)
CREATE OR REPLACE FUNCTION public.join_batch(p_batch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing text;
  v_capacity int;
  v_enrolled int;
  v_status text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'يلزم تسجيل الدخول';
  END IF;

  SELECT e.status INTO v_existing
  FROM public.enrollments e
  WHERE e.student_id = v_uid AND e.batch_id = p_batch_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'status', CASE WHEN v_existing = 'waitlist' THEN 'waitlist' ELSE 'enrolled' END,
      'already', true
    );
  END IF;

  SELECT COALESCE(b.capacity, 30) INTO v_capacity
  FROM public.batches b WHERE b.id = p_batch_id;

  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'المجموعة غير موجودة';
  END IF;

  SELECT COUNT(*) INTO v_enrolled
  FROM public.enrollments
  WHERE batch_id = p_batch_id AND status = 'enrolled';

  v_status := CASE WHEN v_enrolled >= v_capacity THEN 'waitlist' ELSE 'enrolled' END;

  INSERT INTO public.enrollments (student_id, batch_id, status)
  VALUES (v_uid, p_batch_id, v_status);

  UPDATE public.profiles
     SET badge_ids = CASE
           WHEN badge_ids IS NULL THEN ARRAY['firstCourse']
           WHEN NOT ('firstCourse' = ANY(badge_ids)) THEN array_append(badge_ids, 'firstCourse')
           ELSE badge_ids
         END
   WHERE id = v_uid;

  RETURN jsonb_build_object('success', true, 'status', v_status, 'already', false);
END;
$$;

-- 5) Student QR / code check-in (already-checked-in is SUCCESS, not an error)
CREATE OR REPLACE FUNCTION public.student_check_in(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text;
  v_session record;
  v_existing record;
  v_course text;
  v_instructor text;
  v_points int := 15;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'يلزم تسجيل الدخول';
  END IF;

  v_code := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  IF v_code IS NULL OR length(v_code) < 4 THEN
    RAISE EXCEPTION 'أدخل رمز الحضور أو امسح الرمز بالكاميرا';
  END IF;

  SELECT s.id, s.batch_id, s.title, s.checkin_code, s.is_open
    INTO v_session
  FROM public.sessions s
  WHERE upper(regexp_replace(coalesce(s.checkin_code, ''), '[^A-Za-z0-9]', '', 'g')) = v_code
    AND coalesce(s.is_open, false) = true
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'رمز الحضور غير صالح أو منتهي الصلاحية';
  END IF;

  SELECT c.title, p.full_name
    INTO v_course, v_instructor
  FROM public.batches b
  LEFT JOIN public.courses c ON c.id = b.course_id
  LEFT JOIN public.profiles p ON p.id = b.instructor_id
  WHERE b.id = v_session.batch_id;

  -- Auto-enroll if the student scanned a live lecture they have not joined yet
  INSERT INTO public.enrollments (student_id, batch_id, status)
  VALUES (v_uid, v_session.batch_id, 'enrolled')
  ON CONFLICT (student_id, batch_id) DO NOTHING;

  SELECT a.id, a.points, a.status
    INTO v_existing
  FROM public.attendance a
  WHERE a.session_id = v_session.id AND a.student_id = v_uid
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already', true,
      'points', 0,
      'message', 'تم تسجيل حضورك لهذه المحاضرة مسبقاً',
      'course_title', v_course,
      'instructor', v_instructor,
      'session_id', v_session.id,
      'batch_id', v_session.batch_id
    );
  END IF;

  INSERT INTO public.attendance (session_id, student_id, status, points)
  VALUES (v_session.id, v_uid, 'present', v_points);

  UPDATE public.profiles
     SET points = coalesce(points, 0) + v_points,
         streak = coalesce(streak, 0) + 1,
         badge_ids = CASE
           WHEN badge_ids IS NULL THEN ARRAY['firstAttend']
           WHEN NOT ('firstAttend' = ANY(badge_ids)) THEN array_append(badge_ids, 'firstAttend')
           ELSE badge_ids
         END,
         updated_at = now()
   WHERE id = v_uid;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'points_ledger') THEN
    INSERT INTO public.points_ledger (student_id, points, notes)
    VALUES (v_uid, v_points, coalesce('حضور: ' || v_session.title, 'حضور محاضرة'));
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already', false,
    'points', v_points,
    'message', 'تم تسجيل الحضور واحتساب نقاط المحاضرة',
    'course_title', v_course,
    'instructor', v_instructor,
    'session_id', v_session.id,
    'batch_id', v_session.batch_id
  );
END;
$$;

-- 6) Social badge — once per student
CREATE OR REPLACE FUNCTION public.claim_social_badge()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_badges text[];
  v_points int := 25;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'يلزم تسجيل الدخول';
  END IF;

  SELECT coalesce(badge_ids, ARRAY[]::text[]) INTO v_badges
  FROM public.profiles WHERE id = v_uid;

  IF v_badges IS NOT NULL AND 'social' = ANY(v_badges) THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true, 'points', 0);
  END IF;

  UPDATE public.profiles
     SET badge_ids = array_append(coalesce(badge_ids, ARRAY[]::text[]), 'social'),
         points = coalesce(points, 0) + v_points,
         updated_at = now()
   WHERE id = v_uid
     AND (badge_ids IS NULL OR NOT ('social' = ANY(badge_ids)));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true, 'points', 0);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'points_ledger') THEN
    INSERT INTO public.points_ledger (student_id, points, notes)
    VALUES (v_uid, v_points, 'شارة نجم سوشيال — مرة واحدة فقط');
  END IF;

  RETURN jsonb_build_object('success', true, 'already_claimed', false, 'points', v_points);
END;
$$;

-- 7) Student attendance history
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
    s.title,
    c.id,
    c.title,
    c.sessions_count,
    b.name,
    s.session_date,
    a.status,
    coalesce(a.points, 0)
  FROM public.attendance a
  JOIN public.sessions s ON s.id = a.session_id
  JOIN public.batches b ON b.id = s.batch_id
  JOIN public.courses c ON c.id = b.course_id
  WHERE a.student_id = auth.uid()
  ORDER BY s.session_date DESC NULLS LAST
  LIMIT 200;
END;
$$;

-- 8) Volunteer / admin: one student's record
CREATE OR REPLACE FUNCTION public.get_student_attendance(p_student_id uuid, p_batch_id uuid DEFAULT NULL)
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
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('volunteer', 'admin') AND status = 'active'
  ) AND auth.uid() IS DISTINCT FROM p_student_id THEN
    RAISE EXCEPTION 'صلاحية غير كافية';
  END IF;

  RETURN QUERY
  SELECT
    a.session_id,
    s.title,
    c.id,
    c.title,
    c.sessions_count,
    b.name,
    s.session_date,
    a.status,
    coalesce(a.points, 0)
  FROM public.attendance a
  JOIN public.sessions s ON s.id = a.session_id
  JOIN public.batches b ON b.id = s.batch_id
  JOIN public.courses c ON c.id = b.course_id
  WHERE a.student_id = p_student_id
    AND (p_batch_id IS NULL OR s.batch_id = p_batch_id)
  ORDER BY s.session_date DESC NULLS LAST
  LIMIT 200;
END;
$$;

-- 9) Start session — reuse an already-open session for the same batch
CREATE OR REPLACE FUNCTION public.start_session(p_batch_id uuid, p_title text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_open record;
  v_code text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'يلزم تسجيل الدخول';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.batches b
    WHERE b.id = p_batch_id
      AND (b.instructor_id = v_uid OR EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = v_uid AND p.role IN ('admin', 'volunteer')
      ))
  ) THEN
    RAISE EXCEPTION 'صلاحية غير كافية';
  END IF;

  SELECT s.id, s.checkin_code, s.title
    INTO v_open
  FROM public.sessions s
  WHERE s.batch_id = p_batch_id AND coalesce(s.is_open, false) = true
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_open.id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_open.id, 'checkin_code', v_open.checkin_code, 'title', coalesce(v_open.title, p_title));
  END IF;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  INSERT INTO public.sessions (batch_id, title, checkin_code, is_open, session_date)
  VALUES (p_batch_id, coalesce(nullif(p_title, ''), 'المحاضرة الحالية'), v_code, true, now())
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'checkin_code', v_code, 'title', coalesce(nullif(p_title, ''), 'المحاضرة الحالية'));
END;
$$;

-- 10) Visible courses/batches even when is_active is NULL
DROP POLICY IF EXISTS courses_read ON public.courses;
CREATE POLICY courses_read ON public.courses
  FOR SELECT TO authenticated, anon
  USING (is_active IS DISTINCT FROM false OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'volunteer')
  ));

DROP POLICY IF EXISTS batches_read ON public.batches;
CREATE POLICY batches_read ON public.batches
  FOR SELECT TO authenticated
  USING (is_active IS DISTINCT FROM false OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'volunteer')
  ));

-- Volunteers can insert / update the groups they run
DROP POLICY IF EXISTS batches_insert ON public.batches;
CREATE POLICY batches_insert ON public.batches
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'volunteer') AND p.status = 'active')
  );

DROP POLICY IF EXISTS batches_update ON public.batches;
CREATE POLICY batches_update ON public.batches
  FOR UPDATE TO authenticated
  USING (
    instructor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    instructor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Students can read their own attendance; staff can read their groups
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS attendance_read ON public.attendance;
CREATE POLICY attendance_read ON public.attendance
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'volunteer'))
  );

DROP POLICY IF EXISTS attendance_insert ON public.attendance;
CREATE POLICY attendance_insert ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'volunteer'))
  );

GRANT EXECUTE ON FUNCTION public.join_batch(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.student_check_in(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_social_badge() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_attendance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attendance(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_session(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
