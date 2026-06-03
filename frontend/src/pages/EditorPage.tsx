import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { RichTextEditor } from '../components/RichTextEditor';
import { ShareDialog } from '../components/ShareDialog';
import { documentsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { formatRelative } from '../utils/format';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_DELAY_MS = 900;

export function EditorPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [title, setTitle] = useState('');

  // Latest unsaved values + debounce timer kept in refs to avoid stale closures.
  const titleRef = useRef('');
  const contentRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: doc, isLoading, isError, error } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.get(id),
  });

  const canEdit = doc?.access === 'owner' || doc?.access === 'editor';
  const isOwner = doc?.access === 'owner';

  useEffect(() => {
    if (doc) {
      setTitle(doc.title);
      titleRef.current = doc.title;
      contentRef.current = doc.contentHtml;
    }
  }, [doc]);

  const saveMutation = useMutation({
    mutationFn: () =>
      documentsApi.update(id, {
        title: titleRef.current,
        contentHtml: contentRef.current,
      }),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: () => setSaveStatus('error'),
  });

  const scheduleSave = useCallback(() => {
    if (!canEdit) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveMutation.mutate(), AUTOSAVE_DELAY_MS);
  }, [canEdit, saveMutation]);

  // Flush any pending save when leaving the page.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    titleRef.current = value;
    scheduleSave();
  }

  function handleContentChange(html: string) {
    contentRef.current = html;
    scheduleSave();
  }

  function saveNow() {
    if (timerRef.current) clearTimeout(timerRef.current);
    saveMutation.mutate();
  }

  return (
    <div className="min-h-full">
      <Header>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-slate-500 hover:text-blue-600">
            ← All documents
          </Link>
          {doc && <SaveIndicator status={saveStatus} updatedAt={doc.updatedAt} />}
        </div>
      </Header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {isLoading && <p className="text-slate-400">Loading document…</p>}
        {isError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-red-700">
            {getErrorMessage(error, 'Unable to load this document')}
          </div>
        )}

        {doc && (
          <>
            <div className="mb-4 flex items-start justify-between gap-4">
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                readOnly={!canEdit}
                placeholder="Untitled document"
                className="w-full bg-transparent text-3xl font-bold text-slate-900 focus:outline-none"
              />
              {isOwner && (
                <button
                  onClick={() => setShareOpen(true)}
                  className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Share
                </button>
              )}
            </div>

            {!canEdit && (
              <div className="mb-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
                You have view-only access to this document.
              </div>
            )}

            {canEdit && saveStatus === 'error' && (
              <div className="mb-3 flex items-center gap-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                Failed to save changes.
                <button
                  onClick={saveNow}
                  className="font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            <RichTextEditor
              key={doc.id}
              initialContent={doc.contentHtml}
              editable={!!canEdit}
              onChange={handleContentChange}
            />

            {shareOpen && isOwner && (
              <ShareDialog
                documentId={doc.id}
                ownerEmail={doc.owner.email}
                onClose={() => setShareOpen(false)}
                onChanged={() => {
                  queryClient.invalidateQueries({ queryKey: ['document', id] });
                  queryClient.invalidateQueries({ queryKey: ['documents'] });
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function SaveIndicator({
  status,
  updatedAt,
}: {
  status: SaveStatus;
  updatedAt: string;
}) {
  const text =
    status === 'saving'
      ? 'Saving…'
      : status === 'saved'
        ? 'All changes saved'
        : status === 'error'
          ? 'Save failed'
          : `Edited ${formatRelative(updatedAt)}`;
  return (
    <span
      className={`text-xs ${status === 'error' ? 'text-red-600' : 'text-slate-400'}`}
    >
      {text}
    </span>
  );
}
