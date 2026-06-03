import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor', () => {
  it('renders headings and list items from initial HTML content', async () => {
    render(
      <RichTextEditor
        initialContent="<h1>Project brief</h1><ul><li>First item</li><li>Second item</li></ul>"
        editable={false}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Project brief' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('First item')).toBeInTheDocument();
    expect(screen.getByText('Second item')).toBeInTheDocument();
  });

  it('shows the formatting toolbar only when editable', async () => {
    const { rerender } = render(
      <RichTextEditor initialContent="<p>Hi</p>" editable={false} />,
    );
    expect(screen.queryByTitle('Bold (Ctrl+B)')).not.toBeInTheDocument();

    rerender(<RichTextEditor initialContent="<p>Hi</p>" editable={true} />);
    await waitFor(() => {
      expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
    });
  });
});
