import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const OTP_SECRET = process.env.OTP_SECRET || process.env.JWT_SECRET || 'subflow-otp-cryptographic-salt-2026';

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export function generateSecureOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP using SHA-256 with server-side HMAC salt
 * OTPs are NEVER stored in plaintext.
 */
export function hashOTP(otp: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(otp.trim())
    .digest('hex');
}

/**
 * Verify a user-provided OTP against the stored hash
 */
export function verifyOTPHash(candidateOtp: string, storedHash: string): boolean {
  const candidateHash = hashOTP(candidateOtp);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(candidateHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Password Policy Enforcement:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordPolicy(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }
  return { valid: true };
}

/**
 * Gmail Address Verification & Normalization:
 * - Must strictly end in @gmail.com
 * - Trimmed and lowercased
 */
export function validateAndNormalizeGmail(email: string): { valid: boolean; normalized?: string; message?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'A valid email address is required.' };
  }

  const normalized = email.trim().toLowerCase();

  if (!normalized.endsWith('@gmail.com')) {
    return { valid: false, message: 'Only personal or Google Workspace addresses ending in @gmail.com are permitted for customer accounts.' };
  }

  // Basic email syntax check before the @
  const parts = normalized.split('@');
  if (parts.length !== 2 || parts[0].length === 0) {
    return { valid: false, message: 'Malformed Gmail address.' };
  }

  return { valid: true, normalized };
}

/**
 * Hash password securely using bcrypt with cost factor 10
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
