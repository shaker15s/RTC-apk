/**
 * Image Cache Helper
 * Handles prefetching and memory caching for avatar and course images.
 */
import { Image } from 'react-native';

class ImageCacheManager {
  private prefetchedUrls = new Set<string>();

  async prefetch(urls: string[]): Promise<void> {
    const promises = urls
      .filter((url) => url && !this.prefetchedUrls.has(url))
      .map(async (url) => {
        try {
          const success = await Image.prefetch(url);
          if (success) {
            this.prefetchedUrls.add(url);
          }
        } catch (e) {
          // Ignore prefetch failures
        }
      });

    await Promise.all(promises);
  }

  isCached(url: string): boolean {
    return this.prefetchedUrls.has(url);
  }

  clear(): void {
    this.prefetchedUrls.clear();
  }
}

export const RTCImageCache = new ImageCacheManager();
