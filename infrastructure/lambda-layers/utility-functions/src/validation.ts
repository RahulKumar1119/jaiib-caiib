/**
 * Validation utilities for JAIIB-CAIIB Exam Prep Portal
 */

import { REGEX_PATTERNS, PASSWORD_CONFIG, JAIIB_PAPERS } from './constants';

/**
 * Validates email format (RFC 5322 compliant)
 * @param email - The email to validate
 * @returns True if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic RFC 5322 validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validates password strength
 * Requirements: 8+ chars, uppercase, lowercase, numeric
 * @param password - The password to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`,
    };
  }

  if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (PASSWORD_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (PASSWORD_CONFIG.REQUIRE_NUMERIC && !/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one numeric character' };
  }

  return { isValid: true };
}

/**
 * Validates UUID format
 * @param uuid - The UUID to validate
 * @returns True if valid, false otherwise
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  return REGEX_PATTERNS.UUID.test(uuid);
}

/**
 * Validates DynamoDB key format
 * @param key - The key to validate
 * @returns True if valid, false otherwise
 */
export function validateDynamoDBKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Key should not be empty and should not exceed 2048 bytes
  return key.length > 0 && key.length <= 2048;
}

/**
 * Validates JAIIB paper
 * @param paper - The paper to validate
 * @returns True if valid, false otherwise
 */
export function validateJAIIBPaper(paper: string): boolean {
  if (!paper || typeof paper !== 'string') {
    return false;
  }

  return Object.values(JAIIB_PAPERS).includes(paper as any);
}

/**
 * Validates difficulty level
 * @param difficulty - The difficulty level to validate
 * @returns True if valid, false otherwise
 */
export function validateDifficultyLevel(difficulty: string): boolean {
  if (!difficulty || typeof difficulty !== 'string') {
    return false;
  }

  return ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase());
}

/**
 * Validates MCQ answer option
 * @param answer - The answer to validate
 * @returns True if valid, false otherwise
 */
export function validateMCQAnswer(answer: string): boolean {
  if (!answer || typeof answer !== 'string') {
    return false;
  }

  return ['A', 'B', 'C', 'D'].includes(answer.toUpperCase());
}

/**
 * Validates question text
 * @param questionText - The question text to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateQuestionText(questionText: string): { isValid: boolean; error?: string } {
  if (!questionText || typeof questionText !== 'string') {
    return { isValid: false, error: 'Question text is required' };
  }

  if (questionText.trim().length < 10) {
    return { isValid: false, error: 'Question text must be at least 10 characters long' };
  }

  if (questionText.length > 1000) {
    return { isValid: false, error: 'Question text must not exceed 1000 characters' };
  }

  return { isValid: true };
}

/**
 * Validates MCQ option text
 * @param option - The option text to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateMCQOption(option: string): { isValid: boolean; error?: string } {
  if (!option || typeof option !== 'string') {
    return { isValid: false, error: 'Option text is required' };
  }

  if (option.trim().length === 0) {
    return { isValid: false, error: 'Option text cannot be empty' };
  }

  if (option.length > 500) {
    return { isValid: false, error: 'Option text must not exceed 500 characters' };
  }

  return { isValid: true };
}

/**
 * Validates that all MCQ options are unique
 * @param optionA - Option A
 * @param optionB - Option B
 * @param optionC - Option C
 * @param optionD - Option D
 * @returns Object with isValid flag and error message if invalid
 */
export function validateMCQOptionsUnique(
  optionA: string,
  optionB: string,
  optionC: string,
  optionD: string
): { isValid: boolean; error?: string } {
  const options = [optionA, optionB, optionC, optionD];
  const uniqueOptions = new Set(options.map((o) => o.toLowerCase().trim()));

  if (uniqueOptions.size !== 4) {
    return { isValid: false, error: 'All MCQ options must be unique' };
  }

  return { isValid: true };
}

/**
 * Validates user role
 * @param role - The role to validate
 * @returns True if valid, false otherwise
 */
export function validateUserRole(role: string): boolean {
  if (!role || typeof role !== 'string') {
    return false;
  }

  return ['officer', 'admin', 'super_admin'].includes(role.toLowerCase());
}

/**
 * Validates user status
 * @param status - The status to validate
 * @returns True if valid, false otherwise
 */
export function validateUserStatus(status: string): boolean {
  if (!status || typeof status !== 'string') {
    return false;
  }

  return ['active', 'inactive', 'suspended'].includes(status.toLowerCase());
}

/**
 * Validates full name
 * @param fullName - The full name to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateFullName(fullName: string): { isValid: boolean; error?: string } {
  if (!fullName || typeof fullName !== 'string') {
    return { isValid: false, error: 'Full name is required' };
  }

  if (fullName.trim().length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters long' };
  }

  if (fullName.length > 100) {
    return { isValid: false, error: 'Full name must not exceed 100 characters' };
  }

  return { isValid: true };
}

/**
 * Validates tenant ID
 * @param tenantId - The tenant ID to validate
 * @returns True if valid, false otherwise
 */
export function validateTenantId(tenantId: string): boolean {
  if (!tenantId || typeof tenantId !== 'string') {
    return false;
  }

  return tenantId.length > 0 && tenantId.length <= 100;
}

/**
 * Validates IP address (IPv4 or IPv6)
 * @param ip - The IP address to validate
 * @returns True if valid, false otherwise
 */
export function validateIPAddress(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  // IPv4 pattern - validates each octet is 0-255
  const ipv4Pattern = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * Validates timestamp (Unix timestamp in seconds)
 * @param timestamp - The timestamp to validate
 * @returns True if valid, false otherwise
 */
export function validateTimestamp(timestamp: number): boolean {
  if (typeof timestamp !== 'number') {
    return false;
  }

  // Timestamp should be a positive number and not too far in the future
  const now = Math.floor(Date.now() / 1000);
  const maxFutureSeconds = 365 * 24 * 60 * 60; // 1 year

  return timestamp > 0 && timestamp < now + maxFutureSeconds;
}
