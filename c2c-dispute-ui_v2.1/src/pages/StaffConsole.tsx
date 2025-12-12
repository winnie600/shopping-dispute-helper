// ================================
// StaffConsole V3 — 完整覆蓋版
// - 白底 UI
// - 後端 /api/analysis/caseX 整合
// - 左欄：AI Tabs + Live Activity
// - 右欄：Listing Info（上）+ Final Decision（下）
// ================================

import { useEffect, useMemo, useState } from "react";
import { CASES, type ListingPhoto } from "../data/cases";
import type { Activity, AnalysisResult } from "../types";
import { analyzeDispute } from "../api/analyzeDisputeMock";
import { listenActivity } from "../utils/eventBus";


// ---------------- Icon Wrapper ----------------
type IconProps = { className?: string; size?: number; children?: React.ReactNode };
const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const IconWrapper = ({ children, className, size = 16 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const AlertTriangle = (p: Omit<IconProps, "children">) => (
  <IconWrapper {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </IconWrapper>
);

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={cx("px-2 py-0.5 rounded text-xs border", className)}>{children}</span>
);


const ActivityIcon = (p: Omit<IconProps, "children">) => (
  <IconWrapper {...p}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </IconWrapper>
);

const LayoutDashboard = (p: Omit<IconProps, "children">) => (
  <IconWrapper {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="4" rx="1" />
    <rect x="14" y="10" width="7" height="4" rx="1" />
    <rect x="3" y="12" width="7" height="9" rx="1" />
  </IconWrapper>
);

const Wrench = (p: Omit<IconProps, "children">) => (
  <IconWrapper {...p}>
    <path d="M10.5 2a5.5 5.5 0 0 0 0 11c1.2 0 2.3-.4 3.2-1l6.1 6.1a1.5 1.5 0 0 0 2.1-2.1l-6.1-6.1c.6-.9 1-2 1-3.2A5.5 5.5 0 0 0 10.5 2Z" />
  </IconWrapper>
);



// =====================================================
// AI SUMMARY — 全寬區塊
// =====================================================

function AISummary({
  ai,
  loading,
}: {
  ai: AnalysisResult | null;
  loading: boolean;
}) {
  if (loading && !ai) {
    return (
      <div className="w-full p-6 rounded-xl bg-white shadow-sm border border-gray-200 mb-6">
        <div className="h-4 w-24 rounded-full bg-gray-200 mb-3" />
        <div className="h-3 w-full rounded-full bg-gray-100 mb-2" />
        <div className="h-3 w-2/3 rounded-full bg-gray-100" />
      </div>
    );
  }

  if (!ai) return null;

  const status = ai.snadResult.label;

  const statusColor =
    status === "SNAD"
      ? "bg-red-100 text-red-700 border-red-300"
      : status === "Neutral"
      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
      : "bg-green-100 text-green-700 border-green-300";

  return (
    <div className="w-full p-6 rounded-xl bg-white shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}
        >
          {status}
        </span>
        <span className="text-gray-600 text-sm">AI Case Summary</span>
      </div>

      <div className="text-gray-800 text-sm leading-relaxed mb-3">
        {ai.snadResult.reason}
      </div>

      {/* Policy Anchors */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ai.snadResult.policyAnchors?.map((p, i) => (
          <span
            key={i}
            className="px-2 py-0.5 text-xs bg-gray-100 border rounded-lg text-gray-700"
          >
            {p}
          </span>
        ))}
      </div>

      {/* Risk Banner */}
      {ai.snadResult.label === "SNAD" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle size={18} />
          Potential policy violation identified. Manual review recommended.
        </div>
      )}
    </div>
  );
}

// ================================
// StaffConsole MAIN
// ================================

export default function StaffConsole() {
  const [caseId, setCaseId] = useState<number>(CASES[0]?.id ?? 1);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const [activity, setActivity] = useState<Record<number, Activity[]>>(() => {
    const init: Record<number, Activity[]> = {};
    for (const c of CASES) init[c.id] = [];
    return init;
  });

  // 即時事件監聽（模擬後端 push）
  useEffect(() => {
    const off = listenActivity((a) => {
      const id = Number(String(a.caseId).replace("case", ""));
      if (!Number.isNaN(id)) {
        setActivity((prev) => ({
          ...prev,
          [id]: [a, ...(prev[id] || [])],
        }));
      }
    });
    return off;
  }, []);

  // 呼叫後端 API
  async function loadAI(forCaseId: number) {
    setLoadingAI(true);
    try {
      const res = await analyzeDispute(`case${forCaseId}`);
      setAnalysis(res);
    } catch (err) {
      console.error(err);
      setAnalysis(null);
    }
    setLoadingAI(false);
  }

  // 切換案件時重新跑 AI
  useEffect(() => {
    setAnalysis(null);
    void loadAI(caseId);
  }, [caseId]);

  const caseData = useMemo(() => CASES.find((c) => c.id === caseId), [caseId]);

  // =======================================================
  // AI Tabs Component
  // =======================================================

  function AnalysisTabs() {
    if (!analysis) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
          {loadingAI ? "Running AI analysis…" : "No analysis yet."}
        </div>
      );
    }

    return (
      <div className="bg-white p-0 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs Header（靜態） */}
        <div className="flex gap-1 p-1 bg-gray-50">
          <button className="px-3 py-2 rounded-lg bg-white shadow-sm text-sm font-medium">
            Eligibility
          </button>
          <button className="px-3 py-2 rounded-lg text-sm font-medium">
            SNAD Decision
          </button>
          <button className="px-3 py-2 rounded-lg text-sm font-medium">
            Recommendation
          </button>
          <button className="px-3 py-2 rounded-lg text-sm font-medium">
            Case Summary
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-sm">
          {/* Eligibility */}
          <section>
            <div className="flex items-center gap-2">
              <Badge
                className=
                  {analysis.eligibility.r1
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }>
                R1
              </Badge>
              <span>Protected Channel</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs border ${
                  analysis.eligibility.r2
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                R2
              </span>
              <span>Within Dispute Window</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs border ${
                  analysis.eligibility.r3
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                R3
              </span>
              <span>Order Not Complete</span>
            </div>

            {analysis.eligibility.notes && (
              <div className="text-gray-500 mt-1">
                {analysis.eligibility.notes}
              </div>
            )}
          </section>

          {/* SNAD Decision */}
          <section className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs bg-gray-100 border text-gray-700 font-medium">
                {analysis.snadResult.label}
              </span>
              <span className="text-gray-700 font-medium">
                — {analysis.snadResult.reason}
              </span>
            </div>

            {!!analysis.snadResult.policyAnchors?.length && (
              <div className="text-xs text-gray-500 mt-1">
                Policy anchors: {analysis.snadResult.policyAnchors.join(", ")}
              </div>
            )}
          </section>

          {/* Recommendation */}
          <section className="pt-2 border-t space-y-3">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-xs text-blue-700 mb-1">
                Option A (Primary)
              </div>
              <div className="font-medium">
                {analysis.recommendation.primaryOption.label}
              </div>
              <div className="text-gray-700">
                {analysis.recommendation.primaryOption.details}
              </div>
            </div>

            {analysis.recommendation.alternativeOption && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">
                  Option B (Alternative)
                </div>
                <div className="font-medium">
                  {analysis.recommendation.alternativeOption.label}
                </div>
                <div className="text-gray-700">
                  {analysis.recommendation.alternativeOption.details}
                </div>
              </div>
            )}
          </section>

          {/* Case Summary */}
          <section className="pt-2 border-t">
            <pre className="whitespace-pre-wrap text-gray-800">
              {analysis.caseSummary}
            </pre>
          </section>
        </div>
      </div>
    );
  }

  // =======================================================
  // PAGE LAYOUT
  // =======================================================

  return (
  <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gray-100 min-h-screen">

    {/* Header */}
    <div className="flex items-center justify-between bg-white border rounded-xl p-5 shadow-sm">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <LayoutDashboard size={29} className="text-blue-500" />
        客服審核後台(Stadd Console)
        <h2 className="text-sm text-gray-500 font-normal">AI 爭議仲裁助手v3.1— API Integration Edition</h2>
      </h1>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => loadAI(caseId)}
          className="px-3 py-2 rounded-lg border text-sm text-gray-700 bg-white hover:bg-gray-50"
          disabled={loadingAI}
        >
          {loadingAI ? "Refreshing…" : "Refresh AI"}
        </button>

        <select
          value={caseId}
          onChange={(e) => setCaseId(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border bg-white text-sm"
        >
          {CASES.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.id} — {c.title.slice(0, 32)}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* AI Summary */}
    <AISummary ai={analysis} loading={loadingAI} />

    {/* ================= GRID LAYOUT 修正版 ================= */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* LEFT COLUMN — AI Tabs + Live Activity */}
      <div className="lg:col-span-8 space-y-6">

        {/* AI TABS */}
        <AnalysisTabs />

        {/* Live Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
            <ActivityIcon size={16} className="text-gray-500" />
            即時活動日誌 (Live Activity)
          </h3>

          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">時間</th>
                  <th className="px-4 py-3 text-left">角色</th>
                  <th className="px-4 py-3 text-left">類型</th>
                  <th className="px-4 py-3 text-left">摘要</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(activity[caseId] || []).map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{a.ts}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] border bg-gray-100 text-gray-700">
                        {a.actor}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">{a.type}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 truncate max-w-[200px]">{a.note}</td>
                  </tr>
                ))}

                {(activity[caseId] || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                      尚無活動紀錄。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div> {/* ← 左欄正式結束 */}

      {/* ================= RIGHT COLUMN ================= */}
      <div className="lg:col-span-4 min-w-[34px] flex flex-col gap-6">

        {/* 商品資訊 Listing Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase">
            商品資訊 (Listing Info)
          </h3>

          {/* 主圖片 */}
          <div className="aspect-square bg-gray-100 border rounded-lg overflow-hidden flex items-center justify-center mb-4">
            {caseData?.photoLinks?.[0] ? (
              <img
                src={caseData.photoLinks[0].url}
                alt={caseData.photoLinks[0].note || "Main photo"}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-xs">No image</div>
            )}
          </div>

          {/* 其他縮圖 */}
          {caseData?.photoLinks?.length && caseData.photoLinks.length >1? (
            <div className="flex gap-2 mb-4">
              {caseData.photoLinks.slice(1).map((p: ListingPhoto, i: number) => (
                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100">
                  <img src={p.url} alt={p.note || "photo"} className="w-full h-full object-cover" loading="lazy"/>
                </div>
              ))}
            </div>
          ): null}

          <div className="font-bold text-gray-900 text-base">{caseData?.title}</div>
          <div className="text-xl font-bold text-green-700 mt-1">{caseData?.price}</div>

          {caseData?.conditionTag && (
            <div className="mt-2">
              <span className="px-2 py-1 text-xs bg-gray-100 border rounded-lg text-gray-700">
                {caseData.conditionTag}
              </span>
            </div>
          )}

          {caseData?.longDescription && (
            <div className="mt-4 text-sm whitespace-pre-wrap text-gray-700 leading-relaxed">
              {caseData.longDescription}
            </div>
          )}
        </div>

        {/* Final Decision */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase flex items-center gap-2">
            <Wrench size={16} className="text-gray-600" />
            人工最終裁決 (Final Decision)
          </h3>

          <div className="space-y-3 mb-5">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="w-4 h-4" /> 商品與描述不符（SNAD）
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="w-4 h-4" /> 重大缺件 / 損壞
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="w-4 h-4" /> 疑似詐欺 / 風險
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="w-4 h-4" /> 買家個人原因（Buyer Change Mind）
            </label>
          </div>

          <textarea
            rows={3}
            className="w-full border rounded-lg p-2 text-sm resize-none 
             bg-gray-50 text-gray-800 
             focus:bg-white
             focus:ring-2 focus:ring-blue-200 focus:border-blue-400 mb-5"
            placeholder="輸入你的審核摘要、政策依據、或客服補充說明…"
          />

          <div className="flex flex-col gap-3">
            <button className="w-full py-2.5 rounded-lg text-white bg-green-600 hover:bg-green-700 text-sm font-medium">
              批准退款 (Approve)
            </button>

            <button className="w-full py-2.5 rounded-lg text-sm font-medium 
               bg-gray-100 text-gray-800 border border-gray-300 
               hover:bg-gray-200 transition">
              駁回申請 (Reject)
            </button>

            <button className="w-full py-2.5 rounded-lg text-sm font-medium
               border border-red-500 text-red-600 hover:bg-red-50 transition">
              停權賣家 (Ban Seller)
            </button>
          </div>
        </div>

      </div> {/* ← 右欄正式結束 */}

    </div> {/* ← GRID 結束 */}

  </div>
  );
}
