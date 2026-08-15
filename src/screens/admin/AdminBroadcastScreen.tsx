/**
 * Admin Broadcast Alerts Screen (a-broadcast)
 * Broadcast urgent announcements and notifications to all users via admin_broadcast RPC.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { RPC } from '../../data/rpc';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { CustomButton } from '../../components/common/CustomButton';
import { RTCHaptics } from '../../core/native/haptics';
import { Send, Megaphone, AlertCircle, ShieldAlert } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const AdminBroadcastScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors, showToast } = useAppStore();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'urgent'>('info');
  const [sending, setSending] = useState(false);

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      showToast('يرجى ملء عنوان التنبيه ونص الرسالة', 'warn');
      return;
    }

    setSending(true);
    try {
      await RPC.broadcastNotice(
        'all',
        null,
        type === 'urgent' ? 'urgent' : 'info',
        title.trim(),
        message.trim()
      );

      RTCHaptics.success();
      showToast('تم إرسال التنبيه العام لجميع المستخدمين بنجاح 📢', 'ok');
      setTitle('');
      setMessage('');
      onBack();
    } catch (e: any) {
      showToast(e?.message || 'تعذر إرسال التنبيه', 'err');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title="إرسال تنبيه عام" subtitle="بث إشعار لجميع طلاب ومدربي المنظومة" showBack onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <CustomCard style={styles.formCard}>
          <View style={styles.formHeader}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
              <Megaphone color={colors.primary} size={28} />
            </View>
            <Text style={[styles.formTitle, { color: colors.txt }]}>تنبيه فوري لجميع المستخدمين</Text>
            <Text style={[styles.formSub, { color: colors.mut }]}>
              سيظهر هذا الإشعار في شاشات التنبيهات لدى جميع الطلاب والمتطوعين المسجلين في التطبيق.
            </Text>
          </View>

          <TextInputField
            label="عنوان الإشعار"
            value={title}
            onChangeText={setTitle}
            placeholder="مثال: بدء التسجيل في دورات الشهر القادم"
            required
          />

          <TextInputField
            label="نص الرسالة والتفاصيل"
            value={message}
            onChangeText={setMessage}
            placeholder="اكتب نص الإشعار بالتفصيل..."
            multiline
            numberOfLines={5}
            required
          />

          <CustomButton
            title="إرسال وبث التنبيه الآن"
            onPress={handleSendBroadcast}
            variant="primary"
            size="big"
            loading={sending}
            icon={<Send color="#FFFFFF" size={18} />}
            style={{ marginTop: 8 }}
          />
        </CustomCard>
      </ScrollView>
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
  },
  formCard: {
    padding: 20,
    gap: 12,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  formSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
});
