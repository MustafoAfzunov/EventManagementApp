import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../lib/auth';
import { c } from '../../lib/theme';

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined" style={{ verticalAlign: 'middle' }}>{name}</span>;
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Already logged in
  if (user) {
    navigate(user.role === 'Admin' ? '/admin/events' : user.role === 'EventStaff' ? '/staff/check-in' : '/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full">
      {/* Left: Campus Image */}
      <section className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA8pWbBJc3x_Gg2wACdTE566Tpj3q_3x6crLJQU8Rdu-eJbQBvtZtm4ibSuOlbhetT8T_K9ZGO5wyA2BqWvCg8L1Enjz57TwoQrt0Bgd9K864YqfisfBZYhcLVfkXs8yWRd6ZieRQXVC4T7RxpK-UVmwEJMRaDS3odlOzK51ObMR8EQRcDwAnq2QDrCL_vI1FKbo7TX14MA9StHy2sGwXsfJfZfat5CTImG_qzIUiIkGJ4nDO5FoRXLfw8e32wRS01IE14bRHZw_8LK')` }}
        />
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-12" style={{ background: 'linear-gradient(to bottom,rgba(0,63,135,0.4),rgba(0,63,135,0.8))' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <Icon name="school" />
            </div>
            <h1 className="font-bold text-2xl text-white" style={{ fontFamily: 'Hanken Grotesk' }}>University of Central Asia</h1>
          </div>
          <div className="max-w-xl">
            <h2 className="text-white mb-4" style={{ fontFamily: 'Hanken Grotesk', fontSize: 48, fontWeight: 700, lineHeight: '56px' }}>
              Empowering the next generation of leaders.
            </h2>
            <p className="text-white/90 text-lg leading-relaxed" style={{ fontFamily: 'Inter' }}>
              Access your academic portal to manage events, campus life, and your educational journey.
            </p>
          </div>
        </div>
      </section>

      {/* Right: Form */}
      <section className="w-full lg:w-[40%] flex items-center justify-center p-6 md:p-16" style={{ background: c.surfaceLowest }}>
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ background: c.primary }}>
              <Icon name="school" />
            </div>
            <h1 className="font-bold text-2xl" style={{ fontFamily: 'Hanken Grotesk', color: c.primary }}>University of Central Asia</h1>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold mb-2" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>University Login</h3>
            <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Welcome back. Please enter your credentials to continue.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Email or Student ID</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: c.onSurfaceVariant }}>person</span>
                <input
                  type="text" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@uca.edu.kg"
                  className="w-full pl-12 pr-4 py-4 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Password</label>
                <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: c.secondary, fontFamily: 'Inter', textDecoration: 'none' }}>Forgot Password?</Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: c.onSurfaceVariant }}>lock</span>
                <input
                  type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: c.onSurfaceVariant }}>
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-4 rounded-lg font-bold text-sm shadow-sm transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
              style={{ background: c.primaryContainer, color: c.onPrimary, fontFamily: 'Inter' }}
            >
              {loading ? 'Signing in…' : 'Login to Portal'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-bold hover:underline" style={{ color: c.primary, textDecoration: 'none' }}>Register</Link>
            </p>
          </div>

          <footer className="mt-12 pt-6 border-t" style={{ borderColor: c.outlineVariant }}>
            <div className="flex flex-wrap justify-between gap-4">
              <p className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>© 2024 UCA Portal</p>
              <nav className="flex gap-6">
                {['Help Center', 'Privacy Policy'].map((l) => (
                  <a key={l} href="#" className="text-xs hover:underline" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter', textDecoration: 'none' }}>{l}</a>
                ))}
              </nav>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
