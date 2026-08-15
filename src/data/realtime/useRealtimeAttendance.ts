/**
 * Realtime Attendance Hook
 * Subscribes to live session attendance updates for volunteer classroom dashboard.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export interface LiveAttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  created_at: string;
}

export function useRealtimeAttendance(sessionId?: string) {
  const [attendanceRecords, setAttendanceRecords] = useState<LiveAttendanceRecord[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    // 1. Initial fetch
    supabase
      .from('attendance')
      .select('*')
      .eq('session_id', sessionId)
      .then(({ data }) => {
        if (data) setAttendanceRecords(data as LiveAttendanceRecord[]);
      });

    // 2. Realtime listener
    const channel = supabase
      .channel(`session_attendance_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAttendanceRecords((prev) => [...prev, payload.new as LiveAttendanceRecord]);
          } else if (payload.eventType === 'UPDATE') {
            setAttendanceRecords((prev) =>
              prev.map((rec) =>
                rec.id === payload.new.id ? (payload.new as LiveAttendanceRecord) : rec
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setAttendanceRecords((prev) => prev.filter((rec) => rec.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { attendanceRecords };
}
