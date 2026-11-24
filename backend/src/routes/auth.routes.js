import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { hashToken, randomToken } from '../utils/tokens.js';
import { isSmtpConfigured, sendSignupOtpEmail } from '../utils/mail.js';
import {
  generateSignupOtp,
  hashSignupOtp,
  MAX_VERIFY_ATTEMPTS,
  signupOtpExpiresAt,
  verifySignupOtp,
} from '../utils/signup-otp.js';

const router = Router();
const credentials = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().max(190),
  password: z.string().min(10).max(72),
});

const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ''))
  .refine((digits) => /^\d{10}$/.test(digits), 'Contact number must be exactly 10 digits');

const registerBody = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(190),
  phone: phoneSchema,
  password: z.string().min(10).max(72),
});

const verifyBody = z.object({
  email: z.string().email().max(190),
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your email'),
});

const resendBody = z.object({
  email: z.string().email().max(190),
});

function issueToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

async function emailAlreadyRegistered(email) {
  const normalized = email.toLowerCase();
  const [existing] = await pool.execute('SELECT id FROM users WHERE email=? LIMIT 1', [normalized]);
  return existing.length > 0;
}

async function upsertSignupOtp({ email, name, phone, passwordHash, otpHash, expiresAt }) {
  const normalized = email.toLowerCase();
  await pool.execute(
    `INSERT INTO signup_email_otps (email, name, phone, password_hash, otp_hash, expires_at, attempts)
     VALUES (?,?,?,?,?,?,0)
     ON DUPLICATE KEY UPDATE
       name=VALUES(name),
       phone=VALUES(phone),
       password_hash=VALUES(password_hash),
       otp_hash=VALUES(otp_hash),
       expires_at=VALUES(expires_at),
       attempts=0`,
    [normalized, name, phone, passwordHash, otpHash, expiresAt]
  );
}

