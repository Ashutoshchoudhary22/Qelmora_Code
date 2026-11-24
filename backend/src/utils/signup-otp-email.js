import { SIGNUP_OTP_TTL_MINUTES } from './signup-otp.js';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function storefrontOrigin() {
  const raw = process.env.MAIL_PUBLIC_ORIGIN || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  return raw.split(',')[0].trim().replace(/\/$/, '');
}

/** Assets in frontend/public/mail background/ */
function mailBackgroundAssetUrl(filename) {
  const base = storefrontOrigin();
  const folder = encodeURIComponent('mail background');
  return `${base}/${folder}/${encodeURIComponent(filename)}`;
}

function otpDigitCells(otp) {
  const digits = String(otp).padStart(6, '0').slice(0, 6).split('');
  return digits
    .map(
      (digit) => `
        <td style="padding:0 5px;">
          <div style="width:46px;height:54px;line-height:54px;text-align:center;font-size:22px;font-weight:600;color:#9a6b2e;font-family:Georgia,'Times New Roman',serif;background:linear-gradient(180deg,#fffcf7 0%,#f8f0e4 100%);border:1px solid #e0c9a8;border-radius:10px;">
            ${escapeHtml(digit)}
          </div>
        </td>`
    )
    .join('');
}

export function buildSignupOtpEmailContent({ name, otp, ttlMinutes = SIGNUP_OTP_TTL_MINUTES }) {
  const safeName = escapeHtml(name);
  const upperUrl = mailBackgroundAssetUrl('upper.png');
  const backgroundUrl = mailBackgroundAssetUrl('background.png');
  const digitRow = otpDigitCells(otp);

  const subject = 'Your Verification Code — QELMORA';
  const text = `Hi ${name},

Your QELMORA sign-up verification code is: ${otp}

This code expires in ${ttlMinutes} minutes.

If you did not request this, you can ignore this email.

— QELMORA`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ece6dc url('${backgroundUrl}') center top / cover repeat #ece6dc;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;border-radius:6px;overflow:hidden;border:1px solid #e8dcc8;box-shadow:0 18px 40px -28px rgba(60,40,20,0.35);">
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              <img src="${upperUrl}" alt="QELMORA" width="520" height="auto" style="display:block;width:100%;max-width:520px;height:auto;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;background:#faf6ef url('${backgroundUrl}') center top / cover no-repeat #faf6ef;">
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
                <tr>
                  <td style="width:36px;height:36px;border-radius:50%;background:linear-gradient(145deg,#f0e2d0,#fff8f0);border:1px solid #e5d2b8;text-align:center;vertical-align:middle;font-size:18px;line-height:36px;">✉</td>
                </tr>
              </table>
              <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1c1917;">
                Your <span style="color:#b8894a;">Verification Code</span>
              </h1>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 22px;">
                <tr>
                  <td style="width:28px;height:1px;background:linear-gradient(90deg,transparent,#d4b88a,transparent);"></td>
                  <td style="padding:0 6px;color:#c9a66a;font-size:8px;line-height:1;">◆</td>
                  <td style="width:28px;height:1px;background:linear-gradient(90deg,transparent,#d4b88a,transparent);"></td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-family:'Segoe UI',system-ui,sans-serif;font-size:15px;color:#292524;">
                Hi <strong>${safeName}</strong>,
              </p>
              <p style="margin:0 0 22px;font-family:'Segoe UI',system-ui,sans-serif;font-size:14px;line-height:1.55;color:#57534e;max-width:400px;">
                Use the following code to verify your email and finish creating your QELMORA account.
              </p>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>${digitRow}</tr>
              </table>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 20px;border-radius:999px;background:linear-gradient(180deg,#f5ebe0 0%,#efe3d4 100%);border:1px solid #e0cdb4;font-family:'Segoe UI',system-ui,sans-serif;font-size:12px;color:#78716c;">
                    <span style="margin-right:6px;">🕐</span> Expires in <strong style="color:#9a6b2e;">${ttlMinutes} minutes</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;text-align:center;border-top:1px solid #ebe0d2;background:#faf6ef url('${backgroundUrl}') center bottom / cover no-repeat #faf6ef;">
              <p style="margin:0;font-family:'Segoe UI',system-ui,sans-serif;font-size:11px;line-height:1.5;color:#a8a29e;">
                If you didn&apos;t request this code, you can safely ignore this email.
              </p>
              <p style="margin:10px 0 0;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a66a;">QELMORA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}