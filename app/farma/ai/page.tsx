'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Source = { title: string; url: string };

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  searchHtml?: string | null;
};

const EXAMPLES = [
  'Paratsetamol qanday ta’sir qiladi?',
  'Qon bosimini tushiradigan dori guruhlari',
  'NSAID dorilarning asosiy nojo‘ya ta’sirlari',
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    const next: ChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Xatolik yuz berdi.');
      } else {
        setMessages([
          ...next,
          {
            role: 'assistant',
            content: data.answer,
            sources: data.sources,
            searchHtml: data.searchHtml,
          },
        ]);
      }
    } catch {
      setError('Internet bilan muammo. Qayta urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-white flex flex-col">
      <div className="max-w-3xl w-full mx-auto px-6 pt-8 md:pt-12">
        <div className="flex items-center justify-between mb-2">
          <Link href="/farma/dori" className="text-xs text-gray-400 hover:text-cyan-400">
            &larr; Dorilar bazasi
          </Link>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-cyan-400 mb-1">AI yordamchi</h1>
        <p className="text-sm text-gray-400 mb-6">
          Platforma bazasi va ilmiy manbalar asosida javob beradi. Manbasi yo‘q ma’lumot alohida belgilanadi.
        </p>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-6 space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
            <p className="text-sm text-gray-300 mb-3">Savol bering yoki namunadan tanlang:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-3 py-2 text-xs text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition cursor-pointer text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] bg-cyan-600 text-white text-sm rounded-2xl rounded-br-md px-4 py-3 whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[92%] bg-[#111827] border border-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </p>

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-xs text-gray-400 mb-2">Manbalar:</p>
                    <ul className="space-y-1">
                      {m.sources.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-cyan-400 hover:text-cyan-300 underline break-all"
                          >
                            {s.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {m.searchHtml && (
                  <iframe
                    title="Google Search takliflari"
                    srcDoc={m.searchHtml}
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                    className="w-full h-14 mt-3 border-0 rounded-lg"
                  />
                )}
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#111827] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-400">
              Manbalar qidirilmoqda...
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-300"
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-[#0b1120]/95 backdrop-blur border-t border-gray-800">
        <div className="max-w-3xl w-full mx-auto px-6 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-3 items-end"
          >
            <label htmlFor="chat-input" className="sr-only">
              Savolingiz
            </label>
            <textarea
              id="chat-input"
              rows={1}
              maxLength={1000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Dori haqida savol yozing..."
              className="flex-1 px-4 py-3 bg-[#111827] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Yuborish
            </button>
          </form>
          <p className="text-[11px] text-gray-500 mt-2">
            O‘quv maqsadida. Javoblarni darslik va o‘qituvchi bilan tekshiring; klinik qaror uchun
            ishlatmang. Shaxsiy ma’lumot yozmang.
          </p>
        </div>
      </div>
    </div>
  );
}
