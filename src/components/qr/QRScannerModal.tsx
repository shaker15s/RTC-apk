/**
 * Native Camera QR Scanner Modal.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppStore } from '../../state/appStore';
import { CustomButton } from '../common/CustomButton';
import { RTCHaptics } from '../../core/native/haptics';
import { useT } from '../../core/i18n';
import { X, QrCode, Camera } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export interface QRScannerModalProps {
  visible: boolean;
  onScan: (code: string) => void;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ visible, onScan, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scannedRef = React.useRef(false);
  const { colors } = useAppStore();
  const { t } = useT();

  useEffect(() => {
    if (visible) {
      setScanned(false);
      scannedRef.current = false;
    }
  }, [visible]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedRef.current || scanned) return;
    scannedRef.current = true;
    setScanned(true);
    try {
      RTCHaptics.success();
      onScan(String(data || ''));
    } catch {
      setScanned(false);
    } finally {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('scanModalTitle')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {Platform.OS === 'web' ? (
          <WebQRScanner onScan={handleBarcodeScanned} onClose={onClose} />
        ) : !permission?.granted ? (
          <View style={styles.permissionContainer}>
            <Camera color={colors.primary} size={48} />
            <Text style={styles.permTitle}>{t('camPermTitle')}</Text>
            <Text style={styles.permDesc}>{t('camPermDesc')}</Text>
            <CustomButton title={t('grantPermission')} onPress={requestPermission} variant="primary" size="big" />
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'code128', 'code39'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
            <View style={styles.overlay}>
              <View style={styles.unfocusedContainer} />
              <View style={styles.middleContainer}>
                <View style={styles.unfocusedContainer} />
                <View style={styles.targetSquare}>
                  <View style={[styles.corner, styles.tl]} />
                  <View style={[styles.corner, styles.tr]} />
                  <View style={[styles.corner, styles.bl]} />
                  <View style={[styles.corner, styles.br]} />
                </View>
                <View style={styles.unfocusedContainer} />
              </View>
              <View style={styles.unfocusedContainer}>
                <Text style={styles.guideText}>{t('scanGuide')}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const WebQRScanner: React.FC<{
  onScan: (data: { data: string }) => void;
  onClose: () => void;
}> = ({ onScan, onClose }) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(true);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const { colors } = useAppStore();
  const { t } = useT();

  useEffect(() => {
    let active = true;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          setCamError(err?.message || 'Camera access denied');
          setCameraActive(false);
        });
    } else {
      setCameraActive(false);
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    onScan({ data: manualCode.trim() });
  };

  return (
    <View style={styles.webScannerRoot}>
      {cameraActive && !camError ? (
        <View style={styles.webVideoWrap}>
          {/* Real Web HTML5 Video element */}
          {React.createElement('video', {
            ref: videoRef,
            style: {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
            },
            playsInline: true,
            muted: true,
            autoPlay: true,
          })}

          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.middleContainer}>
              <View style={styles.unfocusedContainer} />
              <View style={styles.targetSquare}>
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
              </View>
              <View style={styles.unfocusedContainer} />
            </View>
            <View style={styles.unfocusedContainer}>
              <Text style={styles.guideText}>{t('scanGuide')}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.permissionContainer}>
          <QrCode color={colors.primary} size={56} />
          <Text style={styles.permTitle}>{t('scanModalTitle')}</Text>
          {camError ? (
            <Text style={[styles.permDesc, { color: colors.amber }]}>
              {camError} — يمكنك إدخال الكود يدويًا أدناه
            </Text>
          ) : (
            <Text style={styles.permDesc}>{t('scanCardSubtitle')}</Text>
          )}
        </View>
      )}

      {/* Quick Manual Code Input Strip */}
      <View style={[styles.webManualStrip, { backgroundColor: colors.card, borderColor: colors.line }]}>
        <TextInput
          style={[
            styles.webCodeInput,
            {
              backgroundColor: colors.bg,
              color: colors.txt,
              borderColor: colors.line,
            },
          ]}
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="أو اكتب الكود هنا (مثال: A8K9X2)"
          placeholderTextColor={colors.mut}
          autoCapitalize="characters"
          onSubmitEditing={handleManualSubmit}
        />
        <CustomButton
          title="تأكيد"
          onPress={handleManualSubmit}
          variant="teal"
          size="mid"
          disabled={!manualCode.trim()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webScannerRoot: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
  },
  webVideoWrap: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  webManualStrip: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    zIndex: 20,
  },
  webCodeInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
  },
  header: {
    height: 60,
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  permDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  cameraWrap: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleContainer: {
    flexDirection: 'row',
    height: 260,
  },
  targetSquare: {
    width: 260,
    height: 260,
    borderRadius: Radii.lg,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#00554E',
  },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  guideText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
  },
});
