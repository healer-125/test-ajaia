import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Header({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link to="/" className="text-lg font-bold text-slate-900">
          Ajaia Docs
        </Link>
        <div className="flex-1">{children}</div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user.displayName}
            </span>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
