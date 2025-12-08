export const POLICY_TW = `Carousell Lite — 爭議與退款政策（RAG v1.0）

目的：作為 AI Copilot（RAG）的統一參考來源，用於支援 C2C 爭議處理（特別是 SNAD－Item Not as Described / 與描述不符）。
範圍：二手 C2C 交易；應用內付款／託管（escrow）；台灣 7-ELEVEN 貨到付款（COD）；非應用內交易不受保護。
原則：平台為 venue（中介）；優先在 App 內自行協商；必要時才升級至客服（CS）；最終依 證據 與 時效 判定。

注：此為課程／專案使用的整合版政策，非官方。已加入 錨點代碼 以利 RAG 精準擷取。

1) 定義與術語
SNAD（Not as Described）[DEF-101]：實收商品與刊登描述／圖片不相符（例：尺碼／型號錯誤、未揭露之重大瑕疵）。
Dispute Window（爭議窗口）[DEF-102]：在訂單 Complete 之前可發起退貨／退款的時間窗（常見為「領取後 24–48 小時」）。
Complete / Order Received [DEF-103]：買家點選已收貨／訂單完成，或系統逾時自動完成。
In-app / Escrow [DEF-104]：於 App 內付款；款項先入託管，符合條件後撥付。
Off-platform [DEF-105]：App 外交易不受保護。
7-ELEVEN COD（台灣）[DEF-106]：超商取貨付款；參考運費 NT$60。

2) 角色與責任
Venue [ROL-201]：平台為中介，不保證商品品質／履約。
先自洽再升級 [ROL-202]：雙方應先於 App 內協商；各方至少有 24 小時回覆時限。
保護範圍 [ROL-203]：僅處理 In-app／Escrow 或 7-ELEVEN COD。
證據導向 [ROL-204]：以刊登描述、收貨照片／影片、App 內對話、物流單據等為依據。

3) 程序門檻（Eligibility）
R1 [ELI-301]：受保護通道（In-app／Escrow、7-ELEVEN COD）。
R2 [ELI-302]：仍在爭議窗口內。
R3 [ELI-303]：訂單尚未 Complete。
任一不符 → Out of scope [ELI-304]：Copilot 僅提供證據清單與禮貌協商文案。

4) 標準流程（時間軸）
0h 買家提交退貨／退款 [PRC-401]。
+24h 賣家回覆：接受／拒絕／還價 [PRC-402]；逾時 → 自動升級至客服 [PRC-403]。
賣家還價 → 買家 +24h 接受或拒絕 [PRC-404]；逾時 → 自動升級 [PRC-405]。
升級後：CS 約 24h 內 介入與裁示 [PRC-406]。

5) SNAD 判斷（內容對照）
屬 SNAD [SND-501]：未揭露之實質差異（嚴重色偏、未述之故障、尺碼錯、缺配件未述）。
→ 預設建議：Option A 退貨＋全額退款 [SUG-601]。
不屬 SNAD [SND-502]：已揭露之瑕疵、買家改變心意／主觀不喜。
→ 預設建議：Option B 保留＋部分退款（15–30%）[SUG-602]。
證據不足 [SND-503]：先要求補件（對照照片／開箱影片／聊天）[EVD-701]。

6) 最低證據集（Checklist）
刊登文字＋圖片 [EVD-701]；收貨照片／影片（開箱優先）[EVD-702]；
App 內對話紀錄 [EVD-703]；物流／門市單據（7-ELEVEN 小白單）[EVD-704]。

7) 常見處置結果
全額退款＋退貨 [OUT-801]；免退貨或部分退款 [OUT-802]；不受理 [OUT-803]。

8) 7-ELEVEN COD（台灣）— 作業備註
運費參考 NT$60／單趟 [TW-901]；保管 7 天 [TW-902]；
託管流程與撥付 [TW-903]；電子發票約 7 個工作天 [TW-904]；
領取後 24h 內回報問題 [TW-905]。
費用承擔：屬 SNAD → 賣家承擔往返運費 [FEE-A]；非 SNAD → 買家承擔 [FEE-B]；可採部分退款折衝 [FEE-C]。

9) 不受保護行為
站外交易 [BAN-1001]；欺詐／偽造證據 [BAN-1002]。

10) Copilot 指引
先檢查 R1/R2/R3 [COP-1101]；擷取刊登＋申訴進行對照 [COP-1102]；
產生 A/B 建議＋錨點＋倒數 [COP-1103]；證據不足 → Checklist [COP-1104]；
需升級 → 生成 Case Summary（時間線／Eligibility／證據地圖）[COP-1105]。

11) 錨點速查
[DEF-101..106] | [ROL-201..204] | [ELI-301..304] | [PRC-401..406] | [SND-501..503] | [EVD-701..704] | [OUT-801..803] | [TW-901..905] | [FEE-A..C] | [BAN-1001..1002] | [COP-1101..1105]

12) Case Summary 範本
Order ID：____
Eligibility（R1/R2/R3）：____
Listing 重點：____
Complaint＋Evidence：____
SNAD 對照：是／否 — 理由：____
已提出建議：A/B＋錨點：____
時間線：開啟爭議、24h 截止、是否已自動升級：____
`;

