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
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">Join QELMORA</p>
      <h1 className="font-display mt-3 text-4xl font-light">Create account</h1>
      <form onSubmit={submit} className="mt-10 space-y-4">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="input-field" />
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input-field" />
        <input type="password" required minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (min 10 chars)" className="input-field" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-primary btn-accent w-full">
          Register
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        Already a member?{' '}
        <Link to="/login" className="text-stone-200">
          Sign in
        </Link>
      </p>
    </main>
  );
}
