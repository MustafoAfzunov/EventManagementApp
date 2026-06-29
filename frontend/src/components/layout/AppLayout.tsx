import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth, type Role } from '../../lib/auth';
import { c } from '../../lib/theme';

function Icon({ name, fill = 0, style = {} }: { name: string; fill?: 0 | 1; style?: React.CSSProperties }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontVariationSettings: `'FILL' ${fill},'wght' 400,'GRAD' 0,'opsz' 24`, verticalAlign: 'middle', ...style }}
    >
      {name}
    </span>
  );
}

interface NavItem { icon: string; label: string; to: string; roles?: Role[] }

const attendeeNav: NavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { icon: 'event_upcoming', label: 'My Events', to: '/my-events' },
  { icon: 'how_to_reg', label: 'Registrations', to: '/my-events' },
  { icon: 'notifications', label: 'Notifications', to: '/dashboard' },
  { icon: 'settings_account_box', label: 'Account Settings', to: '/profile' },
];

const staffNav: NavItem[] = [
  { icon: 'qr_code_scanner', label: 'Check-in Console', to: '/staff/check-in' },
];

const adminNav: NavItem[] = [
  { icon: 'event', label: 'Events', to: '/admin/events' },
  { icon: 'location_on', label: 'Venues', to: '/admin/venues' },
  { icon: 'group', label: 'Users', to: '/admin/users' },
  { icon: 'bar_chart', label: 'Reports', to: '/admin/reports' },
];

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems =
    user?.role === 'Admin' ? adminNav :
    user?.role === 'EventStaff' ? staffNav :
    attendeeNav;

  const isActive = (to: string) =>
    location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex" style={{ background: c.surface }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col h-screen w-64 fixed top-0 left-0 border-r py-6 z-40"
        style={{ background: c.surface, borderColor: c.outlineVariant }}
      >
        <div className="px-6 mb-8">
          <Link to="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: c.primary }}>
              <Icon name="school" style={{ color: c.onPrimary, fontSize: 24 }} />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight" style={{ fontFamily: 'Hanken Grotesk', color: c.primary }}>
                {user?.role === 'Admin' ? 'Admin Panel' : user?.role === 'EventStaff' ? 'Staff Portal' : 'Event Portal'}
              </h2>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: c.onSurfaceVariant }}>
                {user?.role === 'Admin' ? 'Administration' : user?.role === 'EventStaff' ? 'Staff Tools' : 'Management System'}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.label}
                to={item.to}
                className="w-full flex items-center gap-3 px-6 py-3 transition-all duration-200"
                style={{
                  background: active ? `${c.secondaryContainer}18` : 'transparent',
                  color: active ? c.primary : c.onSurfaceVariant,
                  fontWeight: active ? 700 : 400,
                  borderRight: active ? `4px solid ${c.primary}` : '4px solid transparent',
                  textDecoration: 'none',
                  display: 'flex',
                }}
              >
                <Icon name={item.icon} fill={active ? 1 : 0} style={{ color: active ? c.primary : c.onSurfaceVariant }} />
                <span style={{ fontFamily: 'Inter', fontSize: 14, letterSpacing: '0.01em' }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {user?.role !== 'Admin' && user?.role !== 'EventStaff' && (
          <div className="px-6 my-4">
            <Link
              to="/events"
              className="w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 text-sm font-medium"
              style={{ background: c.primaryContainer, color: c.onPrimary, fontFamily: 'Inter', textDecoration: 'none' }}
            >
              <Icon name="explore" style={{ fontSize: 20 }} />
              Explore Events
            </Link>
          </div>
        )}

        <div className="mt-auto border-t pt-4" style={{ borderColor: c.outlineVariant }}>
          <Link
            to="/profile"
            className="flex items-center gap-3 px-6 py-3 transition-all"
            style={{ color: c.onSurfaceVariant, textDecoration: 'none' }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: c.primaryFixed, color: c.primary }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ fontFamily: 'Inter', color: c.onSurface }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ fontFamily: 'Inter', color: c.onSurfaceVariant }}>{user?.email}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-3 transition-all"
            style={{ color: c.error }}
          >
            <Icon name="logout" />
            <span style={{ fontFamily: 'Inter', fontSize: 14 }}>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 border-b px-4 py-3 flex items-center justify-between" style={{ background: c.surface, borderColor: c.outlineVariant }}>
          <span className="font-bold" style={{ fontFamily: 'Hanken Grotesk', color: c.primary }}>UCA Portal</span>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: c.primaryFixed, color: c.primary }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </Link>
        </div>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
