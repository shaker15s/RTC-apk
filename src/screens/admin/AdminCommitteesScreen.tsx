/**
 * Admin Committees Management Screen (a-committees)
 * Manage organizational committees (e.g. Trainers, PR, Media, Logistics).
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Repository, VolunteerCommittee } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomButton } from '../../components/common/CustomButton';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import { Layers, PlusCircle, Users, MapPin, X, CheckCircle2 } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const AdminCommitteesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors, isDark, showToast } = useAppStore();

  const [committees, setCommittees] = useState<VolunteerCommittee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const loadData = async () => {
    try {
      const data = await Repository.fetchCommittees();
      setCommittees(data);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleAdd = () => {
    if (!name.trim()) {
      showToast('أدخل اسم اللجنة', 'warn');
      return;
    }
    showToast('تمت إضافة اللجنة بنجاح', 'ok');
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title="إدارة اللجان والفرق"
        subtitle="اللجان التنظيمية بـ RTC"
        showBack
        onBack={onBack}
        rightAction={
          <TouchableOpacity
            onPress={() => {
              RTCHaptics.light();
              setModalVisible(true);
            }}
            style={[styles.addHeaderBtn, { backgroundColor: colors.teal + '18' }]}
          >
            <PlusCircle color={colors.teal} size={16} />
            <Text style={[styles.addHeaderText, { color: colors.teal }]}>لجنة جديدة</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 10 }}>
            <SkeletonLoader height={100} borderRadius={Radii.xl} />
            <SkeletonLoader height={100} borderRadius={Radii.xl} />
          </View>
        ) : committees.length ? (
          committees.map((com) => (
            <CustomCard key={com.id} style={styles.comCard}>
              <View style={styles.comHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                  <Layers color={colors.primary} size={22} />
                </View>
                <View style={styles.titleWrap}>
                  <Text style={[styles.comName, { color: colors.txt }]}>{com.name_ar}</Text>
                </View>
              </View>

              {com.description ? (
                <Text style={[styles.desc, { color: colors.mut }]}>{com.description}</Text>
              ) : null}
            </CustomCard>
          ))
        ) : (
          <EmptyStateView
            title="لا توجد لجان مسجلة"
            description="اضغط على «لجنة جديدة» لإنشاء لجنة تنظيمية."
            icon={<Layers color={colors.teal} size={32} />}
          />
        )}
      </ScrollView>

      {/* Add Committee Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>إنشاء لجنة تنظيمية</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <TextInputField
              label="اسم اللجنة"
              value={name}
              onChangeText={setName}
              placeholder="مثال: لجنة المدربين ومراجعة المناهج"
              required
            />

            <TextInputField
              label="وصف مهام اللجنة"
              value={desc}
              onChangeText={setDesc}
              placeholder="وصف اختصاصات اللجنة..."
              multiline
              numberOfLines={3}
            />

            <CustomButton
              title="حفظ اللجنة"
              onPress={handleAdd}
              variant="primary"
              size="big"
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  addHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
  comCard: {
    padding: 16,
    gap: 8,
  },
  comHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  comName: {
    fontSize: 15,
    fontWeight: '800',
  },
  comBranch: {
    fontSize: 12,
  },
  desc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    padding: 24,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
});
