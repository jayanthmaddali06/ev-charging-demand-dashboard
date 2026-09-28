import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import OverviewDashboard from './pages/OverviewDashboard';
import DemandPrediction from './pages/DemandPrediction';
import TimeSeriesAnalytics from './pages/TimeSeriesAnalytics';
import ClusterAnalysis from './pages/ClusterAnalysis';
import AnomalyDetection from './pages/AnomalyDetection';
import ModelPerformance from './pages/ModelPerformance';
import PredictionResults from './pages/PredictionResults';
import AboutProject from './pages/AboutProject';
import UserProfile from './pages/UserProfile';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import WelcomeAnimation from './pages/WelcomeAnimation';

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2, ease: 'easeIn' } }
};

// ── Main dashboard layout (only shown when authenticated) ────────────────────
function MainLayout({ activePage, setActivePage }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'overview':     return <OverviewDashboard setActivePage={setActivePage} />;
      case 'prediction':   return <DemandPrediction />;
      case 'timeseries':   return <TimeSeriesAnalytics />;
      case 'clustering':   return <ClusterAnalysis />;
      case 'anomalies':    return <AnomalyDetection />;
      case 'performance':  return <ModelPerformance />;
      case 'results':      return <PredictionResults />;
      case 'profile':      return <UserProfile setActivePage={setActivePage} />;
      case 'about':        return <AboutProject />;
      default:             return <OverviewDashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Navbar
          activePage={activePage}
          setActivePage={setActivePage}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-4 sm:px-8 text-center text-xs text-slate-500 dark:text-slate-400 glass-panel mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>EV Charging Demand Prediction &amp; Smart Charging Analytics Platform</p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="font-mono text-emerald-500 font-semibold">RF Pipeline: R² = 0.9888</span>
              <span>•</span>
              <span>FastAPI + Node.js + React</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Auth shell: login | signup | welcome | dashboard ─────────────────────────
function AppShell() {
  const { user, authLoading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [showWelcome, setShowWelcome] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  const prevUserRef = React.useRef(null);

  // When user transitions from null → logged-in, show welcome animation once
  useEffect(() => {
    if (user && !prevUserRef.current) {
      setShowWelcome(true);
    }
    prevUserRef.current = user;
  }, [user]);

  // ── Render loading spinner while verifying stored session ────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M13 3L4 14h8l-1 7 9-11h-8z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated ────────────────────────────────────────────────────
  if (!user) {
    return authView === 'signup' ? (
      <SignUpPage onGoToLogin={() => setAuthView('login')} />
    ) : (
      <LoginPage
        onLoginSuccess={() => { /* AuthContext sets user; useEffect triggers welcome */ }}
        onGoToSignUp={() => setAuthView('signup')}
      />
    );
  }

  // ── Authenticated: welcome animation ────────────────────────────────────
  if (showWelcome) {
    return (
      <WelcomeAnimation
        username={user.fullName || user.username}
        onComplete={() => setShowWelcome(false)}
      />
    );
  }

  // ── Authenticated: dashboard ─────────────────────────────────────────────
  return <MainLayout activePage={activePage} setActivePage={setActivePage} />;
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppShell />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
