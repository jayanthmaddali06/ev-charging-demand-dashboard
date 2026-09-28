import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Zap, 
  TrendingUp, 
  Network, 
  AlertTriangle, 
  Cpu, 
  Table2, 
  Info,
  ChevronLeft,
  ChevronRight,
  BatteryCharging,
  Sparkles,
  UserCircle
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { id: 'prediction', label: 'Prediction', icon: Zap, badge: 'Live ML' },
  { id: 'timeseries', label: 'Time Series', icon: TrendingUp, badge: null },
  { id: 'clustering', label: 'Clustering', icon: Network, badge: '4 Clusters' },
  { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle, badge: 'Isolation' },
  { id: 'performance', label: 'Model Performance', icon: Cpu, badge: 'R² 0.98' },
  { id: 'results', label: 'Prediction Results', icon: Table2, badge: null },
  { id: 'profile', label: 'My Profile', icon: UserCircle, badge: null },
  { id: 'about', label: 'About Project', icon: Info, badge: null },
];

const Sidebar = ({ activePage, setActivePage, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 flex-shrink-0">
              <BatteryCharging className="w-5 h-5 stroke-[2.5]" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col whitespace-nowrap"
              >
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  VoltPulse<span className="text-emerald-500">ML</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Smart EV Analytics
                </span>
              </motion.div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all group ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-900/60'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Active Indicator Background */}
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveBackground"
                    className="absolute inset-0 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <div className={`relative z-10 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {!isCollapsed && (
                  <span className="relative z-10 truncate tracking-tight text-left flex-1">
                    {item.label}
                  </span>
                )}

                {!isCollapsed && item.badge && (
                  <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isActive 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info card */}
        {!isCollapsed && (
          <div className="p-3 m-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pipeline Status</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
              Trained RF Pipeline active. Test R² = 0.9888.
            </p>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
