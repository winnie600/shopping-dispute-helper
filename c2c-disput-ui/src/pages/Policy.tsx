import { useMemo, useState } from 'react';
import { POLICY_TEXT, type PolicyLang } from '../data/policy';

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Policy() {
  const [lang, setLang] = useState<PolicyLang>('zh');
  const content = useMemo(() => POLICY_TEXT[lang], [lang]);

  async function copyAll() {
    try { await navigator.clipboard.writeText(content); } catch {}
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Policy — Dispute & Refund</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang('zh')}
            className={`px-3 py-1.5 rounded-lg text-sm ${lang==='zh' ? 'bg-black text-white' : 'border'}`}
          >
            繁體中文
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-lg text-sm ${lang==='en' ? 'bg-black text-white' : 'border'}`}
          >
            English
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button onClick={copyAll} className="px-3 py-1.5 rounded-lg border text-sm">Copy</button>
          <button onClick={() => download(`policy_${lang}.txt`, content)} className="px-3 py-1.5 rounded-lg border text-sm">
            Download .txt
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm text-gray-500 mb-2">Reference version: RAG v1.0 · Anchors included</div>
        {/* Keep formatting exactly as authored */}
        <pre className="prose-block text-sm leading-relaxed">{content}</pre>
      </div>
    </div>
  );
}