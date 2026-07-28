import React from 'react';

export default function MarkdownToolbar({ textareaRef }) {
  const insertMD = (syntaxType) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.substring(start, end);
    const before = ta.value.substring(0, start);
    const after = ta.value.substring(end);

    let inserted = '';
    let cursorPos = start;

    switch (syntaxType) {
      case 'bold':
        inserted = `**${sel || 'bold text'}**`;
        cursorPos = sel ? start + inserted.length : start + 2;
        break;
      case 'italic':
        inserted = `*${sel || 'italic text'}*`;
        cursorPos = sel ? start + inserted.length : start + 1;
        break;
      case 'strikethrough':
        inserted = `~~${sel || 'strikethrough'}~~`;
        cursorPos = sel ? start + inserted.length : start + 2;
        break;
      case 'heading':
        inserted = `\n### ${sel || 'Heading'}\n`;
        cursorPos = start + inserted.length;
        break;
      case 'quote':
        inserted = `\n> ${sel || 'Quote text'}\n`;
        cursorPos = start + inserted.length;
        break;
      case 'code':
        inserted = sel.includes('\n') ? `\n\`\`\`\n${sel || 'code block'}\n\`\`\`\n` : `\`${sel || 'code'}\``;
        cursorPos = start + inserted.length;
        break;
      case 'link':
        inserted = `[${sel || 'link text'}](https://example.com)`;
        cursorPos = start + inserted.length;
        break;
      case 'list':
        inserted = `\n- ${sel || 'list item'}\n`;
        cursorPos = start + inserted.length;
        break;
      default:
        break;
    }

    ta.value = before + inserted + after;
    ta.focus();
    ta.setSelectionRange(cursorPos, cursorPos);

    // Trigger synthetic change event for React controlled inputs
    const event = new Event('input', { bubbles: true });
    ta.dispatchEvent(event);
  };

  return (
    <div className="md-toolbar">
      <button type="button" className="md-btn" onClick={() => insertMD('bold')} title="Bold"><i className="fa-solid fa-bold"></i></button>
      <button type="button" className="md-btn" onClick={() => insertMD('italic')} title="Italic"><i class="fa-solid fa-italic"></i></button>
      <button type="button" className="md-btn" onClick={() => insertMD('strikethrough')} title="Strikethrough"><i className="fa-solid fa-strikethrough"></i></button>
      <button type="button" className="md-btn" onClick={() => insertMD('heading')} title="Heading"><i className="fa-solid fa-heading"></i></button>
      <button type="button" className="md-btn" onClick={() => insertMD('quote')} title="Quote"><i className="fa-solid fa-quote-left"></i></button>
      <button type="button" className="md-btn" onClick={() => insertMD('code')} title="Code"><i className="fa-solid fa-code"></i></button>
      <button type="button" className="md-btn" onClick={() => insertMD('link')} title="Link"><i className="fa-solid fa-link"></i></button>
      <button type="button" className="md-btn" onClick={() => insertMD('list')} title="List"><i className="fa-solid fa-list-ul"></i></button>
    </div>
  );
}
