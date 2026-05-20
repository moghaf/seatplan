import { useState, useCallback } from 'react';
import { api, setAuthToken } from '../api';
import type { UserInfo } from '../types';

function loadUser(): { user: UserInfo | null; token: string | null } {
  const token = localStorage.getItem('token');
  const data = localStorage.getItem('user');
  if (token && data) {
    setAuthToken(token);
    return { user: JSON.parse(data), token };
  }
  return { user: null, token: null };
}

export function useAuth() {
  const [{ user, token }, setState] = useState(loadUser);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.auth.login(username, password);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setAuthToken(res.token);
    setState({ user: res.user, token: res.token });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
    setState({ user: null, token: null });
  }, []);

  return {
    user,
    token,
    isSuperAdmin: user?.role === 'superAdmin',
    isFunctionAdmin: user?.role === 'functionAdmin',
    isAdmin: user?.role === 'superAdmin' || user?.role === 'functionAdmin',
    isAuthenticated: !!token,
    canManageFunction: (fnId: number) =>
      user?.role === 'superAdmin' || (user?.role === 'functionAdmin' && user?.functionId === fnId),
    login,
    logout,
  };
}
