import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  BatteryCharging,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Singapore',
  'UAE',
  'Japan',
  'Other',
];

/*
 * IMPORTANT:
 * Field is kept OUTSIDE SignUpPage.
 * This prevents React from recreating the Field component
 * every time the form state changes.
 */
const Field = ({
  label,
  name,
  type = 'text',
  placeholder,
  autoComplete,
  required = false,
  children,
  value,
  onChange,
  error,
}) => (
  <div>
    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
      {label}
      {required && <span className="text-rose-400"> *</span>}
    </label>

    {children || (
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/80 text-white placeholder-slate-500 border text-sm focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-rose-500 focus:ring-rose-500/30'
            : 'border-slate-700 focus:ring-emerald-500/40 focus:border-emerald-500/60'
        }`}
      />
    )}

    {error && (
      <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

const SignUpPage = ({ onGoToLogin }) => {
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    city: '',
    state: '',
    country: '',
    agreedToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [apiError, setApiError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * Update one field without losing focus.
   */
  const set = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [field]: '',
    }));

    setApiError('');
  };

  const validate = () => {
    const errs = {};

    // Full Name
    if (!form.fullName.trim()) {
      errs.fullName = 'Full name is required.';
    } else if (form.fullName.trim().length < 2) {
      errs.fullName = 'Full name must be at least 2 characters.';
    }

    // Username
    if (!form.username.trim()) {
      errs.username = 'Username is required.';
    } else if (
      !/^[a-zA-Z0-9_.-]{3,30}$/.test(form.username.trim())
    ) {
      errs.username =
        'Username: 3–30 chars, letters/numbers/_ /. /-only.';
    }

    // Email
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errs.email = 'Invalid email address.';
    }

    // Password
    if (!form.password) {
      errs.password = 'Password is required.';
    } else if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    // Confirm Password
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    // Terms
    if (!form.agreedToTerms) {
      errs.agreedToTerms =
        'You must accept the terms to continue.';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setApiError('');

    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    const payload = {
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      phone: form.phone.trim(),
      location: form.location.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country,
    };

    try {
      const result = await register(payload);

      setSubmitting(false);

      if (result.success) {
        setSuccessMsg(
          result.message ||
            'Account created successfully! Please sign in.'
        );
      } else {
        setApiError(
          result.error ||
            'Registration failed. Please try again.'
        );
      }
    } catch (error) {
      setSubmitting(false);
      setApiError(
        'Unable to connect to the server. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-4 py-10">

      {/* Background decorations */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="absolute top-[-8rem] right-[-8rem] w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute bottom-[-8rem] left-[-8rem] w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence>
        {mounted && (
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.45,
              ease: 'easeOut',
            }}
            className="w-full max-w-2xl relative z-10"
          >

            {/* Header */}
            <div className="text-center mb-8">

              <motion.div
                initial={{
                  scale: 0.7,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 0.4,
                  delay: 0.1,
                }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-2xl shadow-emerald-500/30 mb-3"
              >
                <BatteryCharging className="w-7 h-7 text-white stroke-[2]" />
              </motion.div>

              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                VoltPulse
                <span className="text-emerald-400">
                  ML
                </span>
              </h1>

              <p className="text-slate-400 text-sm mt-1">
                Create your analytics account
              </p>
            </div>

            {/* Success state */}
            {successMsg ? (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-emerald-500/40 p-10 shadow-2xl text-center"
              >
                <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />

                <h3 className="text-xl font-bold text-white mb-2">
                  Account Created!
                </h3>

                <p className="text-slate-300 text-sm mb-6">
                  {successMsg}
                </p>

                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg hover:from-emerald-400 hover:to-teal-500 transition-all"
                >
                  Sign In Now
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.4,
                  delay: 0.2,
                }}
                className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/60 p-7 sm:p-9 shadow-2xl"
              >

                {/* Page header */}
                <div className="flex items-center gap-3 mb-6">

                  <button
                    type="button"
                    onClick={onGoToLogin}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label="Back to sign in"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Create Account
                    </h2>

                    <p className="text-slate-400 text-xs mt-0.5">
                      Fill in your details to get started
                    </p>
                  </div>

                </div>

                {/* API error */}
                {apiError && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="mb-5 flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />

                    <span>{apiError}</span>
                  </motion.div>
                )}

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-4"
                >

                  {/* Personal Information */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 pb-1 border-b border-slate-800">
                    Personal Information
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <Field
                      label="Full Name"
                      name="fullName"
                      placeholder="Your full name"
                      required
                      value={form.fullName}
                      onChange={(e) =>
                        set('fullName', e.target.value)
                      }
                      error={fieldErrors.fullName}
                    />

                    <Field
                      label="Username"
                      name="username"
                      placeholder="e.g. jayanth_m"
                      autoComplete="username"
                      required
                      value={form.username}
                      onChange={(e) =>
                        set('username', e.target.value)
                      }
                      error={fieldErrors.username}
                    />

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <Field
                      label="Email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        set('email', e.target.value)
                      }
                      error={fieldErrors.email}
                    />

                    <Field
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210 (optional)"
                      value={form.phone}
                      onChange={(e) =>
                        set('phone', e.target.value)
                      }
                      error={fieldErrors.phone}
                    />

                  </div>

                  {/* Security */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 pb-1 border-b border-slate-800 pt-2">
                    Security
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Password */}
                    <Field
                      label="Password"
                      name="password"
                      required
                      error={fieldErrors.password}
                    >
                      <div className="relative">

                        <input
                          type={
                            showPassword
                              ? 'text'
                              : 'password'
                          }
                          value={form.password}
                          onChange={(e) =>
                            set(
                              'password',
                              e.target.value
                            )
                          }
                          placeholder="Min. 8 characters"
                          autoComplete="new-password"
                          className={`w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-800/80 text-white placeholder-slate-500 border text-sm focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors.password
                              ? 'border-rose-500 focus:ring-rose-500/30'
                              : 'border-slate-700 focus:ring-emerald-500/40 focus:border-emerald-500/60'
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (value) => !value
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                          aria-label={
                            showPassword
                              ? 'Hide password'
                              : 'Show password'
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>

                      </div>
                    </Field>

                    {/* Confirm Password */}
                    <Field
                      label="Confirm Password"
                      name="confirmPassword"
                      required
                      error={fieldErrors.confirmPassword}
                    >
                      <div className="relative">

                        <input
                          type={
                            showConfirmPassword
                              ? 'text'
                              : 'password'
                          }
                          value={form.confirmPassword}
                          onChange={(e) =>
                            set(
                              'confirmPassword',
                              e.target.value
                            )
                          }
                          placeholder="Repeat your password"
                          autoComplete="new-password"
                          className={`w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-800/80 text-white placeholder-slate-500 border text-sm focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors.confirmPassword
                              ? 'border-rose-500 focus:ring-rose-500/30'
                              : 'border-slate-700 focus:ring-emerald-500/40 focus:border-emerald-500/60'
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (value) => !value
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                          aria-label={
                            showConfirmPassword
                              ? 'Hide confirm password'
                              : 'Show confirm password'
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>

                      </div>
                    </Field>

                  </div>

                  {/* Location */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 pb-1 border-b border-slate-800 pt-2">
                    Location (Optional)
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <Field
                      label="Location / Area"
                      name="location"
                      placeholder="e.g. Hyderabad"
                      value={form.location}
                      onChange={(e) =>
                        set(
                          'location',
                          e.target.value
                        )
                      }
                      error={fieldErrors.location}
                    />

                    <Field
                      label="City"
                      name="city"
                      placeholder="e.g. Hyderabad"
                      value={form.city}
                      onChange={(e) =>
                        set('city', e.target.value)
                      }
                      error={fieldErrors.city}
                    />

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <Field
                      label="State"
                      name="state"
                      placeholder="e.g. Telangana"
                      value={form.state}
                      onChange={(e) =>
                        set('state', e.target.value)
                      }
                      error={fieldErrors.state}
                    />

                    {/* Country */}
                    <div>

                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Country
                      </label>

                      <select
                        value={form.country}
                        onChange={(e) =>
                          set(
                            'country',
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 text-white border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all"
                      >

                        <option value="">
                          Select country
                        </option>

                        {COUNTRIES.map((country) => (
                          <option
                            key={country}
                            value={country}
                          >
                            {country}
                          </option>
                        ))}

                      </select>

                    </div>

                  </div>

                  {/* Terms */}
                  <div className="pt-2">

                    <label className="flex items-start gap-3 cursor-pointer group">

                      <input
                        type="checkbox"
                        checked={form.agreedToTerms}
                        onChange={(e) =>
                          set(
                            'agreedToTerms',
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 mt-0.5 accent-emerald-500 flex-shrink-0"
                      />

                      <span className="text-xs text-slate-400 leading-relaxed">

                        I agree to the{' '}

                        <span className="text-emerald-400 font-semibold">
                          Terms of Service
                        </span>

                        {' '}and{' '}

                        <span className="text-emerald-400 font-semibold">
                          Privacy Policy
                        </span>
                        .

                        Account data is used solely for EV
                        charging analytics.

                      </span>

                    </label>

                    {fieldErrors.agreedToTerms && (
                      <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.agreedToTerms}
                      </p>
                    )}

                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >

                    {submitting ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />

                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>

                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}

                  </button>

                  {/* Sign in */}
                  <p className="text-center text-xs text-slate-500 pt-1">

                    Already have an account?{' '}

                    <button
                      type="button"
                      onClick={onGoToLogin}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                      Sign In
                    </button>

                  </p>

                </form>

              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SignUpPage;