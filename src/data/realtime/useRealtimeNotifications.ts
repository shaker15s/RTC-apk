/**
 * Realtime Notifications Hook
 * Automatically updates notification badges and triggers haptics on new notifications.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../../state/authStore';
import { useAppStore } from '../../state/appStore';
import { NotificationItem, Repository } from '../repositories';
import { RTCHaptics } from '../../core/native/haptics';

export function useRealtimeNotifications() {
  const { session } = useAuthStore();
  const { showToast, incrementUnread } = useAppStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id;

  const loadNotifications = async () => {
    if (!userId) return;
    try {
      const list = await Repository.fetchNotifications();
      setNotifications(list);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    if (!userId) return;

    const channel = supabase
      .channel(`user_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          setNotifications((prev) => [newNotif, ...prev]);
          incrementUnread();
          RTCHaptics.medium();
          showToast(newNotif.title, 'info');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    notifications,
    loading,
    refresh: loadNotifications,
  };
}
