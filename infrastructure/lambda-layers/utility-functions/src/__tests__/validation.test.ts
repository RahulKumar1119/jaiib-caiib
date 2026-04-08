/**
 * Tests for validation utilities
 */

import {
  validateEmail,
  validatePassword,
  validateUUID,
  validateDynamoDBKey,
  validateJAIIBPaper,
  validateDifficultyLevel,
  validateMCQAnswer,
  validateQuestionText,
  validateMCQOption,
  validateMCQOptionsUnique,
  validateUserRole,
  validateUserStatus,
  validateFullName,
  validateTenantId,
  validateIPAddress,
  validateTimestamp,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null as any)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('SecurePass123');
      expect(result.isValid).toBe(true);
    });

    it('should reject passwords that are too short', () => {
      const result = validatePassword('Short1');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 8 characters');
    });

    it('should reject passwords without uppercase', () => {
      const result = validatePassword('lowercase123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('should reject passwords without lowercase', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('lowercase');
    });

    it('should reject passwords without numeric', () => {
      const result = validatePassword('NoNumbers');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('numeric');
    });

    it('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(validateUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(validateUUID('not-a-uuid')).toBe(false);
      expect(validateUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(validateUUID('')).toBe(false);
      expect(validateUUID(null as any)).toBe(false);
    });
  });

  describe('validateDynamoDBKey', () => {
    it('should validate valid keys', () => {
      expect(validateDynamoDBKey('valid-key')).toBe(true);
      expect(validateDynamoDBKey('tenant#user')).toBe(true);
    });

    it('should reject empty keys', () => {
      expect(validateDynamoDBKey('')).toBe(false);
      expect(validateDynamoDBKey(null as any)).toBe(false);
    });
  });

  describe('validateJAIIBPaper', () => {
    it('should validate correct papers', () => {
      expect(validateJAIIBPaper('JAIIB_IE_IFS')).toBe(true);
      expect(validateJAIIBPaper('JAIIB_PPB')).toBe(true);
      expect(validateJAIIBPaper('JAIIB_AFB')).toBe(true);
      expect(validateJAIIBPaper('JAIIB_RBWM')).toBe(true);
    });

    it('should reject invalid papers', () => {
      expect(validateJAIIBPaper('INVALID_PAPER')).toBe(false);
      expect(validateJAIIBPaper('')).toBe(false);
      expect(validateJAIIBPaper(null as any)).toBe(false);
    });
  });

  describe('validateDifficultyLevel', () => {
    it('should validate correct difficulty levels', () => {
      expect(validateDifficultyLevel('easy')).toBe(true);
      expect(validateDifficultyLevel('medium')).toBe(true);
      expect(validateDifficultyLevel('hard')).toBe(true);
      expect(validateDifficultyLevel('EASY')).toBe(true);
    });

    it('should reject invalid difficulty levels', () => {
      expect(validateDifficultyLevel('invalid')).toBe(false);
      expect(validateDifficultyLevel('')).toBe(false);
      expect(validateDifficultyLevel(null as any)).toBe(false);
    });
  });

  describe('validateMCQAnswer', () => {
    it('should validate correct answers', () => {
      expect(validateMCQAnswer('A')).toBe(true);
      expect(validateMCQAnswer('B')).toBe(true);
      expect(validateMCQAnswer('C')).toBe(true);
      expect(validateMCQAnswer('D')).toBe(true);
      expect(validateMCQAnswer('a')).toBe(true);
    });

    it('should reject invalid answers', () => {
      expect(validateMCQAnswer('E')).toBe(false);
      expect(validateMCQAnswer('1')).toBe(false);
      expect(validateMCQAnswer('')).toBe(false);
      expect(validateMCQAnswer(null as any)).toBe(false);
    });
  });

  describe('validateQuestionText', () => {
    it('should validate valid question text', () => {
      const result = validateQuestionText('What is the capital of India?');
      expect(result.isValid).toBe(true);
    });

    it('should reject question text that is too short', () => {
      const result = validateQuestionText('Short');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 10 characters');
    });

    it('should reject question text that is too long', () => {
      const result = validateQuestionText('a'.repeat(1001));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must not exceed 1000 characters');
    });

    it('should reject empty question text', () => {
      const result = validateQuestionText('');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateMCQOption', () => {
    it('should validate valid options', () => {
      const result = validateMCQOption('This is a valid option');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty options', () => {
      const result = validateMCQOption('');
      expect(result.isValid).toBe(false);
    });

    it('should reject options that are too long', () => {
      const result = validateMCQOption('a'.repeat(501));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must not exceed 500 characters');
    });
  });

  describe('validateMCQOptionsUnique', () => {
    it('should validate unique options', () => {
      const result = validateMCQOptionsUnique('Option A', 'Option B', 'Option C', 'Option D');
      expect(result.isValid).toBe(true);
    });

    it('should reject duplicate options', () => {
      const result = validateMCQOptionsUnique('Option A', 'Option A', 'Option C', 'Option D');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be unique');
    });

    it('should reject case-insensitive duplicates', () => {
      const result = validateMCQOptionsUnique('Option A', 'option a', 'Option C', 'Option D');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateUserRole', () => {
    it('should validate correct roles', () => {
      expect(validateUserRole('officer')).toBe(true);
      expect(validateUserRole('admin')).toBe(true);
      expect(validateUserRole('super_admin')).toBe(true);
      expect(validateUserRole('OFFICER')).toBe(true);
    });

    it('should reject invalid roles', () => {
      expect(validateUserRole('invalid')).toBe(false);
      expect(validateUserRole('')).toBe(false);
      expect(validateUserRole(null as any)).toBe(false);
    });
  });

  describe('validateUserStatus', () => {
    it('should validate correct statuses', () => {
      expect(validateUserStatus('active')).toBe(true);
      expect(validateUserStatus('inactive')).toBe(true);
      expect(validateUserStatus('suspended')).toBe(true);
    });

    it('should reject invalid statuses', () => {
      expect(validateUserStatus('invalid')).toBe(false);
      expect(validateUserStatus('')).toBe(false);
      expect(validateUserStatus(null as any)).toBe(false);
    });
  });

  describe('validateFullName', () => {
    it('should validate valid full names', () => {
      const result = validateFullName('John Doe');
      expect(result.isValid).toBe(true);
    });

    it('should reject names that are too short', () => {
      const result = validateFullName('J');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 2 characters');
    });

    it('should reject names that are too long', () => {
      const result = validateFullName('a'.repeat(101));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must not exceed 100 characters');
    });

    it('should reject empty names', () => {
      const result = validateFullName('');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateTenantId', () => {
    it('should validate valid tenant IDs', () => {
      expect(validateTenantId('tenant-123')).toBe(true);
      expect(validateTenantId('org-abc')).toBe(true);
    });

    it('should reject empty tenant IDs', () => {
      expect(validateTenantId('')).toBe(false);
      expect(validateTenantId(null as any)).toBe(false);
    });
  });

  describe('validateIPAddress', () => {
    it('should validate IPv4 addresses', () => {
      expect(validateIPAddress('192.168.1.1')).toBe(true);
      expect(validateIPAddress('10.0.0.1')).toBe(true);
      expect(validateIPAddress('255.255.255.255')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(validateIPAddress('256.256.256.256')).toBe(false);
      expect(validateIPAddress('192.168.1')).toBe(false);
    });

    it('should reject empty IP addresses', () => {
      expect(validateIPAddress('')).toBe(false);
      expect(validateIPAddress(null as any)).toBe(false);
    });
  });

  describe('validateTimestamp', () => {
    it('should validate valid timestamps', () => {
      const now = Math.floor(Date.now() / 1000);
      expect(validateTimestamp(now)).toBe(true);
      expect(validateTimestamp(now - 3600)).toBe(true); // 1 hour ago
    });

    it('should reject invalid timestamps', () => {
      expect(validateTimestamp(0)).toBe(false);
      expect(validateTimestamp(-1)).toBe(false);
      expect(validateTimestamp(NaN)).toBe(false);
    });

    it('should reject timestamps too far in the future', () => {
      const now = Math.floor(Date.now() / 1000);
      const twoYearsFromNow = now + 2 * 365 * 24 * 60 * 60;
      expect(validateTimestamp(twoYearsFromNow)).toBe(false);
    });
  });
});
