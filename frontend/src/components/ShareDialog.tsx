import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sharesApi, usersApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import type { ShareRole } from '../api/types';

interface ShareDialogProps {
  documentId: string;
  ownerEmail: string;
  onClose: () => void;
  onChanged: () => void;
}

export function ShareDialog({
  documentId,
  ownerEmail,
  onClose,
  onChanged,
}: ShareDialogProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareRole>('viewer');
  const [error, setError] = useState<string | null>(null);

  const collaboratorsQuery = useQuery({
    queryKey: ['shares', documentId],
    queryFn: () => sharesApi.list(documentId),
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['shares', documentId] });
    onChanged();
  }

  const grantMutation = useMutation({
    mutationFn: () => sharesApi.grant(documentId, email.trim(), role),
    onSuccess: () => {
      setEmail('');
      setError(null);
      refresh();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const revokeMutation = useMutation({
    mutationFn: (userId: string) => sharesApi.revoke(documentId, userId),
    onSuccess: refresh,
    onError: (err) => setError(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    grantMutation.mutate();
  }

  const candidateEmails = (usersQuery.data ?? [])
    .map((u) => u.email)
    .filter((e) => e !== ownerEmail);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Share document</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              list="user-emails"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@ajaia.dev"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
            <datalist id="user-emails">
              {candidateEmails.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ShareRole)}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={grantMutation.isPending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {grantMutation.isPending ? 'Sharing…' : 'Share'}
          </button>
        </form>

        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            People with access
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-700">{ownerEmail}</span>
              <span className="text-xs font-medium text-emerald-700">Owner</span>
            </li>
            {collaboratorsQuery.data?.map((c) => (
              <li
                key={c.user.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <div>
                  <div className="text-slate-700">{c.user.displayName}</div>
                  <div className="text-xs text-slate-400">{c.user.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium capitalize text-slate-500">
                    {c.role}
                  </span>
                  <button
                    onClick={() => revokeMutation.mutate(c.user.id)}
                    className="text-xs text-slate-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
            {collaboratorsQuery.data?.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400">
                Not shared with anyone yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
