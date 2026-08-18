import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { RTCHaptics } from '../../core/native/haptics';
import { ConfettiCelebration } from '../common/ConfettiCelebration';
import { Sparkles, Heart, Zap, Award, Flame, X } from 'lucide-react-native';
import { Radii, Shadows } from '../../core/theme/tokens';

const { width } = Dimensions.get('window');

export type EasterEggType = 'dev_mode' | 'resala_cheer' | 'streak_legend' | 'matrix_gold' | 'lucky_biscuit';

interface EasterEggModalProps {
  visible: boolean;
  type: EasterEggType;
  onClose: () => void;
  extraData?: string;
}

const EGG_CONTENTS: Record<EasterEggType, { title: string; subtitle: string; emoji: string; quote: string; color: string; badge: string }> = {
  dev_mode: {
    title: 'وضع صانع المعجزات 🛠️⚡',
    subtitle: 'أنت فتحت بوابة المطورين السرية!',
    emoji: '🚀',
    quote: '"أفضل كود برمجته هو اللي بيرسم ابتسامة على وش متطوع أو طالب في رسالة."',
    color: '#00288E',
    badge: 'SECRET DEVELOPER UNLOCKED',
  },
  resala_cheer: {
    title: 'روح رسالة تصنع الفارق ❤️✨',
    subtitle: 'سر التطوع الحقيقي',
    emoji: '🌟',
    quote: '"التطوع مش مجرد وقت بتديه.. ده أثر بيفضل، وعلم بينفع، وأجر مابيخلصش!"',
    color: '#E11D48',
    badge: 'RESALA GOLDEN SPIRIT',
  },
  streak_legend: {
    title: 'أسطورة الالتزام 🔥👑',
    subtitle: 'حضور مستمر والتزام حديدي!',
    emoji: '🏆',
    quote: '"السر مش في البدايات، السر في الاستمرار.. وأنت أثبتت إنك بطل حقيقي!"',
    color: '#D97706',
    badge: 'LEGENDARY STREAK',
  },
  matrix_gold: {
    title: 'كود الحظ السعيد 🍀🎲',
    subtitle: 'لقيت البيضة الذهبية النادرة!',
    emoji: '💎',
    quote: '"مبروك! رصيد حظك اليوم ارتفع 1000%! شارك الطاقة الإيجابية مع زمايلك في القاعة."',
    color: '#059669',
    badge: 'EASTER EGG MASTER',
  },
  lucky_biscuit: {
    title: 'بسكوتة التميز 🍪✨',
    subtitle: 'جرعة دعم وتفاؤل سريعة',
    emoji: '🎈',
    quote: '"ابتسم، المحاضرة اللي جاية هتفهم كل كلمة فيها وهتطلع الأول على الدفعة!"',
    color: '#7C3AED',
    badge: 'GOOD VIBES ONLY',
  },
};

export const EasterEggModal: React.FC<EasterEggModalProps> = ({
  visible,
  type,
  onClose,
  extraData,
}) => {
  const content = EGG_CONTENTS[type] || EGG_CONTENTS.resala_cheer;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      try {
        RTCHaptics.notificationSuccess();
      } catch (e) {}
      scaleAnim.setValue(0.3);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {visible && <ConfettiCelebration active count={50} />}

        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Close floating button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              RTCHaptics.light();
              onClose();
            }}
            style={styles.closeBtn}
          >
            <X color="#64748B" size={20} />
          </TouchableOpacity>

          <View style={[styles.badgePill, { backgroundColor: content.color + '18' }]}>
            <Sparkles color={content.color} size={14} />
            <Text style={[styles.badgeText, { color: content.color }]}>{content.badge}</Text>
          </View>

          <Text style={styles.emoji}>{content.emoji}</Text>

          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>

          <View style={[styles.quoteBox, { borderColor: content.color + '30', backgroundColor: content.color + '08' }]}>
            <Text style={styles.quoteText}>{content.quote}</Text>
          </View>

          {extraData ? (
            <Text style={styles.extra}>{extraData}</Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              RTCHaptics.selection();
              onClose();
            }}
            style={[styles.actionBtn, { backgroundColor: content.color }]}
          >
            <Heart color="#FFFFFF" size={18} fill="#FFFFFF" />
            <Text style={styles.actionBtnText}>أنا جاهز للمزيد من الإبداع! 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: width - 44,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xxl,
    padding: 24,
    alignItems: 'center',
    ...Shadows.strong,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  emoji: {
    fontSize: 54,
    marginVertical: 4,
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  quoteBox: {
    width: '100%',
    padding: 16,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 18,
  },
  quoteText: {
    fontSize: 13.5,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  extra: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
    marginBottom: 12,
  },
  actionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radii.xl,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
