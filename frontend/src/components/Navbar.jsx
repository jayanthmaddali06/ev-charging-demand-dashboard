import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, Sun, Moon, Menu, User, LogOut, Settings, ChevronDown
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Navbar = ({ activePage, setActivePage, isSidebarOpen, setIsSidebarOpen }) => {
  const { toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const [mlStatus, setMlStatus] = useState('checking');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // ── ML health polling ──────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const res = await api.getHealth();
        if (isMounted) {
          setMlStatus(res?.services?.mlService === 'healthy' ? 'online' : 'offline');
        }
      } catch {
        if (isMounted) setMlStatus('offline');
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => { isMounted = false; clearInterval(id); };
  }, []);

  // ── Close profile menu on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pageTitles = {
    overview: 'Overview Dashboard',
    prediction: 'Charging Demand Prediction',
    timeseries: 'Time-Series Analytics',
    clustering: 'K-Means Cluster Analysis',
    anomalies: 'Anomaly Detection',
    performance: 'Model Performance',
    results: 'Prediction Results',
    profile: 'User Profile',
    about: 'About Project',
  };

  // Derive initials from full name or username
  const initials = user
    ? (user.fullName || user.username || 'U')
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                EV Charging Analytics
              </span>
              <span className="text-slate-300 dark:text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">v1.0.0</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {pageTitles[activePage] || 'Dashboard'}
            </h1>
          </div>
        </div>

        {/* Right: ML badge, theme toggle, user menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ML Service Health Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60">
            <span className="relative flex h-2 w-2">
              {mlStatus === 'online' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </>
              ) : mlStatus === 'checking' ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              )}
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              {mlStatus === 'online' ? 'ML Model: Ready' : mlStatus === 'checking' ? 'Checking ML...' : 'ML Service: Offline'}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            aria-label="Toggle Theme"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark
              ? <Sun className="w-5 h-5 text-amber-400" />
              : <Moon className="w-5 h-5 text-indigo-600" />
            }
          </button>

          {/* Quick Predict button */}
          <button
            onClick={() => setActivePage('prediction')}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all transform active:scale-95"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Predict</span>
          </button>

          {/* User profile menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setProfileMenuOpen(v => !v)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="User menu"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow">
                <span className="text-white font-bold text-[11px]">{initials}</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-none">
                  {user?.username || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user?.role || 'user'}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xl overflow-hidden z-50">
                {/* User identity */}
                <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.fullName || user?.username}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { setActivePage('profile'); setProfileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-emerald-500" />
                    View Profile
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
