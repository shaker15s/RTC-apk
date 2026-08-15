/**
 * Edit Profile Screen (s-edit-profile)
 * Allows updating avatar photo, full name, Egyptian phone, and branch.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Repository } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomButton } from '../../components/common/CustomButton';
import { validateFullName, validateEgyptianPhone } from '../../core/security/sanitizers';
import { RTCHaptics } from '../../core/native/haptics';
import {
  Camera,
  User,
  MapPin,
  Check,
  CheckCircle2,
  ChevronDown,
  X,
} from 'lucide-react-native';
import { useT, t } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export const EditProfileScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { t } = useT();
  const { profile, branches, updateProfileData, refreshProfile } = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [selectedBranchId, setSelectedBranchId] = useState(profile?.branch_id || '');
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    RTCHaptics.light();
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast(t('photosPermWarn'), 'warn');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setUploadingAvatar(true);
        showToast(t('avatarUploading'), 'info');
        // Pass the real MIME type — no more labelling everything as webp
        const uploadedUrl = await Repository.uploadAvatar(
          result.assets[0].uri,
          result.assets[0].mimeType || 'image/jpeg'
        );
        setAvatarUrl(uploadedUrl);
        RTCHaptics.success();
        showToast(t('avatarUploaded'), 'ok');
      }
    } catch (e: any) {
      showToast(e?.message || t('avatarUploadError'), 'err');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    let hasError = false;

    if (!validateFullName(fullName)) {
      setNameError(t('editNameError'));
      hasError = true;
    } else {
      setNameError(null);
    }

    if (!validateEgyptianPhone(phone)) {
      setPhoneError(t('editPhoneError'));
      hasError = true;
    } else {
      setPhoneError(null);
    }

    if (hasError) {
      RTCHaptics.error();
      return;
    }

    setSaving(true);
    try {
      await updateProfileData({
        full_name: fullName.trim(),
        phone: phone.trim(),
        branch_id: selectedBranchId,
        avatar_url: avatarUrl,
      });
      await refreshProfile();
      RTCHaptics.success();
      showToast(t('savedChangesToast'), 'ok');
      onBack();
    } catch (e: any) {
      showToast(e?.message || t('saveChangesError'), 'err');
    } finally {
      setSaving(false);
    }
  };

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <GlassHeader title={t('editProfileTitle')} subtitle={t('epSubtitle')} showBack onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Avatar Picker Wrap */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarBox, { borderColor: colors.primary }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <User color={colors.primary} size={48} />
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
              style={[styles.cameraBadge, { backgroundColor: colors.primary }]}
            >
              <Camera color="#FFFFFF" size={16} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.avatarHint, { color: colors.mut }]}>
            {uploadingAvatar ? t('epUploadingShort') : t('epCameraHint')}
          </Text>
        </View>

        {/* Inputs Form */}
        <CustomCard style={styles.formCard}>
          <TextInputField
            label={t('fullName')}
            value={fullName}
            onChangeText={(v) => {
              setFullName(v);
              if (nameError) setNameError(null);
            }}
            placeholder={t('fullNamePlaceholder')}
            error={nameError}
            required
          />

          <TextInputField
            label={t('phone')}
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              if (phoneError) setPhoneError(null);
            }}
            placeholder="01XXXXXXXXX"
            keyboardType="phone-pad"
            maxLength={11}
            error={phoneError}
            required
          />

          {/* Branch Picker */}
          <View style={{ marginBottom: 14 }}>
            <Text style={[styles.branchLabel, { color: colors.txt }]}>{t('branch')}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setBranchModalVisible(true)}
              style={[
                styles.branchPickerBtn,
                {
                  backgroundColor: colors.card2,
                  borderColor: colors.line,
                },
              ]}
            >
              <View style={styles.branchInner}>
                <View style={[styles.branchIcon, { backgroundColor: colors.teal + '18' }]}>
                  <MapPin color={colors.teal} size={18} />
                </View>
                <Text
                  style={[
                    styles.branchSelectedText,
                    { color: selectedBranch ? colors.txt : colors.mut },
                  ]}
                >
                  {selectedBranch?.name_ar || t('epPickBranch')}
                </Text>
              </View>
              <ChevronDown color={colors.mut} size={18} />
            </TouchableOpacity>
          </View>

          <CustomButton
            title={t('saveChanges')}
            onPress={handleSave}
            variant="primary"
            size="big"
            loading={saving}
            icon={<Check color="#FFFFFF" size={20} />}
            style={{ marginTop: 8 }}
          />
        </CustomCard>
      </ScrollView>

      {/* Branch Modal */}
      <Modal visible={branchModalVisible} animationType="slide" transparent onRequestClose={() => setBranchModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>{t('epPickBranchCta')}</Text>
              <TouchableOpacity onPress={() => setBranchModalVisible(false)}>
                <X color={colors.mut} size={22} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={branches}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedBranchId;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedBranchId(item.id);
                      setBranchModalVisible(false);
                    }}
                    style={[
                      styles.branchItem,
                      {
                        backgroundColor: isSelected ? colors.primarySoft : colors.card2,
                        borderColor: isSelected ? colors.primary : colors.line,
                      },
                    ]}
                  >
                    <View style={styles.branchItemLeft}>
                      <Text style={[styles.branchItemName, { color: colors.txt }]}>{item.name_ar}</Text>
                      {item.city ? <Text style={[styles.branchItemCity, { color: colors.mut }]}>{item.city}</Text> : null}
                    </View>
                    {isSelected ? <CheckCircle2 color={colors.primary} size={20} /> : null}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingVertical: 12, gap: 8 }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 10,
  },
  avatarBox: {
    width: 90,
    height: 90,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    resizeMode: 'cover',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarHint: {
    fontSize: 12,
  },
  formCard: {
    padding: 20,
  },
  branchLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'right',
  },
  branchPickerBtn: {
    height: 52,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  branchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  branchIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchSelectedText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '75%',
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  branchItemLeft: {
    gap: 2,
  },
  branchItemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  branchItemCity: {
    fontSize: 12,
  },
});
