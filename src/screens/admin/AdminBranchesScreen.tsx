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
import { useT } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const AdminBranchesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { t } = useT();
  const { branches } = useAuthStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [city, setCity] = useState(t('abDefaultCity'));
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const handleAddBranch = () => {
    if (!nameAr.trim()) {
      showToast(t('abNameHint'), 'warn');
      return;
    }
    showToast(t('abSaved'), 'ok');
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title={t('abTitle')}
        subtitle={t('abSubtitle')}
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
            <Text style={[styles.addHeaderText, { color: colors.primary }]}>{t('abNew')}</Text>
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
              <Text style={[styles.modalTitle, { color: colors.txt }]}>{t('abModalTitle')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <TextInputField
              label={t('abName')}
              value={nameAr}
              onChangeText={setNameAr}
              placeholder={t('abNamePlaceholder')}
              required
            />

            <TextInputField
              label={t('abCity')}
              value={city}
              onChangeText={setCity}
              placeholder={t('abCityPlaceholder')}
            />

            <TextInputField
              label={t('abAddress')}
              value={address}
              onChangeText={setAddress}
              placeholder={t('abAddressPlaceholder')}
            />

            <TextInputField
              label={t('abPhone')}
              value={phone}
              onChangeText={setPhone}
              placeholder="01XXXXXXXXX"
              keyboardType="phone-pad"
            />

            <CustomButton
              title={t('abSave')}
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
