export const POLICY_TW = `[台灣] 服務條款服務條款 Terms of Service

---

# NexBuy 爭議與退款處理政策

**目的：** 本文件作為 AI 助理（AI Copilot/RAG）的統一參考來源，用於支援 C2C 交易爭議處理，特別聚焦「與描述不符」（SNAD）類型。

**適用範圍：** 適用於二手 C2C 交易；使用應用內付款／託管（In-app Payment/Escrow）；以及台灣 7-ELEVEN 取貨付款（COD）。在平台外進行之交易不在本政策保障範圍內。

**運作原則：** NexBuy 以 Venue（連接場域）方式運作。我們鼓勵雙方優先在 App 內自行協商，僅於必要時升級至客服（CS）。所有最終裁決以有效證據與申訴時效為依據。

*說明：本文件為學習／專案綜整用途，非公司正式文本。已納入錨點代碼（anchor codes）以最佳化 RAG 擷取。*

---

### 1. 定義與術語

為確保理解與適用一致，下列術語定義如下：

**與描述不符（SNAD）\`[DEF-101]\`**  
指實際收到之商品與刊登文字／圖片存在重大差異。常見例：尺碼錯、型號錯、或存在賣家未事先揭露之嚴重瑕疵。

**爭議窗口（Dispute Window）\`[DEF-102]\`**  
買家得以發起退貨或退款之有效期間。此期間至訂單轉為「完成」之前為止，通常為收貨後 24–48 小時。

**訂單完成（Complete / Order Received）\`[DEF-103]\`**  
買家在 App 內點「已收貨／完成」，或系統在等待期屆滿後自動完成。

**應用內付款／託管（In-app / Escrow）\`[DEF-104]\`**  
於 Carousell 應用內完成付款；款項先存入中介託管帳戶，僅於交易條件達成後撥付賣家。

**平台外交易（Off-platform）\`[DEF-105]\`**  
包括私下匯款或直接現金交易，未在系統留存紀錄。此類交易不受本政策保障。

**7-ELEVEN 取貨付款（台灣）\`[DEF-106]\`**  
於台灣 7-ELEVEN 門市寄送並代收款之服務，參考運費 NT$60。款項在撥付賣家前同樣經託管流程。

---

### 2. 角色與責任

**Venue 角色定位 \`[ROL-201]\`**  
Carousell Lite 為連接場域，不對商品品質或契約履行結果提供保證。平台外交易之風險由使用者自負。

**「先協商」原則 \`[ROL-202]\`**  
在申請平台介入前，雙方需先透過 App 站內聊天自行協商。各方均享有至少 24 小時回覆時限，始考慮升級。

**保障範圍 \`[ROL-203]\`**  
平台僅處理使用 In-app/Escrow 或 7-ELEVEN COD 的交易爭議。平台外交易不在處理範圍。

**證據導向 \`[ROL-204]\`**  
裁決以具體證據為準，包括刊登原文與圖片、收貨時之照片／影片、站內聊天紀錄、及物流收據等。

---

### 3. 受理條件

要由 AI 助理與系統受理，需同時符合三項先決條件：

* **R1 \`[ELI-301]\`：** 必須屬於受保障之通道（In-app/Escrow 或 7-ELEVEN COD）。  
* **R2 \`[ELI-302]\`：** 必須在「爭議窗口」時效內提出。  
* **R3 \`[ELI-303]\`：** 訂單狀態仍為未完成（Not Complete/Order Received）。

若上述任一不符，視為超出受理範圍 \`[ELI-304]\`。此情況下，Copilot 僅提供所需證據清單與禮貌協商文本，恕不給出具體 A/B 解決方案。

---

### 4. 標準處理流程（時間軸）

爭議流程遵循以下時間軸：

1. **發起（0h）\`[PRC-401]\`：** 買家提交退貨／退款申請。  
2. **賣家回覆（+24h）\`[PRC-402]\`：** 賣家於 24 小時內擇一：接受／拒絕／提出替代方案（還價）。若逾時未回覆，系統將自動升級至客服（Auto-Raise）\`[PRC-403]\`。  
3. **再次協商（+24h）\`[PRC-404]\`：** 若賣家提出替代方案，買家再有 24 小時決定接受或拒絕。若買家逾時未回，系統同樣自動升級 \`[PRC-405]\`。  
4. **升級處理 \`[PRC-406]\`：** 升級後，客服於 24 小時內介入，指引補充證據並依政策作出最終裁示。

---

### 5. 與描述不符（SNAD）判定標準

是否屬 SNAD，依下列標準判斷：

**判定為 SNAD \`[SND-501]\`**  
商品與刊登存在實質且未揭露之差異，如嚴重色差、未告知之故障、尺碼錯誤、或缺少未事先聲明之配件。  
* *預設建議：* A 案 — 退貨並全額退款 \`[SUG-601]\`。

**非 SNAD \`[SND-502]\`**  
屬於賣家已明確揭露之小瑕疵（如已標註刮痕、電池 84% 等），或買家因改變心意／主觀不喜而退貨。  
* *預設建議：* B 案 — 保留商品並部分退款（通常 15–30%，視情況）\`[SUG-602]\`。

**證據不足 \`[SND-503]\`**  
若缺乏對照照片、開箱影片或聊天紀錄，系統暫無法定論，將依清單要求補件 \`[EVD-701]\`。

---

### 6. 最低證據清單

為利調查，雙方至少需提供：

1. 刊登原文與圖片 \`[EVD-701]\`。  
2. 收貨時之照片／影片（優先開箱影片，畫面清楚且包含完整情境）\`[EVD-702]\`。  
3. 站內聊天紀錄，尤其是交易前後之承諾與說明 \`[EVD-703]\`。  
4. 物流憑證，如 7-ELEVEN 收據、追蹤碼與實際收貨時間 \`[EVD-704]\`。

---

### 7. 常見處理結果

依審查情況，可能結果包括：

* **全額退款並退貨 \`[OUT-801]\`：** 買家須於 2 日內選擇退貨方式；賣家確認收回後才撥款。  
* **全額退款（免退）或部分退款 \`[OUT-802]\`：** 適用於雙方達成一致或依客服裁定。部分退款需清楚確認金額。  
* **不予受理 \`[OUT-803]\`：** 超出範圍、逾期或證據不足之案件。

---

### 8. 台灣 7-ELEVEN COD 規範

適用 7-ELEVEN COD 之交易，遵循以下規範：

* **運費與時程：** 參考每件 NT$60 \`[TW-901]\`。門市保管 7 天；取件需出示證件與手機末三碼 \`[TW-902]\`。  
* **金流：** 門市代收 → 進入託管 → 符合條件後撥付賣家 \`[TW-903]\`。電子發票於 7 個工作日內寄送 \`[TW-904]\`。  
* **通報時效：** 買家應於取件後 24 小時內通報問題，以利即時指引 \`[TW-905]\`。

**退貨運費責任：**  
* 屬 SNAD：賣家承擔來回運費（或於收回後退款運費）\`[FEE-A]\`。  
* 非 SNAD（買家變心）：買家承擔 \`[FEE-B]\`。  
* 可採部分退款分攤成本、降低衝突 \`[FEE-C]\`。

---

### 9. 不受保護之行為

下列情形不適用用戶保障：

* **站外交易 \`[BAN-1001]\`：** 私下匯款或現金面交且未留系統紀錄之交易。  
* **詐欺 \`[BAN-1002]\`：** 欺騙、冒名或偽造證據等行為。

---

### 10. AI Copilot 作業指引

AI Copilot 自動化流程如下：

1. 檢核受理條件（R1/R2/R3）\`[COP-1101]\`。  
2. 擷取刊登與申訴內容，進行 SNAD 對照 \`[COP-1102]\`。  
3. 提出 A/B 建議並附政策錨點與 24–48 小時倒數 \`[COP-1103]\`。  
4. 若證據不足，自動列出補件清單 \`[COP-1104]\`。  
5. 需升級時，自動生成案件摘要（時間線、Eligibility、證據地圖）\`[COP-1105]\`。

---

### 附錄：技術參考

**11. 錨點代碼索引**  
\`[DEF-101..106]\` | \`[ROL-201..204]\` | \`[ELI-301..304]\` | \`[PRC-401..406]\` | \`[SND-501..503]\` | \`[EVD-701..704]\` | \`[OUT-801..803]\` | \`[TW-901..905]\` | \`[FEE-A..C]\` | \`[BAN-1001..1002]\` | \`[COP-1101..1105]\`

**12. Case Summary 範本**  
* **Order ID：** ____  
* **Eligibility（R1/R2/R3）：** ____  
* **Listing 重點：**（成色／已揭露瑕疵／屬性） ____  
* **Complaint＋Evidence：**（照片／影片／聊天／物流） ____  
* **SNAD 對照結果：** 是／否 — 理由： ____  
* **已提出建議：** A/B + 錨點： ____  
* **時間線：** 開啟時間、24h 截止、自動升級狀態： ____`;

