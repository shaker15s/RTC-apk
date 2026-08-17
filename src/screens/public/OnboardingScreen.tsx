import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { CustomButton } from '../../components/common/CustomButton';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomCard } from '../../components/common/CustomCard';
import { validateFullName, validateEgyptianPhone } from '../../core/security/sanitizers';
import { RTCHaptics } from '../../core/native/haptics';
import { RTCNotifications } from '../../core/native/notifications';
import { RTC_CONFIG } from '../../core/config';
import { useT } from '../../core/i18n';
import {
  Sparkles,
  ShieldCheck,
  LifeBuoy,
  MapPin,
  Check,
  ChevronDown,
  X,
  UserPlus,
  LogIn,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export interface OnboardingScreenProps {
  onLoginSuccess?: () => void;
  onOpenVerify?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onLoginSuccess, onOpenVerify }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, showToast } = useAppStore();
  const {
    session,
    profile,
    branches,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    updateProfileData,
    resetAuthData,
    initAuth,
    isLoading,
    error: authError,
  } = useAuthStore();
  const { t } = useT();

  const [step, setStep] = useState<1 | 2>(session?.user && (!profile?.phone || !profile?.branch_id) ? 2 : 1);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || '');
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  // Validation Errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      if (!fullName) {
        setFullName(profile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || '');
      }
      if (profile?.phone) {
        setPhone(profile.phone);
      }
      if (profile?.branch_id) {
        setSelectedBranchId(profile.branch_id);
      }
      if (!profile?.phone || !profile?.branch_id) {
        setStep(2);
      }
    }
  }, [session, profile]);

  useEffect(() => {
    if (authError) {
      showToast(authError, 'err');
    }
  }, [authError]);

  const handleEmailAuth = async () => {
    RTCHaptics.light();
    
    if (!email || !email.includes('@')) {
      showToast('يرجى إدخال بريد إلكتروني صحيح', 'err');
      return;
    }
    
    if (!password || password.length < 6) {
      showToast('كلمة المرور يجب أن تكون ٦ أحرف على الأقل', 'err');
      return;
    }

    if (isSignUp) {
      let hasError = false;
      if (!validateFullName(fullName)) {
        setNameError('يرجى إدخال الاسم الثلاثي بالكامل');
        hasError = true;
      } else {
        setNameError(null);
      }

      if (!validateEgyptianPhone(phone)) {
        setPhoneError('يرجى إدخال رقم موبايل مصري صحيح (11 رقم)');
        hasError = true;
      } else {
        setPhoneError(null);
      }

      if (!selectedBranchId) {
        setBranchError('يرجى اختيار الفرع');
        hasError = true;
      } else {
        setBranchError(null);
      }

      if (hasError) {
        RTCHaptics.error();
        return;
      }

      await signUpWithEmail(email, password, fullName.trim(), phone.trim(), selectedBranchId);
      if (onLoginSuccess) onLoginSuccess();
    } else {
      await signInWithEmail(email, password);
      if (onLoginSuccess) onLoginSuccess();
    }
  };

  const handleGoogleSignIn = async () => {
    RTCHaptics.light();
    await signInWithGoogle();
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleSaveProfile = async () => {
    let hasError = false;

    if (!validateFullName(fullName)) {
      setNameError(t('nameErrorMsg'));
      hasError = true;
    } else {
      setNameError(null);
    }

    if (!validateEgyptianPhone(phone)) {
      setPhoneError(t('phoneErrorMsg'));
      hasError = true;
    } else {
      setPhoneError(null);
    }

    if (!selectedBranchId) {
      setBranchError(t('branchErrorMsg'));
      hasError = true;
    } else {
      setBranchError(null);
    }

    if (hasError) {
      RTCHaptics.error();
      return;
    }

    try {
      await updateProfileData({
        full_name: fullName.trim(),
        phone: phone.trim(),
        branch_id: selectedBranchId,
      });
      RTCHaptics.success();
      showToast(t('profileSaved'), 'ok');

      RTCNotifications.requestPermissions()
        .then((granted) => {
          if (granted) {
            RTCNotifications.syncPushRegistration().catch(() => {});
          }
        })
        .catch(() => {});
    } catch (e: any) {
      showToast(e?.message || t('profileSaveError'), 'err');
    }
  };

  const handleHelpPress = () => {
    RTCHaptics.light();
    Alert.alert(t('helpTitle'), t('helpMessage'), [
      {
        text: t('helpReload'),
        onPress: async () => {
          await initAuth();
          showToast(t('helpReloadDone'), 'info');
        },
      },
      {
        text: t('helpCall'),
        onPress: () => Linking.openURL('tel:19450'),
      },
      {
        text: t('helpReset'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            t('helpResetConfirmTitle'),
            t('helpResetConfirmMsg'),
            [
              { text: t('cancel'), style: 'cancel' },
              {
                text: t('helpResetYes'),
                style: 'destructive',
                onPress: async () => {
                  await resetAuthData();
                  showToast(t('helpResetDone'), 'info');
                },
              },
            ]
          );
        },
      },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const renderBranchPicker = (error: string | null) => {
    const selectedBranch = branches.find((b) => b.id === selectedBranchId) || null;
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={[styles.branchLabel, { color: colors.txt }]}>
          الفرع <Text style={{ color: colors.red }}>*</Text>
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setBranchModalVisible(true)}
          style={[
            styles.branchPickerBtn,
            {
              backgroundColor: colors.card2,
              borderColor: error ? colors.red : colors.line,
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
              {selectedBranch?.name_ar || 'اختر الفرع'}
            </Text>
          </View>
          <ChevronDown color={colors.mut} size={18} />
        </TouchableOpacity>
        {error ? <Text style={[styles.branchErrorText, { color: colors.red }]}>{error}</Text> : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <View style={styles.header}>
        <View style={styles.dots}>
          <View
            style={[
              styles.dot,
              {
                width: step === 1 ? 28 : 8,
                backgroundColor: step === 1 ? colors.primary : colors.line,
              },
            ]}
          />
          <View
            style={[
              styles.dot,
              {
                width: step === 2 ? 28 : 8,
                backgroundColor: step === 2 ? colors.primary : colors.line,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          onPress={handleHelpPress}
          style={[styles.helpBtn, { backgroundColor: colors.card2, borderColor: colors.line }]}
        >
          <LifeBuoy color={colors.mut} size={15} />
          <Text style={[styles.helpText, { color: colors.mut }]}>{t('helpBtn')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: '90%' }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          <View style={styles.step1Wrap}>
            <View style={styles.headlineWrap}>
              <View style={styles.eyebrowRow}>
                <Sparkles color={colors.gold} size={18} />
                <Text style={[styles.eyebrow, { color: colors.gold }]}>مراكز رسالة للتدريب</Text>
              </View>
              <Text style={[styles.title, { color: colors.txt }]}>{t('welcomeTitle')}</Text>
              <Text style={[styles.subtitle, { color: colors.mut }]}>
                بوابتك الموحدة لمتابعة الدورات التدريبية، تسجيل الحضور الذكي، والحصول على الشهادات المعتمدة.
              </Text>
            </View>

            <CustomCard style={styles.emailCard} innerStyle={{ padding: 24, gap: 16 }}>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <View style={[styles.googleIconWrap, { backgroundColor: colors.primarySoft }]}>
                  <ShieldCheck color={colors.primary} size={32} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.txt }]}>الدخول الموحد السريع</Text>
                <Text style={[styles.cardSubtitle, { color: colors.mut }]}>
                  سجل دخولك بحساب Google للمتابعة والوصول إلى كافة خدمات التدريب.
                </Text>
              </View>

              <CustomButton
                title="المتابعة باستخدام Google"
                onPress={handleGoogleSignIn}
                variant="primary"
                size="big"
                loading={isLoading}
                icon={<ShieldCheck color="#FFFFFF" size={20} />}
                style={{ width: '100%', marginTop: 8 }}
              />
            </CustomCard>

            <View style={styles.quickAccessRow}>
              {onOpenVerify ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => {
                    RTCHaptics.selection();
                    onOpenVerify();
                  }}
                  style={[styles.verifyCertBtn, { backgroundColor: colors.card2, borderColor: colors.line }]}
                >
                  <ShieldCheck color={colors.primary} size={18} />
                  <Text style={[styles.verifyCertText, { color: colors.txt }]}>{t('verifyCertBtn')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => Linking.openURL(RTC_CONFIG.officialUrl)}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>{t('officialSite')}</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.mut }}>•</Text>
              <TouchableOpacity onPress={() => Linking.openURL(RTC_CONFIG.officialUrl + 'privacy.html')}>
                <Text style={[styles.footerLink, { color: colors.mut }]}>{t('privacyLink')}</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.mut }}>•</Text>
              <TouchableOpacity onPress={() => Linking.openURL(RTC_CONFIG.officialUrl + 'terms.html')}>
                <Text style={[styles.footerLink, { color: colors.mut }]}>{t('termsLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.step2Wrap}>
            <View style={styles.step2Header}>
              <Text style={[styles.step2Title, { color: colors.txt }]}>{t('completeProfile')}</Text>
              <Text style={[styles.step2Subtitle, { color: colors.mut }]}>
                {t('completeProfileSubtitle')}
              </Text>
            </View>

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
                label={t('email')}
                value={session?.user?.email || ''}
                onChangeText={() => {}}
                editable={false}
                keyboardType="email-address"
              />

              <TextInputField
                label={t('phone')}
                value={phone}
                onChangeText={(v) => {
                  setPhone(v);
                  if (phoneError) setPhoneError(null);
                }}
                placeholder={t('phonePlaceholder')}
                keyboardType="phone-pad"
                maxLength={11}
                error={phoneError}
                required
              />

              {renderBranchPicker(branchError)}

              <CustomButton
                title={t('saveStart')}
                onPress={handleSaveProfile}
                variant="primary"
                size="big"
                loading={isLoading}
                icon={<Check color="#FFFFFF" size={20} />}
                style={{ marginTop: 12 }}
              />
            </CustomCard>
          </View>
        )}
      </ScrollView>

      {/* Branch Picker Modal */}
      <Modal visible={branchModalVisible} animationType="slide" transparent onRequestClose={() => setBranchModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.txt }]}>{t('pickBranch')}</Text>
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
                      setBranchError(null);
                      setBranchModalVisible(false);
                    }}
                    style={[
                      styles.branchItem,
                      {
                        backgroundColor: isSelected ? colors.primarySoft : 'transparent',
                        borderColor: isSelected ? colors.primary : colors.line,
                      },
                    ]}
                  >
                    <View style={styles.branchItemLeft}>
                      <MapPin color={isSelected ? colors.primary : colors.mut} size={18} />
                      <View>
                        <Text
                          style={[
                            styles.branchItemName,
                            {
                              color: isSelected ? colors.primary : colors.txt,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {item.name_ar}
                        </Text>
                        {item.address ? (
                          <Text style={[styles.branchItemAddress, { color: colors.mut }]}>
                            {item.address}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {isSelected ? <Check color={colors.primary} size={18} /> : null}
                  </TouchableOpacity>
                );
              }}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  helpText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  step1Wrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
    paddingTop: 20,
  },
  headlineWrap: {
    alignItems: 'center',
    gap: 8,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  emailCard: {
    marginTop: 10,
  },
  googleIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  authToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: Radii.md,
    padding: 4,
    marginBottom: 8,
  },
  authToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  quickAccessRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  verifyCertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  verifyCertText: {
    fontSize: 14,
    fontWeight: '600',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '500',
  },
  step2Wrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
    paddingTop: 20,
  },
  step2Header: {
    alignItems: 'center',
    gap: 8,
  },
  step2Title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  step2Subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    padding: 20,
    gap: 16,
  },
  branchLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'left',
  },
  branchPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  branchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  branchIcon: {
    padding: 6,
    borderRadius: Radii.sm,
  },
  branchSelectedText: {
    fontSize: 15,
    fontWeight: '600',
  },
  branchErrorText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  branchItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  branchItemName: {
    fontSize: 16,
  },
  branchItemAddress: {
    fontSize: 13,
    marginTop: 2,
  },
});
