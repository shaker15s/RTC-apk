/**
 * Native Notifications service using expo-notifications.
 * Handles both local scheduled reminders and remote push notifications.
 * Gracefully adapts when running in Expo Go or standalone APK build.
 */
import * as Notifications from 'expo-notifications';
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
   * Get device push token (only in standalone APK / production builds).
   */
  async getPushToken(): Promise<string | null> {
    if (Platform.OS === 'web' || isExpoGo) {
      return null;
    }
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data || null;
    } catch (e) {
      return null;
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
          title: 'محاضرتك بعد ساعة ⏰',
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
