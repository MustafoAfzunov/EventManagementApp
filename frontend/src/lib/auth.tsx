import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth as authApi } from './api';

export type Role = 'Attendee' | 'EventStaff' | 'Admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp as number | undefined;
    if (exp && exp * 1000 <= Date.now()) return null;
    return {
      id: payload.sub || payload.nameid || '',
      name: payload.name || payload.unique_name || '',
      email: payload.email || '',
      role: (payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'Attendee') as Role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('uca_token');
    if (stored) {
      const parsed = parseToken(stored);
      if (parsed) {
        setToken(stored);
        const storedUser = localStorage.getItem('uca_user');
        if (storedUser) {
          try {
            const u = JSON.parse(storedUser) as AuthUser;
            setUser({ ...parsed, ...u });
          } catch {
            setUser(parsed);
          }
        } else {
          setUser(parsed);
        }
      } else {
        localStorage.removeItem('uca_token');
        localStorage.removeItem('uca_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('uca_token', res.token);
    const authUser: AuthUser = {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: res.user.role as Role,
    };
    localStorage.setItem('uca_user', JSON.stringify(authUser));
    setToken(res.token);
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('uca_token');
    localStorage.removeItem('uca_user');
    setToken(null);
    setUser(null);
  };

  const isRole = (...roles: Role[]) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
