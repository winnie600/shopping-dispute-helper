# C2C網購爭議協助幫手(待更新)

---
## 更新日誌

後端dispute_pipeline_v3.1 前後端嵌入 (能夠看到生成ai analysis在demo網頁上的顯示)。  
後端dispute_pipeline_v3.2 新增AI案件摘要觸發機制的功能。  
前端UI v2.1 解決前端嵌入過程造成的網頁排版錯誤。  

---

## 專案描述

本專案為一個協助處理 C2C 電商交易中 **買家與賣家之間退貨爭議** 的 AI 仲裁助手。
在二手商品交易情境下，商品狀況通常帶有主觀描述（如「正常使用痕跡」、「近全新」），且資訊不對稱，使得「商品是否與描述相符」經常成為爭議來源。

為了解決此問題，本系統整合 **規則基礎審核（eligibility checks）** 與 **大型語言模型判斷（LLM reasoning）**，能夠：

* 分析案件資料（買家敘述、賣家描述、商品資訊、事件時間軸）
* 判定案件是否屬於 SNAD（Significantly Not As Described，商品與描述不符）
* 指出明確的 **描述差異（discrepancy）** 與相關政策依據
* 輸出仲裁結果（SNAD / Neutral / Insufficient Evidence）
* 根據平台政策給出完整的解決方案（退貨退款、部分退款、或中立建議）

本專案目標是讓 C2C 平台能以更快速、透明且一致的方式處理買賣爭議，降低人工仲裁負擔，並提升整體使用者體驗。

---

## 目標使用者
客服人員: 節省審查時間,提升準確度。  
買家 / 賣家:更快速且明確的回覆,降低爭議摩擦。  
平台管理者: 取得自動化報告。

---

## 🔍 專案簡介

本專案是一個 **以 LLM 為核心的自動化 C2C 買賣爭議判定系統**，主要處理：

* **SNAD（Significantly Not As Described）商品與描述不符**
* **Neutral（買家主觀感受 / 無法證明 mismatch）**
* **Insufficient Evidence（證據不足）**

本系統使用 **Gemma 3 (1B)** 作為模型，並透過 **精心設計的 ver2 Prompt** 完成判斷。
不採用 RAG，因為案件文本量小，直接置入 prompt 最穩定且可控。

---

# 🧠 系統特色（v3 架構）

✔ **全面模組化的三階段 Pipeline（ver3 最終採用）**
v3 強調 **模組拆分、可維護性、可測試性與可擴充性**，每個模組負責單一核心功能，避免 v2 的單檔過度耦合問題。

---

## **Stage 1 — Extract & Normalize（資料抽取與規範化）**

負責將原始 JSON 中的所有資訊拆解、規整成統一格式，包含：

* **listing 資訊解析**（標題、描述、品項狀況、配件、瑕疵）
* **chat history 解析**（買賣雙方對話的事件序列）
* **timeline metadata 抽取**（下單、取件、開箱時間等）
* **重點字段正規化**（例如：缺件、尺寸、狀況描述）

➡ 實作檔案：`extractor.py`

輸出：**結構化的 extracted_case dict**，供後續 Stage 2 使用。

---

## **Stage 2 — Policy-Driven SNAD Decision Engine（政策導向 SNAD 判定）**

此階段是 v3 的 **核心邏輯**，由多個模組共同完成：

### 🔸 rflags.py — Red Flags 偵測器

* 自動判斷案件中是否存在「明顯爭議點」
  例如：

  * 尺寸不符
  * 與描述不符
  * 缺件
  * 瑕疵未披露
  * 價格與價值落差
* Red Flags 會送入 prompt 作為 LLM 的 contextual facts。

---

### 🔸 policy.py — 政策 Rule Loader + Anchor Selector

* 載入 **Carousell SNAD 政策**
* 依據案例內容，自動挑選可能適用的政策 anchor（如 SND-501 / EVD-701 等）
* 提供至 Stage 2 prompt，讓 LLM 參考並引用。

---

### 🔸 llm_stage2.py — SNAD / Neutral / IE 最終決策

使用 **嚴格政策導向 Prompt（ver3 最終版）**
輸出格式固定為：

