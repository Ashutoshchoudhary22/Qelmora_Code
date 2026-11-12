import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);
const TOKEN_KEY = 'qelmora_token';
const USER_KEY = 'qelmora_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [booting, setBooting] = useState(!!localStorage.getItem(TOKEN_KEY));

  const persist = useCallback((nextUser, token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      persist(data.user, data.token);
      return data.user;
    },
    [persist]
  );

  const register = useCallback(
    async (name, email, password) => {
      const { data } = await api.post('/auth/register', { name, email, password });
      persist(data.user, data.token);
      return data.user;
    },
    [persist]
  );

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setBooting(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => persist(data.user))
      .catch(() => logout())
      .finally(() => setBooting(false));
  }, [logout, persist]);

  const value = useMemo(
    () => ({ user, booting, login, register, logout, isAdmin: user?.role === 'admin' }),
    [user, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
