import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { auth, ApiError } from '../../lib/api';
import { c } from '../../lib/theme';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFieldErrors((errs) => {
      const next = { ...errs };
      delete next[k];
      delete next.general;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { toast.error('Please accept the Terms of Service.'); return; }
    setLoading(true);
    setFieldErrors({});
    try {
      await auth.register(form);
      toast.success('Account created! Check your email and click the verification link before logging in.');
      navigate('/login');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const [field, messages] of Object.entries(err.fieldErrors)) {
          const msg = messages[0];
          if (field === 'Email') mapped.email = msg;
          else if (field === 'Password') mapped.password = msg;
          else if (field === 'FirstName' || field === 'LastName') mapped.name = msg;
          else mapped.general = msg;
        }
        setFieldErrors(mapped);
        toast.error(err.message);
      } else {
        toast.error((err as Error).message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (key: string) => ({
    background: c.surfaceLowest,
    borderColor: fieldErrors[key] ? c.error : c.outlineVariant,
    fontFamily: 'Inter',
    color: c.onSurface,
  });

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <section className="relative w-full md:w-3/5 min-h-[300px] md:min-h-screen flex items-end p-6 md:p-16 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDvsu_en0oom4qfsDF79foGg-ariHduuVMSPrjn-MJouQIRGHe6vmT1VpEQJt99-vimWkQPatI9klfRt_CVFR_YmGVIKGuk023ew8g65T37Of-ymaALsKCk4MftQVn2TGfyadQVX3lsAdXAuWHxKWthVE72kRyvFpHga5BsVzSg1iVb9WmTTgnCNwFAxuLyrfl7tpCRVglwEPzVyK91ig8GbSk8Psx1S6dD_j2xgLmZIyRuixu2Zky_YubC_UwM-pNpCa8OZ44jdKNz')` }} />
        <div className="absolute top-6 left-6 z-20">
          <Link to="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: c.primary }}>
              <span className="material-symbols-outlined text-white">school</span>
            </div>
            <span className="font-bold text-xl text-white" style={{ fontFamily: 'Hanken Grotesk' }}>University of Central Asia</span>
          </Link>
        </div>
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to top,rgba(0,63,135,0.9) 0%,rgba(0,63,135,0.4) 50%,rgba(0,63,135,0.1) 100%)' }} />
        <div className="relative z-20 max-w-xl text-white">
          <h1 style={{ fontFamily: 'Hanken Grotesk', fontSize: 48, fontWeight: 700, lineHeight: '56px' }} className="mb-4">
            Join the next generation of leaders
          </h1>
          <p className="text-lg opacity-90" style={{ fontFamily: 'Inter' }}>Embark on a journey of academic excellence in the heart of the Silk Road.</p>
        </div>
      </section>

      <section className="w-full md:w-2/5 flex flex-col justify-center items-center p-6 md:p-8" style={{ background: c.surface }}>
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-semibold mb-2" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>Create an account</h2>
            <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Enter your university credentials to access the portal.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {fieldErrors.general && (
              <div className="p-3 rounded-lg text-sm" style={{ background: c.errorContainer, color: c.error, fontFamily: 'Inter' }}>
                {fieldErrors.general}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: c.outline }}>person</span>
                <input type="text" required value={form.name} onChange={set('name')} placeholder="e.g. Alisher Navoi"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border" style={inputStyle('name')} />
              </div>
              {fieldErrors.name && <p className="text-xs mt-1" style={{ color: c.error, fontFamily: 'Inter' }}>{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>University Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: c.outline }}>mail</span>
                <input type="email" required value={form.email} onChange={set('email')} placeholder="name@uca.edu.kg"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border" style={inputStyle('email')} />
              </div>
              {fieldErrors.email
                ? <p className="text-xs mt-1" style={{ color: c.error, fontFamily: 'Inter' }}>{fieldErrors.email}</p>
                : <p className="text-xs mt-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Use a valid email address (e.g. name@uca.edu.kg).</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: c.outline }}>lock</span>
                <input type={showPassword ? 'text' : 'password'} required minLength={8} value={form.password} onChange={set('password')} placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-3 rounded-lg border" style={inputStyle('password')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: c.outline }}>
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs mt-1" style={{ color: c.error, fontFamily: 'Inter' }}>{fieldErrors.password}</p>}
            </div>

            <div className="flex items-start gap-3">
              <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 rounded" style={{ accentColor: c.primary }} />
              <label htmlFor="terms" className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                I agree to the <a href="#" className="font-semibold hover:underline" style={{ color: c.primary, textDecoration: 'none' }}>Terms of Service</a> and <a href="#" className="font-semibold hover:underline" style={{ color: c.primary, textDecoration: 'none' }}>Privacy Policy</a>.
              </label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', fontSize: 18, fontWeight: 600 }}>
              {loading ? 'Creating account…' : 'Register'}
              {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t text-center" style={{ borderColor: c.outlineVariant }}>
            <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-bold hover:underline" style={{ color: c.primary, textDecoration: 'none' }}>Login</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
