// src/pages/StaffConsole.tsx
import { useEffect, useMemo, useState } from 'react';
import { CASES } from '../data/cases';
import type { Activity, CaseData } from '../types';
import ProductGallery from '../components/ProductGallery';
import { listenActivity } from '../utils/eventBus';
import { downloadText } from '../utils/download';

function toCSV(rows: Activity[]) {
  const esc = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const head = ['ts','caseId','actor','type','note','attachmentCount'].map(esc).join(',');
  const body = rows.map(r => [r.ts, r.caseId, r.actor, r.type, r.note ?? '', r.attachmentCount ?? 0].map(esc).join(','));
  return [head, ...body].join('\n');
}
function nowTs() {
  const d = new Date(); const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Heuristic seed from existing chat (highlighted or keywords)
function seedFromCase(c: CaseData): Activity[] {
  const acts: Activity[] = [];
  for (const m of c.chatLog) {
    const isReturn = /return & full/i.test(m.text) || /return\/refund/i.test(m.text) || m.highlight;
    if (isReturn) acts.push({ ts: m.timestamp, caseId: c.id, actor: m.sender as Activity['actor'], type: 'RETURN_REQUEST', note: 'From chat history' });
    if (m.attachments?.length) acts.push({ ts: m.timestamp, caseId: c.id, actor: m.sender as Activity['actor'], type: 'EVIDENCE', note: 'Evidence in chat history', attachmentCount: m.attachments.length });
  }
  return acts;
}

export default function StaffConsole() {
  const [caseId, setCaseId] = useState<string>(CASES[0].id);
  const data: CaseData = useMemo(() => CASES.find(c => c.id === caseId)!, [caseId]);

  // Activity store per case
  const [activity, setActivity] = useState<Record<string, Activity[]>>(() => {
    const init: Record<string, Activity[]> = {};
    for (const c of CASES) init[c.id] = seedFromCase(c);
    return init;
  });

  useEffect(() => {
    // subscribe to event bus
    const off = listenActivity((a) => {
      setActivity(prev => ({ ...prev, [a.caseId]: [...(prev[a.caseId] ?? []), a] }));
    });
    return off;
  }, []);

  const list = activity[caseId] ?? [];
  const reversed = [...list].sort((a,b)=> +new Date(a.ts.replace(' ','T')) - +new Date(b.ts.replace(' ','T')));

  function exportJSON() {
    downloadText(`activity_${caseId}_${nowTs().replace(/[: ]/g,'-')}.json`, JSON.stringify(reversed, null, 2));
  }
  function exportCSV() {
    downloadText(`activity_${caseId}_${nowTs().replace(/[: ]/g,'-')}.csv`, toCSV(reversed));
  }

  const [flags, setFlags] = useState<{snad:boolean; fraud:boolean; missing:boolean}>({snad:false,fraud:false,missing:false});
  const [anchors, setAnchors] = useState<string>('ELI-301, SND-501');
  const [note, setNote] = useState<string>('Initial triage note...');
  const [outcome, setOutcome] = useState<string>('');
  function computeOutcome() {
    const parts = [];
    if (flags.snad) parts.push('SNAD');
    if (flags.fraud) parts.push('Fraud risk');
    if (flags.missing) parts.push('Missing accessories');
    const label = parts.length ? parts.join(' + ') : 'Neutral';
    setOutcome(`Decision: ${label}\nPolicy: ${anchors}\nNote: ${note}`);
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff Console — Dispute Review</h1>
        <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm bg-white">
          {CASES.map(c => <option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: listing quick view */}
        <div className="lg:col-span-7 card p-4">
          <div className="text-sm text-gray-500">Listing preview</div>
          <div className="font-medium">{data.listingInfo.title}</div>
          <div className="text-xs text-gray-500">{data.listingInfo.listedPrice} • {data.listingInfo.condition}</div>
          <div className="mt-3"><ProductGallery photos={data.listingInfo.photos} title={data.listingInfo.title} /></div>
        </div>

        {/* Right: decision + exports */}
        <div className="lg:col-span-5 card p-4 space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Flags</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={flags.snad} onChange={e => setFlags(p=>({...p, snad:e.target.checked}))} />SNAD (Not as described)</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={flags.fraud} onChange={e => setFlags(p=>({...p, fraud:e.target.checked}))} />Fraud risk / misrepresentation</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={flags.missing} onChange={e => setFlags(p=>({...p, missing:e.target.checked}))} />Missing items / accessories</label>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Policy anchors</div>
            <input value={anchors} onChange={(e)=>setAnchors(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="ELI-301, SND-501, EVD-704" />
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Internal notes</div>
            <textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={5} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Investigate Apple Support screenshot, confirm logistics timeline, …" />
          </div>

          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-lg bg-black text-white text-sm" onClick={computeOutcome}>Compute decision</button>
            <button className="px-3 py-2 rounded-lg border text-sm" onClick={()=>{setFlags({snad:false,fraud:false,missing:false}); setAnchors(''); setNote(''); setOutcome('')}}>Reset</button>
            <div className="flex-1" />
            <button className="px-3 py-2 rounded-lg border text-sm" onClick={exportCSV}>Export CSV</button>
            <button className="px-3 py-2 rounded-lg border text-sm" onClick={exportJSON}>Export JSON</button>
          </div>

          {!!outcome && (<div className="p-3 rounded-xl bg-gray-50 text-sm whitespace-pre-wrap">{outcome}</div>)}
        </div>
      </div>

      {/* Activity Log */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Activity Log</h2>
          <div className="text-xs text-gray-500">{reversed.length} items</div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Actor</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Note</th>
                <th className="py-2 pr-4 text-right">Attachments</th>
              </tr>
            </thead>
            <tbody>
              {reversed.map((a, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2 pr-4 whitespace-nowrap">{new Date(a.ts.replace(' ','T')).toLocaleString()}</td>
                  <td className="py-2 pr-4">{a.actor}</td>
                  <td className="py-2 pr-4">{a.type}</td>
                  <td className="py-2 pr-4">{a.note}</td>
                  <td className="py-2 pr-4 text-right">{a.attachmentCount ?? 0}</td>
                </tr>
              ))}
              {reversed.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">No activity yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500">Log is in-memory for demo; events come from Chat view (Return/Refund, Completed, messages, evidence).</div>
    </div>
  );
}