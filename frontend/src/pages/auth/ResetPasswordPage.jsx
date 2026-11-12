import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const token = params.get('token') || '';

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { token, password });
      setMessage('Password updated. You can sign in now.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Reset failed');
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-4xl font-light">New password</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {!token && <p className="text-sm text-red-400">Missing token in URL.</p>}
        <input type="password" minLength={10} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="input-field" />
        <button type="submit" disabled={!token} className="btn-primary btn-accent w-full disabled:opacity-40">
          Update password
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-stone-400">{message}</p>}
      <Link to="/login" className="mt-6 inline-block text-sm text-stone-500">
        Sign in
      </Link>
    </main>
  );
}
