// src/pages/StaffConsole.tsx
import { useEffect, useMemo, useState } from 'react';
import { CASES } from '../data/cases';
import { CHAT_LOGS } from '../data/chatLogs';
import type { Activity } from '../types';
import { listenActivity } from '../utils/eventBus';
import { downloadText } from '../utils/download';

// --- Icon Components (保留原樣) ---
type IconProps = { className?: string; size?: number; children?: any };
const IconWrapper = ({ children, className, size = 16 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ClipboardList = (p: any) => <IconWrapper {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><rect x="6" y="6" width="12" height="14" rx="2" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="15" y2="15" /></IconWrapper>;
const Download = (p: any) => <IconWrapper {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></IconWrapper>;
const RefreshCw = (p: any) => <IconWrapper {...p}><path d="M21 4v6h-6" /><path d="M3 20v-6h6" /><path d="M21 10a9 9 0 1 1-3-6.71" /></IconWrapper>;
const AlertTriangle = (p: any) => <IconWrapper {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></IconWrapper>;
const FileText = (p: any) => <IconWrapper {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></IconWrapper>;
const CheckCircle = (p: any) => <IconWrapper {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></IconWrapper>;
const XCircle = (p: any) => <IconWrapper {...p}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></IconWrapper>;
const Bot = (p: any) => <IconWrapper {...p}><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></IconWrapper>;
const Eye = (p: any) => <IconWrapper {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></IconWrapper>;
const Gavel = (p: any) => <IconWrapper {...p}><path d="M14 13l-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" /><path d="M16 16l6-6" /><path d="M8 8l6-6" /><path d="M9 7l8 8" /><path d="M21 21l-6-6" /></IconWrapper>;
const ArrowRight = (p: any) => <IconWrapper {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></IconWrapper>;
const X = (p: any) => <IconWrapper {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></IconWrapper>;

// --- Helper Functions ---

function toCSV(rows: Activity[]) {
  const esc = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const head = ['ts', 'caseId', 'actor', 'type', 'note', 'attachmentCount'].map(esc).join(',');
  const body = rows.map((r) =>
    [r.ts, r.caseId, r.actor, r.type, r.note ?? '', r.attachmentCount ?? 0].map(esc).join(','),
  );
  return [head, ...body].join('\n');
}

function nowTs() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 產生相對時間 (例如: 10分鐘前)
function pastTs(minutesAgo: number) {
  const d = new Date(Date.now() - minutesAgo * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type CaseItem = typeof CASES[number];

// --- 1. Seed Initial Activity Logs (預填日誌) ---
// 為每個案件生成 3-4 條「假」的歷史日誌，讓畫面不空白
function seedFromCase(c: CaseItem): Activity[] {
  const cid = c.id; // 使用數字型 caseId 以符合 Activity.caseId 的 CaseKey 類型
  
  // 基礎日誌 (所有案件都有)
    const logs = [
      { ts: pastTs(120), caseId: cid, actor: 'System', type: 'ORDER_CREATED', note: `訂單成立 #${c.id} (7-11 COD)` },
      { ts: pastTs(30),  caseId: cid, actor: 'Buyer',  type: 'DISPUTE_OPENED', note: '買家發起爭議申請' },
      { ts: pastTs(29),  caseId: cid, actor: 'AI',     type: 'AUTO_TRIAGE',    note: 'AI 啟動自動審查程序 (RAG Scan)' },
    ] as unknown as Activity[];

  // 根據 Case ID 加入特定日誌，增加真實感
  if (c.id === 1) { // iPhone
    logs.push({ ts: pastTs(28), caseId: cid, actor: 'AI', type: 'RISK_ALERT', note: '偵測到「未揭露維修」關鍵字' } as unknown as Activity);
  } else if (c.id === 8) { // AirPods
    logs.push({ ts: pastTs(28), caseId: cid, actor: 'AI', type: 'FRAUD_DETECT', note: '🔴 高風險：序號不符 / 偽造憑證' } as unknown as Activity);
  } else if (c.id === 4) { // Blender
    logs.push({ ts: pastTs(28), caseId: cid, actor: 'AI', type: 'IMAGE_ANALYSIS', note: '包裝分析完成：符合安全標準' } as unknown as Activity);
  }

  return logs;
}

// --- 2. Mock AI Analysis DB (加入 processingTime & 差異化信心指數) ---
const AI_ANALYSIS_DB: Record<number, {
  reason: string;
  findings: string[];
  recommendation: string;
  confidence: string;
  processingTime: string; // 新增：處理時間
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  policy: string;
}> = {
  1: { // iPhone 12 (明確違規，信心高，處理快)
    reason: '買賣雙方對「重大維修」定義無共識',
    findings: ['買家提供截圖顯示「Display Replaced」', '刊登描述承諾「無重大維修」'],
    recommendation: '強制退貨退款 (賣家責任)',
    confidence: '98.5%',
    processingTime: '0.8s',
    riskLevel: 'Medium',
    policy: 'SND-A2 (未揭露維修)'
  },
  2: { // Jordan 1 (中立，信心稍低，需查外部資料)
    reason: '中立爭議：版型認知落差',
    findings: ['標籤顯示 US9 無誤', '外部數據：該款版型偏小'],
    recommendation: '建議協商部分退款',
    confidence: '89.2%',
    processingTime: '2.4s', // 查外部資料比較慢
    riskLevel: 'Low',
    policy: 'SND-B1 (尺寸問題)'
  },
  3: { // Sony XM4 (資訊模糊)
    reason: '資訊模糊：配件認知落差',
    findings: ['照片無顯示線材', '描述未註明缺件'],
    recommendation: '部分退款 (補貼線材費)',
    confidence: '91.0%',
    processingTime: '1.1s',
    riskLevel: 'Low',
    policy: 'SND-B2 (配件不明)'
  },
  4: { // Blender (物流，需影像分析，處理慢)
    reason: '物流理賠審核：包裝合規性確認',
    findings: ['玻璃破裂', '出貨包裝含三層氣泡紙 (Pass)'],
    recommendation: '啟動運輸保險理賠',
    confidence: '96.5%',
    processingTime: '3.2s', // 影像分析耗時
    riskLevel: 'Medium',
    policy: 'SND-B3 (物流損壞)'
  },
  5: { // Switch (改變心意，規則簡單，處理極快)
    reason: '買家理由不符平台規範',
    findings: ['理由：「用不習慣」', '商品功能正常'],
    recommendation: '駁回退貨申請',
    confidence: '99.9%',
    processingTime: '0.3s', // 規則判定極快
    riskLevel: 'Low',
    policy: 'REJ-01 (改變心意)'
  },
  6: { // Hoodie (色差，影像分析)
    reason: '嚴重色差：照片誤導',
    findings: ['賣家照片過曝', '實物色差 Delta-E > 20'],
    recommendation: '同意退貨退款 (賣家責任)',
    confidence: '94.2%',
    processingTime: '2.8s',
    riskLevel: 'Medium',
    policy: 'SND-A3 (誤導性圖片)'
  },
  7: { // Dyson (模糊地帶)
    reason: '二手商品效能爭議',
    findings: ['承諾 20分 vs 實測 12分', '電池屬消耗品'],
    recommendation: '部分退款 (電池補助)',
    confidence: '82.5%', // 信心較低，因為很難界定
    processingTime: '1.5s',
    riskLevel: 'Low',
    policy: 'SND-B4 (二手預期)'
  },
  8: { // AirPods (詐欺，極高信心)
    reason: '系統偵測到高風險詐欺特徵',
    findings: ['序號不符 (Mismatch)', '憑證偽造痕跡'],
    recommendation: '立即凍結交易 & 停權賣家',
    confidence: '99.9%',
    processingTime: '0.5s', // 風險阻斷優先
    riskLevel: 'Critical',
    policy: 'SND-A4 (仿冒/詐欺)'
  }
};

// --- Evidence Modal ---
function EvidenceModal({ isOpen, onClose, caseId }: { isOpen: boolean; onClose: () => void; caseId: number }) {
  if (!isOpen) return null;
  const logs = CHAT_LOGS[caseId] || [];
  const attachments = logs.flatMap(l => l.attachments || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Eye size={20} className="text-blue-600" /> 
            案件 #{caseId} 證據清單 (Evidence List)
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto bg-gray-100 flex-1">
          {attachments.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {attachments.map((att, idx) => (
                <div key={idx} className="bg-white p-2 rounded-lg shadow-sm border group">
                  <div className="aspect-square overflow-hidden rounded-md bg-gray-200 relative">
                    <img 
                      src={att.url} 
                      alt="evidence" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Error'; }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500 truncate text-center font-mono">
                    {att.name || `Evidence ${idx + 1}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <AlertTriangle size={48} className="mb-2 opacity-20" />
              <p>此案件尚無圖片證據上傳</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-white text-right">
          <button onClick={onClose} className="px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors">
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function StaffConsole() {
  const [caseId, setCaseId] = useState<number>(CASES[0].id);
  const data: CaseItem = useMemo(() => CASES.find((c) => c.id === caseId)!, [caseId]);
  const aiAnalysis = useMemo(() => AI_ANALYSIS_DB[caseId] || AI_ANALYSIS_DB[1], [caseId]);
  const [showEvidence, setShowEvidence] = useState(false);

  // 初始化 Activity Log：使用 seedFromCase 預填資料
  const [activity, setActivity] = useState<Record<number, Activity[]>>(() => {
    const init: Record<number, Activity[]> = {};
    for (const c of CASES) init[c.id] = seedFromCase(c);
    return init;
  });

  useEffect(() => {
    const off = listenActivity((a) => {
      let cid = -1;
      if (typeof a.caseId === 'string' && a.caseId.startsWith('case')) {
         cid = parseInt(a.caseId.replace('case', ''), 10);
      } else {
         cid = Number(a.caseId);
      }
      if (!isNaN(cid)) {
         setActivity((prev) => ({ ...prev, [cid]: [a, ...(prev[cid] ?? [])] }));
      }
    });
    return off;
  }, []);

  const list = activity[caseId] ?? [];
  // Sort descending
  const reversed = [...list].sort(
    (a, b) => +new Date(b.ts.replace(' ', 'T')) - +new Date(a.ts.replace(' ', 'T')),
  );

  function exportJSON() {
    downloadText(`activity_${caseId}_${nowTs().replace(/[: ]/g, '-')}.json`, JSON.stringify(reversed, null, 2));
  }
  function exportCSV() {
    downloadText(`activity_${caseId}_${nowTs().replace(/[: ]/g, '-')}.csv`, toCSV(reversed));
  }

  const [flags, setFlags] = useState<{ snad: boolean; fraud: boolean; missing: boolean }>({
    snad: false, fraud: false, missing: false,
  });
  const [anchors, setAnchors] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [outcome, setOutcome] = useState<string>('');

  useEffect(() => {
    setFlags({ snad: false, fraud: false, missing: false });
    setAnchors('');
    setNote('');
    setOutcome('');
  }, [caseId]);

  function computeOutcome() {
    const parts = [];
    if (flags.snad) parts.push('商品不符 (SNAD)');
    if (flags.fraud) parts.push('詐欺風險 (Fraud Risk)');
    if (flags.missing) parts.push('缺件 (Missing Items)');
    const label = parts.length ? parts.join(' + ') : '中立爭議 (Neutral)';
    setOutcome(`裁決結果: ${label}\n引用政策: ${anchors || '未指定'}\n備註: ${note || '無'}`);
  }

  const [activeIdx, setActiveIdx] = useState(0);
  const photos = data.photoLinks ?? [];
  const mainPhoto = photos[activeIdx];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-[#f3f4f6] min-h-screen font-sans">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Gavel className="text-indigo-600" size={28} />
            客服管理控制台 (Staff Console)
          </h1>
          <p className="text-xs text-gray-500 mt-1 ml-10">AI 輔助爭議仲裁系統 v2.0</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">當前審查案件：</label>
          <select
            value={caseId}
            onChange={(e) => setCaseId(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-w-[240px] cursor-pointer hover:border-indigo-400 transition-colors"
          >
            {CASES.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} — {c.title.length > 25 ? c.title.substring(0, 25) + '...' : c.title}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AI Analysis Card */}
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
            <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-100 p-1.5 rounded-lg">
                  <Bot className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-indigo-900 text-sm">AI Copilot 智能摘要</h2>
                  {/* Dynamic Metrics */}
                  <span className="text-[10px] text-indigo-500 font-mono">
                    Confidence: <strong>{aiAnalysis.confidence}</strong> • Processing: <strong>{aiAnalysis.processingTime}</strong>
                  </span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                aiAnalysis.riskLevel === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' :
                aiAnalysis.riskLevel === 'High' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                aiAnalysis.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                'bg-green-100 text-green-700 border-green-200'
              }`}>
                {aiAnalysis.riskLevel === 'Critical' && <AlertTriangle size={12} />}
                風險等級: {aiAnalysis.riskLevel}
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> 轉交人工原因 (Escalation Reason)
                  </h4>
                  <div className="bg-orange-50 text-orange-900 text-sm p-3 rounded-lg border border-orange-100 font-medium leading-relaxed">
                    {aiAnalysis.reason}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle size={12} /> AI 關鍵發現 (Key Findings)
                  </h4>
                  <ul className="space-y-2">
                    {aiAnalysis.findings.map((f, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2 bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-green-500 mt-0.5">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col justify-between border-l border-gray-100 pl-8 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Bot size={12} /> AI 建議處置 (Recommendation)
                  </h4>
                  <div className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                    {aiAnalysis.recommendation}
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 font-medium">
                    <FileText size={12} />
                    引用政策: {aiAnalysis.policy}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">證據審查 (Evidence Review)</h4>
                  <button 
                    onClick={() => setShowEvidence(true)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm transition-all group bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 group-hover:bg-white p-2 rounded-md transition-colors">
                        <Eye className="text-gray-500 group-hover:text-indigo-600" size={20} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-700 group-hover:text-indigo-700">查看詳細證據</div>
                        <div className="text-[10px] text-gray-400">對話截圖、商品照片</div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log (Now with Pre-filled Data) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <RefreshCw size={14} className="text-green-600" />
              即時活動日誌 (Live Activity)
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium w-24">時間</th>
                    <th className="px-4 py-3 text-left font-medium w-20">角色</th>
                    <th className="px-4 py-3 text-left font-medium w-24">動作</th>
                    <th className="px-4 py-3 text-left font-medium">內容摘要</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reversed.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono whitespace-nowrap">
                        {a.ts.split(' ')[1]}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          a.actor === 'AI' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          a.actor === 'Buyer' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          a.actor === 'System' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                          'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>{a.actor}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-900">{a.type}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[180px]" title={a.note}>
                        {a.note}
                      </td>
                    </tr>
                  ))}
                  {reversed.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                        <ClipboardList size={24} className="opacity-20" />
                        <span>目前尚無活動記錄</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-sm">商品資訊 (Listing Info)</h3>
              <a href="#" className="text-xs text-blue-600 hover:underline">View Original</a>
            </div>
            <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden mb-4 border relative group">
              {mainPhoto ? (
                <img src={mainPhoto.url} alt="Product" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
              )}
              {photos.length > 1 && (
                <div className="absolute bottom-2 left-2 right-2 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                  {photos.map((p, i) => (
                    <button key={i} onClick={() => setActiveIdx(i)} className={`w-10 h-10 shrink-0 rounded border-2 overflow-hidden ${activeIdx === i ? 'border-white shadow-md' : 'border-transparent opacity-70'}`}>
                      <img src={p.url} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="font-bold text-base mb-1 text-gray-900 leading-snug">{data.title}</div>
            <div className="text-xl font-mono text-indigo-600 font-bold mb-3">{data.price}</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 rounded text-gray-600 font-medium">{data.conditionTag}</span>
              <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
                <CheckCircle size={10} /> Protected
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
            <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
              <Gavel size={16} /> 人工最終裁決 (Final Decision)
            </h3>
            <div className="mb-4 space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">人工標記 (Manual Flags)</label>
              <div className="flex flex-col gap-1.5">
                {[
                  { key: 'snad', label: 'SNAD (商品不符)', color: 'text-red-600' },
                  { key: 'fraud', label: 'Fraud Risk (詐欺)', color: 'text-orange-600' },
                  { key: 'missing', label: 'Missing (缺件)', color: 'text-yellow-600' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-50 p-1.5 rounded cursor-pointer">
                    <input type="checkbox" checked={flags[item.key as keyof typeof flags]} onChange={(e) => setFlags(p => ({ ...p, [item.key]: e.target.checked }))} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className={flags[item.key as keyof typeof flags] ? item.color + ' font-bold' : ''}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={computeOutcome} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex justify-center items-center gap-2">
                <CheckCircle size={16} /> 批准退款 (Approve)
              </button>
              <button onClick={computeOutcome} className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-all flex justify-center items-center gap-2">
                <XCircle size={16} /> 駁回申請 (Reject)
              </button>
              <div className="border-t my-3 border-gray-100"></div>
              <button className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium transition-all flex justify-center items-center gap-2">
                <AlertTriangle size={16} /> 停權賣家 (Ban Seller)
              </button>
            </div>
            <div className="mt-4">
              <label className="text-xs font-bold text-gray-500 mb-1 block">內部備註 (Internal Note)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm h-20 resize-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="輸入裁決理由..."></textarea>
            </div>
            {outcome && (
              <div className="mt-4 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2">
                {outcome}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-2">
             <button onClick={exportCSV} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-600 border rounded hover:bg-gray-50"><Download size={14} /> CSV</button>
             <button onClick={exportJSON} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-600 border rounded hover:bg-gray-50"><FileText size={14} /> JSON</button>
          </div>
        </div>
      </div>
      <EvidenceModal isOpen={showEvidence} onClose={() => setShowEvidence(false)} caseId={caseId} />
    </div>
  );
}