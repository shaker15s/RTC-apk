/**
 * Native Haptic Feedback service using expo-haptics.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const RTCHaptics = {
  light(): void {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  },

  medium(): void {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  },

  heavy(): void {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
  },

  success(): void {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  },

  warning(): void {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
  },

  error(): void {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {}
  },

  selection(): void {
    if (Platform.OS === 'web') return;
    try {
      Haptics.selectionAsync();
    } catch (e) {}
  },
};