```json
{
  "snadResult": {
    "label": "SNAD" | "Neutral" | "Insufficient Evidence",
    "reason": "One-line English reason explaining the decision."
  }
}
```

下面我幫你生成 **README 內容（介紹你的 Stage2 Prompt）**，並且清楚標示 **要放在 `stage2_llm.py` 的哪裡**。

---

# ✅ **README：Stage 2 Prompt（ver3）介紹區塊**

以下是一段可以直接放進 README.md 的 **「Prompt Design」章節**：

---

## 🏛 Stage 2 LLM Prompt Design（ver3）

本系統在 Stage 2 採用 **高度結構化、政策導向（policy-driven）** 的 Prompt，以確保模型遵循 Carousell 的 SNAD 裁定標準，不會產生偏誤或亂判 SNAD。

LLM 的任務：

1. 根據政策判定：
   **SNAD / Neutral / Insufficient Evidence**
2. 強制輸出 JSON
3. 強制產生 reason（所有 label 都需要 reason）
4. SNAD 僅限於「客觀、重大、不符描述」的 mismatch
5. Fit/snugness 類型一律 Neutral（若 size label 正確）

Prompt 導入的核心策略：

### ✔ 明確 SNAD 判定條件

* 必須具備 **objective mismatch**
* 必須具備 **material mismatch**
* 必須是 **seller 描述錯誤或未披露**
  若有一項不成立 → 必須 Neutral。

### ✔ Fit Rule（模型最容易誤判的問題 → 已強化）

* 「偏小、偏緊、fit 不合」皆為主觀感受
* 除非 **尺寸標籤本身錯誤**，否則永遠不能 SNAD
  → 大幅提高模型穩定性（對 Case 2、Case 3 都有效）

### ✔ 輸出格式強制為 JSON

避免模型輸出的自然語言干擾後端 parse。

### ✔ reason 強制存在

避免模型省略 reason（Case 2 常見問題）。

---

### 🧩 Prompt 連同政策規則會在 `stage2_llm.py` 中以常數 `STAGE2_PROMPT` 定義：

```python
STAGE2_PROMPT = """
...（政策規則、SNAD 判準、Neutral 判準、fit rule、JSON 格式規範）...
""".strip()
```

Stage 2 Runner：
`stage2_llm_evaluate()` 會：

1. 收集 listing / chat / complaint / red flags
2. 包裝成 payload JSON
3. 拼接進 Prompt → 呼叫 LLM
4. 清洗與修復 LLM JSON
5. 返回標準化的：

```json
{
  "snadResult": {
    "label": "SNAD | Neutral | Insufficient Evidence",
    "reason": "..."
  }
}
```
---


**ver3 的特點：**

* 比 v2 更穩定：加入 rflags 與 policy anchors 讓模型更不會亂飄。
* 明確要求：

  * **SNAD 必須寫 reason（要有實體 discrepancy）**
  * Neutral 與 IE **不得亂寫 reason**
* 正式使用 `clean_json_output()` 確保一定能 parse 成 JSON。

---

## **Stage 3 — Post-Process, Recommendation, Summary（格式化與補充）**

Stage 3 **僅格式化，不修改 LLM 判定內容**（符合你 v3 的要求）

包含三個模組：

### 🔸 postprocess.py

* 將 llm raw output 清洗成合法 JSON
* 移除模型亂加的說明文字
* 處理 JSON 斷裂、缺逗號等情況

---

### 🔸 outcome_ai.py

* 根據 Stage 2 label，自動生成建議方案：

  * **SNAD → 應提供 Return & Refund / Partial Refund**
  * **Neutral → 多為雙方無過錯，提供 Partial Refund 建議**
  * **Insufficient Evidence → 建議雙方協商或維持原狀**

---

### 🔸 summary.py

* 將整案整理成「可讀的 Case Summary」
* 包含：

  * 關鍵事件線
  * Red Flags
  * 判定摘要
  * 建議處置方案

---

## **Stage Builder — build.py**

集成所有模組，負責組合完整 Pipeline 的執行順序：

1. Extractor
2. RFlags
3. Policy Loader
4. Stage2 Decision
5. Post-process
6. Outcome Recommendation
7. Summary

---

## **arbitration_pipeline.py — 主入口**

v3 的統一入口（取代 v2 的單檔 pipeline），負責：

