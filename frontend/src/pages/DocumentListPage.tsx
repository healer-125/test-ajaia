import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Header } from '../components/Header';
import { documentsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { formatRelative } from '../utils/format';
import type { DocumentSummary } from '../api/types';

const ACCEPTED_TYPES = '.txt,.md,.docx';

export function DocumentListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const { data: documents, isLoading, isError, error } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () => documentsApi.create({ title: 'Untitled document' }),
    onSuccess: (doc) => navigate(`/doc/${doc.id}`),
    onError: (err) => setBanner(getErrorMessage(err)),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsApi.upload(file),
    onSuccess: (doc) => navigate(`/doc/${doc.id}`),
    onError: (err) => setBanner(getErrorMessage(err)),
  });

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setBanner(null);
      uploadMutation.mutate(file);
    }
    e.target.value = '';
  }

  const owned = (documents ?? []).filter((d) => d.access === 'owner');
  const shared = (documents ?? []).filter((d) => d.access !== 'owner');

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
            <p className="text-sm text-slate-500">
              Create, import, edit, and share rich-text documents.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFilePicked}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {uploadMutation.isPending ? 'Importing…' : 'Import file'}
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              New document
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Supported imports: .txt, .md, .docx (max 5 MB).
        </p>

        {banner && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {banner}
          </div>
        )}

        {isLoading && (
          <p className="mt-8 text-slate-400">Loading documents…</p>
        )}
        {isError && (
          <p className="mt-8 text-red-600">{getErrorMessage(error)}</p>
        )}

        {documents && (
          <div className="mt-8 space-y-10">
            <Section
              title="My documents"
              emptyHint="You have not created any documents yet."
              docs={owned}
            />
            <Section
              title="Shared with me"
              emptyHint="No documents have been shared with you yet."
              docs={shared}
            />
          </div>
        )}
      </main>
    </div>
  );

  function Section({
    title,
    emptyHint,
    docs,
  }: {
    title: string;
    emptyHint: string;
    docs: DocumentSummary[];
  }) {
    return (
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title} <span className="text-slate-400">({docs.length})</span>
        </h2>
        {docs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            {emptyHint}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onOpen={() => navigate(`/doc/${doc.id}`)}
                onChanged={() =>
                  queryClient.invalidateQueries({ queryKey: ['documents'] })
                }
                onError={setBanner}
              />
            ))}
          </div>
        )}
      </section>
    );
  }
}

function DocumentCard({
  doc,
  onOpen,
  onChanged,
  onError,
}: {
  doc: DocumentSummary;
  onOpen: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const isOwner = doc.access === 'owner';

  const renameMutation = useMutation({
    mutationFn: (newTitle: string) =>
      documentsApi.update(doc.id, { title: newTitle }),
    onSuccess: () => {
      setRenaming(false);
      onChanged();
    },
    onError: (err) => onError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentsApi.remove(doc.id),
    onSuccess: onChanged,
    onError: (err) => onError(getErrorMessage(err)),
  });

  return (
    <div className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div>
        {renaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              renameMutation.mutate(title.trim() || 'Untitled document');
            }}
          >
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setRenaming(false)}
              className="w-full rounded border border-blue-400 px-2 py-1 text-sm focus:outline-none"
            />
          </form>
        ) : (
          <button
            onClick={onOpen}
            className="text-left text-base font-semibold text-slate-900 hover:text-blue-600"
          >
            {doc.title}
          </button>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs">
          <AccessBadge access={doc.access} />
          {!isOwner && (
            <span className="text-slate-400">by {doc.owner.displayName}</span>
          )}
          {isOwner && doc.sharedCount > 0 && (
            <span className="text-slate-400">
              shared with {doc.sharedCount}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {formatRelative(doc.updatedAt)}
        </span>
        {isOwner && (
          <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => {
                setTitle(doc.title);
                setRenaming(true);
              }}
              className="text-xs text-slate-500 hover:text-blue-600"
            >
              Rename
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(`Delete "${doc.title}"? This cannot be undone.`)
                ) {
                  deleteMutation.mutate();
                }
              }}
              className="text-xs text-slate-500 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AccessBadge({ access }: { access: DocumentSummary['access'] }) {
  const styles: Record<string, string> = {
    owner: 'bg-emerald-50 text-emerald-700',
    editor: 'bg-blue-50 text-blue-700',
    viewer: 'bg-amber-50 text-amber-700',
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${styles[access]}`}
    >
      {access}
    </span>
  );
}
