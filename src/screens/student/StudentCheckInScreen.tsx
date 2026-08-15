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
  const { refreshProfile } = useAuthStore();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ message: string } | null>(null);

  const handleCheckIn = async (checkinCode: string) => {
    const cleanCode = checkinCode.trim().toUpperCase();
    if (!cleanCode) {
      showToast('أدخل رمز الحضور المكون من ٦ أحرف أو امسح الرمز بالكاميرا', 'warn');
      return;
    }

    setLoading(true);
    setSuccessInfo(null);

    try {
      const res = await RPC.studentCheckIn(cleanCode);
      RTCHaptics.success();
      showToast('تم تسجيل حضورك بنجاح وكسب نقاط المحاضرة 🎉', 'ok');
      setSuccessInfo({ message: res?.message || 'تم تسجيل الحضور واحتساب النقاط' });
      await refreshProfile();
      setCode('');
    } catch (e: any) {
      RTCHaptics.error();
      showToast(e?.message || 'رمز الحضور غير صالح أو منتهي الصلاحية', 'err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title="تسجيل الحضور" subtitle="إثبات الحضور بالرمز أو الكاميرا" showBack onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Card if checked in */}
        {successInfo ? (
          <CustomCard style={[styles.successCard, { borderColor: colors.teal }]}>
            <View style={[styles.successIconCircle, { backgroundColor: colors.teal + '18' }]}>
              <CheckCircle2 color={colors.teal} size={36} />
            </View>
            <Text style={[styles.successTitle, { color: colors.teal }]}>تم تسجيل الحضور بنجاح!</Text>
            <Text style={[styles.successMessage, { color: colors.txt }]}>{successInfo.message}</Text>
            <View style={[styles.pointsEarnedBadge, { backgroundColor: colors.teal + '14' }]}>
              <Sparkles color={colors.teal} size={16} />
              <Text style={[styles.pointsEarnedText, { color: colors.teal }]}>+10 نقاط تضاف لسجلك</Text>
            </View>
          </CustomCard>
        ) : null}

        {/* Camera QR Card */}
        <CustomCard style={styles.qrActionCard}>
          <View style={[styles.qrIconWrap, { backgroundColor: colors.teal + '18' }]}>
            <Camera color={colors.teal} size={32} />
          </View>
          <Text style={[styles.qrCardTitle, { color: colors.txt }]}>مسح رمز QR من هاتف المدرب</Text>
          <Text style={[styles.qrCardSubtitle, { color: colors.mut }]}>
            وجّه كاميرا هاتفك نحو شاشة المدرب لتسجيل الحضور الفوري في ثانية واحدة
          </Text>

          <CustomButton
            title="فتح كاميرا مسح QR"
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
          <Text style={[styles.orText, { color: colors.mut }]}>أو أدخل الرمز يدوياً</Text>
          <View style={[styles.orLine, { backgroundColor: colors.line }]} />
        </View>

        {/* Manual Code Input Card */}
        <CustomCard style={styles.manualCard}>
          <TextInputField
            label="رمز الحضور (6 أحرف/أرقام)"
            value={code}
            onChangeText={setCode}
            placeholder="مثال: X7K9P2"
            maxLength={10}
            inputStyle={{
              textAlign: 'center',
              letterSpacing: 4,
              fontSize: 18,
              fontWeight: '800',
            }}
          />

          <CustomButton
            title="تأكيد وتسجيل الحضور"
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
            يُفتح رمز الحضور أثناء وقت المحاضرة فقط، ولا يمكن تسجيل الحضور نيابة عن زميل.
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
});
