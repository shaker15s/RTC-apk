-- ============================================================
-- مسار RTC — حزمة إصلاحات الجودة (SQL Migrations)
-- التاريخ: 2026-08-15
-- الهدف: دعم إصلاحات العميل في تقرير الـ QA (docs/QA-REPORT.md)
--
-- ⚠️ تنبيه هام: دي مرجعية مكتوبة على افتراض أسماء الأعمدة الموجودة
-- في الكود. راجع السكيما الفعلي وعدّل أسماء الأعمدة/الجداول إن لزم،
-- وجرّب كل دالة في بيئة staging قبل production.
-- ============================================================

-- ------------------------------------------------------------
-- 1) admin_award_points — دالة منح النقاط اليدوية للمشرف
--    (كان زر "منح النقاط" في التطبيق لا يستدعي أي شيء — P0-1)
--    تفترض وجود جدولي: points_ledger و points_rules،
--    ووجود كود قاعدة 'manual_award' في points_rules.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_award_points(
  p_user_id uuid,
  p_points integer,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_new_balance integer;
BEGIN
  -- تحقق من أن المستدعي مشرف
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'صلاحية غير كافية: المشرفون فقط يمكنهم منح النقاط';
  END IF;

  IF p_points IS NULL OR p_points <= 0 OR p_points > 1000 THEN
    RAISE EXCEPTION 'عدد النقاط يجب أن يكون بين 1 و 1000';
  END IF;

  -- تسجيل العملية في سجل النقاط
  INSERT INTO points_ledger (student_id, points, rule_id, notes)
  VALUES (
    p_user_id,
    p_points,
    (SELECT id FROM points_rules WHERE code = 'manual_award' LIMIT 1),
    COALESCE(p_reason, 'منحة يدوية من الإدارة')
  );

  -- تحديث الرصيد
  UPDATE profiles
  SET points = COALESCE(points, 0) + p_points
  WHERE id = p_user_id
  RETURNING points INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- منح حق التنفيذ للمستخدمين المسجلين فقط (الحماية الفعلية داخل الدالة)
REVOKE ALL ON FUNCTION public.admin_award_points(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_award_points(uuid, integer, text) TO authenticated;

-- ------------------------------------------------------------
-- 2) get_active_session — استرجاع الجلسة النشطة المفتوحة لمجموعة
--    (كانت الجلسة تختفي من شاشة المدرب بعد أي تنقل — P0-5)
--    ⚠️ عدّل اسماء الأعمدة حسب جدول sessions الفعلي
--    (المفترض: id, batch_id, title, checkin_code, is_open, created_at)
-- ------------------------------------------------------------
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
  -- تحقق أن المستدعي مدرب هذه المجموعة أو مشرف
  IF NOT EXISTS (
    SELECT 1 FROM batches b
    WHERE b.id = p_batch_id
      AND (b.instructor_id = auth.uid()
           OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  ) THEN
    RAISE EXCEPTION 'صلاحية غير كافية';
  END IF;

  RETURN QUERY
  SELECT s.id, s.checkin_code, COALESCE(s.title, 'المحاضرة الحالية')
  FROM sessions s
  WHERE s.batch_id = p_batch_id
    AND s.is_open = TRUE          -- ⚠️ تأكد من اسم عمود الحالة الفعلي
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_active_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_session(uuid) TO authenticated;

-- ------------------------------------------------------------
-- 3) get_my_next_session — أقرب محاضرة قادمة للطالب
--    (كانت بطاقة "المحاضرة القادمة" تعرض أول تسجيل وليس الجلسة الفعلية — F-2)
--    ⚠️ عدّل أسماء الأعمدة حسب جدول sessions الفعلي
--    (المفترض: batch_id, session_date, title, is_open/status, created_at)
-- ------------------------------------------------------------
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
  FROM sessions s
  JOIN enrollments e ON e.batch_id = s.batch_id AND e.student_id = auth.uid() AND e.status = 'enrolled'
  JOIN batches b ON b.id = s.batch_id
  JOIN courses c ON c.id = b.course_id
  WHERE s.session_date >= now()
  ORDER BY s.session_date ASC
  LIMIT 1;

  RETURN COALESCE(v_row, 'null'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_next_session() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_next_session() TO authenticated;

-- ------------------------------------------------------------
-- 4) get_my_attendance — سجل الحضور التفصيلي للطالب (F-10)
--    ⚠️ عدّل أسماء الأعمدة حسب جدولي sessions و attendance الفعليين
--    (المفترض: attendance(session_id, student_id, status, points))
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_attendance()
RETURNS TABLE (
  session_id uuid,
  session_title text,
  course_title text,
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
    c.title AS course_title,
    b.name AS batch_name,
    s.session_date,
    a.status,
    COALESCE(a.points, 0) AS points
  FROM attendance a
  JOIN sessions s ON s.id = a.session_id
  JOIN batches b ON b.id = s.batch_id
  JOIN courses c ON c.id = b.course_id
  WHERE a.student_id = auth.uid()
  ORDER BY s.session_date DESC
  LIMIT 200;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_attendance() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_attendance() TO authenticated;

-- ------------------------------------------------------------
-- ملاحظات إضافية للفريق:
-- 1) تأكد أن RLS يسمح فقط للمشرف بتنفيذ admin_award_points (الدالة تفحص داخلياً).
-- 2) أضف كود قاعدة 'manual_award' في points_rules إن لم يوجد.
-- 3) يُفضل إضافة expire تلقائي لأكواد الحضور (جلسة مفتوحة > 4 ساعات تُغلق تلقائياً).
-- 4) storage policies: حدد أقصى حجم 8MB لمستندات الأعذار و 5MB للصور في الباكتات.
-- ============================================================
