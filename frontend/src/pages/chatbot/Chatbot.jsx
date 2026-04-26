import { useState, useRef, useEffect } from 'react';
import { chatbotApi } from '../../api/chatbot';

// Strip LaTeX and convert plain-text math to readable Unicode
function stripLatex(text) {
  return text
    .replace(/\\\[\s*/g, '').replace(/\s*\\\]/g, '')
    .replace(/\$\$\s*/g, '').replace(/\s*\$\$/g, '')
    .replace(/\\\(\s*/g, '').replace(/\s*\\\)/g, '')
    .replace(/\\sqrt\{([^}]+)\}/g, '\u221a($1)')
    .replace(/\\sqrt\s+(\S+)/g, '\u221a$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\approx/g, '\u2248')
    .replace(/\\times/g, '\u00d7')
    .replace(/\\div/g, '\u00f7')
    .replace(/\\pm/g, '\u00b1')
    .replace(/\\infty/g, '\u221e')
    .replace(/\\pi/g, '\u03c0')
    .replace(/\\alpha/g, '\u03b1').replace(/\\beta/g, '\u03b2').replace(/\\gamma/g, '\u03b3')
    .replace(/\\theta/g, '\u03b8').replace(/\\lambda/g, '\u03bb').replace(/\\mu/g, '\u03bc')
    .replace(/\\sigma/g, '\u03c3').replace(/\\Delta/g, '\u0394').replace(/\\sum/g, '\u03a3')
    .replace(/\^2/g, '\u00b2').replace(/\^3/g, '\u00b3')
    .replace(/\^{([^}]+)}/g, '^($1)')
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\bsqrt\(([^)]+)\)/g, '\u221a($1)')
    .replace(/\bsqrt\s+(\S+)/g, '\u221a$1')
    .replace(/\bpi\b/g, '\u03c0')
    .replace(/\binfinity\b/g, '\u221e')
    .replace(/\b(\w+)\^2\b/g, '$1\u00b2')
    .replace(/\b(\w+)\^3\b/g, '$1\u00b3');
}

