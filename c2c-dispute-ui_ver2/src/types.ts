// src/types.ts

/** ====== Core IDs ====== */
// ID “chuẩn” kiểu chuỗi cho các màn dựa trên key tĩnh
export type CaseId =
  | 'case1'
  | 'case2'
  | 'case3'
  | 'case4'
  | 'case5'
  | 'case6'
  | 'case7'
  | 'case8';

// Cho phép dùng cả số (1..8) lẫn chuỗi ('case1'..'case8') tùy dataset
export type CaseKey = CaseId | number;

/** ====== Listing (for product/listing pages) ====== */
export interface ListingInfo {
  /** Listing title shown to users */
  title: string;
  /** Price string, e.g., "NT$9,500" */
  listedPrice: string;
  /** Condition badge, e.g., "Like New", "Brand New", "8/10" */
  condition: string;
  /** Seller disclosed flaws (displayed as a paragraph) */
  disclosedFlaws: string;
  /** Key attributes (flattened into one string for your current UI) */
  attributes: string;
  /** Listing photos (label is used in UI as a caption) */
  photos: { url: string; label: string }[];
  /** Optional extra notes */
  notes?: string;
}

/** ====== Chat / Inbox ====== */
export type ChatSender = 'Buyer' | 'Seller' | 'System' | 'AI';

export interface Attachment {
  /** Currently your UI supports image-only attachments */
  type: 'image';
  url: string;
  name?: string;
}

export interface ChatEntry {
  /** "YYYY-MM-DD HH:mm" */
  timestamp: string;
  sender: ChatSender;
  /** Chat bubble text (zh-TW for NexBuy UI) */
  text: string;
  /** Optional evidence images */
  attachments?: Attachment[];
  /** Mark important actions (Return/Refund, Completed, etc.) for highlighting */
  highlight?: boolean;
}

/** One complete case used by ChatInbox (chatLog) and listing (listingInfo) */
export interface CaseData {
  id: CaseKey; // ⬅️ chấp nhận số hoặc chuỗi
  title: string;
  listingInfo: ListingInfo;
  /** Seed/history chats for this case */
  chatLog: ChatEntry[];
  /** Buyer complaint short text (used by analyzer) */
  complaint: string;
  /** Optional metadata (order id, shipping channel, etc.) */
  orderMeta?: { label: string; value: string }[];
}

/** Helpful alias for external chat seed stores */
export type ChatLogs = Record<CaseKey, ChatEntry[]>;

/** ====== AI Analysis (used by StaffDashboard/Console) ====== */
export interface Eligibility {
  r1: boolean; // Protected channel (in-app/escrow or 7-ELEVEN COD)
  r2: boolean; // Within dispute window
  r3: boolean; // Not completed
  notes?: string;
}

export type SnadLabel = 'SNAD' | 'Neutral' | 'Not SNAD';

export interface SnadResult {
  label: SnadLabel;
  reason: string;
  /** Policy anchors, e.g., ["ELI-301", "SND-501"] */
  policyAnchors?: string[];
}

export interface RecommendationOption {
  label: string;   // e.g., "Return & Full Refund"
  details: string; // free text explanation
}

export interface Recommendation {
  primaryOption: RecommendationOption;
  alternativeOption?: RecommendationOption;
}

export interface AnalysisResult {
  eligibility: Eligibility;
  snadResult: SnadResult;
  recommendation: Recommendation;
  /** Multiline summary (printed in <pre/>) */
  caseSummary: string;
}

/** ====== Staff Console activity timeline ====== */
export type ActivityActor = 'Buyer' | 'Seller' | 'AI' | 'System';
export type ActivityType = 'RETURN_REQUEST' | 'COMPLETED' | 'EVIDENCE' | 'MESSAGE';

export interface Activity {
  /** "YYYY-MM-DD HH:mm" */
  ts: string;
  caseId: CaseKey; // ⬅️ number | 'caseX' để logActivity không lỗi
  actor: ActivityActor;
  type: ActivityType;
  note?: string;
  attachmentCount?: number;
}

/** ====== (Optional) Tickets & Threads for dashboards/inbox ====== */
/** Reuse in StaffDashboard (status chips) */
export type TicketStatus =
  | 'Monitoring'
  | 'Pending AI'
  | 'Analyzing'
  | 'AI Completed'
  | 'Needs Staff'
  | 'Resolved';

export interface Ticket {
  id: CaseKey; // ⬅️ hỗ trợ cả số lẫn chuỗi
  title: string;
  /** Mirror of listing price shown in ticket list */
  price: string;
  status: TicketStatus;
  /** "YYYY-MM-DD HH:mm" */
  lastUpdate: string;
  analysis?: AnalysisResult;
}

/** Thread item used in ChatInbox left pane */
export interface Thread {
  id: CaseKey; // ⬅️ hỗ trợ cả số lẫn chuỗi
  title: string;
  price: string;
  lastMsg: string;
  unread: number;
}

/** ====== Utility helpers (optional) ====== */
export type ValueOf<T> = T[keyof T];
export type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };