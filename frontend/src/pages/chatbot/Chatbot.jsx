import { useState, useRef, useEffect } from 'react';
import { chatbotApi } from '../../api/chatbot';

export default function Chatbot() {
  const [mode,     setMode]     = useState('study');
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
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

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text, mode }]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatbotApi.sendMessage(text, mode);
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

  return (
    <div className="flex flex-col h-screen p-8 pb-0">

      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
        <p className="text-gray-400 mt-1">Your personal study and motivation companion.</p>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2 mb-4 flex-shrink-0">
        <button onClick={() => setMode('study')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'study' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          📚 Study Assistant
        </button>
        <button onClick={() => setMode('motivation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'motivation' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          💙 Motivation & Support
        </button>
      </div>

      {/* Mode indicator */}
      <div className="mb-4 flex-shrink-0">
        {mode === 'study' ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-900/30 border border-indigo-800/50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
            <p className="text-indigo-300 text-xs">Study mode — Ask questions, get explanations, solve problems</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-violet-900/30 border border-violet-800/50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-violet-400"></div>
            <p className="text-violet-300 text-xs">Motivation mode — Share how you feel, get encouragement and support</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-3 rounded-2xl text-sm max-w-2xl ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-tl-sm'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pb-8 pt-4 border-t border-gray-800">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={mode === 'study' ? 'Ask a study question...' : "Share how you're feeling..."}
            rows={1}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-colors text-sm"
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className={`px-4 py-3 rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${mode === 'study' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-violet-600 hover:bg-violet-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>
        <p className="text-gray-600 text-xs mt-2 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}