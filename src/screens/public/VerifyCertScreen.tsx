/**
 * Public Certificate Verification Screen (matches verify.html and s-certs verify modal).
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/appStore';
import { RPC, VerifyCertificateResult } from '../../data/rpc';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomButton } from '../../components/common/CustomButton';
import { CustomCard } from '../../components/common/CustomCard';
import { RTCHaptics } from '../../core/native/haptics';
import { useT } from '../../core/i18n';
import { ShieldCheck, CheckCircle2, XCircle, Search, Award, Calendar, User, ArrowRight } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const VerifyCertScreen: React.FC<{ onBack?: () => void; initialSerial?: string }> = ({
  onBack,
  initialSerial,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, showToast } = useAppStore();
  const { t } = useT();

  const [serial, setSerial] = useState(initialSerial || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyCertificateResult | null>(null);
  const [searched, setSearched] = useState(false);

  const runVerify = async (rawSerial: string) => {
    const cleanSerial = rawSerial.trim().toUpperCase();
    if (!cleanSerial) {
      showToast(t('verifyEnterSerialWarn'), 'warn');
      return;
    }

    setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      const rows = await RPC.verifyCertificate(cleanSerial);
      if (rows && rows.length && rows[0].is_valid) {
        setResult(rows[0]);
        RTCHaptics.success();
      } else {
        setResult(null);
        RTCHaptics.error();
      }
    } catch (e: any) {
      showToast(e?.message || t('verifyError'), 'err');
    } finally {
      setLoading(false);
    }
  };

  // Deep-link support (fixes A-1): org.resala.rtc.masar://verify?serial=X
  // arrives via route params and auto-verifies on mount.
  useEffect(() => {
    if (initialSerial) {
      setSerial(initialSerial);
      runVerify(initialSerial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSerial]);

  const handleVerify = async () => {
    await runVerify(serial);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: colors.card2 }]}>
            <ArrowRight color={colors.txt} size={20} />
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.headerTitle, { color: colors.txt }]}>{t('verifyTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
            <ShieldCheck color={colors.primary} size={36} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.txt }]}>{t('verifyHero')}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.mut }]}>
            {t('verifyHeroSub')}
          </Text>
        </View>

        {/* Input Card */}
        <CustomCard style={styles.searchCard}>
          <TextInputField
            label={t('serialFieldLabel')}
            value={serial}
            onChangeText={setSerial}
            placeholder={t('serialPlaceholder')}
            maxLength={64}
            icon={<Search color={colors.mut} size={18} />}
          />

          <CustomButton
            title={t('verifyCta')}
            onPress={handleVerify}
            variant="primary"
            size="big"
            loading={loading}
            icon={<Search color="#FFFFFF" size={18} />}
          />
        </CustomCard>

        {/* Result Area */}
        {searched ? (
          result ? (
            /* Valid Certificate */
            <CustomCard style={[styles.resultCard, { borderColor: colors.teal }]}>
              <View style={[styles.validBanner, { backgroundColor: colors.teal + '18' }]}>
                <CheckCircle2 color={colors.teal} size={24} />
                <Text style={[styles.validTitle, { color: colors.teal }]}>{t('verifyValid')}</Text>
              </View>

              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Award color={colors.primary} size={18} />
                  </View>
                  <View style={styles.detailTextWrap}>
                    <Text style={[styles.detailLabel, { color: colors.mut }]}>{t('verifyCourseField')}</Text>
                    <Text style={[styles.detailValue, { color: colors.txt }]}>{result.course_title}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <User color={colors.teal} size={18} />
                  </View>
                  <View style={styles.detailTextWrap}>
                    <Text style={[styles.detailLabel, { color: colors.mut }]}>{t('verifyStudentField')}</Text>
                    <Text style={[styles.detailValue, { color: colors.txt }]}>{result.student_name}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Calendar color={colors.gold} size={18} />
                  </View>
                  <View style={styles.detailTextWrap}>
                    <Text style={[styles.detailLabel, { color: colors.mut }]}>{t('verifyDateField')}</Text>
                    <Text style={[styles.detailValue, { color: colors.txt }]}>{result.issued_date || '—'}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <ShieldCheck color={colors.primary} size={18} />
                  </View>
                  <View style={styles.detailTextWrap}>
                    <Text style={[styles.detailLabel, { color: colors.mut }]}>{t('verifySerialField')}</Text>
                    <Text style={[styles.detailValue, { color: colors.txt }]}>
                      {result.serial}
                    </Text>
                  </View>
                </View>
              </View>
            </CustomCard>
          ) : (
            /* Invalid Certificate */
            <CustomCard style={[styles.resultCard, { borderColor: colors.red }]}>
              <View style={[styles.validBanner, { backgroundColor: colors.red + '18' }]}>
                <XCircle color={colors.red} size={24} />
                <Text style={[styles.validTitle, { color: colors.red }]}>{t('verifyNotFound')}</Text>
              </View>
              <Text style={[styles.invalidDesc, { color: colors.mut }]}>
                {t('verifyNotFoundDesc')}
              </Text>
            </CustomCard>
          )
        ) : null}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  heroWrap: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  searchCard: {
    padding: 20,
    gap: 12,
  },
  resultCard: {
    padding: 18,
    borderWidth: 2,
    gap: 16,
  },
  validBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: Radii.md,
  },
  validTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailsList: {
    gap: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailTextWrap: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  invalidDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
