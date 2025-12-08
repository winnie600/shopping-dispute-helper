import type { AnalysisResult } from '../types';

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`badge ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{label}</span>
  );
}
function SnadLabel({ label }: { label: 'SNAD' | 'Neutral' | 'Not SNAD' }) {
  const cls = label === 'SNAD' ? 'bg-red-100 text-red-700' : label === 'Neutral' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function AnalysisPanel({ loading, result, onRun }: { loading: boolean; result?: AnalysisResult; onRun: () => void }) {
  if (!result) {
    return (
      <div className="card p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="text-sm text-gray-500">No analysis yet.</div>
        <button onClick={onRun} disabled={loading} className="mt-3 px-4 py-2 rounded-xl bg-black text-white disabled:opacity-40">
          {loading ? 'Analyzing…' : 'Run AI Analysis'}
        </button>
        {loading && <div className="mt-2 text-xs text-gray-500">Simulating API call…</div>}
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex gap-1 p-1 bg-gray-50">
        <button className="px-3 py-2 rounded-xl bg-white shadow text-sm font-medium">Eligibility</button>
        <button className="px-3 py-2 rounded-xl text-sm font-medium">SNAD Decision</button>
        <button className="px-3 py-2 rounded-xl text-sm font-medium">Recommendation</button>
        <button className="px-3 py-2 rounded-xl text-sm font-medium">Case Summary</button>
      </div>

      <div className="p-4 space-y-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2"><Badge ok={result.eligibility.r1} label="R1" /> <span>Protected Channel</span></div>
          <div className="flex items-center gap-2"><Badge ok={result.eligibility.r2} label="R2" /> <span>Within Dispute Window</span></div>
          <div className="flex items-center gap-2"><Badge ok={result.eligibility.r3} label="R3" /> <span>Order Not Complete</span></div>
          {result.eligibility.notes && <div className="text-gray-500">{result.eligibility.notes}</div>}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2"><SnadLabel label={result.snadResult.label} /><span className="font-medium">— {result.snadResult.reason}</span></div>
          {!!result.snadResult.policyAnchors?.length && <div className="text-xs text-gray-500 mt-1">Policy anchors: {result.snadResult.policyAnchors.join(', ')}</div>}
        </div>

        <div className="pt-2 border-t space-y-3">
          <div className="p-3 rounded-xl bg-blue-50">
            <div className="text-xs text-blue-700 mb-1">Option A (Primary)</div>
            <div className="font-medium">{result.recommendation.primaryOption.label}</div>
            <div className="text-gray-700">{result.recommendation.primaryOption.details}</div>
          </div>
          {result.recommendation.alternativeOption && (
            <div className="p-3 rounded-xl bg-gray-50">
              <div className="text-xs text-gray-600 mb-1">Option B (Alternative)</div>
              <div className="font-medium">{result.recommendation.alternativeOption.label}</div>
              <div className="text-gray-700">{result.recommendation.alternativeOption.details}</div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <pre className="prose-block">{result.caseSummary}</pre>
        </div>
      </div>
    </div>
  );
}
