// src/api/analyzeDisputeMock.ts
import { MOCK_ANALYSIS_RESULTS } from '../data/mockAnalysis';
import type { AnalysisResult } from '../types';

export async function analyzeDispute(caseId: string): Promise<AnalysisResult> {
  // Giả lập AI chạy ~1.2s
  await new Promise(r => setTimeout(r, 1200));
  const data = MOCK_ANALYSIS_RESULTS[caseId];
  if (!data) throw new Error('No mock analysis for ' + caseId);
  return data;
}
