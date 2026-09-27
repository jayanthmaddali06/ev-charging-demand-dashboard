import React from 'react';
import { motion } from 'framer-motion';

export const DashboardSkeleton = ({ message = "Loading dashboard data..." }) => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero Skeleton */}
      <div className="h-44 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800/60 p-4" />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
      </div>

      <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-slate-400">
        <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800/60" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
      ))}
    </div>
  );
};

export default { DashboardSkeleton, TableSkeleton };
