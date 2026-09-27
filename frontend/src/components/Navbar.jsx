import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Sun, 
  Moon, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Menu, 
  Activity,
  Layers
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

const Navbar = ({ activePage, setActivePage, isSidebarOpen, setIsSidebarOpen }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [mlStatus, setMlStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;
    const checkServiceHealth = async () => {
      try {
        const res = await api.getHealth();
        if (isMounted) {
          if (res?.services?.mlService === 'healthy') {
            setMlStatus('online');
          } else {
            setMlStatus('offline');
          }
        }
      } catch (err) {
        if (isMounted) setMlStatus('offline');
      }
    };

    checkServiceHealth();
    const interval = setInterval(checkServiceHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const pageTitles = {
    overview: 'Overview Dashboard',
    prediction: 'Charging Demand Prediction',
    timeseries: 'Time-Series Analytics',
    clustering: 'K-Means Cluster Analysis',
    anomalies: 'Anomaly Detection',
    performance: 'Model Performance',
    results: 'Prediction Results',
    about: 'About Project'
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: Mobile toggle & Breadcrumb */}
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
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                v1.0.0-prod
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {pageTitles[activePage] || 'Dashboard'}
            </h1>
          </div>
        </div>

        {/* Right Section: Status badge, Theme Toggle, Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* ML Service Health Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60">
            <span className="relative flex h-2 w-2">
              {mlStatus === 'online' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : mlStatus === 'checking' ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              )}
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              {mlStatus === 'online' ? 'ML Model: Ready' : mlStatus === 'checking' ? 'Checking ML...' : 'ML Service: Offline'}
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            aria-label="Toggle Theme"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 animate-pulse-subtle" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600" />
            )}
          </button>

          {/* Quick Navigate Button to Prediction */}
          <button
            onClick={() => setActivePage('prediction')}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all transform active:scale-95"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Make Prediction</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
