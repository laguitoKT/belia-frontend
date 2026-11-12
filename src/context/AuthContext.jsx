import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../features/auth/services/authServices';

const AuthContext = createContext(null);

// Claves de almacenamiento local para persistencia de sesión
const STORAGE_USER_KEY = 'belia_current_user';
const STORAGE_TOKEN_KEY = 'belia_access_token';
const STORAGE_AUTH_SOURCE_KEY = 'belia_auth_source';

// Proveedor de contexto de autenticación
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (localStorage.getItem(STORAGE_AUTH_SOURCE_KEY) !== 'api') {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      return null;
    }
    const saved = localStorage.getItem(STORAGE_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    }
  }, [user]);

  // Función de inicio de sesión que simula la autenticación y guarda el token y usuario en localStorage
  const login = async (username, password) => {
    const response = await authService.login(username, password);
    if (response.access_token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, response.access_token);
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
    localStorage.setItem(STORAGE_AUTH_SOURCE_KEY, 'api');
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_AUTH_SOURCE_KEY);
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
}