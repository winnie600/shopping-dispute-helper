// src/components/QnASection.tsx
import { useState } from 'react';
import type { QAItem } from '../data/qna';
import { MOCK_QA } from '../data/qna';

function fmt(ts: string) {
  // Safari-safe: thay khoảng trắng bằng 'T'
  return new Date(ts.replace(' ', 'T')).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function QnASection() {
  const [items, setItems] = useState<QAItem[]>(
    [...MOCK_QA].sort(
      (a, b) =>
        +new Date(b.createdAt.replace(' ', 'T')) -
        +new Date(a.createdAt.replace(' ', 'T'))
    )
  );
  const [q, setQ] = useState('');

  function submitMock() {
    const text = q.trim();
    if (!text) return;
    const it: QAItem = {
      id: String(Date.now()),
      author: 'you',
      question: text,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    // prepend
    setItems((prev) => [it, ...prev]);
    setQ('');
  }

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Q&amp;A ({items.length})</h3>
        <div className="text-xs text-gray-500">Demo-only</div>
      </div>

      {/* Ask box */}
      <div className="mt-3 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hỏi người bán… (demo)"
          className="flex-1 px-3 py-2 rounded-lg border"
        />
        <button onClick={submitMock} className="px-3 py-2 rounded-lg bg-black text-white">
          Ask
        </button>
      </div>

      {/* List */}
      <ul className="mt-4 space-y-3">
        {items.map((it) => (
          <li key={it.id} className="rounded-xl border p-3">
            <div className="text-sm">
              <span className="font-medium">{it.author}</span>{' '}
              <span className="text-gray-500">• {fmt(it.createdAt)}</span>
            </div>
            <div className="mt-1">{it.question}</div>

            {it.answer ? (
              <div className="mt-2 rounded-lg bg-gray-50 p-2 text-sm">
                <span className="text-gray-500">Seller:</span> {it.answer}
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-500">Chưa có trả lời</div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
