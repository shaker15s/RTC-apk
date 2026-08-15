/**
 * Native Share Sheet integration using expo-sharing & react-native Share.
 */
import * as Sharing from 'expo-sharing';
import { Share as RNShare } from 'react-native';
import { RTC_CONFIG } from '../config';

export const RTCSharing = {
  async shareText(title: string, message: string, url = RTC_CONFIG.officialUrl): Promise<boolean> {
    try {
      const result = await RNShare.share({
        title,
        message: `${message}\n${url}`,
        url,
      });
      return result.action === RNShare.sharedAction;
    } catch (e) {
      return false;
    }
  },

  async shareFile(fileUri: string, mimeType?: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return false;
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: 'مشاركة ملف الشهادة',
      });
      return true;
    } catch (e) {
      return false;
    }
  },
};
