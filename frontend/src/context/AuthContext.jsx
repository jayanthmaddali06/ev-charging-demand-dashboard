import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'ev_auth_token';

// Axios instance for auth calls
const authClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request automatically
authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true while validating stored token
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const mountedRef = useRef(true);

  // ────────────────────────────────────────────────────────────────────────────
  // On mount: verify stored JWT with the backend
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    const verifySession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (mountedRef.current) setAuthLoading(false);
        return;
      }
      try {
        const res = await authClient.get('/auth/me');
        if (mountedRef.current && res.data?.success) {
          setUser(res.data.user);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        // Token invalid / expired — clear it
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        if (mountedRef.current) setAuthLoading(false);
      }
    };
    verifySession();
    return () => { mountedRef.current = false; };
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // login(identifier, password, rememberMe)
  // ────────────────────────────────────────────────────────────────────────────
  const login = useCallback(async (identifier, password, rememberMe) => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await authClient.post('/auth/login', { identifier, password });
      const { token, user: userData } = res.data;

      // Store token — always in localStorage (rememberMe controls UI pre-fill only)
      localStorage.setItem(TOKEN_KEY, token);
      if (mountedRef.current) setUser(userData);

      if (rememberMe) {
        try { localStorage.setItem('ev_remembered_username', userData.username); } catch {}
      } else {
        localStorage.removeItem('ev_remembered_username');
      }

      return { success: true };
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Invalid username/email or password.';
      if (mountedRef.current) setLoginError(msg);
      return { success: false, error: msg };
    } finally {
      if (mountedRef.current) setIsLoggingIn(false);
    }
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // register(formData)
  // ────────────────────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    try {
      const res = await authClient.post('/auth/register', formData);
      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, error: msg };
    }
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // logout
  // ────────────────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authClient.post('/auth/logout');
    } catch {
      // Ignore — token may already be invalid; we still clear locally
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      if (mountedRef.current) setUser(null);
    }
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // updateProfile(data) — calls PUT /api/auth/profile
  // ────────────────────────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (data) => {
    try {
      const res = await authClient.put('/auth/profile', data);
      if (mountedRef.current) setUser(res.data.user);
      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      return { success: false, error: msg };
    }
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // changePassword(currentPassword, newPassword, confirmNewPassword)
  // ────────────────────────────────────────────────────────────────────────────
  const changePassword = useCallback(async (currentPassword, newPassword, confirmNewPassword) => {
    try {
      const res = await authClient.post('/auth/change-password', {
        currentPassword, newPassword, confirmNewPassword,
      });
      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      return { success: false, error: msg };
    }
  }, []);

  const clearLoginError = useCallback(() => setLoginError(''), []);

  const getRememberedUsername = useCallback(() => {
    try { return localStorage.getItem('ev_remembered_username') || ''; } catch { return ''; }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      authLoading,
      isLoggingIn,
      loginError,
      login,
      logout,
      register,
      updateProfile,
      changePassword,
      clearLoginError,
      getRememberedUsername,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Export the auth axios client so other services can reuse it
export { authClient };
