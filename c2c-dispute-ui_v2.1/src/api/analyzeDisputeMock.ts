// src/api/analyzeDisputeMock.ts
import type { AnalysisResult } from '../types';

export async function analyzeDispute(caseId: string): Promise<AnalysisResult> {
  // 模擬 loading，可保留或刪除
  await new Promise(r => setTimeout(r, 800));

  // 改成呼叫你的 FastAPI
  const res = await fetch(`http://127.0.0.1:8000/api/analysis/${caseId}`);

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status}`);
  }

  const data = await res.json();

  // 後端沒資料時
  if (!data || data.error) {
    throw new Error(`No analysis found for ${caseId}`);
  }

  return data as AnalysisResult;
}
