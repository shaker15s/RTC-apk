/**
 * Background Sync Queue for offline resilience.
 * Queues non-critical mutations (e.g. excuse drafts, rating submissions) when offline and flushes upon reconnection.
 */
import { RTCSecureStorage } from '../storage/secureStorage';

export interface PendingAction {
  id: string;
  actionType: 'submit_rating' | 'submit_excuse' | 'mark_attendance';
  payload: any;
  queuedAt: number;
}

const SYNC_QUEUE_KEY = 'rtc_pending_actions_queue';

class BackgroundSyncManager {
  async queueAction(actionType: PendingAction['actionType'], payload: any): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newAction: PendingAction = {
        id: `${Date.now()}_${Math.random()}`,
        actionType,
        payload,
        queuedAt: Date.now(),
      };
      queue.push(newAction);
      await RTCSecureStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {}
  }

  async getQueue(): Promise<PendingAction[]> {
    try {
      const raw = await RTCSecureStorage.getItem(SYNC_QUEUE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  async clearQueue(): Promise<void> {
    await RTCSecureStorage.removeItem(SYNC_QUEUE_KEY);
  }
}

export const RTCBackgroundSync = new BackgroundSyncManager();
