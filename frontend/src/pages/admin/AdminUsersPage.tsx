import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { adminUsers, ApiError, type AdminUser } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import Modal from '../../components/ui/Modal';
import { c } from '../../lib/theme';

const ROLES = ['Attendee', 'EventStaff', 'Admin'] as const;

const roleBadgeStyle = (role: string) => {
  if (role === 'Admin') return { bg: `${c.primary}18`, color: c.primary };
  if (role === 'EventStaff') return { bg: `${c.secondary}18`, color: c.secondary };
  return { bg: c.surfaceHigh, color: c.onSurfaceVariant };
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Attendee' as (typeof ROLES)[number],
  });

  const refresh = () =>
    adminUsers.list()
      .then(setUsers)
      .catch(() => setUsers([]));

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'Attendee' });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      const created = await adminUsers.create(form);
      setUsers((us) => [...us, created].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      toast.success('User created.');
      setModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const [field, messages] of Object.entries(err.fieldErrors)) {
          const key = field === 'FirstName' ? 'firstName' : field === 'LastName' ? 'lastName' : field === 'Email' ? 'email' : field === 'Password' ? 'password' : field === 'Role' ? 'role' : 'general';
          mapped[key] = messages[0];
        }
        setFieldErrors(mapped);
      }
      toast.error((err as Error).message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminUsers.delete(deleteTarget.id);
      setUsers((us) => us.filter((u) => u.id !== deleteTarget.id));
      toast.success('User deleted.');
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const inputStyle = (key: string) => ({
    background: c.surfaceLowest,
    borderColor: fieldErrors[key] ? c.error : c.outlineVariant,
    fontFamily: 'Inter',
    color: c.onSurface,
  });

  return (
    <div className="pb-12" style={{ background: c.surface, minHeight: '100vh' }}>
      <div className="max-w-[1280px] mx-auto px-6 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-semibold" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>Users</h2>
            <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Add and remove user accounts across the platform.</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-sm" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', fontSize: 14 }}>
            <span className="material-symbols-outlined">person_add</span> Add User
          </button>
        </div>

        <div className="relative max-w-md mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: c.onSurfaceVariant }}>search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none"
            style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }}
          />
        </div>

        <div className="border rounded-xl shadow-sm overflow-hidden" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: `${c.surfaceLow}80` }}>
                  {['NAME', 'EMAIL', 'ROLE', 'JOINED', 'ACTIONS'].map((h) => (
                    <th key={h} className="px-5 py-4 border-b text-xs font-semibold uppercase tracking-wider" style={{ color: c.onSurfaceVariant, borderColor: c.outlineVariant, fontFamily: 'Inter' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: c.outlineVariant }}>
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 rounded animate-pulse" style={{ background: c.surfaceHigh }} /></td>
                    ))}
                  </tr>
                )) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                      No users found.
                    </td>
                  </tr>
                ) : filtered.map((u) => {
                  const badge = roleBadgeStyle(u.role);
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: c.primaryFixed, color: c.primary }}>
                            {u.fullName.charAt(0)}
                          </div>
                          <span className="font-medium" style={{ fontFamily: 'Inter', color: c.onSurface }}>{u.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{u.email}</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: badge.bg, color: badge.color, fontFamily: 'Inter' }}>{u.role}</span>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setDeleteTarget(u)}
                          disabled={isSelf}
                          title={isSelf ? 'You cannot delete your own account' : 'Delete user'}
                          className="p-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-50"
                          style={{ color: c.error }}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'Inter', color: c.onSurface }}>First name *</label>
              <input required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border focus:outline-none" style={inputStyle('firstName')} />
              {fieldErrors.firstName && <p className="text-xs mt-1" style={{ color: c.error }}>{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'Inter', color: c.onSurface }}>Last name *</label>
              <input required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border focus:outline-none" style={inputStyle('lastName')} />
              {fieldErrors.lastName && <p className="text-xs mt-1" style={{ color: c.error }}>{fieldErrors.lastName}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'Inter', color: c.onSurface }}>Email *</label>
            <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border focus:outline-none" style={inputStyle('email')} />
            {fieldErrors.email && <p className="text-xs mt-1" style={{ color: c.error }}>{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'Inter', color: c.onSurface }}>Password *</label>
            <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border focus:outline-none" style={inputStyle('password')} />
            {fieldErrors.password && <p className="text-xs mt-1" style={{ color: c.error }}>{fieldErrors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'Inter', color: c.onSurface }}>Role *</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as (typeof ROLES)[number] }))} className="w-full px-4 py-2.5 rounded-lg border focus:outline-none" style={inputStyle('role')}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {fieldErrors.role && <p className="text-xs mt-1" style={{ color: c.error }}>{fieldErrors.role}</p>}
          </div>
          <p className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Admin-created accounts are email-verified and can log in immediately.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter' }}>Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}>
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User">
        <p className="mb-6" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
          Delete <strong style={{ color: c.onSurface }}>{deleteTarget?.fullName}</strong> ({deleteTarget?.email})? This also removes their registrations and notifications.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter' }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: c.error, color: '#fff', fontFamily: 'Inter' }}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
