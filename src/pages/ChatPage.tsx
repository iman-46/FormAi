import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Cloud, AlertTriangle, MessageSquareText, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useHybridRunner } from '../hooks/useHybridRunner';
import { askDocumentQuestion } from '../services/hybridAIService';
import type { ChatMessage } from '../types';

const SUGGESTED_QUESTIONS = [
  'What is the last date to confirm admission or submit?',
  'Am I eligible according to these conditions?',
  'Which documents are mandatory vs optional?',
  'What happens if I miss the deadline?',
  'Explain Section 4 in plain words.',
  'What should I complete first?',
];

export default function ChatPage() {
  const { user, activeDoc, chatMessages, remoteConfig, appendChatMessage } = useApp();
  const { executeTrackedTask } = useHybridRunner();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activeDoc) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center max-w-xl mx-auto">
        <p className="text-sm font-medium mb-2">Select or upload a document first</p>
        <Link
          to="/upload"
          className="inline-flex px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold"
        >
          Upload Document
        </Link>
      </div>
    );
  }

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) return;
    if (!activeDoc.extractedText) {
      setError('No extracted text is available for this document.');
      return;
    }

    setError(null);
    setSending(true);
    setInput('');

    const uid = user?.uid || 'guest';
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      userId: uid,
      docId: activeDoc.id,
      role: 'user',
      content: trimmed,
      uncertain: false,
      inferenceSource: 'none',
    };

    try {
      const historySnapshot = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await executeTrackedTask({
        operation: 'chat',
        docId: activeDoc.id,
        docTitle: activeDoc.title,
        requestedMode: 'only_in_cloud',
        requiresCloud: true,
        consentReason: `Multi-turn Ask Your Document Q&A uses Firebase AI Logic Cloud inference (${remoteConfig.cloudModelId}) because on-device Chrome models only support single-turn prompts.`,
        run: async () => {
          const out = await askDocumentQuestion({
            documentTitle: activeDoc.title,
            documentText: activeDoc.extractedText || '',
            history: historySnapshot,
            question: trimmed,
            remoteConfig,
          });
          return { data: out, meta: out.meta };
        },
      });

      if (!res) {
        setSending(false);
        return;
      }

      await appendChatMessage(userMsg);

      const assistantMsg: ChatMessage = {
        id: `msg_a_${Date.now() + 1}`,
        userId: uid,
        docId: activeDoc.id,
        role: 'assistant',
        content: res.data.answer,
        citations: res.data.citations,
        uncertain: res.data.uncertain,
        inferenceSource: res.meta.inferenceSource,
      };
      await appendChatMessage(assistantMsg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to answer question.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendQuestion(input);
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{activeDoc.title}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Ask Your Document</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Multi-turn grounded Q&amp;A powered by Cloud Gemini via Firebase AI Logic (<span className="font-mono">{remoteConfig.cloudModelId}</span>).
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-900/60 bg-violet-50/70 dark:bg-violet-950/30 text-xs font-mono text-violet-700 dark:text-violet-300">
          <Cloud className="w-3.5 h-3.5" />
          CLOUD CHAT SESSION
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={sending}
            onClick={() => void sendQuestion(q)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs text-slate-700 dark:text-slate-300 hover:border-violet-400 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Conversation Thread */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 min-h-[380px] max-h-[540px] overflow-y-auto space-y-4">
        {chatMessages.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquareText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Ask anything about "{activeDoc.title}"</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Answers are grounded in the extracted document text, include section citations, and flag missing or ambiguous information.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#0F172A] dark:bg-violet-600 text-white'
                    : 'border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)]'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {msg.role === 'assistant' && msg.uncertain && (
                  <div className="mt-3 pt-2.5 border-t border-amber-300/40 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Uncertainty warning: The document may not state this completely; verify with the issuing organization.</span>
                  </div>
                )}

                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[var(--border-hairline)] text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <p className="font-semibold">Document references:</p>
                    {msg.citations.map((c, idx) => (
                      <p key={idx}>• {c}</p>
                    ))}
                  </div>
                )}

                {msg.role === 'assistant' && (
                  <p className="mt-2 text-[10px] font-mono text-violet-700 dark:text-violet-400">
                    inferenceSource: {msg.inferenceSource.toUpperCase()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <input
          type="text"
          value={input}
          disabled={sending}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question about deadlines, fees, eligibility, or sections..."
          className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? 'Thinking...' : 'Ask'}
        </button>
      </form>
    </div>
  );
}