* loading case
* 執行 build pipeline
* 回傳完整 analysis JSON 結果

---

# ✅ v3 的整體優勢

| 項目          | v2 舊版本          | v3 新版本（最終採用）                         |
| ----------- | --------------- | ------------------------------------ |
| 模組化         | ❌ 單一大檔，難維護      | ✔ 完整拆分，易 debug、易擴充                   |
| 再現性         | ❌ 模型輸出容易飄       | ✔ 有 rflags + policy anchors，穩定許多     |
| JSON 可靠度    | ❌ 常壞掉           | ✔ clean_json_output + coerce_to_json |
| Prompt 控制力  | 中等              | ✔ 強 prompt + 明確格式規範                  |
| 便於前端串接      | 普通              | ✔ 統一結構，前端只需讀一種格式                     |
| 是否改動 LLM 判斷 | ❌ 有時 Stage3 會覆蓋 | ✔ 完全不碰 LLM label                     |

---

### ✔ **高可控性、穩定輸出 JSON**

所有案例（Case1 / Case2 / Case3）皆能穩定產生：

```json
{
  "eligibility": {...},
  "snadResult": {...},
  "recommendation": {...},
  "caseSummary": {...}
}
```

---

### ✔ **政策引用（Policy Anchoring）**

限制只能引用 whitelist 內的代碼：

* SND-501 / 502 / 503
* EVD-701 / 702 / 703 / 704
* OUT-801 / 802 / 803
* FEE-A / B / C

超出範圍不允許，提升可信度與一致性。

---

### ✔ **不使用 RAG，穩定性更高**

理由：

* 文本量小（listing + chat）
* chunk 容易切壞語意
* Gemma 小模型更適合完整上下文
* 高可控 JSON 輸出 → 不適合 RAG 的非確定性

---

## 🔧 技術架構

```
data/source/caseX_raw.json
           │
           ▼
     extractor.py
  （建構標準摘要）
           │
           ▼
       rflags.py
 （Eligibility R1 R2 R3）
           │
           ▼
    llm_stage2.py
（依政策進行 SNAD 判斷）
           │
           ▼
   postprocess.py
（清理並強制 JSON 化）
          │
          ▼
    outcome_ai.py
 （產生 Option A/B）
          │
          ▼
    summary.py
（生成文字摘要）
          │
          ▼
data/analysis/caseX_analysis.json
   （最終輸出）
```

---

## 🚀 安裝與執行方式

### 1️⃣ 建立虛擬環境

```bash
python -m venv venv
source venv/bin/activate  # Windows 用 venv\Scripts\activate
```

### 2️⃣ 安裝套件

```bash
pip install -r requirements.txt
```

### 3️⃣ 啟動 Ollama 並下載模型

```bash
ollama pull gemma3:1b
# 或 gemma3:2b
ollama serve
```

### 4️⃣ 啟動後端(目前版本無嵌入前端 忽略此項目)

```bash
uvicorn app.main:app --reload
```

---

## 📂 專案結構

```
dispute_pipeline_v3/
│
├── README.md
├── requirements.txt
│
├── src/
│   ├── __init__.py
│   ├── pipeline/
│   │     ├── __init__.py
│   │     ├── extractor.py
│   │     ├── rflags.py
│   │     ├── llm_stage2.py
│   │     ├── postprocess.py
│   │     ├── policy.py
│   │     ├── outcome_ai.py
│   │     ├── summary.py
│   │     └── build.py  ← 把所有模組串在一起
│   │
│   └── arbitration_pipeline.py   ← 主入口（控制資料流、決定順序）
│
└── data/
    ├── source/     ← 放 case1_raw.json, case2_raw.json ...（原始輸入）
    └── analysis/   ← LLM 輸出結果
```

---

## 🧪 使用方式

執行：

```bash
python src\arbitration_pipeline.py --case-id case1 --data-dir .\data\source --out-dir .\data\analysis --model gemma3:1b
```

將輸出case1的：

* eligibility 判定
* SNAD/Neutral/IE
* policy anchors
* recommendation
* case summary

---

## 📝 ver2 Prompt 設計原則（關鍵）

* **Neutral 不需要 reason**
* **Fit / snugness = 主觀，不算 mismatch**（Case2 的關鍵修正）
* SNAD 必須指出：

  * 哪一個 listing 與 complaint 不符
  * 對應政策代碼
