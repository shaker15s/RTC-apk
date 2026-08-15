/**
 * Volunteer Attendance Marking Screen (v-attendance)
 * Bulk attendance recording with Present, Late, Absent, Excused statuses.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { RPC, BatchRosterStudent } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { CustomButton } from '../../components/common/CustomButton';
import { RTCHaptics } from '../../core/native/haptics';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Save,
  Users,
} from 'lucide-react-native';
import { useT } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export interface VolunteerAttendanceScreenProps {
  sessionId: string;
  batchId: string;
  /** Roster may be passed by the caller; if omitted the screen loads it
   *  itself from batch_roster (keeps navigation params serializable). */
  students?: BatchRosterStudent[];
  onBack: () => void;
}

export const VolunteerAttendanceScreen: React.FC<VolunteerAttendanceScreenProps> = ({
  sessionId,
  batchId,
  students: initialStudents,
  onBack,
}) => {
  const { colors, showToast } = useAppStore();
  const { t } = useT();

  const [students, setStudents] = useState<BatchRosterStudent[]>(initialStudents || []);
  const [loadingRoster, setLoadingRoster] = useState(!initialStudents?.length);

  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>(() => {
    const init: Record<string, AttendanceStatus> = {};
    (initialStudents || []).forEach((s) => {
      init[s.student_id] = 'present';
    });
    return init;
  });

  const [saving, setSaving] = useState(false);

  // Self-load the roster when it wasn't passed through navigation
  // (fixes non-serializable params with React Navigation).
  useEffect(() => {
    if (initialStudents?.length) return;
    let cancelled = false;
    RPC.batchRoster(batchId)
      .then((roster) => {
        if (cancelled) return;
        setStudents(roster);
        const init: Record<string, AttendanceStatus> = {};
        roster.forEach((s) => {
          init[s.student_id] = 'present';
        });
        setAttendanceState(init);
      })
      .catch((e: any) => {
        if (!cancelled) showToast(t('rosterLoadError'), 'err');
      })
      .finally(() => {
        if (!cancelled) setLoadingRoster(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    RTCHaptics.selection();
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.keys(attendanceState).map((studentId) => ({
        student_id: studentId,
        status: attendanceState[studentId],
      }));

      await RPC.recordSessionAttendance(sessionId, records);
      RTCHaptics.success();
      showToast(t('attendanceSavedToast'), 'ok');
      onBack();
    } catch (e: any) {
      showToast(e?.message || t('attendanceSaveError'), 'err');
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status: AttendanceStatus) => {
    RTCHaptics.light();
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.student_id] = status;
    });
    setAttendanceState(updated);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('attendanceMarkTitle')} subtitle={t('attendanceMarkSubtitle')} showBack onBack={onBack} />

      {/* Quick Mark All Bar */}
      <View style={styles.quickBar}>
        <Text style={[styles.quickBarLabel, { color: colors.mut }]}>{t('quickMarkLabel')}</Text>
        <View style={styles.quickButtons}>
          <TouchableOpacity
            onPress={() => markAll('present')}
            style={[styles.quickBtn, { backgroundColor: colors.teal + '18' }]}
          >
            <Text style={[styles.quickBtnText, { color: colors.teal }]}>{t('markAllPresent')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => markAll('absent')}
            style={[styles.quickBtn, { backgroundColor: colors.red + '18' }]}
          >
            <Text style={[styles.quickBtnText, { color: colors.red }]}>{t('markAllAbsent')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loadingRoster ? (
          <View style={styles.loadingWrap}>
            <Text style={[styles.loadingText, { color: colors.mut }]}>{t('loadingRoster')}</Text>
          </View>
        ) : students.length === 0 ? (
          <View style={styles.loadingWrap}>
            <Text style={[styles.loadingText, { color: colors.mut }]}>{t('emptyRoster')}</Text>
          </View>
        ) : students.map((student) => {
          const currentStatus = attendanceState[student.student_id] || 'present';

          return (
            <CustomCard key={student.student_id} style={styles.studentRowCard}>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: colors.txt }]}>{student.full_name}</Text>
                <Text style={[styles.studentAttSummary, { color: colors.mut }]}>
                  {t('prevAttendancePct', { p: student.attendance_pct || 0 })}
                </Text>
              </View>

              {/* Status Picker Buttons */}
              <View style={styles.statusButtonsRow}>
                {/* Present */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setStudentStatus(student.student_id, 'present')}
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: currentStatus === 'present' ? colors.teal : colors.card2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBtnText,
                      { color: currentStatus === 'present' ? '#FFFFFF' : colors.mut },
                    ]}
                  >
                    {t('present')}
                  </Text>
                </TouchableOpacity>

                {/* Late */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setStudentStatus(student.student_id, 'late')}
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: currentStatus === 'late' ? colors.amber : colors.card2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBtnText,
                      { color: currentStatus === 'late' ? '#FFFFFF' : colors.mut },
                    ]}
                  >
                    {t('late')}
                  </Text>
                </TouchableOpacity>

                {/* Excused */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setStudentStatus(student.student_id, 'excused')}
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: currentStatus === 'excused' ? colors.primary : colors.card2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBtnText,
                      { color: currentStatus === 'excused' ? '#FFFFFF' : colors.mut },
                    ]}
                  >
                    {t('excused')}
                  </Text>
                </TouchableOpacity>

                {/* Absent */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setStudentStatus(student.student_id, 'absent')}
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: currentStatus === 'absent' ? colors.red : colors.card2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBtnText,
                      { color: currentStatus === 'absent' ? '#FFFFFF' : colors.mut },
                    ]}
                  >
                    {t('absent')}
                  </Text>
                </TouchableOpacity>
              </View>
            </CustomCard>
          );
        })}
      </ScrollView>
      {/* Fixed Save Button at bottom */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.line }]}>
        <CustomButton
          title={t('saveAttendanceCta')}
          onPress={handleSaveAttendance}
          variant="primary"
          size="big"
          loading={saving}
          icon={<Save color="#FFFFFF" size={20} />}
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  quickBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 100,
    gap: 10,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  studentRowCard: {
    padding: 14,
    gap: 10,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  studentAttSummary: {
    fontSize: 11.5,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
});
