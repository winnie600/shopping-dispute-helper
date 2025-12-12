// src/data/mockAnalysis.ts
import type { AnalysisResult } from '../types';

export const MOCK_ANALYSIS_RESULTS: Record<string, AnalysisResult> = {
  case1: {
    eligibility: { r1: true, r2: true, r3: true, notes: 'In-app + 7-ELEVEN COD; opened ~15h after pickup.' },
    snadResult: { label: 'SNAD', reason: 'Undisclosed screen replacement (material info).', policyAnchors: ['ELI-301','SND-501','EVD-704'] },
    recommendation: {
      primaryOption: { label: 'Return & Full Refund', details: 'Seller reimburses NT$60 COD + provides return label.' },
      alternativeOption: { label: 'Partial Refund', details: '15–30% if buyer keeps item.' }
    },
    caseSummary:
`Order: TW-10567
Eligibility: R1/R2/R3 ✅
Key: “No major repairs” vs Apple proof “Display replaced”
Decision: SNAD (non-disclosure)
Rec:
 A) Return & Full + NT$60 + label
 B) Keep & Partial (15–30%)`
  },

  case2: {
    eligibility: { r1: true, r2: true, r3: true, notes: 'Within 24h; protected channel.' },
    snadResult: { label: 'Neutral', reason: 'Model runs 0.5 size smaller by design.', policyAnchors: ['ELI-301','SND-502'] },
    recommendation: {
      primaryOption: { label: 'Partial Refund', details: '≈10% goodwill (NT$400–600) if buyer keeps.' },
      alternativeOption: { label: 'Return & Full Refund', details: 'Buyer covers NT$60 shipping (no fault).' }
    },
    caseSummary:
`Order: TW-11021
Eligibility: R1/R2/R3 ✅
Decision: Neutral (product characteristic)
Outcome: Partial refund NT$500`
  },

  case3: {
    eligibility: { r1: true, r2: true, r3: true, notes: 'Reported within window.' },
    snadResult: { label: 'Neutral', reason: 'Accessories not guaranteed; no “complete set” claim.', policyAnchors: ['ELI-301','SND-502'] },
    recommendation: {
      primaryOption: { label: 'Partial Refund', details: '5–10% (NT$200–400) goodwill.' },
      alternativeOption: { label: 'Return & Full Refund', details: 'Buyer covers NT$60 shipping (no fault).' }
    },
    caseSummary:
`Order: TW-12033
Eligibility: R1/R2/R3 ✅
Decision: Neutral (ambiguous expectation)
Outcome: Partial refund NT$300`
  },

  case4: {
    eligibility: { r1: true, r2: true, r3: true, notes: '程序合規；寄出前/收貨後照片相互矛盾，無開箱影片。' },
    snadResult: {
      label: 'Neutral',
      reason: '中立損害（運輸或不明因素），非賣家過失，證據不足以判 SNAD。',
      policyAnchors: ['ELI-301', 'SND-503', 'ROL-202']
    },
    recommendation: {
      primaryOption: { label: 'Return & Refund', details: '退貨退款；退貨運費由買家負擔（非 SNAD）。' },
      alternativeOption: { label: 'Goodwill Partial Refund', details: '賣家自願 5–10% 小額補償以和平解決。' }
    },
    caseSummary:
`Order: TW-13058
Eligibility: R1/R2/R3 ✅
Decision: Neutral Damage（非 SNAD）
Options: A) 退貨退款（買家付運費） B) 小額補償`
  },

  case5: {
    eligibility: { r1: true, r2: true, r3: true, notes: '買家確認商品正常；僅因個人喜好改變。' },
    snadResult: {
      label: 'Not SNAD',
      reason: 'Buyer’s Change of Mind（買家改變心意），非商品或描述問題。',
      policyAnchors: ['ELI-301', 'SND-502']
    },
    recommendation: {
      primaryOption: { label: 'Seller May Decline', details: '賣家可合法拒絕退貨。' },
      alternativeOption: { label: 'Partial Refund (50–80%)', details: '賣家若願意折衷，可協議 50–80% 部分退款。' }
    },
    caseSummary:
`Order: TW-14012
Eligibility: R1/R2/R3 ✅
Decision: Not SNAD（買家改變心意）
Options: 拒絕／或協議 50–80%`
  },

  case6: {
    eligibility: { r1: true, r2: true, r3: true, notes: '買家於 24h 內回報色差，證據充分。' },
    snadResult: {
      label: 'SNAD',
      reason: '誤導性圖片（強光/自動提亮導致顏色與實物明顯不符）。',
      policyAnchors: ['ELI-301', 'SND-501', 'EVD-704']
    },
    recommendation: {
      primaryOption: { label: 'Return & Full Refund', details: '賣家負擔退貨運費（SNAD）。' },
      alternativeOption: { label: 'Partial Refund (20–30%)', details: '買家願意保留時可協議 20–30%。' }
    },
    caseSummary:
`Order: TW-15011
Eligibility: R1/R2/R3 ✅
Decision: SNAD（照片誤導）
Options: 全額退款 or 20–30%`
  },

  case7: {
    eligibility: { r1: true, r2: true, r3: true, notes: '續航受環境/吸頭等影響；缺乏標準測試證據。' },
    snadResult: {
      label: 'Neutral',
      reason: '證據不足以判 SNAD，雙方說法皆合理；無法歸責。',
      policyAnchors: ['ELI-301', 'SND-503']
    },
    recommendation: {
      primaryOption: { label: 'Return (Buyer Pays Shipping)', details: '非 SNAD；退貨運費由買家負擔。' },
      alternativeOption: { label: 'Goodwill Partial Refund (5–10%)', details: '雙方可小額補償結案。' }
    },
    caseSummary:
`Order: TW-19802
Eligibility: R1/R2/R3 ✅
Decision: Neutral Dispute（SND-503）
Options: 退貨（買家付運費）/ 小額補償`
  },

  case8: {
    eligibility: { r1: true, r2: false, r3: true, notes: '買家約 36h 後才回報；超出 24h 規則。' },
    snadResult: {
      label: 'SNAD',
      reason: '疑似假貨（序號不符、ANC/Spatial Audio 異常、韌體未知…）——高風險類別。',
      policyAnchors: ['ELI-102', 'SND-101', 'RISK-901']
    },
    recommendation: {
      primaryOption: { label: 'Escalate to CS', details: '逾時且高風險；必須人工介入，不由 AI 直接裁決。' },
      alternativeOption: { label: '—', details: '—' }
    },
    caseSummary:
`Order: TW-16852
Eligibility: R1 ✅ / R2 ❌ / R3 ✅
Decision: Counterfeit High-Risk → Escalate to CS`
  }
};