* 限制只能引用 whitelist 內政策
* JSON 結構不可變動

---

## ✔ 已完成進度（期末）

* ver3 SNAD Pipeline（最終版）
* Case1/Case2/Case3 均可穩定跑完
* 政策引用完善
* JSON 結構一致
* 取消 RAG，prompt 完全可控

---

## ❗ 遇到的問題（已解決）

### 1. JSON reason 欄位空白

→ Neutral 不需 reason → 由 prompt 修正。

### 2. RAG chunk 錯誤

→ 文本量太小，不適合 RAG → 改 direct prompt。

---

## ❗ 遇到的問題（未解決）
### 1. Case2 被判成 SNAD
→ fit/snugness 一律視為主觀 → Neutral。
仍無法判斷正確，可能為模型太小，語意判斷較弱。
### 2. Case3 Prompt 產出忽略 netural的reason
→ 解法1.prompt 加入明確規則 解法2.讓netural有預設的reason至少不會產出空。
---

## UI設計
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252811370.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252857348.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252869133.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252892722.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252906611.jpg)


---
## 政策範例
Carousell Lite — 爭議與退款政策（RAG v1.0）
目的： 作為 AI Copilot（RAG）的統一參考來源，用於支援 C2C 爭議處理（特別是 SNAD－Item Not as Described / 與描述不符）。
範圍： 二手 C2C 交易；應用內付款／託管（escrow）；台灣 7-ELEVEN 貨到付款（COD）；非應用內交易不受保護。
原則： 平台為 venue（中介）；優先在 App 內自行協商；必要時才升級至客服（CS）；最終依 證據 與 時效 判定。
注：此為課程／專案使用的整合版政策，非官方。已加入 錨點代碼 以利 RAG 精準擷取。

1) 定義與術語
SNAD（Not as Described）[DEF-101]：實收商品與刊登描述／圖片不相符（例：尺碼／型號錯誤、未揭露的重大瑕疵）。
Dispute Window（爭議窗口）[DEF-102]：在訂單 Complete/Order Received 之前可發起退貨／退款的時間窗（常見為「已送達／領取後 24–48 小時」）。
Complete / Order Received [DEF-103]：買家點選已收貨／訂單完成，或系統逾時自動完成。
In-app / Escrow（應用內／託管）[DEF-104]：於 App 內付款；款項先入託管帳戶，符合條件後才撥付給賣家。
Off-platform（站外）[DEF-105]：App 外交易（自行轉帳、線下面交未留紀錄等），不受保護。
7-ELEVEN COD（台灣） [DEF-106]：超商寄送／取貨付款；參考運費 NT$60／次；款項入託管後再撥付。

2) 角色與責任
Venue [ROL-201]：平台為中介，不保證商品品質／履約結果；站外交易風險自負。
先自洽再升級 [ROL-202]：雙方應先於 App 內協商；各方至少有 24 小時 回覆時限，再考量升級。
保護範圍 [ROL-203]：僅處理 應用內／託管或 7-ELEVEN COD 的爭議；站外交易不在範圍內。
證據導向 [ROL-204]：以刊登描述／圖片、收貨照片／影片、App 內對話紀錄、物流單據等為依據。

3) 程序門檻（Eligibility –「硬條件」）
R1 [ELI-301]：交易屬 受保護通道（應用內／託管、7-ELEVEN COD）。
R2 [ELI-302]：仍在 爭議窗口 內。
R3 [ELI-303]：訂單 尚未 Complete/Order Received。
任一不符 → Out of scope [ELI-304]。Copilot 僅提供證據清單與禮貌協商文案（不給 A/B 方案建議）。

4) 標準流程（時間軸）
0h – 買家提交退貨／退款 [PRC-401]。
+24h – 賣家需回覆：接受／拒絕／提出還價（counter-offer）[PRC-402]。
若賣家 24h 無動作 → 自動升級（Auto-Raise） 至客服 [PRC-403]。
若賣家 還價：買家有 +24h 接受或拒絕 [PRC-404]。
買家 24h 無動作 → 自動升級 [PRC-405]。
升級後：CS 約 24h 內 介入，指引補件並依政策裁示 [PRC-406]。

