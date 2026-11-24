import crypto from 'crypto';
import { hashToken } from './tokens.js';

export const SIGNUP_OTP_TTL_MINUTES = 15;
const OTP_TTL_MS = SIGNUP_OTP_TTL_MINUTES * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

export function generateSignupOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashSignupOtp(otp) {
  return hashToken(`signup:${String(otp).trim()}`);
}

export function signupOtpExpiresAt() {
  return new Date(Date.now() + OTP_TTL_MS);
}

export function verifySignupOtp(otp, otpHash) {
  if (!otp || !otpHash) return false;
  const candidate = hashSignupOtp(otp);
  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(otpHash, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export { MAX_VERIFY_ATTEMPTS };