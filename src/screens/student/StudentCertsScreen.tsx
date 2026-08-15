/**
 * Student Certificates Screen (s-certs) — v100.4.0
 * Displays earned accredited certificates with serial numbers, QR
 * preview, image sharing (PNG card), and PDF export (new).
 * Fully bilingual via the reactive i18n engine.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Repository, CertItem } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { CustomButton } from '../../components/common/CustomButton';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import { RTCSharing } from '../../core/native/sharing';
import { RTC_CONFIG } from '../../core/config';
import { useT, dateLocale } from '../../core/i18n';
import { buildCertificateHtml } from '../../core/pdf/certificatePdf';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { CertificateCard } from '../../components/cert/CertificateCard';
import {
  Award,
  Share2,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  X,
  FileText,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const StudentCertsScreen: React.FC<{ onNavigate: (screenId: string) => void }> = ({ onNavigate }) => {
  const { colors, isDark, showToast } = useAppStore();
  const { t } = useT();

  const [certs, setCerts] = useState<CertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCert, setSelectedCert] = useState<CertItem | null>(null);
  const [sharingImage, setSharingImage] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);
  const certCardRef = useRef<ViewShot>(null);

  const loadData = async () => {
    try {
      const data = await Repository.fetchCerts(true);
      setCerts(data);
    } catch (e) {
      showToast(t('errorGeneric'), 'warn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleShareCert = async (cert: CertItem) => {
    RTCHaptics.light();
    const url = `${RTC_CONFIG.officialUrl}verify.html?serial=${cert.serial}`;
    await RTCSharing.shareText(
      t('shareCertTitle', { course: cert.courses?.title || '' }),
      t('shareCertMessage', { course: cert.courses?.title || '', serial: cert.serial }),
      url
    );
  };

  // Capture the certificate card and share it as a real PNG (fixes F-13)
  const handleShareImage = async () => {
    if (!selectedCert) return;
    RTCHaptics.light();
    setSharingImage(true);
    try {
      const uri = await certCardRef.current?.capture?.();
      if (!uri) throw new Error('capture-failed');

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showToast(t('shareUnavailable'), 'warn');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('shareImageCta'),
      });
      RTCHaptics.success();
    } catch (e: any) {
      showToast(e?.message || t('captureError'), 'err');
    } finally {
      setSharingImage(false);
    }
  };

  // Build an official PDF certificate and share it (v100.4.0)
  const handleSharePdf = async () => {
    if (!selectedCert) return;
    RTCHaptics.light();
    setSharingPdf(true);
    showToast(t('pdfGenerating'), 'info');
    try {
      // Reuse the captured card image (contains the QR) inside the PDF.
      const cardUri = await certCardRef.current?.capture?.();
      let imageBase64: string | undefined;
      if (cardUri) {
        try {
          imageBase64 = await FileSystem.readAsStringAsync(cardUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (e) {
          imageBase64 = undefined; // PDF still works without the image
        }
      }

      const html = buildCertificateHtml({
        imageBase64,
        studentName: selectedCert.profiles?.full_name || '',
        courseTitle: selectedCert.courses?.title || t('certCourseFallback'),
        serial: selectedCert.serial,
        issuedDate: selectedCert.issued_at,
        verifyUrl: `${RTC_CONFIG.officialUrl}verify.html?serial=${selectedCert.serial}`,
      });

      const { uri: pdfUri } = await Print.printToFileAsync({ html });

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showToast(t('shareUnavailable'), 'warn');
        return;
      }

      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: t('pdfShareTitle'),
        UTI: 'com.adobe.pdf',
      });
      RTCHaptics.success();
    } catch (e: any) {
      showToast(e?.message || t('pdfError'), 'err');
    } finally {
      setSharingPdf(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title={t('certsTitle')}
        subtitle={t('certsSubtitle')}
        rightAction={
          <TouchableOpacity
            onPress={() => onNavigate('verify')}
            style={[styles.verifyHeaderBtn, { backgroundColor: colors.card2, borderColor: colors.line }]}
          >
            <ShieldCheck color={colors.primary} size={16} />
            <Text style={[styles.verifyHeaderText, { color: colors.primary }]}>{t('verifyHeaderCta')}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 14 }}>
            <SkeletonLoader height={160} borderRadius={Radii.xl} />
            <SkeletonLoader height={160} borderRadius={Radii.xl} />
          </View>
        ) : certs.length ? (
          certs.map((cert) => {
            const dateStr = cert.issued_at
              ? new Date(cert.issued_at).toLocaleDateString(dateLocale(), {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '';

            return (
              <CustomCard key={cert.id} style={styles.certCard}>
                <View style={styles.certHeader}>
                  <View style={[styles.certIconWrap, { backgroundColor: colors.primarySoft }]}>
                    <GraduationCap color={colors.primary} size={24} />
                  </View>
                  <View style={styles.certTitleWrap}>
                    <Text style={[styles.certCourseTitle, { color: colors.txt }]}>
                      {cert.courses?.title || t('certCardTitle')}
                    </Text>
                    <Text style={[styles.certDate, { color: colors.mut }]}>{t('issuedAt', { d: dateStr })}</Text>
                  </View>
                  <View style={[styles.validBadge, { backgroundColor: colors.teal + '18' }]}>
                    <CheckCircle2 color={colors.teal} size={14} />
                    <Text style={[styles.validBadgeText, { color: colors.teal }]}>{t('certifiedBadge')}</Text>
                  </View>
                </View>

                {/* Serial Box */}
                <View style={[styles.serialBox, { backgroundColor: colors.card2, borderColor: colors.line }]}>
                  <Text style={[styles.serialLabel, { color: colors.mut }]}>{t('serialLabel')}</Text>
                  <Text style={[styles.serialCode, { color: colors.txt }]}>
                    {cert.serial}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.certActions}>
                  <CustomButton
                    title={t('shareCertCta')}
                    onPress={() => handleShareCert(cert)}
                    variant="soft"
                    size="mid"
                    icon={<Share2 color={colors.txt} size={16} />}
                    style={{ flex: 1 }}
                  />

                  <CustomButton
                    title={t('qrVerifyCta')}
                    onPress={() => {
                      RTCHaptics.light();
                      setSelectedCert(cert);
                    }}
                    variant="primary"
                    size="mid"
                    icon={<QrCode color="#FFFFFF" size={16} />}
                    style={{ flex: 1 }}
                  />
                </View>
              </CustomCard>
            );
          })
        ) : (
          <EmptyStateView
            title={t('certsEmptyTitle')}
            description={t('certsEmptyDesc')}
            icon={<Award color={colors.gold} size={36} />}
            action={
              <CustomButton
                title={t('exploreCoursesCta')}
                onPress={() => onNavigate('s-explore')}
                variant="primary"
                size="mid"
              />
            }
          />
        )}
      </ScrollView>

      {/* Certificate Modal: card + QR + share as image / PDF */}
      <Modal visible={!!selectedCert} transparent animationType="fade" onRequestClose={() => setSelectedCert(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.qrCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {selectedCert ? (
              <>
                <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedCert(null)}>
                  <X color={colors.mut} size={22} />
                </TouchableOpacity>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  <View style={[styles.qrIconCircle, { backgroundColor: colors.primarySoft }]}>
                    <ShieldCheck color={colors.primary} size={28} />
                  </View>

                  <Text style={[styles.qrCourseTitle, { color: colors.txt }]}>
                    {selectedCert.courses?.title || t('certCourseFallback')}
                  </Text>

                  {/* Capture-ready certificate card (fixes F-13) */}
                  <ViewShot
                    ref={certCardRef}
                    options={{ format: 'png', quality: 0.95 }}
                    style={styles.certCardWrap}
                  >
                    <CertificateCard
                      studentName={selectedCert.profiles?.full_name || ''}
                      courseTitle={selectedCert.courses?.title || t('certCourseFallback')}
                      serial={selectedCert.serial}
                      issuedDate={selectedCert.issued_at}
                    />
                  </ViewShot>

                  {/* REAL scannable QR pointing to the verification page (fixes P1-4) */}
                  <View style={styles.qrBox}>
                    <QRCode
                      value={`${RTC_CONFIG.officialUrl}verify.html?serial=${selectedCert.serial}`}
                      size={120}
                      color="#001A6B"
                      backgroundColor="#FFFFFF"
                    />
                  </View>

                  <Text style={[styles.qrSerial, { color: colors.mut }]}>
                    {selectedCert.serial}
                  </Text>

                  <Text style={[styles.qrNotice, { color: colors.mut }]}>
                    {t('scanCertNotice')}
                  </Text>

                  <CustomButton
                    title={t('shareImageCta')}
                    onPress={handleShareImage}
                    variant="primary"
                    size="big"
                    loading={sharingImage}
                    icon={<Share2 color="#FFFFFF" size={18} />}
                    style={{ width: '100%', marginTop: 8 }}
                  />

                  <CustomButton
                    title={t('sharePdfCta')}
                    onPress={handleSharePdf}
                    variant="teal"
                    size="mid"
                    loading={sharingPdf}
                    icon={<FileText color="#FFFFFF" size={16} />}
                    style={{ width: '100%', marginTop: 8 }}
                  />

                  <CustomButton
                    title={t('shareLinkCta')}
                    onPress={() => {
                      handleShareCert(selectedCert);
                      setSelectedCert(null);
                    }}
                    variant="soft"
                    size="mid"
                    style={{ width: '100%', marginTop: 8 }}
                  />
                </ScrollView>
              </>
            ) : null}
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
  verifyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  verifyHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
    gap: 14,
  },
  certCard: {
    padding: 18,
    gap: 14,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  certIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certTitleWrap: {
    flex: 1,
    gap: 2,
  },
  certCourseTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  certDate: {
    fontSize: 11.5,
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  validBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  serialBox: {
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    gap: 3,
  },
  serialLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
  serialCode: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  certActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  qrCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radii.xxl,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 6,
  },
  qrIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCourseTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  qrBox: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modalScrollContent: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  certCardWrap: {
    marginVertical: 6,
  },
  qrSerial: {
    fontSize: 13,
    fontWeight: '700',
  },
  qrNotice: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
