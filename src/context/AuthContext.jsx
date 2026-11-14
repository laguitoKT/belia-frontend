import { useState, useEffect } from 'react';
import { authService } from '../features/auth/services/authServices';
import AuthContext from './authContextValue';
import {
  clearAuthStorage,
  SESSION_EXPIRED_EVENT,
  STORAGE_AUTH_SOURCE_KEY,
  STORAGE_TOKEN_KEY,
  STORAGE_USER_KEY,
} from '../utils/authStorage';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (
      localStorage.getItem(STORAGE_AUTH_SOURCE_KEY) !== 'api' ||
      !localStorage.getItem(STORAGE_TOKEN_KEY) ||
      !localStorage.getItem(STORAGE_USER_KEY)
    ) {
      clearAuthStorage();
      return null;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_USER_KEY));
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) return saved;
    } catch {
      // Discard an unreadable stored session.
    }
    clearAuthStorage();
    return null;
  });

  useEffect(() => {
    const onSessionExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  const login = async (username, password) => {
    const response = await authService.login(username, password);
    localStorage.setItem(STORAGE_TOKEN_KEY, response.access_token);
    localStorage.setItem(STORAGE_AUTH_SOURCE_KEY, 'api');
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}