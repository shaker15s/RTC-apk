/**
 * SuccessAnimation Overlay Component
 * Fullscreen celebration / success dialog with animated checkmark and haptics.
 */
import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useAppStore } from '../../state/appStore';
import { CheckCircle2 } from 'lucide-react-native';
import { RTCHaptics } from '../../core/native/haptics';
import { SpringConfigs } from '../../core/animations';
import { Radii, Shadows } from '../../core/theme/tokens';

export interface SuccessAnimationProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onFinish: () => void;
  autoDismissMs?: number;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  visible,
  title,
  subtitle,
  onFinish,
  autoDismissMs = 2000,
}) => {
  const { colors } = useAppStore();
  const scale = useSharedValue(0.3);

  useEffect(() => {
    if (visible) {
      RTCHaptics.success();
      scale.value = withSpring(1, SpringConfigs.bouncy);

      const timer = setTimeout(() => {
        onFinish();
      }, autoDismissMs);

      return () => clearTimeout(timer);
    } else {
      scale.value = 0.3;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.backdrop}
        />
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.line },
            Shadows.medium,
            animatedStyle,
          ]}
        >
          <View style={styles.iconCircle}>
            <CheckCircle2 color="#22C55E" size={56} />
          </View>
          <Text style={[styles.title, { color: colors.txt }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mut }]}>
              {subtitle}
            </Text>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    width: '88%',
    maxWidth: 320,
    borderRadius: Radii.xxl,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
