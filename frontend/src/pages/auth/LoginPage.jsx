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
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-500">Login</p>
      <h1 className="font-display mt-2 text-3xl font-light text-stone-900 sm:text-4xl">Welcome back</h1>
      <p className="mt-2 text-sm text-stone-500">Sign in to access your orders and saved details.</p>
      {location.state?.from?.startsWith?.('/admin') && (
        <p className="mt-3 text-sm text-amber-800/90">Admin area requires an admin account.</p>
      )}
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input-field"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input-field"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary btn-accent w-full py-3 text-[11px]">
          Continue
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        <Link to="/forgot-password" className="font-medium text-stone-800 underline-offset-2 hover:underline">
          Forgot password?
        </Link>
      </p>
      <p className="mt-4 text-center text-sm text-stone-500">
        New here?{' '}
        <Link to="/register" className="font-medium text-stone-900 underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
