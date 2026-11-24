import nodemailer from 'nodemailer';
import { buildSignupOtpEmailContent } from './signup-otp-email.js';

function smtpPassword() {
  return process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && smtpPassword());
}

export function createMailTransport() {
  if (!isSmtpConfigured()) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: smtpPassword(),
    },
  });
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

/** Gmail requires the authenticated account (SMTP_USER) as the sender unless an alias is set up in Gmail. */
export function resolveMailFrom() {
  const smtpUser = normalizeEmail(process.env.SMTP_USER);
  const smtpFrom = normalizeEmail(process.env.SMTP_FROM);
  const fromName = process.env.SMTP_FROM_NAME || 'QELMORA';

  const fromAddress = smtpUser || smtpFrom;
  const replyTo =
    smtpFrom && smtpUser && smtpFrom !== smtpUser ? process.env.SMTP_FROM.trim() : undefined;

  return { fromAddress, fromName, replyTo };
}

export async function sendSignupOtpEmail({ to, name, otp }) {
  const transport = createMailTransport();
  if (!transport) {
    throw new Error('SMTP is not configured');
  }

  const { fromAddress, fromName, replyTo } = resolveMailFrom();
  if (!fromAddress) {
    throw new Error('SMTP_USER is required');
  }

  const { subject, text, html } = buildSignupOtpEmailContent({ name, otp });

  await transport.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    ...(replyTo ? { replyTo } : {}),
    to,
    subject,
    text,
    html,
  });
}