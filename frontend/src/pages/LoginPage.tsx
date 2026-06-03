import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../api/client';

const DEMO_ACCOUNTS = [
  { email: 'alice@ajaia.dev', label: 'Alice (owner)' },
  { email: 'bob@ajaia.dev', label: 'Bob (collaborator)' },
  { email: 'carol@ajaia.dev', label: 'Carol (reviewer)' },
];

const DEMO_PASSWORD = 'password123';

export function LoginPage() {
  const { user, login, initializing } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('alice@ajaia.dev');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Ajaia Docs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in with a seeded demo account to start editing and sharing.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Quick sign-in
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
              >
                {acc.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            All demo accounts use the password{" "}
            <code className="rounded bg-slate-100 px-1">{DEMO_PASSWORD}</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
