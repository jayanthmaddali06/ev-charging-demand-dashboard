import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, BatteryCharging, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = ({ onLoginSuccess, onGoToSignUp }) => {
  const { login, isLoggingIn, loginError, clearLoginError, getRememberedUsername } = useAuth();

  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const remembered = getRememberedUsername();
    if (remembered) {
      setIdentifier(remembered);
      setRememberMe(true);
    }
  }, [getRememberedUsername]);

  const validate = () => {
    const errs = {};
    if (!identifier.trim()) errs.identifier = 'Username or email is required.';
    if (!password) errs.password = 'Password is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearLoginError();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    const result = await login(identifier.trim(), password, rememberMe);
    if (result.success && onLoginSuccess) onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-4">

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Ambient glow orbs */}
      <div className="absolute top-[-8rem] left-[-8rem] w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-8rem] right-[-8rem] w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating energy dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/40"
            style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          />
        ))}
      </div>

      <AnimatePresence>
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md relative z-10"
          >
            {/* Logo / Brand */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-2xl shadow-emerald-500/30 mb-4"
              >
                <BatteryCharging className="w-8 h-8 text-white stroke-[2]" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  VoltPulse<span className="text-emerald-400">ML</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">EV Charging Demand Prediction &amp; Analytics</p>
              </motion.div>
            </div>

            {/* Login Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/60 p-7 sm:p-9 shadow-2xl"
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Sign In</h2>
                <p className="text-slate-400 text-sm mt-1">Access your analytics dashboard</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Username or Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setFieldErrors(p => ({ ...p, identifier: '' })); }}
                    placeholder="Enter username or email"
                    autoComplete="username"
                    className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 text-white placeholder-slate-500 border text-sm focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.identifier
                        ? 'border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-700 focus:ring-emerald-500/40 focus:border-emerald-500/60'
                    }`}
                  />
                  {fieldErrors.identifier && (
                    <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {fieldErrors.identifier}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className={`w-full px-4 py-3 pr-11 rounded-xl bg-slate-800/80 text-white placeholder-slate-500 border text-sm focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.password
                          ? 'border-rose-500 focus:ring-rose-500/30'
                          : 'border-slate-700 focus:ring-emerald-500/40 focus:border-emerald-500/60'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-xs text-slate-400 cursor-pointer select-none">
                    Remember my username
                  </label>
                </div>

                {/* API / credentials error */}
                <AnimatePresence>
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                      <span>{loginError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      Sign In to Dashboard
                    </>
                  )}
                </button>

                {/* Sign Up link */}
                <p className="text-center text-xs text-slate-500 pt-1">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={onGoToSignUp}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                  >
                    Create Account
                  </button>
                </p>
              </form>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-[11px] text-slate-600 mt-6"
            >
              EV Charging Demand Prediction · ML-Powered Analytics Platform
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