function inlineFormat(text) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: '#1a1a2e', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ background: '#dbeffe', color: '#1a5a9a', padding: '0 4px', borderRadius: '4px', fontSize: '0.75rem' }}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function renderMarkdown(raw) {
  const text = stripLatex(raw);
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') { i++; continue; }

    // Table
    if (line.includes('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines.filter(l => !/^\|[-| :]+\|$/.test(l.trim()));
      elements.push(
        <div key={i} className="overflow-x-auto my-2">
          <table className="text-xs border-collapse w-full">
            {rows.map((row, ri) => {
              const cells = row.split('|').filter((_, ci) => ci > 0 && ci < row.split('|').length - 1);
              return (
                <tr key={ri} style={ri === 0 ? { borderBottom: '1px solid #c8dcc6' } : {}}>
                  {cells.map((cell, ci) => {
                    const Tag = ri === 0 ? 'th' : 'td';
                    return <Tag key={ci} style={{ padding: '4px 12px', textAlign: 'left', color: '#1a1a2e' }}>{cell.trim()}</Tag>;
                  })}
                </tr>
              );
            })}
          </table>
        </div>
      );
      continue;
    }

    // Bullet list
    if (/^[-*•]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-1 my-1">
          {items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={i} className="list-decimal list-inside space-y-1 my-1">
          {items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Heading
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#+)/)[1].length;
      const content = line.replace(/^#+\s/, '');
      const cls = level === 1 ? 'text-base font-bold mt-2' : 'text-sm font-bold mt-1';
      elements.push(<p key={i} className={cls}>{inlineFormat(content)}</p>);
      i++; continue;
    }

    elements.push(<p key={i} className="leading-relaxed">{inlineFormat(line)}</p>);
    i++;
  }

  return elements;
}

export default function Chatbot() {
  const [mode,       setMode]       = useState('study');
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText,   setEditText]   = useState('');
  const [copiedIdx,  setCopiedIdx]  = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: mode === 'study'
        ? "Hi! I'm your Study Assistant. Ask me anything about your subjects, concepts, or study strategies. What are you working on today?"
        : "Hi! I'm here to support you. How are you feeling about your studies today?",
      mode
    }]);
  }, [mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: msg, mode }]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatbotApi.sendMessage(msg, mode);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.reply, mode }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', mode }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function startEdit(i, content) {
    setEditingIdx(i);
    setEditText(content);
  }

  function cancelEdit() {
    setEditingIdx(null);
    setEditText('');
  }

  async function submitEdit(i) {
    const newText = editText.trim();
    if (!newText) return;
    setMessages(prev => prev.slice(0, i));
    setEditingIdx(null);
    setEditText('');
    await sendMessage(newText);
  }

  async function copyText(content, i) {
    await navigator.clipboard.writeText(content);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="flex flex-col h-screen p-8 pb-0" style={{ background: '#E5EEE4' }}>

      <div className="mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>AI Assistant</h2>
        <p className="mt-1" style={{ color: '#6b7a6b' }}>Your personal study and motivation companion.</p>
      </div>

      <div className="flex gap-2 mb-4 flex-shrink-0">
        <button onClick={() => setMode('study')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={mode === 'study' ? { background: '#87CEFA', color: '#1a1a2e' } : { background: '#69fd59', color: '#4a5a4a' }}>
          📚 Study Assistant
        </button>
        <button onClick={() => setMode('motivation')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={mode === 'motivation' ? { background: '#87CEFA', color: '#1a1a2e' } : { background: '#f0fd36', color: '#4a5a4a' }}>
          💙 Motivation & Support
        </button>
      </div>

      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ background: '#E5EEE4', borderColor: '#c8dcc6' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: '#87CEFA' }}></div>
          <p className="text-xs" style={{ color: '#4a5a4a' }}>
            {mode === 'study' ? 'Study mode — Ask questions, get explanations, solve problems' : 'Motivation mode — Share how you feel, get encouragement and support'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

            <div className="px-4 py-3 rounded-2xl text-sm max-w-2xl border"
              style={msg.role === 'user'
                ? { background: '#87CEFA', color: '#1a1a2e', borderColor: '#6ab8e8', borderTopRightRadius: '4px' }
                : { background: '#a2fcff', color: '#000000', borderColor: '#c8dcc6', borderTopLeftRadius: '4px' }}>
              {editingIdx === i ? (
                <div className="space-y-2 min-w-60">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(i); }
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    rows={3} autoFocus
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none border"
                    style={{ background: '#fff', borderColor: '#6ab8e8', color: '#1a1a2e' }}
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={cancelEdit}
                      className="text-xs px-3 py-1 rounded-lg border transition-colors"
                      style={{ background: '#fff', borderColor: '#b0c4b0', color: '#4a5a4a' }}>
                      Cancel
                    </button>
                    <button type="button" onClick={() => submitEdit(i)}
                      className="text-xs px-3 py-1 rounded-lg font-medium transition-colors"
                      style={{ background: '#3a9ad9', color: '#fff' }}>
                      Send
                    </button>
                  </div>
                </div>
              ) : msg.role === 'assistant' ? (
                <div className="space-y-1 text-sm">{renderMarkdown(msg.content)}</div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}
            </div>

            {editingIdx !== i && (
              <div className="flex gap-2 mt-1 px-1">
                {msg.role === 'user' && (
                  <button type="button" onClick={() => startEdit(i, msg.content)}
                    className="flex items-center gap-1 text-xs transition-colors" style={{ color: '#8a9a8a' }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                  </button>
                )}
                {msg.role === 'assistant' && (
                  <button type="button" onClick={() => copyText(msg.content, i)}
                    className="flex items-center gap-1 text-xs transition-colors" style={{ color: copiedIdx === i ? '#1a7a3a' : '#8a9a8a' }}>
                    {copiedIdx === i ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 border" style={{ background: '#E5EEE4', borderColor: '#c8dcc6', borderTopLeftRadius: '4px' }}>
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#87CEFA', animationDelay: `${delay}ms` }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <div className="flex-shrink-0 pb-8 pt-4 border-t" style={{ borderColor: '#c8dcc6' }}>
        <div className="flex gap-3">
          <textarea
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder={mode === 'study' ? 'Ask a study question...' : "Share how you're feeling..."}
            rows={1}
            className="flex-1 rounded-xl px-4 py-3 focus:outline-none resize-none transition-colors text-sm border"
            style={{ background: '#fff', borderColor: '#b0c4b0', color: '#1a1a2e' }}
          />
          <button type="button" onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{ background: '#87CEFA', color: '#1a1a2e' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: '#8a9a8a' }}>Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}