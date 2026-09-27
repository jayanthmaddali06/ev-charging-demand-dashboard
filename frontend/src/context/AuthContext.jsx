import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Demo credentials - clearly marked as demo-only.
// In production, replace this with JWT/session-based backend authentication.
const DEMO_USERS = [
  { username: 'Jayanth', password: 'ev@2025', role: 'admin' },
  { username: 'Admin', password: 'admin123', role: 'admin' },
  { username: 'Demo', password: 'demo', role: 'viewer' },
];

const SESSION_KEY = 'ev_dashboard_session';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate stored session has required fields
        if (parsed && parsed.username && parsed.role) return parsed;
      }
    } catch {}
    return null;
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Persist session across page refreshes (within the same browser tab session)
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const login = useCallback(async (username, password, rememberMe) => {
    setIsLoggingIn(true);
    setLoginError('');

    // Simulate a brief async network call (replace with real API call in production)
    await new Promise(resolve => setTimeout(resolve, 900));

    const match = DEMO_USERS.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (match) {
      const sessionData = {
        username: match.username,
        role: match.role,
        loginTime: new Date().toISOString(),
      };
      setUser(sessionData);
      setIsLoggingIn(false);

      if (rememberMe) {
        try { localStorage.setItem(SESSION_KEY + '_remember', match.username); } catch {}
      }
      return { success: true };
    } else {
      setIsLoggingIn(false);
      const msg = 'Invalid username or password.';
      setLoginError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const clearLoginError = useCallback(() => setLoginError(''), []);

  // Get remembered username for pre-filling
  const getRememberedUsername = useCallback(() => {
    try { return localStorage.getItem(SESSION_KEY + '_remember') || ''; } catch { return ''; }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggingIn, loginError, clearLoginError, getRememberedUsername }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