export const POLICY_EN = `Carousell Lite — Dispute & Refund Policy (RAG v1.0)

Purpose: Unified reference for AI Copilot (RAG) to support C2C dispute handling (focus on SNAD – Item Not as Described).
Scope: Second-hand C2C; in-app payment/escrow; Taiwan 7-ELEVEN COD. Off-platform trades are not protected.
Principles: Platform acts as a venue; prefer in-app negotiation first; escalate to CS only when needed; decisions are evidence- and time-bound.

Note: Class/Project consolidation, not official. Anchor codes included for precise RAG retrieval.

1) Definitions
SNAD [DEF-101]: Delivered item mismatches listing/text/photos (e.g., wrong size/model, undisclosed major defect).
Dispute Window [DEF-102]: Period before order Complete when return/refund can be opened (commonly 24–48h after pickup).
Complete / Order Received [DEF-103]: Buyer taps “received/complete” or system auto-completes.
In-app / Escrow [DEF-104]: Paid in app; funds held in escrow and released per policy.
Off-platform [DEF-105]: Transactions outside the app are unprotected.
7-ELEVEN COD (TW) [DEF-106]: Convenience-store cash on delivery; ref. fee NT$60.

2) Roles & Responsibilities
Venue [ROL-201]: Platform is an intermediary; does not guarantee quality/performance.
Settle first, then escalate [ROL-202]: Parties should negotiate in-app; each party has ≥24h to respond.
Coverage [ROL-203]: Only in-app/escrow or 7-ELEVEN COD disputes.
Evidence-driven [ROL-204]: Listing, receiving photos/videos, in-app chat, logistics proof.

3) Eligibility (hard gates)
R1 [ELI-301]: Protected channel (in-app/escrow, 7-ELEVEN COD).
R2 [ELI-302]: Within dispute window.
R3 [ELI-303]: Order not Complete.
Any failure → Out of scope [ELI-304]; Copilot supplies checklist and polite scripts only.

4) Standard timeline
0h Buyer opens return/refund [PRC-401].
+24h Seller must respond: accept/decline/counter [PRC-402]; otherwise auto-raise to CS [PRC-403].
Counter → Buyer gets +24h to accept/decline [PRC-404]; no action → auto-raise [PRC-405].
After escalation: CS intervenes in ~24h [PRC-406].

5) SNAD decision (content check)
SNAD [SND-501]: Undisclosed material differences (severe color cast, undisclosed faults, wrong size, missing items not stated).
→ Default: Option A Return & Full Refund [SUG-601].
Not SNAD [SND-502]: Clearly disclosed flaws; buyer’s change of mind/subjective dislike.
→ Default: Option B Keep & Partial Refund (15–30%) [SUG-602].
Insufficient evidence [SND-503]: Ask for checklist items first [EVD-701].

6) Minimum evidence checklist
Listing text+photos [EVD-701]; receiving photos/video (unboxing preferred) [EVD-702];
In-app chat logs [EVD-703]; logistics/store receipts (7-ELEVEN) [EVD-704].

7) Common outcomes
Full refund + return [OUT-801]; no-return full/partial refund [OUT-802]; not accepted [OUT-803].

8) 7-ELEVEN COD (TW) — notes
NT$60 per leg [TW-901]; store keeps for 7 days [TW-902];
Escrow flow & payout [TW-903]; e-invoice ~7 business days [TW-904];
Report issues within 24h after pickup [TW-905].
Fees: SNAD → seller bears both-ways shipping [FEE-A]; Non-SNAD → buyer bears [FEE-B]; partial refund compromise allowed [FEE-C].

9) Not protected
Off-platform trades [BAN-1001]; fraud/forgery [BAN-1002].

10) Copilot guidance
Check R1/R2/R3 first [COP-1101]; compare listing vs. complaint [COP-1102];
Produce A/B with anchors and countdown [COP-1103]; if lacking evidence, output checklist [COP-1104];
When escalating, generate Case Summary (timeline, eligibility, evidence map) [COP-1105].

11) Anchor quick index
[DEF-101..106] | [ROL-201..204] | [ELI-301..304] | [PRC-401..406] | [SND-501..503] | [EVD-701..704] | [OUT-801..803] | [TW-901..905] | [FEE-A..C] | [BAN-1001..1002] | [COP-1101..1105]

12) Case Summary template
Order ID: ____
Eligibility (R1/R2/R3): ____
Listing highlights: ____
Complaint + Evidence: ____
SNAD check: Yes/No — Why: ____
Suggestions: A/B + anchors: ____
Timeline: open, 24h deadlines, auto-raise?: ____
`;
export type PolicyLang = 'zh' | 'en';
export const POLICY_TEXT: Record<PolicyLang, string> = { zh: POLICY_TW, en: POLICY_EN };