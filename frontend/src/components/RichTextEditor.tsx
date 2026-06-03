import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Toolbar } from './Toolbar';

interface RichTextEditorProps {
  initialContent: string;
  editable: boolean;
  onChange?: (html: string) => void;
}

export function RichTextEditor({
  initialContent,
  editable,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        class: 'doc-content min-h-[60vh] px-2 py-4',
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  // Keep the editor's editable state in sync with the caller's permission.
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  if (!editor) {
    return null;
  }

  return (
    <div>
      {editable && (
        <div className="sticky top-[57px] z-10 mb-3 bg-slate-50 pb-1 pt-1">
          <Toolbar editor={editor} />
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
