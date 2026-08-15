-- ============================================================
-- مسار RTC — سجل الحضور الذكي v2 (Attendance Intelligence v2)
-- التاريخ: 2026-08-16
-- ⚠️ استبدال كامل للدالة السابقة: نفّذ هذا الملف بعد الملف الأساسي.
-- الإضافة: course_id + course_sessions_count حتى يحسب العميل
-- نسبة الالتزام الحقيقية لكل دورة وأهلية الشهادة (75%).
-- ============================================================

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

-- ملاحظة: لو عمود اسمه مختلف في جدول sessions (مثلاً session_at بدل session_date)
-- أو جدول الحضور فيه حالة null، عدّل الأسماء أعلاه. العميل يتعامل بأمان
-- مع أي صف ناقص أو قيم null.
