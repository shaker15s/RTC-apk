/**
 * Onboarding Screen with 2-step flow (Google Sign-In + Complete Profile).
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { CustomButton } from '../../components/common/CustomButton';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomCard } from '../../components/common/CustomCard';
import { validateFullName, validateEgyptianPhone } from '../../core/security/sanitizers';
import { RTCHaptics } from '../../core/native/haptics';
import { RTC_CONFIG } from '../../core/config';
import {
  Gift,
  Sparkles,
  ShieldCheck,
  Lock,
  LifeBuoy,
  MapPin,
  Check,
  CheckCircle2,
  ChevronDown,
  X,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export interface OnboardingScreenProps {
  onLoginSuccess?: () => void;
  onOpenVerify?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onLoginSuccess, onOpenVerify }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, showToast } = useAppStore();
  const { session, profile, branches, signInWithGoogle, updateProfileData, resetAuthData, isLoading } =
    useAuthStore();

  const [step, setStep] = useState<1 | 2>(session?.user && !profile?.phone ? 2 : 1);
  const [fullName, setFullName] = useState(profile?.full_name || session?.user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [selectedBranchId, setSelectedBranchId] = useState(profile?.branch_id || '');
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);

  React.useEffect(() => {
    if (session?.user && (!profile?.phone || !profile?.branch_id)) {
      setStep(2);
    }
  }, [session, profile]);

  const handleGoogleSignIn = async () => {
    RTCHaptics.light();
    await signInWithGoogle();
  };

  const handleSaveProfile = async () => {
    let hasError = false;

    if (!validateFullName(fullName)) {
      setNameError('الاسم يجب أن يكون ثلاثياً على الأقل وبدون رموز خاصة');
      hasError = true;
    } else {
      setNameError(null);
    }

    if (!validateEgyptianPhone(phone)) {
      setPhoneError('رقم غير صحيح — يجب أن يبدأ بـ 010/011/012/015 ومكون من 11 رقماً');
      hasError = true;
    } else {
      setPhoneError(null);
    }

    if (!selectedBranchId) {
      setBranchError('يرجى اختيار الفرع الأقرب لك');
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
      showToast('تم حفظ البيانات بنجاح', 'ok');
    } catch (e: any) {
      showToast(e?.message || 'تعذر حفظ البيانات', 'err');
    }
  };

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
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
          onPress={() => {
            RTCHaptics.light();
            resetAuthData();
            showToast('تمت إعادة تهيئة البيانات المحلية', 'info');
          }}
          style={[styles.helpBtn, { backgroundColor: colors.card2, borderColor: colors.line }]}
        >
          <LifeBuoy color={colors.mut} size={15} />
          <Text style={[styles.helpText, { color: colors.mut }]}>مشكلة في الدخول؟</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          /* Step 1: Welcome & Google Sign-In */
          <View style={styles.step1Wrap}>
            {/* Free badge */}
            <View style={styles.badgeRow}>
              <View style={[styles.freePill, { backgroundColor: colors.teal + '18', borderColor: colors.teal + '40' }]}>
                <Gift color={colors.teal} size={15} />
                <Text style={[styles.freeText, { color: colors.teal }]}>تعلّم مجاني ١٠٠٪</Text>
              </View>
            </View>

            {/* Main Headline */}
            <View style={styles.headlineWrap}>
              <View style={styles.eyebrowRow}>
                <Sparkles color={colors.gold} size={16} />
                <Text style={[styles.eyebrow, { color: colors.gold }]}>رحلتك من التعلّم إلى الأثر</Text>
              </View>
              <Text style={[styles.title, { color: colors.txt }]}>ابدأ مسارك مع RTC</Text>
              <Text style={[styles.subtitle, { color: colors.mut }]}>
                كورسات مجانية يقودها متطوعون، حضور ونقاط وشهادات موثّقة—كل رحلتك في مكان واحد.
              </Text>
            </View>

            {/* Trust Row */}
            <View style={[styles.trustRow, { backgroundColor: colors.card, borderColor: colors.line }]}>
              <View style={styles.trustItem}>
                <Text style={[styles.trustNum, { color: colors.primary }]}>منذ ٢٠٠٠</Text>
                <Text style={[styles.trustLabel, { color: colors.mut }]}>خبرة مجتمعية</Text>
              </View>
              <View style={[styles.trustDivider, { backgroundColor: colors.line }]} />
              <View style={styles.trustItem}>
                <Text style={[styles.trustNum, { color: colors.teal }]}>١٧ فرعًا</Text>
                <Text style={[styles.trustLabel, { color: colors.mut }]}>بالمحافظات</Text>
              </View>
              <View style={[styles.trustDivider, { backgroundColor: colors.line }]} />
              <View style={styles.trustItem}>
                <Text style={[styles.trustNum, { color: colors.gold }]}>متطوعون</Text>
                <Text style={[styles.trustLabel, { color: colors.mut }]}>يصنعون أثرًا</Text>
              </View>
            </View>

            {/* Google Gate */}
            <CustomCard style={styles.googleGate}>
              <CustomButton
                title="تسجيل الدخول باستخدام Google"
                onPress={handleGoogleSignIn}
                variant="primary"
                size="big"
                loading={isLoading}
                icon={<ShieldCheck color="#FFFFFF" size={20} />}
                style={{ width: '100%' }}
              />

              <View style={styles.privacyNote}>
                <Lock color={colors.mut} size={14} />
                <Text style={[styles.privacyText, { color: colors.mut }]}>
                  دخول مشفّر عبر Google. لا نخزّن كلمة مرورك أبداً.
                </Text>
              </View>
            </CustomCard>

            {/* Footer Links */}
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => Linking.openURL(RTC_CONFIG.officialUrl)}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>موقع RTC الرسمي</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.mut }}>•</Text>
              <TouchableOpacity onPress={() => Linking.openURL(RTC_CONFIG.officialUrl + 'privacy.html')}>
                <Text style={[styles.footerLink, { color: colors.mut }]}>الخصوصية</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.mut }}>•</Text>
              <TouchableOpacity onPress={() => Linking.openURL(RTC_CONFIG.officialUrl + 'terms.html')}>
                <Text style={[styles.footerLink, { color: colors.mut }]}>الشروط</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Step 2: Complete Profile */
          <View style={styles.step2Wrap}>
            <View style={styles.step2Header}>
              <Text style={[styles.step2Title, { color: colors.txt }]}>أكمل بياناتك للتواصل</Text>
              <Text style={[styles.step2Subtitle, { color: colors.mut }]}>
                أدخل رقم الهاتف والفرع لتأكيد حضورك وإصدار الشهادة باسمك الصحيح
              </Text>
            </View>

            <CustomCard style={styles.formCard}>
              <TextInputField
                label="الاسم الثلاثي / الرباعي"
                value={fullName}
                onChangeText={(v) => {
                  setFullName(v);
                  if (nameError) setNameError(null);
                }}
                placeholder="اسمك الكامل كما يظهر بالشهادة"
                error={nameError}
                required
              />

              <TextInputField
                label="البريد الإلكتروني"
                value={session?.user?.email || ''}
                onChangeText={() => {}}
                editable={false}
                keyboardType="email-address"
              />

              <TextInputField
                label="رقم الموبايل"
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

              <View style={{ marginBottom: 14 }}>
                <Text style={[styles.branchLabel, { color: colors.txt }]}>
                  الفرع الأقرب لك <Text style={{ color: colors.red }}>*</Text>
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
                      {selectedBranch?.name_ar || 'اضغط لاختيار الفرع الأقرب'}
                    </Text>
                  </View>
                  <ChevronDown color={colors.mut} size={18} />
                </TouchableOpacity>
                {branchError ? <Text style={[styles.branchErrorText, { color: colors.red }]}>{branchError}</Text> : null}
              </View>

              <CustomButton
                title="حفظ وبدء الاستخدام"
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
              <Text style={[styles.modalTitle, { color: colors.txt }]}>اختر الفرع الأقرب لك</Text>
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
    </View>
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
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: Radii.full,
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
    fontSize: 11.5,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  step1Wrap: {
    paddingTop: 10,
    gap: 18,
  },
  badgeRow: {
    alignItems: 'flex-start',
  },
  freePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  freeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headlineWrap: {
    gap: 6,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderRadius: Radii.xl,
    borderWidth: 1,
  },
  trustItem: {
    alignItems: 'center',
  },
  trustNum: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  trustLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  trustDivider: {
    width: 1,
    height: 28,
  },
  googleGate: {
    gap: 14,
    padding: 20,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  privacyText: {
    fontSize: 11.5,
    textAlign: 'center',
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  step2Wrap: {
    paddingTop: 10,
    gap: 16,
  },
  step2Header: {
    alignItems: 'center',
    gap: 6,
  },
  step2Title: {
    fontSize: 20,
    fontWeight: '800',
  },
  step2Subtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
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
  branchErrorText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
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
