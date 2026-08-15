/**
 * ActionSheet Component
 * Smooth bottom sheet modal with backdrop blur and spring animations.
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  SlideInDown,
  SlideOutDown,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/appStore';
import { Radii } from '../../core/theme/tokens';
import { RTCHaptics } from '../../core/native/haptics';

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppStore();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback
          onPress={() => {
            RTCHaptics.light();
            onClose();
          }}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.backdrop}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.line,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={[styles.dragHandle, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }]} />

          {title ? (
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.txt }]}>{title}</Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: colors.mut }]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetContainer: {
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  content: {
    width: '100%',
  },
});
