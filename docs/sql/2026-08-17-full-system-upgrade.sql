-- ═══════════════════════════════════════════════════════════════════
--  Masar RTC — Full System & Admin Upgrade Migration (v100.5.0)
--  Fixes RLS policies for batches, courses, ratings, and role management.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Enable RLS on core tables (idempotent)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excuses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies on batches
DROP POLICY IF EXISTS batches_read ON public.batches;
DROP POLICY IF EXISTS batches_staff_ins ON public.batches;
DROP POLICY IF EXISTS batches_admin_ins ON public.batches;
DROP POLICY IF EXISTS batches_manage ON public.batches;
DROP POLICY IF EXISTS batches_admin_del ON public.batches;

-- 3. Create comprehensive and permissive policies for batches
-- Anyone authenticated can read active batches (or staff can read all)
CREATE POLICY batches_read ON public.batches FOR SELECT TO authenticated
  USING (is_active = true OR public.is_staff() OR public.is_admin());

-- Admins and Staff can insert new batches for any course/instructor
CREATE POLICY batches_insert ON public.batches FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_staff());

-- Admins and assigned instructors can update batches
CREATE POLICY batches_update ON public.batches FOR UPDATE TO authenticated
  USING (public.is_admin() OR instructor_id = auth.uid())
  WITH CHECK (public.is_admin() OR instructor_id = auth.uid());

-- Admins can delete or soft-delete batches
CREATE POLICY batches_delete ON public.batches FOR DELETE TO authenticated
  USING (public.is_admin());

-- 4. Fix courses policies for Admin management
DROP POLICY IF EXISTS courses_read ON public.courses;
DROP POLICY IF EXISTS courses_admin_ins ON public.courses;
DROP POLICY IF EXISTS courses_admin_upd ON public.courses;
DROP POLICY IF EXISTS courses_admin_del ON public.courses;

CREATE POLICY courses_read ON public.courses FOR SELECT TO authenticated, anon
  USING (is_active = true OR public.is_staff() OR public.is_admin());

CREATE POLICY courses_admin_ins ON public.courses FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_staff());

CREATE POLICY courses_admin_upd ON public.courses FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_staff())
  WITH CHECK (public.is_admin() OR public.is_staff());

CREATE POLICY courses_admin_del ON public.courses FOR DELETE TO authenticated
  USING (public.is_admin());

-- 5. Fix Course Ratings table & multi-dimensional feedback support
ALTER TABLE public.course_ratings ADD COLUMN IF NOT EXISTS instructor_rating INT DEFAULT 5;
ALTER TABLE public.course_ratings ADD COLUMN IF NOT EXISTS org_rating INT DEFAULT 5;
ALTER TABLE public.course_ratings ADD COLUMN IF NOT EXISTS venue_rating INT DEFAULT 5;

DROP POLICY IF EXISTS ratings_read ON public.course_ratings;
DROP POLICY IF EXISTS ratings_insert ON public.course_ratings;
DROP POLICY IF EXISTS ratings_update ON public.course_ratings;

CREATE POLICY ratings_read ON public.course_ratings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ratings_insert ON public.course_ratings FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY ratings_update ON public.course_ratings FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- 6. Ensure change_user_role RPC allows promoting to admin and volunteer seamlessly
CREATE OR REPLACE FUNCTION public.change_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
      RAISE EXCEPTION 'unauthorized';
    END IF;
  END IF;

  IF p_role NOT IN ('student','volunteer','admin') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;

  UPDATE public.profiles
     SET role = p_role,
         updated_at = now()
   WHERE id = p_user_id;

  PERFORM public.write_audit('change_role', 'profiles', p_user_id::text, jsonb_build_object('role', p_role));
END $$;

GRANT EXECUTE ON FUNCTION public.change_user_role(UUID, TEXT) TO authenticated;

-- 7. Admin Award Points RPC (allows Admin to reward points to students/volunteers)
CREATE OR REPLACE FUNCTION public.admin_award_points(p_user_id UUID, p_points INT, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_new_balance INT;
BEGIN
  IF NOT public.is_admin() THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
      RAISE EXCEPTION 'unauthorized';
    END IF;
  END IF;

  IF p_points <= 0 THEN
    RAISE EXCEPTION 'النقاط يجب أن تكون أكبر من الصفر';
  END IF;

  UPDATE public.profiles
     SET points = COALESCE(points, 0) + p_points,
         updated_at = now()
   WHERE id = p_user_id
  RETURNING points INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;

  -- Create notification for the student
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'مكافأة نقاط تميز ⭐',
    COALESCE(p_reason, 'حصلت على ' || p_points || ' نقطة إضافية من إدارة المركز!'),
    'success'
  );

  PERFORM public.write_audit('award_points', 'profiles', p_user_id::text, jsonb_build_object('points', p_points, 'reason', p_reason));

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END $$;

GRANT EXECUTE ON FUNCTION public.admin_award_points(UUID, INT, TEXT) TO authenticated;

-- 8. Force schema reload for PostgREST
NOTIFY pgrst, 'reload schema';
