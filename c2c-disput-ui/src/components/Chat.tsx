// src/components/Chat.tsx
import { useEffect, useMemo, useRef } from 'react';
import type { ChatEntry } from '../types';

type Props = { items: ChatEntry[] };

function fmtDateHeader(d: Date) {
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function avatar(sender: ChatEntry['sender']) {
  const base = 'w-7 h-7 rounded-full grid place-items-center text-[10px] font-semibold text-white';
  if (sender === 'Buyer') return `${base} bg-blue-600`;
  if (sender === 'Seller') return `${base} bg-green-600`;
  return `${base} bg-gray-500`; // not used for center roles
}

function bubbleBase(sender: ChatEntry['sender']) {
  // Center roles share neutral style
  if (sender === 'AI' || sender === 'System') return 'bg-gray-100 text-gray-800 border border-gray-200';
  if (sender === 'Buyer') return 'bg-blue-50';
  if (sender === 'Seller') return 'bg-green-50';
  return 'bg-gray-100 text-gray-700';
}

function ImageGrid({ urls }: { urls: { url: string; name?: string }[] }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {urls.map((a, i) => (
        <a
          key={a.url + i}
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-lg border bg-gray-100"
          title={a.name || 'evidence'}
        >
          <img
            src={a.url}
            alt={a.name || 'evidence'}
            className="w-full h-28 object-cover"
            onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.opacity='0'; }}
          />
        </a>
      ))}
    </div>
  );
}

function ChatMessage({ m }: { m: ChatEntry }) {
  const d = new Date(m.timestamp.replace(' ', 'T'));
  const isCenter = m.sender === 'AI' || m.sender === 'System';
  const right = !isCenter && m.sender === 'Buyer'; // Buyer on right
  const ring = m.highlight ? 'ring-2 ring-blue-400' : '';

  const maxW = isCenter ? 'max-w-[820px]' : 'max-w-[70%]';

  return (
    <div className={`flex ${isCenter ? 'justify-center' : right ? 'justify-end' : 'justify-start'} items-end gap-2`}>
      {!right && !isCenter && <div className={avatar(m.sender)}>{m.sender.slice(0,1)}</div>}

      <div className={`${maxW} px-4 py-3 rounded-2xl text-sm shadow-sm ${bubbleBase(m.sender)} ${ring}`}>
        <div className={`text-[10px] uppercase tracking-wide text-gray-500 mb-1 ${isCenter ? 'text-center' : ''}`}>
          {m.sender}
        </div>

        <div className={`${isCenter ? 'text-center' : ''} whitespace-pre-line leading-relaxed`}>
          {m.text}
        </div>

        {!!m.attachments?.length && (
          <ImageGrid urls={m.attachments.map(a => ({ url: a.url, name: a.name }))} />
        )}

        <div className={`mt-1 text-[10px] text-gray-500 ${isCenter ? 'text-center' : 'text-right'}`}>{fmtTime(d)}</div>
      </div>

      {right && !isCenter && <div className={avatar(m.sender)}>{m.sender.slice(0,1)}</div>}
    </div>
  );
}

export default function ChatList({ items }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, ChatEntry[]>();
    for (const it of items) {
      const key = new Date(it.timestamp.replace(' ', 'T')).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries()).map(([k, arr]) => ({
      key: k,
      date: new Date(arr[0].timestamp.replace(' ', 'T')),
      items: arr,
    }));
  }, [items]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [items]);

  return (
    <div className="space-y-4 max-h-64 overflow-auto pr-2">
      {groups.map((g) => (
        <div key={g.key} className="space-y-3">
          <div className="sticky top-0 z-10 w-full">
            <div className="mx-auto w-max px-3 py-0.5 rounded-full bg-gray-200 text-[11px] text-gray-700">
              {fmtDateHeader(g.date)}
            </div>
          </div>
          {g.items.map((m, idx) => <ChatMessage key={idx} m={m} />)}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
