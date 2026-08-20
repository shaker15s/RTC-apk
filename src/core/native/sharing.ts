/**
 * Native Share Sheet integration using expo-sharing & react-native Share.
 */
import * as Sharing from 'expo-sharing';
import { t } from '../i18n';
import { Share as RNShare, Platform } from 'react-native';
import { RTC_CONFIG } from '../config';

export const RTCSharing = {
  async shareText(title: string, message: string, url = RTC_CONFIG.appDownloadUrl): Promise<boolean> {
    if (Platform.OS === 'web') {
      try {
        if (navigator.share) {
          await navigator.share({ title, text: message, url });
          return true;
        } else {
          await navigator.clipboard.writeText(`${title}\n${message}\n${url}`);
          alert('Copied to clipboard!');
          return true;
        }
      } catch (e) {
        return false;
      }
    }
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
        dialogTitle: t('pdfShareTitle'),
      });
      return true;
    } catch (e) {
      return false;
    }
  },
};
