import type { Editor } from '@tiptap/react';

interface ToolbarProps {
  editor: Editor;
}

function Btn({
  active,
  onClick,
  label,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`min-w-8 rounded px-2 py-1 text-sm transition ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-slate-200" />;

export function Toolbar({ editor }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-1">
      <Btn
        title="Bold (Ctrl+B)"
        label="B"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <Btn
        title="Italic (Ctrl+I)"
        label="I"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <Btn
        title="Underline (Ctrl+U)"
        label="U"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <Btn
        title="Strikethrough"
        label="S"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <Divider />
      <Btn
        title="Heading 1"
        label="H1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <Btn
        title="Heading 2"
        label="H2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <Btn
        title="Body text"
        label="P"
        active={editor.isActive('paragraph')}
        onClick={() => editor.chain().focus().setParagraph().run()}
      />
      <Divider />
      <Btn
        title="Bullet list"
        label="• List"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <Btn
        title="Numbered list"
        label="1. List"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <Btn
        title="Quote"
        label="❝"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
    </div>
  );
}
