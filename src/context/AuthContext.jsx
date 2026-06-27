import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/auth';
import { setAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing session

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // On app load, try to silently refresh using the httpOnly cookie (if any),
  // so a page reload doesn't force a fresh login when the session is still valid.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { data } = await authApi.refresh();
        setAccessToken(data.data.accessToken);
        const me = await authApi.me();
        if (!cancelled) setUser(me.data.data.user);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();

    function handleForcedLogout() {
      clearSession();
    }
    window.addEventListener('auth:logout', handleForcedLogout);

    return () => {
      cancelled = true;
      window.removeEventListener('auth:logout', handleForcedLogout);
    };
  }, [clearSession]);

  async function login(email, password) {
    const { data } = await authApi.login({ email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }

  async function register(payload) {
    const { data } = await authApi.register(payload);
    return data.data.user;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }

  const value = { user, loading, login, register, logout, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
