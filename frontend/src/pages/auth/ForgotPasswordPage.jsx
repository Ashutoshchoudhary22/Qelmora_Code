import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');

  async function submit(e) {
    e.preventDefault();
    const { data } = await api.post('/auth/forgot-password', { email });
    setMessage(data.message);
    if (data.devResetToken) setDevToken(data.devResetToken);
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-4xl font-light">Reset password</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input-field" />
        <button type="submit" className="btn-primary w-full">
          Send reset link
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-stone-400">{message}</p>}
      {devToken && (
        <p className="mt-4 rounded border border-q-accent/30 bg-q-accent/10 p-3 text-xs text-stone-300">
          Dev token: <Link to={`/reset-password?token=${devToken}`}>{devToken.slice(0, 12)}…</Link>
        </p>
      )}
      <Link to="/login" className="mt-6 inline-block text-sm text-stone-500">
        ← Back to sign in
      </Link>
    </main>
  );
}
