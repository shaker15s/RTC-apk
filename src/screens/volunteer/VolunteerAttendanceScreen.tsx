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
  Alert,
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

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused' | 'unmarked';

export interface VolunteerAttendanceScreenProps {
  sessionId: string;
  batchId: string;
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
      init[s.student_id] = 'unmarked';
    });
    return init;
  });

  const [saving, setSaving] = useState(false);

  // Self-load the roster when it wasn't passed through navigation
  useEffect(() => {
    if (initialStudents?.length) return;
    let cancelled = false;
    RPC.batchRoster(batchId)
      .then((roster) => {
        if (cancelled) return;
        setStudents(roster);
        const init: Record<string, AttendanceStatus> = {};
        roster.forEach((s) => {
          init[s.student_id] = 'unmarked';
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
  }, [batchId]);

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    RTCHaptics.selection();
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  const executeSave = async (records: { student_id: string; status: AttendanceStatus }[]) => {
    setSaving(true);
    try {
      await RPC.recordSessionAttendance(sessionId, records as any);
      RTCHaptics.success();
      showToast(t('attendanceSavedToast'), 'ok');
      onBack();
    } catch (e: any) {
      showToast(e?.message || t('attendanceSaveError'), 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAttendance = async () => {
    const total = students.length;
    const records = Object.keys(attendanceState).map((studentId) => ({
      student_id: studentId,
      status: attendanceState[studentId] === 'unmarked' ? 'absent' : attendanceState[studentId],
    }));

    const unmarkedCount = Object.values(attendanceState).filter((s) => s === 'unmarked').length;
    if (unmarkedCount > 0) {
      RTCHaptics.warning();
      Alert.alert(
        'مراجعة كشف الحضور',
        `يوجد ${unmarkedCount} طالب لم يتم تحديد حالتهم. سيتم تسجيلهم كـ "غائب". هل تريد المتابعة وحفظ الكشف؟`,
        [
          { text: 'إلغاء للمراجعة', style: 'cancel' },
          {
            text: 'نعم، حفظ الكشف',
            onPress: () => executeSave(records),
          },
        ]
      );
      return;
    }

    await executeSave(records);
  };

  const markAll = (status: AttendanceStatus) => {
    RTCHaptics.light();
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.student_id] = status;
    });
    setAttendanceState(updated);
  };

  // Counts
  const presentCount = Object.values(attendanceState).filter((s) => s === 'present').length;
  const lateCount = Object.values(attendanceState).filter((s) => s === 'late').length;
  const absentCount = Object.values(attendanceState).filter((s) => s === 'absent').length;
  const excusedCount = Object.values(attendanceState).filter((s) => s === 'excused').length;
  const unmarkedCount = Object.values(attendanceState).filter((s) => s === 'unmarked').length;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('attendanceMarkTitle')} subtitle={t('attendanceMarkSubtitle')} showBack onBack={onBack} />

      {/* Summary Counters */}
      <View style={[styles.statsRow, { backgroundColor: colors.card, borderBottomColor: colors.line }]}>
        <View style={[styles.statChip, { backgroundColor: colors.teal + '15' }]}>
          <Text style={[styles.statChipText, { color: colors.teal }]}>حاضر: {presentCount}</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: colors.amber + '15' }]}>
          <Text style={[styles.statChipText, { color: colors.amber }]}>متأخر: {lateCount}</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: colors.red + '15' }]}>
          <Text style={[styles.statChipText, { color: colors.red }]}>غائب: {absentCount}</Text>
        </View>
        {excusedCount > 0 && (
          <View style={[styles.statChip, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.statChipText, { color: colors.primary }]}>معذور: {excusedCount}</Text>
          </View>
        )}
        {unmarkedCount > 0 && (
          <View style={[styles.statChip, { backgroundColor: colors.mut + '15' }]}>
            <Text style={[styles.statChipText, { color: colors.mut }]}>غير محدد: {unmarkedCount}</Text>
          </View>
        )}
      </View>

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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  statChipText: {
    fontSize: 12,
    fontWeight: '700',
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