router.post('/register/send-otp', async (req, res, next) => {
  try {
    if (!isSmtpConfigured()) {
      return res.status(503).json({ message: 'Email service is not configured. Contact support.' });
    }

    const data = registerBody.parse(req.body);
    const email = data.email.toLowerCase();

    if (await emailAlreadyRegistered(email)) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const otp = generateSignupOtp();
    const otpHash = hashSignupOtp(otp);
    const expiresAt = signupOtpExpiresAt();

    await upsertSignupOtp({
      email,
      name: data.name,
      phone: data.phone,
      passwordHash,
      otpHash,
      expiresAt,
    });

    try {
      await sendSignupOtpEmail({ to: email, name: data.name, otp });
    } catch (mailErr) {
      console.error('SMTP send failed:', mailErr.message);
      return res.status(502).json({
        message:
          'Could not send verification email. Check SMTP settings (Gmail: use App Password on SMTP_USER).',
      });
    }

    const payload = { message: 'Verification code sent to your email.' };
    if (process.env.NODE_ENV !== 'production') {
      payload.devOtp = otp;
    }
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

router.post('/register/resend-otp', async (req, res, next) => {
  try {
    if (!isSmtpConfigured()) {
      return res.status(503).json({ message: 'Email service is not configured. Contact support.' });
    }

    const { email } = resendBody.parse(req.body);
    const normalized = email.toLowerCase();

    if (await emailAlreadyRegistered(normalized)) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const [rows] = await pool.execute(
      'SELECT name FROM signup_email_otps WHERE email=? LIMIT 1',
      [normalized]
    );
    if (!rows[0]) {
      return res.status(400).json({ message: 'No pending sign-up for this email. Start again.' });
    }

    const otp = generateSignupOtp();
    const otpHash = hashSignupOtp(otp);
    const expiresAt = signupOtpExpiresAt();

    await pool.execute(
      'UPDATE signup_email_otps SET otp_hash=?, expires_at=?, attempts=0 WHERE email=?',
      [otpHash, expiresAt, normalized]
    );

    try {
      await sendSignupOtpEmail({ to: normalized, name: rows[0].name, otp });
    } catch (mailErr) {
      console.error('SMTP resend failed:', mailErr.message);
      return res.status(502).json({
        message:
          'Could not send verification email. Check SMTP settings (Gmail: use App Password on SMTP_USER).',
      });
    }

    const payload = { message: 'A new verification code was sent.' };
    if (process.env.NODE_ENV !== 'production') {
      payload.devOtp = otp;
    }
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

router.post('/register/verify', async (req, res, next) => {
  try {
    const data = verifyBody.parse(req.body);
    const email = data.email.toLowerCase();

    const [rows] = await pool.execute(
      'SELECT id, name, phone, password_hash, otp_hash, expires_at, attempts FROM signup_email_otps WHERE email=? LIMIT 1',
      [email]
    );
    const pending = rows[0];
    if (!pending) {
      return res.status(400).json({ message: 'No pending sign-up for this email. Start again.' });
    }

    if (new Date(pending.expires_at) < new Date()) {
      await pool.execute('DELETE FROM signup_email_otps WHERE id=?', [pending.id]);
      return res.status(400).json({ message: 'Code expired. Request a new one.' });
    }

    if (pending.attempts >= MAX_VERIFY_ATTEMPTS) {
      await pool.execute('DELETE FROM signup_email_otps WHERE id=?', [pending.id]);
      return res.status(400).json({ message: 'Too many attempts. Start sign-up again.' });
    }

    if (!verifySignupOtp(data.otp, pending.otp_hash)) {
      await pool.execute('UPDATE signup_email_otps SET attempts=attempts+1 WHERE id=?', [pending.id]);
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (await emailAlreadyRegistered(email)) {
      await pool.execute('DELETE FROM signup_email_otps WHERE id=?', [pending.id]);
      return res.status(409).json({ message: 'Email already registered' });
    }

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, phone, password_hash, role, email_verified_at)
       VALUES (?,?,?,?,?,NOW())`,
      [pending.name, email, pending.phone || null, pending.password_hash, 'customer']
    );
    await pool.execute('DELETE FROM signup_email_otps WHERE id=?', [pending.id]);

    const user = { id: result.insertId, name: pending.name, email, role: 'customer' };
    res.status(201).json({ user, token: issueToken(user) });
  } catch (e) {
    next(e);
  }
});

router.post('/register', async (_req, res) => {
  res.status(400).json({
    message: 'Verify your email first. Use POST /auth/register/send-otp then /auth/register/verify.',
  });
});

router.post('/login', async (req, res, next) => {
  try {
    const data = credentials.omit({ name: true }).parse(req.body);
    const [rows] = await pool.execute(
      'SELECT id,name,email,password_hash,role,is_active FROM users WHERE email=? LIMIT 1',
      [data.email.toLowerCase()]
    );
    const user = rows[0];
    if (!user || !user.is_active || !(await bcrypt.compare(data.password, user.password_hash)))
      return res.status(401).json({ message: 'Invalid email or password' });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: issueToken(user),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id,name,email,phone,role,created_at AS createdAt FROM users WHERE id=? AND is_active=1',
      [req.user.sub]
    );
    if (!rows[0]) return res.status(401).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (e) {
    next(e);
  }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const data = z
      .object({
        name: z.string().min(2).max(120).optional(),
        phone: z.string().min(8).max(25).optional().nullable(),
        password: z.string().min(10).max(72).optional(),
      })
      .parse(req.body);
    const fields = [];
    const values = [];
    if (data.name) {
      fields.push('name=?');
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      fields.push('phone=?');
      values.push(data.phone);
    }
    if (data.password) {
      fields.push('password_hash=?');
      values.push(await bcrypt.hash(data.password, 12));
    }
    if (!fields.length) return res.status(400).json({ message: 'No updates' });
    values.push(req.user.sub);
    await pool.execute(`UPDATE users SET ${fields.join(',')} WHERE id=?`, values);
    res.json({ message: 'Profile updated' });
  } catch (e) {
    next(e);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const [rows] = await pool.execute('SELECT id FROM users WHERE email=? AND is_active=1', [email.toLowerCase()]);
    if (!rows[0]) {
      return res.json({ message: 'If that email exists, a reset link was sent' });
    }
    const raw = randomToken();
    const tokenHash = hashToken(raw);
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await pool.execute('UPDATE password_reset_tokens SET used_at=NOW() WHERE user_id=? AND used_at IS NULL', [
      rows[0].id,
    ]);
    await pool.execute(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)',
      [rows[0].id, tokenHash, expires]
    );
    const payload = { message: 'If that email exists, a reset link was sent' };
    if (process.env.NODE_ENV !== 'production') {
      payload.devResetToken = raw;
    }
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = z
      .object({ token: z.string().min(20), password: z.string().min(10).max(72) })
      .parse(req.body);
    const tokenHash = hashToken(token);
    const [rows] = await pool.execute(
      `SELECT prt.id, prt.user_id FROM password_reset_tokens prt
       WHERE prt.token_hash=? AND prt.used_at IS NULL AND prt.expires_at > NOW() LIMIT 1`,
      [tokenHash]
    );
    if (!rows[0]) return res.status(400).json({ message: 'Invalid or expired reset token' });
    const hash = await bcrypt.hash(password, 12);
    await pool.execute('UPDATE users SET password_hash=? WHERE id=?', [hash, rows[0].user_id]);
    await pool.execute('UPDATE password_reset_tokens SET used_at=NOW() WHERE id=?', [rows[0].id]);
    res.json({ message: 'Password updated' });
  } catch (e) {
    next(e);
  }
});

router.post('/bootstrap-admin', async (req, res, next) => {
  try {
    if (!process.env.BOOTSTRAP_SECRET || req.headers['x-bootstrap-secret'] !== process.env.BOOTSTRAP_SECRET)
      return res.status(403).json({ message: 'Forbidden' });
    const data = credentials.extend({ name: z.string().min(2).max(120) }).parse(req.body);
    const [admins] = await pool.execute("SELECT id FROM users WHERE role='admin' LIMIT 1");
    if (admins.length) return res.status(409).json({ message: 'Admin already exists' });
    const hash = await bcrypt.hash(data.password, 12);
    const [result] = await pool.execute("INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,'admin')", [
      data.name,
      data.email.toLowerCase(),
      hash,
    ]);
    const user = { id: result.insertId, name: data.name, email: data.email.toLowerCase(), role: 'admin' };
    res.status(201).json({ user, token: issueToken(user) });
  } catch (e) {
    next(e);
  }
});

export default router;