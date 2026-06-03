import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { TOKEN_STORAGE_KEY } from '../api/client';
import { authApi } from '../api/endpoints';
import type { PublicUser } from '../api/types';

interface AuthContextValue {
  user: PublicUser | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore the session from a persisted token on first load.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setInitializing(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, logout }),
    [user, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