export const POLICY_EN = `Terms of Service

# NEXBUY DISPUTE RESOLUTION AND REFUND POLICY

**Purpose:** This document serves as a unified reference source for the AI Assistant (AI Copilot/RAG) in supporting the handling of C2C commercial disputes, with a particular focus on cases of “Item Not as Described” (SNAD).

**Scope of Application:** This policy applies to second-hand C2C transactions; transactions that use the In-app Payment/Escrow feature; and Cash on Delivery (COD) via 7-Eleven in Taiwan. Transactions carried out off-platform are not covered by this policy.

**Operating Principle:** NexBuy operates as a venue. We encourage parties to prioritize in-app negotiation and only escalate to Customer Support (CS) when truly necessary. All final decisions will be based on authentic evidence and the timeliness of the claim.

*Note: This is a consolidated document for learning/project purposes and is not an official corporate text. Anchor codes have been integrated to optimize RAG data extraction.*

---

### 1. Definitions and Terms

To ensure consistency in interpretation and application, the terms below are defined as follows:

**Item Not as Described (SNAD) \`[DEF-101]\`**  
Refers to a material discrepancy between the actual item received and the listing description or photos. Typical examples include the wrong size, wrong model, or serious defects that the seller failed to disclose.

**Dispute Window \`[DEF-102]\`**  
The valid period during which the buyer may initiate a return or refund request. This window lasts until before the order transitions to “Complete,” typically 24–48 hours after receipt.

**Complete / Order Received \`[DEF-103]\`**  
An order is considered complete when the buyer taps “Order Received/Complete” in the app, or when the system auto-completes after the waiting period expires.

**In-app / Escrow \`[DEF-104]\`**  
A payment method executed directly within the Carousell app. The funds are held in an intermediate escrow account and are released to the seller only when the transaction conditions have been met.

**Off-platform Transactions \`[DEF-105]\`**  
Includes private bank transfers or direct cash transactions that leave no record in the system. Such transactions are not protected by this policy.

**7-Eleven Cash on Delivery (7-ELEVEN COD – Taiwan) \`[DEF-106]\`**  
A service for shipping and cash collection at 7-Eleven stores in Taiwan, with a reference shipping fee of NT$60. Collected funds also go through the escrow process before being released to the seller.

---

### 2. Roles and Responsibilities

**Venue Role \`[ROL-201]\`**  
Carousell Lite functions as a connecting venue and does not provide any guarantee regarding product quality or contractual performance. Risks arising from off-platform transactions are borne by the users.

**“Negotiate First” Principle \`[ROL-202]\`**  
Before requesting platform intervention, both parties must negotiate via the in-app chat. Each party has a minimum of 24 hours to respond before escalation is considered.

**Coverage \`[ROL-203]\`**  
The platform only resolves disputes for transactions using In-app Payment/Escrow or 7-Eleven COD. Off-platform transactions fall outside the scope of handling.

**Evidence-based Orientation \`[ROL-204]\`**  
All decisions are based on specific evidence, including the original listing text and photos, photos/videos of the item upon receipt, in-app chat history, and shipping receipts.

---

### 3. Eligibility (Admissibility)

For the AI Assistant and system to support a dispute, all three prerequisites (Eligibility) must be satisfied:

* **R1 \`[ELI-301]\`:** The transaction must be through a protected channel (In-app/Escrow or 7-Eleven COD).  
* **R2 \`[ELI-302]\`:** The dispute must be filed within the defined Dispute Window.  
* **R3 \`[ELI-303]\`:** The order must not yet be “Complete/Order Received.”

If any of the above conditions are violated, the request is deemed out of scope \`[ELI-304]\`. In such cases, the Copilot will only provide a required-evidence checklist and polite negotiation templates, but will not issue concrete A/B resolution proposals.

---

### 4. Standard Handling Process (Timeline)

The dispute-resolution process follows the timeline below:

1. **Initiation (0h) \`[PRC-401]\`:** The process begins when the Buyer submits a Return/Refund request.  
2. **Seller Response (+24h) \`[PRC-402]\`:** The Seller has 24 hours to choose: Accept, Reject, or Propose an Alternative (counteroffer). If the Seller does not respond within 24 hours, the system automatically escalates the case to Customer Support (Auto-Raise) \`[PRC-403]\`.  
3. **Renegotiation (+24h) \`[PRC-404]\`:** If the Seller proposes an alternative, the Buyer has an additional 24 hours to Accept or Reject. If the Buyer fails to respond within 24 hours, the system will also auto-escalate \`[PRC-405]\`.  
4. **Escalation Handling \`[PRC-406]\`:** Once escalated, CS will intervene within 24 hours to request supplementary evidence as needed and issue a final decision according to policy.

---

### 5. SNAD Evaluation Criteria

Whether an item qualifies as SNAD is determined by these criteria:

**Cases Determined as SNAD \`[SND-501]\`**  
The item has material, undisclosed differences from the listing, such as severe color discrepancies, undisclosed damage, wrong size, or missing accessories.  
* *Default Proposal:* Option A — Return and Full Refund \`[SUG-601]\`.

**Cases NOT Considered SNAD \`[SND-502]\`**  
The item has minor issues that were clearly disclosed by the seller (e.g., a noted scratch, stated 84% battery health), or the return is requested due to a change of mind or subjective dislike by the buyer.  
* *Default Proposal:* Option B — Keep the item and receive a Partial Refund (typically 15–30% depending on the situation) \`[SUG-602]\`.

**Insufficient Evidence \`[SND-503]\`**  
If comparison photos, unboxing video, or chat history are lacking, the system cannot conclude and will request additional evidence per the checklist \`[EVD-701]\`.

---

### 6. Minimum Evidence Checklist

For investigation purposes, the parties must provide at least the following:

1. Original listing text and photos \`[EVD-701]\`.  
2. Photos or video of the item upon receipt (unboxing video with clear, complete context preferred) \`[EVD-702]\`.  
3. In-app chat history, especially pre- and post-purchase commitments \`[EVD-703]\`.  
4. Shipping documents such as 7-Eleven receipts, tracking codes, and actual receipt time \`[EVD-704]\`.

---

### 7. Common Outcomes

Based on the review, possible outcomes include:

* **Full Refund with Return \`[OUT-801]\`:** The buyer must select a return method within 2 days. Funds are released only after the seller confirms receipt of the returned item.  
* **Full Refund (No Return) or Partial Refund \`[OUT-802]\`:** Applied when both parties reach an agreement or per a CS decision. For partial refunds, the exact amount must be clearly confirmed.  
* **Not Admitted \`[OUT-803]\`:** The request will be rejected if it is out of scope, overdue, or lacks sufficient evidence.

---

### 8. 7-Eleven COD Rules in Taiwan

For transactions using 7-Eleven COD, the following operational rules apply:

* **Shipping Fee and Time:** Reference fee is NT$60 per shipment \`[TW-901]\`. Items are stored at the store for 7 days; to pick up, present ID and the last 3 digits of the phone number \`[TW-902]\`.  
* **Money Flow:** Funds collected at the store are transferred into an escrow account before being released to the seller \`[TW-903]\`. E-invoices will be sent via email within 7 business days after 7-Eleven confirms collection \`[TW-904]\`.  
* **Issue Reporting:** Buyers should report issues within 24 hours of pickup for timely guidance \`[TW-905]\`.

**Responsibility for Return Shipping Costs:**  
* If SNAD: The seller bears round-trip shipping costs (or refunds the buyer after receiving the return) \`[FEE-A]\`.  
* If not SNAD (buyer’s change of mind): The buyer bears the costs \`[FEE-B]\`.  
* A partial refund may be applied to share costs and reduce conflict \`[FEE-C]\`.

---

### 9. Non-protected Behaviors

User protection is void for:

* **Off-platform Transactions \`[BAN-1001]\`:** Private transfers or direct cash deals outside the app.  
* **Fraud \`[BAN-1002]\`:** Acts of deception, impersonation, or forged evidence.

---

### 10. Operating Guide for AI Copilot

The automated process of AI Copilot follows these steps:

1. Check eligibility (R1/R2/R3) \`[COP-1101]\`.  
2. Extract listing details and the complaint to compare for SNAD \`[COP-1102]\`.  
3. Provide Option A/B recommendations with policy citations (anchor codes) and a 24–48h countdown \`[COP-1103]\`.  
4. If evidence is insufficient, automatically output the required evidence list \`[COP-1104]\`.  
5. When escalation is needed, automatically generate a Case Summary including the timeline, eligibility, and evidence map \`[COP-1105]\`.

---

### Appendix: Technical References

**11. Anchor Code Index**  
\`[DEF-101..106]\` | \`[ROL-201..204]\` | \`[ELI-301..304]\` | \`[PRC-401..406]\` | \`[SND-501..503]\` | \`[EVD-701..704]\` | \`[OUT-801..803]\` | \`[TW-901..905]\` | \`[FEE-A..C]\` | \`[BAN-1001..1002]\` | \`[COP-1101..1105]\`

**12. Case Summary Template**  
* **Order ID:** ____  
* **Eligibility (R1/R2/R3):** ____  
* **Listing Key Points:** (Condition/Disclosed defects/Attributes) ____  
* **Complaint & Evidence:** (Photos/Video/Chat/Logistics) ____  
* **SNAD Assessment:** Yes/No — Reason: ____  
* **Proposed Solution:** Option A/B + Anchor codes: ____  
* **Timeline:** Dispute opened, 24h deadline, auto-raise status: ____"`;

export const POLICY_TEXT: Record<'zh' | 'en', string> = {
  zh: POLICY_TW,
  en: POLICY_EN,
};