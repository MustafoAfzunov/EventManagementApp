import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { user as userApi, type User } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { c } from '../../lib/theme';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<Partial<User>>({ name: authUser?.name ?? '', email: authUser?.email ?? '' });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [tab, setTab] = useState<'profile' | 'security'>('profile');

  useEffect(() => {
    userApi.me()
      .then((u) => setProfile(u))
      .catch(() => { /* use auth user */ });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await userApi.update({ name: profile.name });
      toast.success('Profile updated successfully.');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) { toast.error('New passwords do not match.'); return; }
    if (passwords.next.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setSavingPw(true);
    try {
      await userApi.changePassword(passwords.current, passwords.next);
      toast.success('Password changed successfully.');
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: 'person' },
    { id: 'security' as const, label: 'Security', icon: 'lock' },
  ];

  return (
    <div className="pb-12" style={{ background: c.surface, minHeight: '100vh' }}>
      <div className="max-w-[800px] mx-auto px-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ background: c.primaryFixed, color: c.primary, fontFamily: 'Hanken Grotesk' }}>
            {profile.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <h2 className="font-semibold text-2xl" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>{profile.name}</h2>
            <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{profile.email}</p>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold" style={{ background: c.primaryFixed, color: c.primary, fontFamily: 'Inter' }}>
              {authUser?.role}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ background: c.surfaceContainer }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? c.surfaceLowest : 'transparent',
                color: tab === t.id ? c.primary : c.onSurfaceVariant,
                fontFamily: 'Inter',
                boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="border rounded-2xl p-8" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
            <h3 className="font-semibold text-xl mb-6" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Personal Information</h3>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: c.onSurfaceVariant }}>person</span>
                  <input
                    type="text" required value={profile.name ?? ''} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className="w-full pl-12 pr-4 py-4 rounded-lg border focus:outline-none"
                    style={{ background: c.surface, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>University Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: c.onSurfaceVariant }}>mail</span>
                  <input
                    type="email" disabled value={profile.email ?? ''}
                    className="w-full pl-12 pr-4 py-4 rounded-lg border opacity-60 cursor-not-allowed"
                    style={{ background: c.surfaceLow, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Email cannot be changed. Contact the registrar for assistance.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Role</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: c.onSurfaceVariant }}>badge</span>
                  <input disabled value={authUser?.role ?? ''}
                    className="w-full pl-12 pr-4 py-4 rounded-lg border opacity-60 cursor-not-allowed"
                    style={{ background: c.surfaceLow, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={savingProfile}
                  className="px-8 py-3 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}>
                  {savingProfile ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div className="border rounded-2xl p-8" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
            <h3 className="font-semibold text-xl mb-6" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-5">
              {[
                { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
                { key: 'next', label: 'New Password', placeholder: 'Minimum 8 characters' },
                { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{f.label}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: c.onSurfaceVariant }}>lock</span>
                    <input
                      type="password" required value={passwords[f.key as keyof typeof passwords]}
                      onChange={(e) => setPasswords((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full pl-12 pr-4 py-4 rounded-lg border focus:outline-none"
                      style={{ background: c.surface, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }}
                    />
                  </div>
                </div>
              ))}

              <div className="p-4 rounded-xl border" style={{ background: c.surfaceLow, borderColor: c.outlineVariant }}>
                <p className="text-xs font-bold mb-1" style={{ color: c.primary, fontFamily: 'Inter' }}>Password Requirements</p>
                <ul className="text-xs space-y-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                  {['At least 8 characters', 'Mix of letters and numbers recommended', 'Avoid using personal information'].map((r) => (
                    <li key={r} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: '#166534' }}>check_circle</span> {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={savingPw}
                  className="px-8 py-3 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}>
                  {savingPw ? 'Changing…' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
