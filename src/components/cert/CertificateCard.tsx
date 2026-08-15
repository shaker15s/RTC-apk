/**
 * Certificate Card — a shareable, capture-ready certificate design (v100.2.0)
 * Rendered inside a ViewShot container so the student can export their
 * certificate as a real image (fixes F-13).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { RTC_CONFIG } from '../../core/config';
import { GraduationCap, ShieldCheck } from 'lucide-react-native';

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
  return (
    <LinearGradient
      colors={['#001A6B', '#00288E', '#00554E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Top ribbon */}
      <View style={styles.topRow}>
        <View style={styles.badgeIcon}>
          <GraduationCap color="#FFFFFF" size={20} />
        </View>
        <Text style={styles.org}>جمعية رسالة — مراكز التدريب</Text>
        <View style={styles.verifiedPill}>
          <ShieldCheck color="#89F5E7" size={12} />
          <Text style={styles.verifiedText}>موثقة</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>شهادة إتمام دورة تدريبية</Text>
      <Text style={styles.subtitle}>تشهد جمعية رسالة بأن</Text>

      {/* Student name */}
      <Text style={styles.studentName} numberOfLines={2}>
        {studentName || '—'}
      </Text>

      <Text style={styles.subtitle}>قد أتم بنجاح متطلبات دورة</Text>
      <Text style={styles.courseTitle} numberOfLines={2}>
        {courseTitle || '—'}
      </Text>

      {/* Bottom: QR + meta */}
      <View style={styles.bottomRow}>
        <View style={styles.qrWrap}>
          <QRCode
            value={`${RTC_CONFIG.officialUrl}verify.html?serial=${serial}`}
            size={84}
            color="#001A6B"
            backgroundColor="#FFFFFF"
          />
        </View>
        <View style={styles.metaWrap}>
          <Text style={styles.metaLabel}>الرقم التسلسلي</Text>
          <Text style={styles.metaValue}>{serial}</Text>
          <Text style={styles.metaLabel}>تاريخ الإصدار</Text>
          <Text style={styles.metaValue}>{issuedDate || '—'}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 320,
    minHeight: 420,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  org: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: {
    color: '#89F5E7',
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    textAlign: 'center',
  },
  studentName: {
    color: '#89F5E7',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 30,
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
    gap: 14,
    marginTop: 10,
  },
  qrWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 6,
  },
  metaWrap: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9.5,
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
