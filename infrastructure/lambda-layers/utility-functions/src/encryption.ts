/**
 * Encryption utilities for JAIIB-CAIIB Exam Prep Portal
 * Implements AES-256-GCM encryption for sensitive data
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

/**
 * Encrypts plaintext using AES-256-GCM
 * @param plaintext - The text to encrypt
 * @param key - The encryption key (should be 32 bytes for AES-256)
 * @returns Encrypted string in format: salt:iv:authTag:ciphertext (all hex-encoded)
 */
export function encrypt(plaintext: string, key: string): string {
  try {
    // Derive a consistent key from the provided key string
    const derivedKey = deriveKey(key);

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine: iv:authTag:ciphertext (all hex-encoded)
    const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;

    return result;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypts ciphertext encrypted with encrypt()
 * @param ciphertext - The encrypted text in format: iv:authTag:ciphertext
 * @param key - The encryption key (must be the same as used for encryption)
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string, key: string): string {
  try {
    // Derive the same key
    const derivedKey = deriveKey(key);

    // Parse the ciphertext
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid authentication tag length');
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a random encryption key
 * @returns A 32-byte (256-bit) key as a hex string
 */
export function generateKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Derives a consistent 32-byte key from a string using PBKDF2
 * @param keyString - The key string to derive from
 * @returns A 32-byte derived key
 */
function deriveKey(keyString: string): Buffer {
  // Use a fixed salt for consistency (in production, consider using a per-record salt)
  const salt = Buffer.from('jaiib-caiib-exam-prep-portal', 'utf8');

  // Derive key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(keyString, salt, 100000, 32, 'sha256');

  return derivedKey;
}

/**
 * Hashes a string using SHA-256
 * @param data - The data to hash
 * @returns The hash as a hex string
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verifies a hash against data
 * @param data - The original data
 * @param hash - The hash to verify against
 * @returns True if the hash matches, false otherwise
 */
export function verifyHash(data: string, hashValue: string): boolean {
  const computed = hash(data);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hashValue));
}
