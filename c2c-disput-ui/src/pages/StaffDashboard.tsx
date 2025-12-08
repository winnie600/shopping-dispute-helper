// src/pages/StaffDashboard.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { CASES } from '../data/cases';
import type { CaseData, ChatEntry, AnalysisResult, CaseId } from '../types';
import ChatList from '../components/Chat';
import { analyzeDispute } from '../api/analyzeDisputeMock';
import { listenActivity } from '../utils/eventBus';

type TicketStatus =
  | 'Monitoring'
  | 'Pending AI'
  | 'Analyzing'
  | 'AI Completed'
  | 'Needs Staff'
  | 'Resolved';

type Ticket = {
  id: CaseId;
  title: string;
  price: string;
  status: TicketStatus;
  lastUpdate: string;
  analysis?: AnalysisResult;
};

function nowTs() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}`;
}

function StatusChip({ s }: { s: TicketStatus }) {
  const map: Record<TicketStatus, string> = {
    Monitoring: 'bg-gray-100 text-gray-700 border-gray-200',
    'Pending AI': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Analyzing: 'bg-blue-50 text-blue-700 border-blue-200',
    'AI Completed': 'bg-green-50 text-green-700 border-green-200',
    'Needs Staff': 'bg-red-50 text-red-700 border-red-200',
    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${map[s]}`}>
      {s}
    </span>
  );
}

function seedTickets(): Ticket[] {
  return CASES.map((c) => {
    const hasHighlight = c.chatLog.some((m) => m.highlight);
    return {
      id: c.id,
      title: c.title,
      price: c.listingInfo.listedPrice,
      status: hasHighlight ? 'Pending AI' : 'Monitoring',
      lastUpdate: nowTs(),
    };
  });
}

