import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { endpoints, configureAuthFailure } from '../services/api';
import { getStoredItem, removeStoredItem, setStoredItem } from '../services/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await Promise.all([removeStoredItem('access_token'), removeStoredItem('refresh_token'), removeStoredItem('user')]);
    setUser(null);
  }, []);

  useEffect(() => {
    configureAuthFailure(() => setUser(null));
    (async () => {
      try {
        const saved = await getStoredItem('user');
        if (saved) setUser(JSON.parse(saved));
        const token = await getStoredItem('access_token');
        if (token) {
          const current = await endpoints.me();
          setUser(current); await setStoredItem('user', JSON.stringify(current));
        }
      } catch { await clearSession(); }
      finally { setLoading(false); }
    })();
  }, [clearSession]);

  const login = useCallback(async (username, password) => {
    const tokens = await endpoints.login(username.trim().toLowerCase(), password);
    await Promise.all([setStoredItem('access_token', tokens.access_token), setStoredItem('refresh_token', tokens.refresh_token)]);
    const current = await endpoints.me();
    await setStoredItem('user', JSON.stringify(current)); setUser(current);
    return current;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getStoredItem('refresh_token');
    try { if (refreshToken) await apiLogout(refreshToken); } catch { /* local cleanup always wins */ }
    await clearSession();
  }, [clearSession]);

  const value = useMemo(() => ({ user, loading, login, logout, isAdmin: user?.rol === 'administrador' }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function apiLogout(refreshToken) {
  const { api } = await import('../services/api');
  return api('/auth/logout', { method: 'POST', body: { refresh_token: refreshToken } }, false);
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  return value;
}
