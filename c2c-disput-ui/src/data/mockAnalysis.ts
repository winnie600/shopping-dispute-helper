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
  }
};
