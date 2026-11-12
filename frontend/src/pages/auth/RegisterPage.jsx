import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/account');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-500">Sign up</p>
      <h1 className="font-display mt-2 text-3xl font-light text-stone-900 sm:text-4xl">Create account</h1>
      <p className="mt-2 text-sm text-stone-500">Join QELMORA for orders, addresses, and your profile.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Full name"
          className="input-field"
        />
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="input-field"
        />
        <input
          type="password"
          required
          minLength={10}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password (min 10 chars)"
          className="input-field"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary btn-accent w-full py-3 text-[11px]">
          Continue
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        Already a member?{' '}
        <Link to="/login" className="font-medium text-stone-900 underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