5) SNAD 判斷（內容對照）
屬 SNAD [SND-501]：未揭露的實質差異（例：嚴重色偏、未說明之故障、尺碼錯、缺配件未述）。
預設建議：Option A – 退貨＋全額退款 [SUG-601]。
不屬 SNAD [SND-502]：已明確揭露之瑕疵（例：已標註細痕、電池 84% 已載明）、或買家改變心意／主觀不喜。
預設建議：Option B – 保留＋部分退款（15–30%，視案情微調）[SUG-602]。
證據不足 [SND-503]：缺少對照照片／開箱影片／聊天證據 → 依證據清單要求補件 [EVD-701]。

6) 最低證據集（Checklist）
原刊登文字＋圖片 [EVD-701]。
收貨照片／影片（清楚、具情境，優先開箱影片）[EVD-702]。
App 內對話紀錄（購前／購後重點承諾）[EVD-703]。
運送單據：7-ELEVEN 小白單／追蹤、實際領取時間 [EVD-704]。

7) 常見處置結果
全額退款＋退貨 [OUT-801]：買家須於 2 天內 選擇退回方式；賣家收回後 才撥付退款。
全額退款（免退貨）或部分退款 [OUT-802]：需雙方同意或 CS 裁示；部分退款需確認最終金額。
不受理 [OUT-803]：超出範圍／逾期／證據不足 → 可能遭駁回。

8) 7-ELEVEN COD（台灣）— 作業備註
運費參考：NT$60／單趟 [TW-901]。
店鋪 保管 7 天；取件需 身分證＋手機末三碼 [TW-902]。
託管流程：門市收款 → 入 託管帳戶 → 依狀態撥付賣家 [TW-903]。
運費發票：7-ELEVEN 確認收款後 7 個工作天 內 Email e-invoice [TW-904]。
24h 通報：買家領取後 24 小時內 發現問題應儘速回報，以便指引 [TW-905]。
退回運費誰承擔？
屬 SNAD → 優先由賣家承擔往返運費（或賣家收回後補貼買家）[FEE-A]。
非 SNAD（改變心意／主觀不喜）→ 買家承擔 [FEE-B]。
可採 部分退款 折衝，降低衝突 [FEE-C]。

9) 不受保護行為
站外交易（私下轉帳、未留 App 記錄之面交）[BAN-1001]。
欺詐／冒用／偽造證據 [BAN-1002]。

10) Copilot（RAG）指引
先檢查 Eligibility（R1/R2/R3） [COP-1101]。
擷取 刊登＋申訴 → 進行 SNAD 對照 [COP-1102]。
產生 A/B 建議，附 錨點引用 與 倒數 24–48h [COP-1103]。
證據不足 → 出 Checklist 要求補件 [COP-1104]。
需升級 → 生成 Case Summary（時間線、Eligibility、證據地圖、已嘗試方案）[COP-1105]。

11) 錨點速查（供 RAG 引用）
[DEF-101..106] | [ROL-201..204] | [ELI-301..304] | [PRC-401..406] | [SND-501..503] | [EVD-701..704] | [OUT-801..803] | [TW-901..905] | [FEE-A..C] | [BAN-1001..1002] | [COP-1101..1105]

12) Case Summary 範本（升級用）
Order ID：____
Eligibility（R1/R2/R3）：____
Listing 重點（狀況／已揭露缺陷／關鍵屬性）：____
Complaint＋Evidence（圖／影／聊天／物流）：____
SNAD 對照：是／否 — 理由：____
已提出建議：A/B＋錨點：____
時間線：開啟爭議、24h 截止、是否已自動升級：____

---

## 🔮 未來規劃

AI 案件摘要自動觸發機制（Auto Summary Trigger）
我們設計了真實平台會使用的自動化摘要邏輯，例如：

單方 24 小時未回覆自動觸發

對話超過 72 小時沒有結果自動觸發

人工升級按鈕立即觸發

目前本專案尚未串接資料庫或即時訊息系統，因此無法真實追蹤對話時間。
不過，我們已在後端架構中預留完整的觸發模組（summary_trigger.py），若未來平台擴充為實際營運模式，只需串接 DB & message events 即可立即啟用自動摘要功能。


---

## License
MIT
