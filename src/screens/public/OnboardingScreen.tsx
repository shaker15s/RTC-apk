/**
 * Onboarding Screen with Multi-mode Access:
 * 1. Fast Demo One-Tap Access (Student / Volunteer / Admin)
 * 2. Email & Password Sign-In / Sign-Up
 * 3. Google Sign-In
 * 4. Step 2: Profile Data Completion (Phone & Branch)
 */
import React, { useState } from 'react';
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
  Gift,
  Sparkles,
  ShieldCheck,
  Lock,
  LifeBuoy,
  MapPin,
  Check,
  ChevronDown,
  X,
  GraduationCap,
  Users,
  Shield,
  Mail,
  KeyRound,
  UserPlus,
  LogIn,
  Zap,
} from 'lucide-react-native';
import { Radii, Shadows } from '../../core/theme/tokens';

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
    signInWithDemoRole,
    updateProfileData,
    resetAuthData,
    initAuth,
    isLoading,
  } = useAuthStore();
  const { t } = useT();

  const [step, setStep] = useState<1 | 2>(session?.user && !profile?.phone ? 2 : 1);
  const [authTab, setAuthTab] = useState<'demo' | 'email' | 'google'>('demo');

  // Email form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailNameInput, setEmailNameInput] = useState('');
  const [emailPhoneInput, setEmailPhoneInput] = useState('');

  // Step 2 state
  const [fullName, setFullName] = useState(profile?.full_name || session?.user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [selectedBranchId, setSelectedBranchId] = useState(profile?.branch_id || (branches[0]?.id || 'b1'));
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);

  React.useEffect(() => {
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

  const handleDemoSignIn = async (role: 'student' | 'volunteer' | 'admin') => {
    RTCHaptics.selection();
    await signInWithDemoRole(role);
    showToast(
      role === 'student'
        ? 'مرحباً بك كطالب في مسار RTC! 🎓'
        : role === 'volunteer'
        ? 'مرحباً بك كمدرب / متطوع! 👨‍🏫'
        : 'مرحباً بك في لوحة تحكم المسؤول 👑',
      'ok'
    );
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleEmailAuth = async () => {
    RTCHaptics.light();
    if (!emailInput || !emailInput.includes('@')) {
      showToast('يرجى إدخال بريد إلكتروني صحيح', 'err');
      return;
    }
    if (!passwordInput || passwordInput.length < 6) {
      showToast('كلمة المرور يجب أن تكون ٦ أحرف على الأقل', 'err');
      return;
    }

    if (isSignUp) {
      if (!emailNameInput.trim()) {
        showToast('يرجى إدخال الاسم الثلاثي بالكامل', 'err');
        return;
      }
      if (!validateEgyptianPhone(emailPhoneInput)) {
        showToast('يرجى إدخال رقم موبايل مصري صحيح (11 رقم)', 'err');
        return;
      }
      await signUpWithEmail(
        emailInput,
        passwordInput,
        emailNameInput,
        emailPhoneInput,
        selectedBranchId
      );
      showToast('تم إنشاء الحساب بنجاح! مرحباً بك في مسار 🌟', 'ok');
    } else {
      await signInWithEmail(emailInput, passwordInput);
      showToast('تم تسجيل الدخول بنجاح! 🚀', 'ok');
    }
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleGoogleSignIn = async () => {
    RTCHaptics.light();
    await signInWithGoogle();
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

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      {/* Header with dots and help */}
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
          /* Step 1: Welcome & Flexible Sign-In */
          <View style={styles.step1Wrap}>
            {/* Top Brand Pill */}
            <View style={styles.badgeRow}>
              <View style={[styles.freePill, { backgroundColor: colors.teal + '18', borderColor: colors.teal + '40' }]}>
                <Gift color={colors.teal} size={16} />
                <Text style={[styles.freeText, { color: colors.teal }]}>منصة رسالة للتدريب مجاناً 100%</Text>
              </View>
            </View>

            {/* Main Hero Headline */}
            <View style={styles.headlineWrap}>
              <View style={styles.eyebrowRow}>
                <Sparkles color={colors.gold} size={18} />
                <Text style={[styles.eyebrow, { color: colors.gold }]}>مسار RTC الذكي</Text>
              </View>
              <Text style={[styles.title, { color: colors.txt }]}>{t('welcomeTitle')}</Text>
              <Text style={[styles.subtitle, { color: colors.mut }]}>
                ابدأ رحلتك التدريبية، سجل حضورك بالـ QR، واستلم شهاداتك المعتمدة فوراً.
              </Text>
            </View>

            {/* Auth Mode Switcher Tabs */}
            <View style={[styles.authTabsRow, { backgroundColor: colors.card2, borderColor: colors.line }]}>
              <TouchableOpacity
                onPress={() => {
                  RTCHaptics.selection();
                  setAuthTab('demo');
                }}
                style={[
                  styles.authTabBtn,
                  authTab === 'demo' && { backgroundColor: colors.primary, elevation: 2 },
                ]}
              >
                <Zap color={authTab === 'demo' ? '#FFFFFF' : colors.mut} size={16} />
                <Text
                  style={[
                    styles.authTabText,
                    { color: authTab === 'demo' ? '#FFFFFF' : colors.mut },
                  ]}
                >
                  ⚡ دخول تجريبي فوري
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  RTCHaptics.selection();
                  setAuthTab('email');
                }}
                style={[
                  styles.authTabBtn,
                  authTab === 'email' && { backgroundColor: colors.primary, elevation: 2 },
                ]}
              >
                <Mail color={authTab === 'email' ? '#FFFFFF' : colors.mut} size={16} />
                <Text
                  style={[
                    styles.authTabText,
                    { color: authTab === 'email' ? '#FFFFFF' : colors.mut },
                  ]}
                >
                  إيميل وكلمة سر
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  RTCHaptics.selection();
                  setAuthTab('google');
                }}
                style={[
                  styles.authTabBtn,
                  authTab === 'google' && { backgroundColor: colors.primary, elevation: 2 },
                ]}
              >
                <ShieldCheck color={authTab === 'google' ? '#FFFFFF' : colors.mut} size={16} />
                <Text
                  style={[
                    styles.authTabText,
                    { color: authTab === 'google' ? '#FFFFFF' : colors.mut },
                  ]}
                >
                  Google
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: Fast Demo Accounts */}
            {authTab === 'demo' && (
              <CustomCard style={styles.demoCard} innerStyle={{ padding: 18, gap: 14 }}>
                <View style={styles.demoHeader}>
                  <Text style={[styles.demoHeaderText, { color: colors.txt }]}>
                    اختر الدور الذي ترغب في تجربته بنقرة واحدة:
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleDemoSignIn('student')}
                  style={[styles.roleOptionCard, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '40' }]}
                >
                  <View style={[styles.roleOptionIcon, { backgroundColor: colors.primary }]}>
                    <GraduationCap color="#FFFFFF" size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleOptionTitle, { color: colors.txt }]}>حساب طالب نشط 🎓</Text>
                    <Text style={[styles.roleOptionDesc, { color: colors.mut }]}>
                      (عبدالله شاكر) - دورات مسجلة، سجل حضور ذكي، نقاط، شارات وشهادات.
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleDemoSignIn('volunteer')}
                  style={[styles.roleOptionCard, { backgroundColor: colors.teal + '14', borderColor: colors.teal + '40' }]}
                >
                  <View style={[styles.roleOptionIcon, { backgroundColor: colors.teal }]}>
                    <Users color="#FFFFFF" size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleOptionTitle, { color: colors.txt }]}>حساب مدرب / متطوع 👨‍🏫</Text>
                    <Text style={[styles.roleOptionDesc, { color: colors.mut }]}>
                      (م. أحمد شاكر) - مجموعات تدريبية، توليد باركود التحضير، وتقارير المحاضرات.
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleDemoSignIn('admin')}
                  style={[styles.roleOptionCard, { backgroundColor: colors.gold + '14', borderColor: colors.gold + '40' }]}
                >
                  <View style={[styles.roleOptionIcon, { backgroundColor: colors.gold }]}>
                    <Shield color="#FFFFFF" size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleOptionTitle, { color: colors.txt }]}>حساب مسؤول نظام 👑</Text>
                    <Text style={[styles.roleOptionDesc, { color: colors.mut }]}>
                      (أ. شاكر عبدالله) - لوحة تحكم كاملة، إدارة المستخدمين والفروع والشهادات.
                    </Text>
                  </View>
                </TouchableOpacity>
              </CustomCard>
            )}

            {/* TAB 2: Email & Password Sign-In / Sign-Up */}
            {authTab === 'email' && (
              <CustomCard style={styles.emailCard} innerStyle={{ padding: 18, gap: 12 }}>
                <View style={styles.emailToggleRow}>
                  <TouchableOpacity
                    onPress={() => setIsSignUp(false)}
                    style={[styles.emailToggleBtn, !isSignUp && { backgroundColor: colors.primary }]}
                  >
                    <Text style={{ color: !isSignUp ? '#FFFFFF' : colors.mut, fontWeight: '700' }}>
                      تسجيل دخول
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsSignUp(true)}
                    style={[styles.emailToggleBtn, isSignUp && { backgroundColor: colors.primary }]}
                  >
                    <Text style={{ color: isSignUp ? '#FFFFFF' : colors.mut, fontWeight: '700' }}>
                      إنشاء حساب جديد
                    </Text>
                  </TouchableOpacity>
                </View>

                {isSignUp && (
                  <>
                    <TextInputField
                      label="الاسم بالكامل"
                      value={emailNameInput}
                      onChangeText={setEmailNameInput}
                      placeholder="مثال: عبدالله شاكر محمود"
                      required
                    />
                    <TextInputField
                      label="رقم الموبايل"
                      value={emailPhoneInput}
                      onChangeText={setEmailPhoneInput}
                      placeholder="010XXXXXXXX"
                      keyboardType="phone-pad"
                      maxLength={11}
                      required
                    />
                  </>
                )}

                <TextInputField
                  label="البريد الإلكتروني"
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="name@domain.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  required
                />

                <TextInputField
                  label="كلمة المرور"
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  placeholder="••••••••"
                  secureTextEntry
                  required
                />

                <CustomButton
                  title={isSignUp ? 'إنشاء حساب والدخول' : 'تسجيل الدخول'}
                  onPress={handleEmailAuth}
                  variant="primary"
                  size="big"
                  loading={isLoading}
                  icon={isSignUp ? <UserPlus color="#FFFFFF" size={20} /> : <LogIn color="#FFFFFF" size={20} />}
                  style={{ marginTop: 8 }}
                />
              </CustomCard>
            )}

            {/* TAB 3: Google Sign-In */}
            {authTab === 'google' && (
              <CustomCard style={styles.googleGate} innerStyle={{ padding: 22, gap: 16 }}>
                <CustomButton
                  title={t('googleCta')}
                  onPress={handleGoogleSignIn}
                  variant="primary"
                  size="big"
                  loading={isLoading}
                  icon={<ShieldCheck color="#FFFFFF" size={22} />}
                  style={{ width: '100%' }}
                />

                <View style={styles.privacyNote}>
                  <Lock color={colors.mut} size={15} />
                  <Text style={[styles.privacyText, { color: colors.mut }]}>
                    {t('privacyNote')}
                  </Text>
                </View>
              </CustomCard>
            )}

            {/* Quick Actions & Verification */}
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

            {/* Footer Links */}
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
          /* Step 2: Complete Profile */
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

              <View style={{ marginBottom: 14 }}>
                <Text style={[styles.branchLabel, { color: colors.txt }]}>
                  {t('branch')} <Text style={{ color: colors.red }}>*</Text>
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setBranchModalVisible(true)}
                  style={[
                    styles.branchPickerBtn,
                    {
                      backgroundColor: colors.card2,
                      borderColor: branchError ? colors.red : colors.line,
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
                      {selectedBranch?.name_ar || t('branchPlaceholder')}
                    </Text>
                  </View>
                  <ChevronDown color={colors.mut} size={18} />
                </TouchableOpacity>
                {branchError ? <Text style={[styles.branchErrorText, { color: colors.red }]}>{branchError}</Text> : null}
              </View>

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
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 10,
  },
  badgeRow: {
    alignItems: 'center',
  },
  freePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  freeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headlineWrap: {
    alignItems: 'center',
    gap: 8,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  authTabsRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radii.lg,
    borderWidth: 1,
    gap: 4,
  },
  authTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  authTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  demoCard: {
    borderRadius: Radii.xl,
  },
  demoHeader: {
    marginBottom: 4,
  },
  demoHeaderText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  roleOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  roleOptionDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  emailCard: {
    borderRadius: Radii.xl,
  },
  emailToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#00000010',
    borderRadius: Radii.md,
    padding: 3,
    marginBottom: 6,
  },
  emailToggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: Radii.sm,
  },
  googleGate: {
    borderRadius: Radii.xl,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  privacyText: {
    fontSize: 12,
  },
  quickAccessRow: {
    alignItems: 'center',
    marginTop: 4,
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
    fontSize: 13,
    fontWeight: '700',
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 10,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  step2Wrap: {
    gap: 18,
    paddingTop: 16,
  },
  step2Header: {
    gap: 6,
  },
  step2Title: {
    fontSize: 22,
    fontWeight: '800',
  },
  step2Subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  formCard: {
    padding: 18,
    gap: 6,
  },
  branchLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  branchPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  branchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  branchIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchSelectedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  branchErrorText: {
    fontSize: 11.5,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000060',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    maxHeight: '75%',
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  branchItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  branchItemName: {
    fontSize: 14,
  },
  branchItemAddress: {
    fontSize: 11,
    marginTop: 2,
  },
});
