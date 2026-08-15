/**
 * WebCrypto & RandomValues Polyfill for React Native & Expo.
 * Polyfills global.crypto with getRandomValues and subtle.digest (SHA-256)
 * using expo-crypto to support Supabase PKCE standard hashing.
 */
import * as Crypto from 'expo-crypto';

if (typeof global.crypto !== 'object') {
  (global as any).crypto = {};
}

if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = (array: any) => {
    return Crypto.getRandomValues(array);
  };
}

if (!global.crypto.subtle) {
  (global.crypto as any).subtle = {
    digest: async (algorithm: string | { name: string }, data: ArrayBuffer | Uint8Array) => {
      const algoName = typeof algorithm === 'string' ? algorithm : algorithm.name;
      let expoAlgo: Crypto.CryptoDigestAlgorithm = Crypto.CryptoDigestAlgorithm.SHA256;

      if (algoName.toUpperCase().replace('-', '') === 'SHA256') {
        expoAlgo = Crypto.CryptoDigestAlgorithm.SHA256;
      } else if (algoName.toUpperCase().replace('-', '') === 'SHA1') {
        expoAlgo = Crypto.CryptoDigestAlgorithm.SHA1;
      } else if (algoName.toUpperCase().replace('-', '') === 'SHA512') {
        expoAlgo = Crypto.CryptoDigestAlgorithm.SHA512;
      }

      // Convert buffer to string/binary
      const uint8 = new Uint8Array(data);
      let binaryStr = '';
      for (let i = 0; i < uint8.length; i++) {
        binaryStr += String.fromCharCode(uint8[i]);
      }

      // Hash using expo-crypto
      const hex = await Crypto.digestStringAsync(expoAlgo, binaryStr, {
        encoding: Crypto.CryptoEncoding.HEX,
      });

      // Convert hex to ArrayBuffer
      const result = new Uint8Array(hex.match(/[\da-f]{2}/gi)!.map((h) => parseInt(h, 16)));
      return result.buffer;
    },
  };
}
