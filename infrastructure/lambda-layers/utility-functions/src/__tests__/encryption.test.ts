/**
 * Tests for encryption utilities
 */

import { encrypt, decrypt, generateKey, hash, verifyHash } from '../encryption';

describe('Encryption Utilities', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const plaintext = 'Hello, World!';
      const key = generateKey();

      const encrypted = encrypt(plaintext, key);
      const decrypted = decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for the same plaintext', () => {
      const plaintext = 'Hello, World!';
      const key = generateKey();

      const encrypted1 = encrypt(plaintext, key);
      const encrypted2 = encrypt(plaintext, key);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should fail to decrypt with wrong key', () => {
      const plaintext = 'Hello, World!';
      const key1 = generateKey();
      const key2 = generateKey();

      const encrypted = encrypt(plaintext, key1);

      expect(() => decrypt(encrypted, key2)).toThrow();
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const key = generateKey();

      const encrypted = encrypt(plaintext, key);
      const decrypted = decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(10000);
      const key = generateKey();

      const encrypted = encrypt(plaintext, key);
      const decrypted = decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const key = generateKey();

      const encrypted = encrypt(plaintext, key);
      const decrypted = decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '你好世界 🌍 مرحبا بالعالم';
      const key = generateKey();

      const encrypted = encrypt(plaintext, key);
      const decrypted = decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('generateKey', () => {
    it('should generate a 64-character hex string (32 bytes)', () => {
      const key = generateKey();

      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate different keys each time', () => {
      const key1 = generateKey();
      const key2 = generateKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('hash and verifyHash', () => {
    it('should hash data consistently', () => {
      const data = 'test data';

      const hash1 = hash(data);
      const hash2 = hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', () => {
      const hash1 = hash('data1');
      const hash2 = hash('data2');

      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct hash', () => {
      const data = 'test data';
      const hashValue = hash(data);

      expect(verifyHash(data, hashValue)).toBe(true);
    });

    it('should reject incorrect hash', () => {
      const data = 'test data';
      const wrongHash = hash('different data');

      expect(verifyHash(data, wrongHash)).toBe(false);
    });

    it('should produce 64-character hex string (SHA-256)', () => {
      const hashValue = hash('test');

      expect(hashValue).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
