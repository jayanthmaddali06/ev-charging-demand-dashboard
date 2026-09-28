import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Building2, Globe,
  Calendar, Shield, Edit3, X, Check, KeyRound,
  ChevronDown, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

// ── Helpers ──────────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-emerald-500 flex-shrink-0 mt-0.5">
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{value || '—'}</p>
    </div>
  </div>
);

const EditField = ({ label, name, type = 'text', value, onChange, placeholder, disabled }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(name, e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

// ── Change Password Section ───────────────────────────────────────────────────

const ChangePasswordSection = () => {
  const { changePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) {
      setMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (form.newPassword !== form.confirmNewPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setLoading(true);
    const result = await changePassword(form.currentPassword, form.newPassword, form.confirmNewPassword);
    setLoading(false);
    if (result.success) {
      setMsg({ type: 'success', text: result.message });
      setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } else {
      setMsg({ type: 'error', text: result.error });
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Change Password</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Update your login password</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-4 border-t border-slate-200/60 dark:border-slate-800/60 pt-4">
              {['currentPassword', 'newPassword', 'confirmNewPassword'].map((field) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                    {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    value={form[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={field === 'currentPassword' ? 'Your current password' : field === 'newPassword' ? 'Min. 8 characters' : 'Repeat new password'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                  />
                </div>
              ))}

              {msg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
                  msg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}>
                  {msg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {msg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Profile Page ─────────────────────────────────────────────────────────

const UserProfile = ({ setActivePage }) => {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const handleEdit = () => {
    setEditForm({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      location: user?.location || '',
      city: user?.city || '',
      state: user?.state || '',
      country: user?.country || '',
    });
    setSaveMsg(null);
    setEditing(true);
  };

  const handleCancel = () => { setEditing(false); setSaveMsg(null); };

  const handleFieldChange = (name, value) => setEditForm(p => ({ ...p, [name]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateProfile(editForm);
    setSaving(false);
    if (result.success) {
      setSaveMsg({ type: 'success', text: result.message });
      setTimeout(() => { setEditing(false); setSaveMsg(null); }, 1500);
    } else {
      setSaveMsg({ type: 'error', text: result.error });
    }
  };

  if (!user) return null;

  const initials = (user.fullName || user.username || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="space-y-8">
      <PageHeader
        title="User Profile"
        subtitle="Manage your account information and preferences."
        badge="Account Settings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Avatar / Identity card ── */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 flex flex-col items-center text-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                <span className="text-white font-extrabold text-3xl tracking-tight">{initials}</span>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.fullName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
            </div>

            {/* Role badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              user.role === 'admin'
                ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}>
              <Shield className="w-3 h-3" />
              {user.role}
            </span>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Joined {joinDate}
            </div>

            {!editing && (
              <button
                onClick={handleEdit}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-all"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Details / Edit panel ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* View mode */}
          {!editing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6"
            >
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 uppercase tracking-wider text-[11px] text-slate-400">
                Account Details
              </h3>
              <InfoRow icon={User} label="Full Name" value={user.fullName} />
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={Phone} label="Phone" value={user.phone} />
              <InfoRow icon={MapPin} label="Location" value={user.location} />
              <InfoRow icon={Building2} label="City" value={user.city} />
              <InfoRow icon={Building2} label="State" value={user.state} />
              <InfoRow icon={Globe} label="Country" value={user.country} />
            </motion.div>
          )}

          {/* Edit mode */}
          {editing && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSave}
              className="glass-panel rounded-2xl border border-emerald-500/30 p-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Edit Profile</h3>
                <button type="button" onClick={handleCancel}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Non-editable fields shown as read-only */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditField label="Username (read-only)" name="username" value={user.username} disabled />
                <EditField label="Email (read-only)" name="email" value={user.email} disabled />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditField label="Full Name" name="fullName" value={editForm.fullName} onChange={handleFieldChange} placeholder="Your full name" />
                <EditField label="Phone Number" name="phone" value={editForm.phone} onChange={handleFieldChange} placeholder="+91 98765 43210" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditField label="Location / Area" name="location" value={editForm.location} onChange={handleFieldChange} placeholder="Area / locality" />
                <EditField label="City" name="city" value={editForm.city} onChange={handleFieldChange} placeholder="City" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditField label="State" name="state" value={editForm.state} onChange={handleFieldChange} placeholder="State" />
                <EditField label="Country" name="country" value={editForm.country} onChange={handleFieldChange} placeholder="Country" />
              </div>

              {saveMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
                  saveMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}>
                  {saveMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {saveMsg.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleCancel}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </motion.form>
          )}

          {/* Change Password section */}
          <ChangePasswordSection />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
