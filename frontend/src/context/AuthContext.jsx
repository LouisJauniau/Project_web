import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const TOKEN_KEY = 'eventhub_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setLoadingAuth(false);
      return;
    }

    api
      .get('/auth/me/')
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setLoadingAuth(false));
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    localStorage.setItem(TOKEN_KEY, response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const signup = async ({ username, password, passwordConfirmation }) => {
    const response = await api.post('/auth/signup/', {
      username,
      password,
      password_confirmation: passwordConfirmation,
    });
    localStorage.setItem(TOKEN_KEY, response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      // Token may already be invalid.
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loadingAuth,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
    }),
    [user, loadingAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
