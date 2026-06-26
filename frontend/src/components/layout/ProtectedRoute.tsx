import { Navigate, useLocation } from 'react-router';
import { useAuth, type Role } from '../../lib/auth';
import { c } from '../../lib/theme';

interface Props {
  children: React.ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: c.surface }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `${c.primary}40`, borderTopColor: c.primary }} />
          <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: c.surface }}>
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: c.errorContainer }}>
            <span className="material-symbols-outlined text-[40px]" style={{ color: c.error }}>lock</span>
          </div>
          <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Not Authorized</h2>
          <p className="mb-6" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
            You don&apos;t have permission to access this page. This area requires the{' '}
            <strong>{roles.join(' or ')}</strong> role.
          </p>
          <a href="/" className="px-6 py-3 rounded-lg text-sm font-medium" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', textDecoration: 'none' }}>
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
