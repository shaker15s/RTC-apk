/**
 * Support & Branch Directory Screen (support)
 * Direct hotline call (19450), official links, dynamic branch contacts, and interactive FAQ accordion.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { CustomButton } from '../../components/common/CustomButton';
import { RTCHaptics } from '../../core/native/haptics';
import { RTC_CONFIG } from '../../core/config';
import {
  PhoneCall,
  MapPin,
  Facebook,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  Building2,
} from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';

export const FAQ_LIST = [
  {
    q: 'هل الكورسات مجانية فعلاً؟',
    a: 'نعم، جميع الدورات والمقررات التدريبية في مراكز رسالة (RTC) مجانية بالكامل ١٠٠٪ من التسجيل وحتى استلام الشهادة المعتمدة.',
  },
  {
    q: 'كيف أسجّل حضوري في المحاضرة؟',
    a: 'يقوم المتطوع أو المدرب ببدء الجلسة وعرض رمز QR ورمز نصي. يمكنك مسح الرمز بكاميرا التطبيق أو كتابته يدوياً من تبويب «تسجيل حضوري».',
  },
  {
    q: 'فاتتني محاضرة بسبب ظرف طارئ، ماذا أفعل؟',
    a: 'يمكنك تقديم طلب عذر غياب من قائمة الإجراءات السريعة مع كتابة السبب وإرفاق مستند، وسيقوم المدرب بمراجعته وقبوله واحتساب المحاضرة معذورة.',
  },
  {
    q: 'كيف أحصل على شهادة إتمام الدورة؟',
    a: 'يشترط حضور ٧٥٪ على الأقل من محاضرات الدورة لتأهيلك تلقائياً لاستلام الشهادة الموثقة فور قيام المدرب بإغلاق الدفعة.',
  },
  {
    q: 'كيف أنضم كمتطوع أو مدرب في RTC؟',
    a: 'تبدأ جميع الحسابات في النظام كطلاب، ويمكنك التواصل مع إدارة الفرع أو مسؤول التدريب لترقية حسابك لمدرب من لوحة الإدارة.',
  },
];

export const SupportScreen: React.FC<{
  onBack?: () => void;
  onNavigate?: (screenId: string) => void;
}> = ({ onBack, onNavigate }) => {
  const { colors } = useAppStore();
  const { branches } = useAuthStore();

  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    RTCHaptics.selection();
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title="مركز المساعدة والدعم" subtitle="دليل الفروع والأسئلة الشائعة" showBack={!!onBack} onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hotline Hero Card */}
        <CustomCard style={[styles.hotlineCard, { borderColor: colors.teal }]}>
          <View style={[styles.hotlineIconCircle, { backgroundColor: colors.teal + '18' }]}>
            <PhoneCall color={colors.teal} size={30} />
          </View>
          <Text style={[styles.hotlineTitle, { color: colors.txt }]}>الخط الساخن لجمعية رسالة</Text>
          <Text style={[styles.hotlineSub, { color: colors.mut }]}>
            للاستفسارات العامة عن مواعيد ومقار الدورات التدريبية المتاحة
          </Text>

          <CustomButton
            title="اتصال مباشر: 19450"
            onPress={() => {
              RTCHaptics.light();
              Linking.openURL('tel:19450');
            }}
            variant="teal"
            size="big"
            icon={<PhoneCall color="#FFFFFF" size={18} />}
            style={{ width: '100%', marginTop: 6 }}
          />
        </CustomCard>

        {/* Official Links */}
        <CustomCard style={styles.linksCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL(RTC_CONFIG.officialUrl)}
            style={styles.linkRow}
          >
            <View style={styles.linkLeft}>
              <View style={[styles.linkIcon, { backgroundColor: colors.primarySoft }]}>
                <ExternalLink color={colors.primary} size={18} />
              </View>
              <Text style={[styles.linkText, { color: colors.txt }]}>الموقع الرسمي لمنصة مسار RTC</Text>
            </View>
            <ExternalLink color={colors.mut} size={16} />
          </TouchableOpacity>

          <View style={[styles.linkDivider, { backgroundColor: colors.line }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL(RTC_CONFIG.resalaActivityUrl)}
            style={styles.linkRow}
          >
            <View style={styles.linkLeft}>
              <View style={[styles.linkIcon, { backgroundColor: colors.teal + '18' }]}>
                <Building2 color={colors.teal} size={18} />
              </View>
              <Text style={[styles.linkText, { color: colors.txt }]}>صفحة نشاط RTC على موقع جمعية رسالة</Text>
            </View>
            <ExternalLink color={colors.mut} size={16} />
          </TouchableOpacity>
        </CustomCard>

        {/* Dynamic Branch Directory */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.txt }]}>دليل فروع مراكز التدريب</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mut }]}>عناوين وصفحات فروع رسالة الرسمية</Text>
        </View>

        {branches.map((branch) => (
          <CustomCard key={branch.id} style={styles.branchCard}>
            <View style={styles.branchHeader}>
              <View style={styles.branchTitleWrap}>
                <Text style={[styles.branchName, { color: colors.txt }]}>{branch.name_ar}</Text>
                {branch.city ? <Text style={[styles.branchCity, { color: colors.mut }]}>{branch.city}</Text> : null}
              </View>
            </View>

            {branch.address ? (
              <View style={styles.branchAddressRow}>
                <MapPin color={colors.mut} size={15} />
                <Text style={[styles.branchAddressText, { color: colors.mut }]}>{branch.address}</Text>
              </View>
            ) : null}

            <View style={styles.branchActions}>
              {branch.whatsapp ? (
                <CustomButton
                  title="واتساب"
                  onPress={() => Linking.openURL(`https://wa.me/${branch.whatsapp?.replace(/[^0-9]/g, '')}`)}
                  variant="soft"
                  size="sm"
                  style={{ flex: 1 }}
                />
              ) : null}

              {branch.facebook_url ? (
                <CustomButton
                  title="صفحة الفيسبوك"
                  onPress={() => Linking.openURL(branch.facebook_url!)}
                  variant="soft"
                  size="sm"
                  icon={<Facebook color="#1877F2" size={15} />}
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          </CustomCard>
        ))}

        {/* FAQ Accordion */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.txt }]}>الأسئلة الشائعة</Text>
        </View>

        {FAQ_LIST.map((faq, index) => {
          const isExpanded = expandedFaqIndex === index;
          return (
            <CustomCard key={index} style={styles.faqCard}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => toggleFaq(index)} style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: colors.txt }]}>{faq.q}</Text>
                {isExpanded ? <ChevronUp color={colors.primary} size={18} /> : <ChevronDown color={colors.mut} size={18} />}
              </TouchableOpacity>

              {isExpanded ? (
                <View style={styles.faqAnswerWrap}>
                  <Text style={[styles.faqAnswer, { color: colors.mut }]}>{faq.a}</Text>
                </View>
              ) : null}
            </CustomCard>
          );
        })}
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
    paddingTop: 12,
    paddingBottom: 90,
    gap: 14,
  },
  hotlineCard: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 8,
  },
  hotlineIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  hotlineTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  hotlineSub: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  linksCard: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  linkDivider: {
    height: 1,
  },
  sectionHeader: {
    marginTop: 6,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  branchCard: {
    padding: 16,
    gap: 10,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  branchTitleWrap: {
    flex: 1,
    gap: 2,
  },
  branchName: {
    fontSize: 15,
    fontWeight: '700',
  },
  branchCity: {
    fontSize: 12,
  },
  branchAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  branchAddressText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  branchActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  faqCard: {
    padding: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  faqQuestion: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  faqAnswerWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
  },
});
