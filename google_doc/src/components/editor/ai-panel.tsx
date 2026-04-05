'use client';

import {
  SparklesIcon,
  XIcon,
  SendIcon,
  FileTextIcon,
  SpellCheckIcon,
  PenLineIcon,
  TagIcon,
  ChevronDownIcon,
  CopyIcon,
  CheckIcon,
  Loader2Icon,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Editor } from '@tiptap/react';

import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/use-editor-store';

// ── Types ─────────────────────────────────────────────────────────────────────

type Task = 'summarise' | 'grammar' | 'rewrite' | 'title';
type Mode = 'tasks' | 'chat';

interface TaskConfig {
  id: Task;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const TASKS: TaskConfig[] = [
  {
    id: 'summarise',
    label: 'Summarise',
    description: 'Get a 2–3 sentence summary of the document.',
    icon: FileTextIcon,
    color: 'text-blue-600',
  },
  {
    id: 'grammar',
    label: 'Fix Grammar',
    description: 'Correct spelling and grammar errors in selected text.',
    icon: SpellCheckIcon,
    color: 'text-green-600',
  },
  {
    id: 'rewrite',
    label: 'Rewrite',
    description: 'Make selected text clearer and more professional.',
    icon: PenLineIcon,
    color: 'text-purple-600',
  },
  {
    id: 'title',
    label: 'Suggest Titles',
    description: 'Generate 3 title ideas for this document.',
    icon: TagIcon,
    color: 'text-orange-600',
  },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function getDocumentContent(editor: ReturnType<typeof useEditorStore>['editor']): string {
  return editor?.getText() ?? '';
}

function getSelectedText(editor: ReturnType<typeof useEditorStore>['editor']): string {
  if (!editor) return '';
  const { from, to } = editor.state.selection;
  return editor.state.doc.textBetween(from, to, '\n');
}

// ── Sub-components ────────────────────────────────────────────────────────────

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
    >
      {copied ? <CheckIcon className="size-3 text-green-500" /> : <CopyIcon className="size-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const InsertButton = ({ text, onInsert }: { text: string; onInsert: (t: string) => void }) => (
  <button
    onClick={() => onInsert(text)}
    className="flex items-center gap-1 rounded px-2 py-1 text-xs bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
  >
    Insert into doc
  </button>
);

interface ResultCardProps {
  result: string;
  task?: Task;
  onInsert: (text: string) => void;
}

const ResultCard = ({ result, task, onInsert }: ResultCardProps) => {
  // Title suggestions come back as a JSON array
  if (task === 'title') {
    let titles: string[] = [];
    try {
      titles = JSON.parse(result);
    } catch {
      titles = result.split('\n').filter(Boolean);
    }

    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Title Suggestions</p>
        {titles.map((title, i) => (
          <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-white border border-neutral-200 px-3 py-2">
            <span className="text-sm text-neutral-800 flex-1">{title}</span>
            <div className="flex items-center gap-1 shrink-0">
              <CopyButton text={title} />
              <InsertButton text={title} onInsert={onInsert} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
      <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{result}</p>
      <div className="flex items-center justify-end gap-1 pt-1 border-t border-neutral-200">
        <CopyButton text={result} />
        <InsertButton text={result} onInsert={onInsert} />
      </div>
    </div>
  );
};

// ── Main Panel ────────────────────────────────────────────────────────────────

interface AIPanelProps {
  onClose: () => void;
}

export const AIPanel = ({ onClose }: AIPanelProps) => {
  const { editor } = useEditorStore();
  const [mode, setMode] = useState<Mode>('tasks');

  // Tasks state
  const [taskLoading, setTaskLoading] = useState<Task | null>(null);
  const [taskResults, setTaskResults] = useState<Partial<Record<Task, string>>>({});

  // Chat state
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, streamingText]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const insertText = useCallback(
    (text: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(text).run();
      toast.success('Inserted into document');
    },
    [editor],
  );

  // ── Task (complete) handler ───────────────────────────────────────────────

  const runTask = async (task: Task) => {
    const content =
      task === 'grammar' || task === 'rewrite'
        ? getSelectedText(editor) || getDocumentContent(editor)
        : getDocumentContent(editor);

    if (!content.trim()) {
      toast.error('The document is empty. Add some text first.');
      return;
    }

    setTaskLoading(task);
    setTaskResults((prev) => ({ ...prev, [task]: undefined }));

    try {
      const res = await fetch('/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, content }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Error ${res.status}`);
      }

      const data = (await res.json()) as { result: string };
      setTaskResults((prev) => ({ ...prev, [task]: data.result }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setTaskLoading(null);
    }
  };

  // ── Chat (stream) handler ─────────────────────────────────────────────────

  const sendChatMessage = async () => {
    const prompt = chatPrompt.trim();
    if (!prompt || chatLoading) return;

    const context = getDocumentContent(editor);
    setChatHistory((h) => [...h, { role: 'user', content: prompt }]);
    setChatPrompt('');
    setChatLoading(true);
    setStreamingText('');

    try {
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context }),
      });

      if (!res.ok || !res.body) throw new Error(`Stream error ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE lines
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
            const delta = parsed.choices?.[0]?.delta?.content ?? '';
            accumulated += delta;
            setStreamingText(accumulated);
          } catch {
            // skip malformed chunk
          }
        }
      }

      setChatHistory((h) => [...h, { role: 'assistant', content: accumulated }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Stream failed');
    } finally {
      setChatLoading(false);
      setStreamingText('');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col bg-white border-l border-neutral-200 w-80 shrink-0 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <SparklesIcon className="size-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-neutral-800">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex border-b border-neutral-200 px-4 py-2 gap-1">
        {(['tasks', 'chat'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors capitalize',
              mode === m
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700',
            )}
          >
            {m === 'tasks' ? 'Quick Tasks' : 'Ask AI'}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'tasks' ? (
          <div className="p-4 space-y-3">
            <p className="text-xs text-neutral-500">
              Run AI actions on your document. For Grammar and Rewrite, select text first — otherwise the full document is used.
            </p>

            {TASKS.map((task) => {
              const Icon = task.icon;
              const isLoading = taskLoading === task.id;
              const result = taskResults[task.id];

              return (
                <div key={task.id} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                  <button
                    onClick={() => runTask(task.id)}
                    disabled={!!taskLoading}
                    className="flex w-full items-start gap-3 px-3 py-3 hover:bg-neutral-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className={cn('mt-0.5 shrink-0', task.color)}>
                      {isLoading ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-neutral-800">{task.label}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{task.description}</p>
                    </div>
                  </button>

                  {result && (
                    <div className="border-t border-neutral-100 px-3 pb-3">
                      <ResultCard result={result} task={task.id} onInsert={insertText} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: 'calc(100% - 64px)' }}>
              {chatHistory.length === 0 && !streamingText && (
                <div className="text-center pt-8 space-y-2">
                  <div className="flex justify-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100">
                      <SparklesIcon className="size-6 text-indigo-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-neutral-700">Ask anything about your document</p>
                  <p className="text-xs text-neutral-400">The AI has access to your full document context.</p>
                </div>
              )}

              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-neutral-900 text-white rounded-br-sm'
                        : 'bg-neutral-100 text-neutral-800 rounded-bl-sm',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-2 pt-1 border-t border-neutral-200/50">
                        <CopyButton text={msg.content} />
                        <InsertButton text={msg.content} onInsert={insertText} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {streamingText && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-neutral-100 px-3 py-2 text-sm text-neutral-800 leading-relaxed">
                    <p className="whitespace-pre-wrap">{streamingText}</p>
                    <span className="inline-block size-1.5 rounded-full bg-indigo-500 animate-pulse ml-0.5" />
                  </div>
                </div>
              )}

              {chatLoading && !streamingText && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="size-1.5 rounded-full bg-neutral-400 animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-neutral-200 p-3">
              <div className="flex items-end gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 focus-within:border-indigo-300 focus-within:bg-white transition-colors">
                <textarea
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder="Ask the AI anything… (Enter to send)"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
                  style={{ maxHeight: '100px' }}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatPrompt.trim() || chatLoading}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
                >
                  <SendIcon className="size-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-neutral-400">Shift+Enter for new line</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
