// src/pages/ChatInbox.tsx
import { useMemo, useState } from 'react';
import { CASES } from '../data/cases';
import type { CaseData, ChatEntry, CaseId } from '../types';
import ChatList from '../components/Chat';
import ChatComposer from '../components/ChatComposer';
import { logActivity } from '../utils/eventBus';

type Thread = { id: CaseId; title: string; price: string; lastMsg: string; unread: number };

function buildThreads(): Thread[] {
  return CASES.map((c) => {
    const last = c.chatLog[c.chatLog.length - 1];
    return {
      id: c.id,
      title: c.title,
      price: c.listingInfo.listedPrice,
      lastMsg: last ? `${last.sender}: ${last.text}` : '',
      unread: c.chatLog.length ? 1 : 0,
    };
  });
}

function nowTs() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function ListingSidebar({ data }: { data: CaseData }) {
  const { listingInfo } = data;
  return (
    <aside className="hidden xl:block w-[280px] shrink-0">
      <div className="sticky top-4 space-y-4">
        <div className="card overflow-hidden">
          <div className="aspect-[4/3] bg-gray-100">
            <img
              src={listingInfo.photos[0]?.url}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0';
              }}
              alt={listingInfo.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3">
            <div className="line-clamp-2 text-sm">{listingInfo.title}</div>
            <div className="mt-1 font-semibold">{listingInfo.listedPrice}</div>
          </div>
        </div>
        <div className="card p-3 bg-green-50 border-green-200 text-sm">✅ In-app chat & 7-ELEVEN COD protected.</div>
        <div className="card p-3 text-xs text-gray-600">
          <div className="mt-2 h-64 rounded-lg bg-red-200/60 grid place-items-center">Ad</div>
        </div>
      </div>
    </aside>
  );
}

export default function ChatInbox() {
  const threads = useMemo(() => buildThreads(), []);
  const [activeId, setActiveId] = useState<CaseId | undefined>(threads[0]?.id);

  const [logs, setLogs] = useState<Record<CaseId, ChatEntry[]>>(
    Object.fromEntries(CASES.map((c) => [c.id, [...c.chatLog]])) as Record<CaseId, ChatEntry[]>
  );

  const activeCase = useMemo(() => (activeId ? CASES.find((c) => c.id === activeId) : undefined), [activeId]);
  const activeLog = activeId ? logs[activeId] ?? [] : [];

  function push(e: ChatEntry) {
    if (!activeId) return; // guard
    setLogs((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), e] }));
  }

  function onReturnRefund() {
    if (!activeId) return;
    const ts = nowTs();
    push({
      timestamp: ts,
      sender: 'Buyer',
      text: 'Return & Full Refund requested.\nReason: Not as described / undisclosed repair.',
      highlight: true,
    });
    logActivity({
      ts,
      caseId: activeId,
      actor: 'Buyer',
      type: 'RETURN_REQUEST',
      note: 'Return & Full Refund requested',
    });

    const ts2 = nowTs();
    const aiText = [
      'Return/Refund request received.',
      'Seller has 24 hours to: Accept / Decline / Counter-offer.',
      '',
      'Tip:',
      '• Buyer — upload Apple Support screenshots & comparison photos.',
      '• Seller — provide Apple service proof if available.',
    ].join('\n');
    push({ timestamp: ts2, sender: 'AI', text: aiText });
    logActivity({ ts: ts2, caseId: activeId, actor: 'AI', type: 'MESSAGE', note: 'Guidance after return request' });
  }

  function onCompleted() {
    if (!activeId) return;
    const ts = nowTs();
    push({ timestamp: ts, sender: 'System', text: 'Order marked as Completed.', highlight: true });
    logActivity({ ts, caseId: activeId, actor: 'System', type: 'COMPLETED', note: 'Order marked as completed' });
  }

  function handleSend(entry: ChatEntry) {
    if (!activeId) return;
    push(entry);
    const hasImg = entry.attachments && entry.attachments.length > 0;
    const ts = entry.timestamp;
    if (hasImg) {
      logActivity({
        ts,
        caseId: activeId,
        actor: entry.sender,
        type: 'EVIDENCE',
        note: 'Evidence attached',
        attachmentCount: entry.attachments!.length,
      });
    } else {
      logActivity({
        ts,
        caseId: activeId,
        actor: entry.sender,
        type: 'MESSAGE',
        note: entry.text.slice(0, 80),
      });
    }
  }

  // Nếu chưa có thread nào (edge case)
  if (!activeId || !activeCase) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-center justify-between py-3">
          <h1 className="text-xl font-semibold">Inbox</h1>
          <div className="text-sm text-gray-500">0 unread chat</div>
        </div>
        <div className="card p-6 text-center text-sm text-gray-600">No chats available.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex items-center justify-between py-3">
        <h1 className="text-xl font-semibold">Inbox</h1>
        <div className="text-sm text-gray-500">{threads.filter((t) => t.unread > 0).length} unread chat</div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-white">
        <div className="grid grid-cols-12">
          {/* Left: thread list */}
          <aside className="col-span-3 border-r bg-gray-50">
            <div className="p-2">
              <input className="w-full px-3 py-2 rounded-lg border bg-white text-sm" placeholder="Search chats" />
            </div>
            <ul className="max-h-[70vh] overflow-auto">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    className={`w-full text-left px-3 py-3 hover:bg-gray-100 ${
                      activeId === t.id ? 'bg-white border-l-4 border-l-black' : ''
                    }`}
                    onClick={() => setActiveId(t.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-10 h-10 rounded-md bg-gray-200 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="truncate text-sm font-medium">{t.title}</div>
                          {t.unread > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-1.5">
                              {t.unread}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{t.lastMsg}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="p-4 text-center text-xs text-gray-500 border-t">That’s all for your chats</div>
          </aside>

          {/* Middle: chat */}
          <section className="col-span-9 xl:col-span-6 flex flex-col min-h-[70vh]">
            <div className="h-14 border-b px-4 flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate font-medium text-sm">{activeCase.title}</div>
                <div className="text-xs text-gray-500">{activeCase.listingInfo.listedPrice}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 rounded-lg border text-xs" onClick={onCompleted}>
                  Completed
                </button>
                <button className="px-2 py-1 rounded-lg bg-black text-white text-xs" onClick={onReturnRefund}>
                  Return / Refund
                </button>
              </div>
            </div>

            <div className="p-4 flex-1">
              <ChatList items={activeLog} />
            </div>
            <ChatComposer onSend={handleSend} role="Buyer" />
          </section>

          {/* Right: listing info */}
          <div className="col-span-12 xl:col-span-3 p-4 bg-gray-50">
            <ListingSidebar data={activeCase} />
          </div>
        </div>
      </div>
    </div>
  );
}