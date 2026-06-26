import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../lib/auth';
import { c } from '../../lib/theme';

function Icon({ name, style = {} }: { name: string; style?: React.CSSProperties }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", verticalAlign: 'middle', ...style }}
    >
      {name}
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLink = (label: string, to: string) => (
    <Link
      to={to}
      className="text-sm transition-colors duration-200 pb-1"
      style={{
        fontFamily: 'Inter',
        color: isActive(to) ? c.primary : c.onSurfaceVariant,
        fontWeight: isActive(to) ? 700 : 400,
        borderBottom: isActive(to) ? `2px solid ${c.primary}` : '2px solid transparent',
        textDecoration: 'none',
      }}
    >
      {label}
    </Link>
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b shadow-sm"
      style={{ background: c.surface, borderColor: c.outlineVariant }}
    >
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="font-bold text-xl"
            style={{ fontFamily: 'Hanken Grotesk', color: c.primary, textDecoration: 'none' }}
          >
            University of Central Asia
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navLink('Events', '/events')}
            {user?.role === 'Admin' && navLink('Admin', '/admin/events')}
            {user?.role === 'EventStaff' && navLink('Check-in', '/staff/check-in')}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {(user.role === 'Attendee') && (
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  style={{ color: c.primary, fontFamily: 'Inter', textDecoration: 'none' }}
                >
                  <Icon name="dashboard" style={{ fontSize: 18 }} />
                  Dashboard
                </Link>
              )}
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm"
                  style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: c.primaryFixed, color: c.primary }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
                  <Icon name="expand_more" style={{ fontSize: 18, color: c.onSurfaceVariant }} />
                </button>
                <div
                  className="absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-lg overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50"
                  style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}
                >
                  {user.role === 'Attendee' && (
                    <>
                      <Link to="/dashboard" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition-colors" style={{ color: c.onSurface, fontFamily: 'Inter', textDecoration: 'none' }}>
                        <Icon name="dashboard" style={{ fontSize: 18 }} /> Dashboard
                      </Link>
                      <Link to="/my-events" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition-colors" style={{ color: c.onSurface, fontFamily: 'Inter', textDecoration: 'none' }}>
                        <Icon name="event_upcoming" style={{ fontSize: 18 }} /> My Events
                      </Link>
                    </>
                  )}
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition-colors" style={{ color: c.onSurface, fontFamily: 'Inter', textDecoration: 'none' }}>
                    <Icon name="person" style={{ fontSize: 18 }} /> Profile
                  </Link>
                  <div className="border-t" style={{ borderColor: c.outlineVariant }} />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-red-50 transition-colors" style={{ color: c.error, fontFamily: 'Inter' }}>
                    <Icon name="logout" style={{ fontSize: 18 }} /> Log Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-1.5 rounded-lg text-sm transition-all" style={{ color: c.primary, fontFamily: 'Inter', textDecoration: 'none' }}>
                Login
              </Link>
              <Link to="/register" className="px-5 py-1.5 rounded-lg shadow-sm text-sm transition-all hover:brightness-110" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', textDecoration: 'none' }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
