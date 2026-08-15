/**
 * Encrypted Secure Storage for Masar RTC Native Mobile.
 * Uses iOS Keychain & Android Keystore via expo-secure-store.
 * Automatically chunks values larger than 1800 bytes to stay safely under
 * Android's 2048-byte SharedPreferences limit.
 */
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;
const memoryFallback: Record<string, string> = {};

export const RTCSecureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      // 1. Check if item was stored as multi-chunk
      const manifest = await SecureStore.getItemAsync(`${key}__chunks`);
      if (manifest) {
        const chunkCount = parseInt(manifest, 10);
        if (!isNaN(chunkCount) && chunkCount > 0) {
          let fullValue = '';
          for (let i = 0; i < chunkCount; i++) {
            const chunk = await SecureStore.getItemAsync(`${key}__chunk_${i}`);
            if (chunk === null) return null;
            fullValue += chunk;
          }
          return fullValue;
        }
      }

      // 2. Direct read for single chunk
      const value = await SecureStore.getItemAsync(key);
      if (value !== null) return value;
      return memoryFallback[key] || null;
    } catch (e) {
      return memoryFallback[key] || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      // If value is small, store directly
      if (value.length <= CHUNK_SIZE) {
        // Clean up any old chunks if existed previously
        await this.cleanChunks(key);
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
        return;
      }

      // Value exceeds chunk size - split into chunks
      const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
      for (let i = 0; i < chunkCount; i++) {
        const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await SecureStore.setItemAsync(`${key}__chunk_${i}`, chunk, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      }
      await SecureStore.setItemAsync(`${key}__chunks`, String(chunkCount), {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
      // Remove unchunked key if present
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch (e) {
      memoryFallback[key] = value;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await this.cleanChunks(key);
      await SecureStore.deleteItemAsync(key).catch(() => {});
      delete memoryFallback[key];
    } catch (e) {
      delete memoryFallback[key];
    }
  },

  async cleanChunks(key: string): Promise<void> {
    try {
      const manifest = await SecureStore.getItemAsync(`${key}__chunks`);
      if (manifest) {
        const chunkCount = parseInt(manifest, 10);
        for (let i = 0; i < chunkCount; i++) {
          await SecureStore.deleteItemAsync(`${key}__chunk_${i}`).catch(() => {});
        }
        await SecureStore.deleteItemAsync(`${key}__chunks`).catch(() => {});
      }
    } catch (e) {}
  },

  async clear(): Promise<void> {
    try {
      // Clear the known Supabase session keys from SecureStore
      const supabaseKeys = [
        'supabase-auth-token',
        'supabase.auth.token',
        'sb-jwhedqmszbdougsqqmhv-auth-token',
      ];
      for (const key of supabaseKeys) {
        await this.removeItem(key);
      }
      // Also clear memory fallback
      for (const k in memoryFallback) delete memoryFallback[k];
    } catch (e) {
      for (const k in memoryFallback) delete memoryFallback[k];
    }
  },
};
