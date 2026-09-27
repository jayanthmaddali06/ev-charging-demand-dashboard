import React from 'react';
import { motion } from 'framer-motion';

const ChartCard = ({ title, subtitle, badge, action, children, isLoading, height = 'h-80', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
            {badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="flex items-center gap-2">
            {action}
          </div>
        )}
      </div>

      <div className={`w-full ${height} relative flex items-center justify-center`}>
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Rendering analytics chart...</span>
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
};

export default ChartCard;
