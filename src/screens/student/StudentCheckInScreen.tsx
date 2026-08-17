/**
 * Student Check-In Screen (s-checkin)
 * Manual code entry and Native Camera QR scanner integration.
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
import { RPC } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomButton } from '../../components/common/CustomButton';
import { QRScannerModal } from '../../components/qr/QRScannerModal';
import { RTCHaptics } from '../../core/native/haptics';
import { withTimeout } from '../../core/performance/withTimeout';
import { useT } from '../../core/i18n';
import {
  QrCode,
  Camera,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Flame,
  Award,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const StudentCheckInScreen: React.FC<{
  onBack: () => void;
  onNavigate?: (screenId: string) => void;
}> = ({ onBack, onNavigate }) => {
  const { colors, showToast } = useAppStore();
  const { t } = useT();
  const { refreshProfile } = useAuthStore();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    message: string;
    courseTitle?: string;
    instructor?: string;
    points: number;
  } | null>(null);

  const handleCheckIn = async (rawInput: string) => {
    let cleanCode = rawInput.trim();
    let meta: any = null;

    try {
      if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
        const parsed = JSON.parse(cleanCode);
        if (parsed.code) {
          cleanCode = parsed.code;
          meta = parsed;
        }
      }
    } catch (e) {
      // Use raw input
    }

    cleanCode = cleanCode.toUpperCase();
    if (!cleanCode) {
      showToast(t('emptyCodeWarn'), 'warn');
      return;
    }

    setLoading(true);

    try {
      // Hard timeout so a hanging network never leaves a stuck spinner (A-7)
      const res = await withTimeout(RPC.studentCheckIn(cleanCode), 15000);
      RTCHaptics.success();
      const msg = res?.message || t('checkInSuccessDefault');
      showToast(t('checkInDoneToast'), 'ok');
      
      setCelebrationData({
        message: msg,
        courseTitle: meta?.courseTitle,
        instructor: meta?.instructor,
        points: 15,
      });

      await refreshProfile();
      setCode('');
    } catch (e: any) {
      RTCHaptics.error();
      showToast(e?.message || t('invalidCodeError'), 'err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('checkInTitle')} subtitle={t('checkInSubtitle')} showBack onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Camera QR Card */}
        <CustomCard style={styles.qrActionCard}>
          <View style={[styles.qrIconWrap, { backgroundColor: colors.teal + '18' }]}>
            <Camera color={colors.teal} size={32} />
          </View>
          <Text style={[styles.qrCardTitle, { color: colors.txt }]}>{t('scanCardTitle')}</Text>
          <Text style={[styles.qrCardSubtitle, { color: colors.mut }]}>
            {t('scanCardSubtitle')}
          </Text>

          <CustomButton
            title={t('openCameraCta')}
            onPress={() => {
              RTCHaptics.light();
              setScannerVisible(true);
            }}
            variant="teal"
            size="big"
            icon={<QrCode color="#FFFFFF" size={20} />}
            style={{ width: '100%', marginTop: 6 }}
          />
        </CustomCard>

        {/* Divider with 'أو' */}
        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: colors.line }]} />
          <Text style={[styles.orText, { color: colors.mut }]}>{t('orManual')}</Text>
          <View style={[styles.orLine, { backgroundColor: colors.line }]} />
        </View>

        {/* Manual Code Input Card */}
        <CustomCard style={styles.manualCard}>
          <TextInputField
            label={t('codeLabel')}
            value={code}
            onChangeText={setCode}
            placeholder={t('codePlaceholder')}
            maxLength={10}
            inputStyle={{
              textAlign: 'center',
              letterSpacing: 4,
              fontSize: 18,
              fontWeight: '800',
            }}
          />

          <CustomButton
            title={t('confirmCheckInCta')}
            onPress={() => handleCheckIn(code)}
            variant="primary"
            size="big"
            loading={loading}
            icon={<CheckCircle2 color="#FFFFFF" size={18} />}
          />
        </CustomCard>

        {/* Rules note */}
        <View style={styles.rulesNote}>
          <ShieldAlert color={colors.mut} size={15} />
          <Text style={[styles.rulesText, { color: colors.mut }]}>
            {t('checkInRules')}
          </Text>
        </View>
      </ScrollView>

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={(scannedCode) => {
          handleCheckIn(scannedCode);
        }}
      />

      {/* Luxury Apple Celebration Modal */}
      <Modal
        visible={!!celebrationData}
        transparent
        animationType="fade"
        onRequestClose={() => setCelebrationData(null)}
      >
        <View style={styles.celebrateOverlay}>
          <View style={[styles.celebrateCard, { backgroundColor: colors.card, borderColor: colors.teal }]}>
            <View style={[styles.celebrateIconCircle, { backgroundColor: colors.teal + '20' }]}>
              <CheckCircle2 color={colors.teal} size={48} />
            </View>

            <Text style={[styles.celebrateTitle, { color: colors.txt }]}>
              تم تسجيل حضورك بنجاح! 🎉
            </Text>

            {celebrationData?.courseTitle ? (
              <Text style={[styles.celebrateCourse, { color: colors.primary }]}>
                {celebrationData.courseTitle}
              </Text>
            ) : null}

            {celebrationData?.instructor ? (
              <Text style={[styles.celebrateInstructor, { color: colors.mut }]}>
                المدرب: {celebrationData.instructor}
              </Text>
            ) : null}

            <Text style={[styles.celebrateMessage, { color: colors.mut }]}>
              {celebrationData?.message}
            </Text>

            <View style={[styles.pointsBadge, { backgroundColor: colors.gold + '18', borderColor: colors.gold + '40' }]}>
              <Sparkles color={colors.gold} size={18} />
              <Text style={[styles.pointsText, { color: colors.gold }]}>
                +{celebrationData?.points || 15} نقطة نشاط وتميز
              </Text>
            </View>

            <CustomButton
              title="رائع، تم"
              onPress={() => {
                RTCHaptics.light();
                setCelebrationData(null);
                if (onNavigate) {
                  onNavigate('s-home');
                } else {
                  onBack();
                }
              }}
              variant="teal"
              size="big"
              style={{ width: '100%', marginTop: 8 }}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  successCard: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    gap: 8,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  successMessage: {
    fontSize: 13,
    textAlign: 'center',
  },
  pointsEarnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    marginTop: 6,
  },
  pointsEarnedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  qrActionCard: {
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  qrIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  qrCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  qrCardSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 12,
    fontWeight: '600',
  },
  manualCard: {
    padding: 20,
    gap: 12,
  },
  rulesNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  rulesText: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 17,
  },
  celebrateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrateCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radii.xxl,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 12,
  },
  celebrateIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  celebrateTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  celebrateCourse: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  celebrateInstructor: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  celebrateMessage: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginVertical: 6,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