export default function StaffDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>(seedTickets);
  const [activeId, setActiveId] = useState<CaseId | undefined>(tickets[0]?.id);

  const [logs] = useState<Record<CaseId, ChatEntry[]>>(
    Object.fromEntries(CASES.map((c) => [c.id, [...c.chatLog]])) as Record<CaseId, ChatEntry[]>
  );

  const activeCase: CaseData | undefined = useMemo(
    () => (activeId ? CASES.find((c) => c.id === activeId) : undefined),
    [activeId]
  );
  const activeTicket: Ticket | undefined = tickets.find((t) => t.id === activeId);
  const activeLog = activeId ? logs[activeId] ?? [] : [];

  // Nghe event từ Inbox (RETURN_REQUEST/COMPLETED/…)
  useEffect(() => {
    const off = listenActivity((a) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === a.caseId
            ? {
                ...t,
                status: a.type === 'RETURN_REQUEST' ? 'Pending AI' : t.status,
                lastUpdate: a.ts,
              }
            : t
        )
      );
    });
    return off;
  }, []);

  // Auto-run AI cho ticket Pending AI
  const aiRunning = useRef<Record<string, boolean>>({});
  useEffect(() => {
    for (const t of tickets) {
      if ((t.status === 'Pending AI' || t.status === 'Analyzing') && !aiRunning.current[t.id]) {
        aiRunning.current[t.id] = true;
        setTickets((prev) =>
          prev.map((x) =>
            x.id === t.id ? { ...x, status: 'Analyzing', lastUpdate: nowTs() } : x
          )
        );
        analyzeDispute(t.id)
          .then((res) => {
            setTickets((prev) =>
              prev.map((x) =>
                x.id === t.id
                  ? {
                      ...x,
                      status: res.snadResult.label === 'SNAD' ? 'Needs Staff' : 'AI Completed',
                      analysis: res,
                      lastUpdate: nowTs(),
                    }
                  : x
              )
            );
          })
          .catch(() => {
            setTickets((prev) =>
              prev.map((x) =>
                x.id === t.id ? { ...x, status: 'Needs Staff', lastUpdate: nowTs() } : x
              )
            );
          })
          .finally(() => {
            aiRunning.current[t.id] = false;
          });
      }
    }
  }, [tickets]);

  function setStatus(id: CaseId, status: TicketStatus) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status, lastUpdate: nowTs() } : t)));
  }

  function markResolved() {
    if (!activeId) return;
    setStatus(activeId, 'Resolved');
  }

  // Guard: chưa có ticket/case hợp lệ
  if (!activeId || !activeCase || !activeTicket) {
    return (
      <div className="max-w-[1200px] mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold">Staff Dashboard — Dispute Monitoring</h1>
        <div className="mt-4 card p-4 text-sm text-gray-600">
          No tickets available. Please seed CASES.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff Dashboard — Dispute Monitoring</h1>
        <div className="text-sm text-gray-500">
          Auto AI analysis on raised tickets • In-memory demo
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Ticket list */}
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Tickets</div>
              <div className="text-xs text-gray-500">{tickets.length}</div>
            </div>
            <ul className="divide-y">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button
                    className={`w-full text-left py-3 ${
                      activeId === t.id ? 'bg-gray-50 rounded-lg px-3' : 'px-0'
                    }`}
                    onClick={() => setActiveId(t.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-10 h-10 rounded-md bg-gray-200 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{t.title}</div>
                        <div className="text-xs text-gray-500">{t.price}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <StatusChip s={t.status} />
                          <span className="text-[11px] text-gray-400">• {t.lastUpdate}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* MIDDLE: Chat + Summary */}
        <section className="col-span-12 md:col-span-8 lg:col-span-6 flex flex-col">
          <div className="card p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate font-medium text-sm">{activeCase.title}</div>
                <div className="text-xs text-gray-500">{activeCase.listingInfo.listedPrice}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip s={activeTicket.status} />
                {activeTicket.status === 'Needs Staff' && (
                  <span className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-700">
                    Action required
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
              {activeTicket.status === 'Monitoring' && 'Waiting for customer action…'}
              {activeTicket.status === 'Pending AI' && 'Ticket raised • Queued for AI analysis…'}
              {activeTicket.status === 'Analyzing' && 'AI is analyzing evidence and policy anchors…'}
              {activeTicket.status === 'AI Completed' &&
                'AI analysis completed • No staff action required unless escalated.'}
              {activeTicket.status === 'Needs Staff' && 'AI flagged SNAD • Staff review recommended.'}
              {activeTicket.status === 'Resolved' && 'Ticket resolved.'}
            </div>

            <div className="mt-3">
              <ChatList items={activeLog} />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button className="px-3 py-2 rounded-lg border text-sm" onClick={markResolved}>
                Mark as Resolved
              </button>
              <a className="px-3 py-2 rounded-lg border text-sm" href="/policy" target="_blank" rel="noreferrer">
                Open Policy
              </a>
            </div>
          </div>
        </section>

        {/* RIGHT: AI panel */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="card p-3 space-y-3">
            <div className="font-semibold">AI Analysis</div>
            {!activeTicket.analysis ? (
              <div className="text-sm text-gray-500">
                {activeTicket.status === 'Monitoring' && 'No ticket to analyze.'}
                {(activeTicket.status === 'Pending AI' || activeTicket.status === 'Analyzing') &&
                  'Running…'}
                {activeTicket.status === 'Needs Staff' && 'Running summary available after completion.'}
              </div>
            ) : (
              <>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Eligibility (R1/R2/R3)</div>
                  <ul className="text-sm list-disc pl-5">
                    <li>R1: {activeTicket.analysis.eligibility.r1 ? '✅' : '❌'}</li>
                    <li>R2: {activeTicket.analysis.eligibility.r2 ? '✅' : '❌'}</li>
                    <li>R3: {activeTicket.analysis.eligibility.r3 ? '✅' : '❌'}</li>
                  </ul>
                  {activeTicket.analysis.eligibility.notes && (
                    <div className="mt-1 text-xs text-gray-500">
                      {activeTicket.analysis.eligibility.notes}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">SNAD Decision</div>
                  <div className="text-sm">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border ${
                        activeTicket.analysis.snadResult.label === 'SNAD'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : activeTicket.analysis.snadResult.label === 'Neutral'
                          ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}
                    >
                      {activeTicket.analysis.snadResult.label}
                    </span>
                    <div className="mt-1">{activeTicket.analysis.snadResult.reason}</div>
                    {!!activeTicket.analysis.snadResult.policyAnchors?.length && (
                      <div className="mt-1 text-xs text-gray-500">
                        Anchors: {activeTicket.analysis.snadResult.policyAnchors.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Recommendation</div>
                  <div className="text-sm">
                    <div className="font-medium">
                      A) {activeTicket.analysis.recommendation.primaryOption.label}
                    </div>
                    <div className="text-gray-700">
                      {activeTicket.analysis.recommendation.primaryOption.details}
                    </div>
                    {activeTicket.analysis.recommendation.alternativeOption && (
                      <>
                        <div className="mt-2 font-medium">
                          B) {activeTicket.analysis.recommendation.alternativeOption.label}
                        </div>
                        <div className="text-gray-700">
                          {activeTicket.analysis.recommendation.alternativeOption.details}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Case Summary</div>
                  <pre className="text-xs rounded-lg bg-gray-50 p-2 whitespace-pre-wrap">
{activeTicket.analysis.caseSummary}
                  </pre>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
