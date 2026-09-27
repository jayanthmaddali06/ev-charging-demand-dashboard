import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const KPICard = ({ title, value, unit = '', icon: Icon, trend, trendValue, colorScheme = 'emerald', delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Animated counter effect
  useEffect(() => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numericValue)) return;

    let start = 0;
    const duration = 1200; // ms
    const stepTime = 25;
    const steps = duration / stepTime;
    const increment = numericValue / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  const colorStyles = {
    emerald: {
      gradient: 'from-emerald-500/10 to-teal-500/5',
      border: 'hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400',
      glow: 'group-hover:shadow-emerald-500/10'
    },
    cyan: {
      gradient: 'from-cyan-500/10 to-blue-500/5',
      border: 'hover:border-cyan-500/50',
      iconBg: 'bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20 dark:text-cyan-400',
      glow: 'group-hover:shadow-cyan-500/10'
    },
    amber: {
      gradient: 'from-amber-500/10 to-orange-500/5',
      border: 'hover:border-amber-500/50',
      iconBg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400',
      glow: 'group-hover:shadow-amber-500/10'
    },
    rose: {
      gradient: 'from-rose-500/10 to-red-500/5',
      border: 'hover:border-rose-500/50',
      iconBg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400',
      glow: 'group-hover:shadow-rose-500/10'
    },
    violet: {
      gradient: 'from-violet-500/10 to-purple-500/5',
      border: 'hover:border-violet-500/50',
      iconBg: 'bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400',
      glow: 'group-hover:shadow-violet-500/10'
    },
    indigo: {
      gradient: 'from-indigo-500/10 to-blue-500/5',
      border: 'hover:border-indigo-500/50',
      iconBg: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400',
      glow: 'group-hover:shadow-indigo-500/10'
    }
  };

  const currentTheme = colorStyles[colorScheme] || colorStyles.emerald;

  const formattedCounter = () => {
    if (typeof value !== 'number' && isNaN(parseFloat(value))) return value;
    const num = displayValue;
    if (Number.isInteger(value)) {
      return Math.round(num).toLocaleString();
    }
    return num.toFixed(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative overflow-hidden rounded-2xl glass-panel p-5 transition-all duration-300 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl ${currentTheme.glow} ${currentTheme.border}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${currentTheme.gradient} rounded-full blur-2xl pointer-events-none -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500`} />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {formattedCounter()}
            </span>
            {unit && (
              <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div className={`p-3 rounded-xl ${currentTheme.iconBg} transition-transform duration-300 group-hover:scale-110 flex-shrink-0 shadow-sm`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {(trend || trendValue) && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium relative z-10">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md ${
            trend === 'up' 
              ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400' 
              : trend === 'down'
              ? 'text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400'
              : 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {trendValue}
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">vs baseline</span>
        </div>
      )}
    </motion.div>
  );
};

export default KPICard;
