/**
 * Supabase Realtime Client & Generic Subscription Hooks
 * Listens to postgres_changes events on tables with automatic cleanup and event mapping.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeSubscriptionOptions<T> {
  table: string;
  schema?: string;
  filter?: string;
  onInsert?: (row: T) => void;
  onUpdate?: (row: T) => void;
  onDelete?: (oldRow: { id: string }) => void;
  enabled?: boolean;
}

export function useRealtimeTable<T = any>({
  table,
  schema = 'public',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: RealtimeSubscriptionOptions<T>) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime_${table}_${filter || 'all'}_${Date.now()}`;
    let sub = supabase.channel(channelName);

    const filterConfig: any = {
      event: '*',
      schema,
      table,
    };
    if (filter) {
      filterConfig.filter = filter;
    }

    sub = sub.on(
      'postgres_changes' as any,
      filterConfig,
      (payload: any) => {
        if (payload.eventType === 'INSERT' && onInsert) {
          onInsert(payload.new as T);
        } else if (payload.eventType === 'UPDATE' && onUpdate) {
          onUpdate(payload.new as T);
        } else if (payload.eventType === 'DELETE' && onDelete) {
          onDelete(payload.old as { id: string });
        }
      }
    );

    sub.subscribe();
    setChannel(sub);

    return () => {
      supabase.removeChannel(sub);
    };
  }, [table, schema, filter, enabled]);

  return channel;
}
