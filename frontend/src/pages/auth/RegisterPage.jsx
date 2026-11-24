import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PasswordField } from '../../components/auth/PasswordField';

const OTP_LENGTH = 6;

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
};

export default function RegisterPage() {
  const { sendRegisterOtp, verifyRegisterOtp, resendRegisterOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [form, setForm] = useState(emptyForm);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function submitDetails(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (form.password !== form.passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Contact number must be exactly 10 digits.');
      return;
    }

    setSending(true);
    try {
      const result = await sendRegisterOtp(form.name, form.email, phoneDigits, form.password);
      setStep('otp');
      setOtp('');
      setInfo(result?.message || 'Check your email for the 6-digit code.');
      if (result?.devOtp) {
        setInfo(`${result.message || 'Code sent.'} (Dev code: ${result.devOtp})`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send verification code');
    } finally {
      setSending(false);
    }
  }

  async function submitOtp(e) {
    e.preventDefault();
    setError('');
    setVerifying(true);
    try {
      await verifyRegisterOtp(form.email, otp);
      navigate('/account');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  async function resend() {
    setError('');
    setInfo('');
    setSending(true);
    try {
      const result = await resendRegisterOtp(form.email);
      setInfo(result?.message || 'New code sent.');
      if (result?.devOtp) {
        setInfo(`${result.message || 'Code sent.'} (Dev code: ${result.devOtp})`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-500">Sign up</p>
      <h1 className="font-display mt-2 text-3xl font-light text-stone-900 sm:text-4xl">Create account</h1>
      <p className="mt-2 text-sm text-stone-500">
        {step === 'form'
          ? 'Join QELMORA for orders, addresses, and your profile.'
          : `We sent a code to ${form.email}. Enter it below to verify your email.`}
      </p>

      {step === 'form' ? (
        <form onSubmit={submitDetails} className="auth-signup-form mt-8 space-y-4">
          <div>
            <label htmlFor="signup-name" className="auth-form-label">
              Full name
            </label>
            <input
              id="signup-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              className="input-field"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="auth-form-label">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="input-field"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="signup-phone" className="auth-form-label">
              Contact no.
            </label>
            <input
              id="signup-phone"
              type="tel"
              required
              inputMode="numeric"
              pattern="\d{10}"
              minLength={10}
              maxLength={10}
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
              }
              placeholder="10-digit mobile number"
              className="input-field"
              autoComplete="tel-national"
            />
          </div>

          <PasswordField
            id="signup-password"
            label="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Minimum 10 characters"
            autoComplete="new-password"
          />

          <PasswordField
            id="signup-password-confirm"
            label="Re-type password"
            value={form.passwordConfirm}
            onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
            placeholder="Same as above"
            autoComplete="new-password"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-stone-600">{info}</p>}
          <button type="submit" disabled={sending} className="btn-primary btn-accent w-full py-3 text-[11px]">
            {sending ? 'Sending code…' : 'Send verification code'}
          </button>
        </form>
      ) : (
        <form onSubmit={submitOtp} className="mt-8 space-y-4">
          <div>
            <label htmlFor="signup-otp" className="auth-form-label">
              Email verification code
            </label>
            <input
              id="signup-otp"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={OTP_LENGTH}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
              placeholder="6-digit code"
              className="input-field text-center text-lg tracking-[0.45em]"
              autoComplete="one-time-code"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-stone-600">{info}</p>}
          <button
            type="submit"
            disabled={verifying || otp.length !== OTP_LENGTH}
            className="btn-primary btn-accent w-full py-3 text-[11px]"
          >
            {verifying ? 'Verifying…' : 'Verify & create account'}
          </button>
          <div className="flex flex-col gap-2 text-center text-sm sm:flex-row sm:justify-center sm:gap-6">
            <button
              type="button"
              disabled={sending}
              onClick={resend}
              className="font-medium text-stone-800 underline-offset-2 hover:underline disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('form');
                setOtp('');
                setError('');
                setInfo('');
              }}
              className="text-stone-500 underline-offset-2 hover:underline"
            >
              Edit details
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-stone-500">
        Already a member?{' '}
        <Link to="/login" className="font-medium text-stone-900 underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}