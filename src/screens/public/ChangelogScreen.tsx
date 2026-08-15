/**
 * Changelog & What's New Screen (changelog)
 * Documents application releases, upgrades, and feature announcements.
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { CustomCard } from '../../components/common/CustomCard';
import { Sparkles, Check, ShieldCheck, Zap } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export interface ChangelogScreenProps {
  onBack: () => void;
}

export const ChangelogScreen: React.FC<ChangelogScreenProps> = ({ onBack }) => {
  const { colors } = useAppStore();

  const releases = [
    {
      version: 'v100.2.0 (تجربة النيتف الكاملة)',
      date: 'أغسطس 2026',
      badge: 'تحديث كبير',
      items: [
        '🧭 تنقل نيتف حقيقي: انتقالات أصلية ورجوع بالسحب ودعم الروابط العميقة',
        '📅 سجل حضور تفصيلي لكل محاضرة بحالتها ونقاطها وتاريخها',
        '🏆 مشاركة الشهادة كصورة معتمدة بتصميم رسمي ورمز QR موثّق',
        '♿ تحسينات إمكانية الوصول: أسماء وأدوار لكل الأزرار والحقول والمفاتيح',
        '🔗 فتح صفحة التحقق تلقائياً عند الدخول من رابط شهادة',
      ],
    },
    {
      version: 'v100.1.0 (تحديث الجودة الشامل)',
      date: 'أغسطس 2026',
      badge: 'إصلاحات QA',
      items: [
        '🔧 زر منح النقاط للمشرفين أصبح حقيقياً ومتصلاً بقاعدة البيانات',
        '🔔 إشعارات وتذكيرات المحاضرات متصلة الآن وتسجيل جهازك للتنبيهات',
        '📶 وضع الأوفلاين الحقيقي: كشف الشبكة وشريط التنبيه يعملان فعلياً',
        '📷 رمز QR حقيقي قابل للمسح في جلسات المدرب وشهاداتك الموثقة',
        '🛡️ إخفاء أرقام هواتف الطلاب افتراضياً مع نسخ بضغطة واحدة',
        '📎 فحص نوع وحجم الملفات المرفوعة + حفظ الامتداد الصحيح',
        '🌐 رابط الانضمام للمحاضرات الأونلاين يظهر مباشرة في دوراتك',
        '🚀 بدء أسرع للتطبيق، خروج مزدوج آمن، وبحث أذكى للمشرفين',
      ],
    },
    {
      version: 'v100.0.0 (النسخة الاحترافية الشاملة)',
      date: 'أغسطس 2026',
      badge: 'إصدار رئيسي',
      items: [
        '✨ واجهة نيتف فائقة السرعة مع رسوم متحركة 60fps باستخدام Reanimated',
        '⚡ تحديثات فورية حية Realtime عبر Supabase للحضور والإشعارات',
        '📊 لوحة تحليلات تنفيذية مزودة بمخططات SVG تفاعلية',
        '⭐ نظام تقييم الكورسات والمدربين بعد إتمام المحاضرات',
        '📝 تقارير المحاضرات الذكية للمدربين والمتطوعين',
        '🔒 تشفير محلي آمن للجلسات عبر Keychain و Android Keystore',
        '📱 دعم كامل للغة العربية RTL',
      ],
    },
    {
      version: 'v1.0.0',
      date: 'يوليو 2026',
      badge: 'الإطلاق الأولي',
      items: [
        '🚀 إطلاق منصة مسار RTC لمراكز رسالة للتدريب',
        '🎓 إدارة المجموعات، الحضور بالباركود، الشهادات، والنقاط',
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title="ما الجديد؟"
        subtitle="سجل التحديثات والتطوير"
        showBack
        onBack={onBack}
        showNotif={false}
        showAvatar={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {releases.map((rel) => (
          <CustomCard key={rel.version} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                <Sparkles color={colors.primary} size={14} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>{rel.badge}</Text>
              </View>
              <Text style={[styles.dateText, { color: colors.mut }]}>{rel.date}</Text>
            </View>

            <Text style={[styles.versionTitle, { color: colors.txt }]}>{rel.version}</Text>

            <View style={styles.itemsList}>
              {rel.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={[styles.itemText, { color: colors.txt }]}>{item}</Text>
                </View>
              ))}
            </View>
          </CustomCard>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    padding: 20,
    borderRadius: Radii.xxl,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
  },
  versionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemsList: {
    gap: 8,
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
