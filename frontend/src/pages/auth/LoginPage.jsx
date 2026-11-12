import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      const dest = location.state?.from || (user.role === 'admin' ? '/admin' : '/account');
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">Client login</p>
      <h1 className="font-display mt-3 text-4xl font-light">Welcome back</h1>
      <form onSubmit={submit} className="mt-10 space-y-4">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input-field" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input-field" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-primary btn-accent w-full">
          Sign in
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        <Link to="/forgot-password" className="text-q-accent">
          Forgot password?
        </Link>
      </p>
      <p className="mt-4 text-center text-sm text-stone-500">
        New here?{' '}
        <Link to="/register" className="text-stone-200 underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
