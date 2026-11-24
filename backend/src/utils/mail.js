import nodemailer from 'nodemailer';

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

  const subject = 'Your QELMORA verification code';
  const text = `Hi ${name},\n\nYour sign-up verification code is: ${otp}\n\nThis code expires in 15 minutes. If you did not request this, you can ignore this email.\n\n— QELMORA`;

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#1c1917;max-width:480px;">
      <p style="margin:0 0 1rem;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#b45309;">QELMORA</p>
      <p>Hi ${name},</p>
      <p>Use this code to verify your email and finish creating your account:</p>
      <p style="margin:1.25rem 0;font-size:28px;font-weight:600;letter-spacing:0.35em;">${otp}</p>
      <p style="font-size:13px;color:#57534e;">Expires in 15 minutes.</p>
    </div>
  `;

  await transport.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    ...(replyTo ? { replyTo } : {}),
    to,
    subject,
    text,
    html,
  });
}