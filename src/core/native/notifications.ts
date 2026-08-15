/**
 * Native Notifications service using expo-notifications.
 * Handles both local scheduled reminders and remote push notifications.
 * Gracefully adapts when running in Expo Go or standalone APK build.
 */
import * as Notifications from 'expo-notifications';
import { t } from '../i18n';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configure default notification presentation behavior
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {}

// Android local notifications are delivered through the "default"
// channel — pre-configure it with HIGH importance so lecture reminders
// show heads-up with sound (fixes silent/quiet reminders on Android 8+).
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'تذكيرات المحاضرات — Lecture reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  }).catch(() => {});
}

export const RTCNotifications = {
  /**
   * Request notification permissions for local and remote notifications.
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      return false;
    }
  },

  /**
   * Get device push token WITHOUT prompting (only if permission is
   * already granted). Permission is requested contextually elsewhere
   * (after profile completion — see OnboardingScreen).
   */
  async getPushToken(): Promise<string | null> {
    if (Platform.OS === 'web' || isExpoGo) {
      return null;
    }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return null;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Silently sync this device's push token with the backend.
   * Never prompts — call requestPermissions() first where a prompt
   * makes sense (e.g. after profile completion).
   */
  async syncPushRegistration(): Promise<void> {
    if (Platform.OS === 'web' || isExpoGo) return;
    try {
      const token = await this.getPushToken();
      if (!token) return;

      // Import lazily to avoid a module cycle (notifications ↔ rpc).
      const { RPC } = require('../../data/rpc');
      await RPC.registerPushDevice(
        token,
        Platform.OS === 'ios' ? 'ios' : 'android'
      ).catch(() => {});
    } catch (e) {
      // non-fatal — registration will be retried on next app foreground
    }
  },

  /**
   * Schedule a local lecture reminder 1 hour before start time.
   */
  async scheduleCourseReminder(
    batchId: string,
    title: string,
    startsAt: string,
    location?: string
  ): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    try {
      const starts = new Date(startsAt).getTime();
      const triggerTime = starts - 60 * 60 * 1000; // 1 hour before
      if (triggerTime <= Date.now()) return null;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: t('notifReminderTitle'),
          body: `${title} ${location ? '— ' + location : ''}`,
          data: { screen: 's-courses', batchId },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(triggerTime),
        },
      });
      return id;
    } catch (e) {
      return null;
    }
  },

  /**
   * Cancel all scheduled lecture reminders.
   */
  async cancelAllCourseReminders(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {}
  },
};
