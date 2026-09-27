import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Sparkles, Activity } from 'lucide-react';

const PageHeader = ({ title, subtitle, badge, actionButton }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-900/90 via-slate-900/95 to-slate-950 text-white shadow-xl border border-emerald-500/20 mb-8">
      {/* Subtle animated electric background grid */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Subtle glowing ambient lights */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 right-48 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          {badge && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{badge}</span>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed font-normal"
          >
            {subtitle}
          </motion.p>
        </div>

        {actionButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="flex-shrink-0"
          >
            {actionButton}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
