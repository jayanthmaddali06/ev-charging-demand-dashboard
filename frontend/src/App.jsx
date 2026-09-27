import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
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

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2, ease: 'easeIn' } }
};

function MainLayout() {
  const [activePage, setActivePage] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderActivePage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewDashboard setActivePage={setActivePage} />;
      case 'prediction':
        return <DemandPrediction />;
      case 'timeseries':
        return <TimeSeriesAnalytics />;
      case 'clustering':
        return <ClusterAnalysis />;
      case 'anomalies':
        return <AnomalyDetection />;
      case 'performance':
        return <ModelPerformance />;
      case 'results':
        return <PredictionResults />;
      case 'about':
        return <AboutProject />;
      default:
        return <OverviewDashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Sticky Top Navigation */}
        <Navbar
          activePage={activePage}
          setActivePage={setActivePage}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Modern Enterprise Footer */}
        <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-4 sm:px-8 text-center text-xs text-slate-500 dark:text-slate-400 glass-panel mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              EV Charging Demand Prediction & Smart Charging Analytics Platform • Production Architecture
            </p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="font-mono text-emerald-500 font-semibold">Trained RF Pipeline: 0.9888 R²</span>
              <span>•</span>
              <span>FastAPI + Node.js + React</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <MainLayout />
      </NotificationProvider>
    </ThemeProvider>
  );
}
