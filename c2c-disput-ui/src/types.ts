// src/types.ts
export type CaseId = 'case1' | 'case2' | 'case3';

export interface ListingInfo {
  title: string;
  listedPrice: string;
  condition: string;
  disclosedFlaws: string;
  attributes: string;
  photos: { url: string; label: string }[];
  notes?: string;
}

export interface Attachment {
  type: 'image';
  url: string;
  name?: string;
}

export interface ChatEntry {
  timestamp: string; // "YYYY-MM-DD HH:mm"
  sender: 'Buyer' | 'Seller' | 'System' | 'AI';
  text: string;
  attachments?: Attachment[];
  highlight?: boolean; // action/important (e.g., Return/Refund)
}

export interface CaseData {
  id: CaseId;
  title: string;
  listingInfo: ListingInfo;
  chatLog: ChatEntry[];
  complaint: string;
  orderMeta?: { label: string; value: string }[];
}

export interface Eligibility { r1: boolean; r2: boolean; r3: boolean; notes?: string }
export interface SnadResult { label: 'SNAD' | 'Neutral' | 'Not SNAD'; reason: string; policyAnchors?: string[] }
export interface RecommendationOption { label: string; details: string }
export interface Recommendation { primaryOption: RecommendationOption; alternativeOption?: RecommendationOption }

export interface AnalysisResult {
  eligibility: Eligibility;
  snadResult: SnadResult;
  recommendation: Recommendation;
  caseSummary: string;
}

/** Activity log item (for Staff Console) */
export interface Activity {
  ts: string;              // "YYYY-MM-DD HH:mm"
  caseId: CaseId;
  actor: 'Buyer' | 'Seller' | 'AI' | 'System';
  type: 'RETURN_REQUEST' | 'COMPLETED' | 'EVIDENCE' | 'MESSAGE';
  note?: string;
  attachmentCount?: number;
}
