import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { RTC_CONFIG } from '../../core/config';
import { useT } from '../../core/i18n';
import { Award, ShieldCheck, Sparkles } from 'lucide-react-native';

export interface CertificateCardProps {
  studentName: string;
  courseTitle: string;
  serial: string;
  issuedDate: string;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  studentName,
  courseTitle,
  serial,
  issuedDate,
}) => {
  const { t } = useT();

  return (
    <LinearGradient
      colors={['#061338', '#00288E', '#001A6B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Inner Decorative Luxury Border */}
      <View style={styles.innerBorder}>
        {/* Top ribbon & Emblem */}
        <View style={styles.topRow}>
          <View style={styles.badgeIcon}>
            <Award color="#F59E0B" size={24} />
          </View>
          <View style={styles.orgWrap}>
            <Text style={styles.orgAr}>جمعية رسالة للأعمال الخيرية</Text>
            <Text style={styles.orgEn}>Resala Training Centers (RTC)</Text>
          </View>
          <View style={styles.verifiedPill}>
            <ShieldCheck color="#F59E0B" size={13} />
            <Text style={styles.verifiedText}>معتمدة رسمياً</Text>
          </View>
        </View>

        {/* Certificate Title */}
        <View style={styles.titleWrap}>
          <Text style={styles.certMainTitle}>شهادة إتمام واجتياز دورة تدريبية</Text>
          <Text style={styles.certSubTitle}>CERTIFICATE OF ACHIEVEMENT</Text>
          <View style={styles.goldDivider} />
        </View>

        {/* Recipient Statement */}
        <Text style={styles.certPreamble}>يشهد مركز رسالة للتدريب بأن المتدرب / المتدربة:</Text>

        {/* Student Name in Luxury Gold / Light Cyan */}
        <Text style={styles.studentName} numberOfLines={2}>
          {studentName || '—'}
        </Text>

        {/* Course Statement */}
        <Text style={styles.certCourseIntro}>قد اجتاز(ت) بنجاح متطلبات الدورة التدريبية المعتمدة في:</Text>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {courseTitle || '—'}
        </Text>

        {/* Bottom Verification & QR */}
        <View style={styles.bottomRow}>
          <View style={styles.qrWrap}>
            <QRCode
              value={`${RTC_CONFIG.officialUrl}verify.html?serial=${serial}`}
              size={72}
              color="#001A6B"
              backgroundColor="#FFFFFF"
            />
          </View>
          <View style={styles.metaWrap}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>رقم الاعتماد الدولي:</Text>
              <Text style={styles.metaValue}>{serial}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>تاريخ التحرير:</Text>
              <Text style={styles.metaValue}>{issuedDate || '—'}</Text>
            </View>
            <View style={styles.sealRow}>
              <Sparkles color="#F59E0B" size={12} />
              <Text style={styles.sealText}>ختم الاعتماد الإلكتروني لمركز رسالة</Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 330,
    minHeight: 460,
    borderRadius: 24,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#D97706',
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.35)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgWrap: {
    flex: 1,
    alignItems: 'center',
  },
  orgAr: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  orgEn: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: '#F59E0B',
  },
  verifiedText: {
    color: '#F59E0B',
    fontSize: 9.5,
    fontWeight: '800',
  },
  titleWrap: {
    alignItems: 'center',
    gap: 2,
    marginVertical: 4,
  },
  certMainTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  certSubTitle: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  goldDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#D97706',
    marginTop: 4,
    borderRadius: 1,
  },
  certPreamble: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  studentName: {
    color: '#FDE68A',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  certCourseIntro: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    textAlign: 'center',
  },
  courseTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217,119,6,0.25)',
  },
  qrWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  metaWrap: {
    flex: 1,
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sealText: {
    color: '#F59E0B',
    fontSize: 8.5,
    fontWeight: '700',
  },
});
