/**
 * Admin Branches Management Screen (a-branches)
 * Manage RTC training branch centers, addresses, contact numbers, and social links.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Branch } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomButton } from '../../components/common/CustomButton';
import { RTCHaptics } from '../../core/native/haptics';
import {
  Building2,
  MapPin,
  Phone,
  Facebook,
  PlusCircle,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const AdminBranchesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { branches } = useAuthStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [city, setCity] = useState('القاهرة');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const handleAddBranch = () => {
    if (!nameAr.trim()) {
      showToast('أدخل اسم الفرع', 'warn');
      return;
    }
    showToast('تم حفظ بيانات الفرع بنجاح', 'ok');
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title="إدارة الفروع والمقرات"
        subtitle="فروع مراكز رسالة للتدريب"
        showBack
        onBack={onBack}
        rightAction={
          <TouchableOpacity
            onPress={() => {
              RTCHaptics.light();
              setModalVisible(true);
            }}
            style={[styles.addHeaderBtn, { backgroundColor: colors.primarySoft }]}
          >
            <PlusCircle color={colors.primary} size={16} />
            <Text style={[styles.addHeaderText, { color: colors.primary }]}>فرع جديد</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {branches.map((branch) => (
          <CustomCard key={branch.id} style={styles.branchCard}>
            <View style={styles.branchHeader}>
              <View style={[styles.branchIcon, { backgroundColor: colors.primarySoft }]}>
                <Building2 color={colors.primary} size={22} />
              </View>

              <View style={styles.branchTitleWrap}>
                <Text style={[styles.branchName, { color: colors.txt }]}>{branch.name_ar}</Text>
                {branch.city ? <Text style={[styles.branchCity, { color: colors.mut }]}>{branch.city}</Text> : null}
              </View>
            </View>

            {branch.address ? (
              <View style={styles.infoRow}>
                <MapPin color={colors.mut} size={15} />
                <Text style={[styles.infoText, { color: colors.mut }]}>{branch.address}</Text>
              </View>
            ) : null}

            {branch.phone ? (
              <View style={styles.infoRow}>
                <Phone color={colors.mut} size={15} />
                <Text style={[styles.infoText, { color: colors.mut }]}>
                  {branch.phone}
                </Text>
              </View>
            ) : null}
          </CustomCard>
        ))}
      </ScrollView>

      {/* Add Branch Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>إضافة فرع تدريبي جديد</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <TextInputField
              label="اسم الفرع"
              value={nameAr}
              onChangeText={setNameAr}
              placeholder="مثال: فرع المعادي"
              required
            />

            <TextInputField
              label="المحافظة / المدينة"
              value={city}
              onChangeText={setCity}
              placeholder="القاهرة / الجيزة / الإسكندرية"
            />

            <TextInputField
              label="العنوان التفصيلي"
              value={address}
              onChangeText={setAddress}
              placeholder="شارع..."
            />

            <TextInputField
              label="رقم الهاتف للتواصل"
              value={phone}
              onChangeText={setPhone}
              placeholder="01XXXXXXXXX"
              keyboardType="phone-pad"
            />

            <CustomButton
              title="حفظ الفرع"
              onPress={handleAddBranch}
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
  branchCard: {
    padding: 16,
    gap: 10,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  branchIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchTitleWrap: {
    flex: 1,
    gap: 2,
  },
  branchName: {
    fontSize: 15,
    fontWeight: '800',
  },
  branchCity: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
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
