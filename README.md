# C2C 網購爭議協助幫手（v3.2 最終版）

---

## 📌 更新日誌

**後端：dispute_pipeline_v3.1**
✔ 前後端嵌入功能完成（demo UI 已能顯示 AI analysis）

**後端：dispute_pipeline_v3.2**
✔ 新增「AI 案件摘要觸發機制」自動偵測沉默時間並生成 summary

**前端：c2c-dispute-ui_v2.1**
✔ 修正前端嵌入後產生的排版錯誤
✔ Staff Console 能讀取後端 JSON 並即時展示 AI 分析結果

---

## 📝 專案目標

讓 C2C 電商平台能以更快速、透明且一致的方式處理買賣爭議，降低人工仲裁負擔，並提升整體使用者體驗。

---

## 📝 專案描述

本專案是一個協助處理 C2C 電商交易中 **買家與賣家退貨爭議** 的 AI 仲裁助手。

在二手交易中，買家與賣家可能因：

* 商品狀況描述不清
* 主觀認知差異
* 缺件是否揭露
* 對話中的承諾是否成立
* 時效要件是否符合

…而產生爭議。

本系統整合：

* **規則基礎審核（Eligibility Checks）**
* **政策導向 LLM 判定（Policy-Driven LLM Reasoning）**
* **AI Summary 自動生成* *

能夠協助平台在早期就給出一致、結構清楚、透明的判定，降低人工工作量。

---

## 👥 目標使用者

* **客服人員：** 加速審查、提升一致性
* **買家 / 賣家：** 提供快速且清楚的仲裁依據
* **平台管理者：** 自動化審核、可視化分析資料

---

# 🧠 系統特色（v3.2 架構）

v3.2 能將整個仲裁流程完整模組化，包含：

* 可維護性
* 可測試性
* 案件間的穩定輸出
* 前後端可串接性

---

## 🔧 技術架構（Technical Architecture）

本專案後端主要分成兩條路線：

1. **離線 Pipeline（CLI 執行）**：從 `data/source` 讀取單一 case，跑完整 Stage1～Stage3，輸出到 `data/analysis`。  
2. **線上 API（前後端嵌入）**：透過 `app/main.py` 提供 `/api/analysis/{case_id}` 給前端呼叫，同樣走內部 pipeline，只是改成即時回傳 JSON。

---

### 1️⃣ 後端 Pipeline 資料流（CLI / API 共用）

```text
data/source/caseX_raw.json
           │
           ▼
     extractor.py
  （Stage 1：資料抽取與整理）
           │
           ▼
       rflags.py
（計算 Eligibility：R1/R2/R3 ）
           │
           ▼
     llm_stage2.py
（Stage 2：LLM 依政策判定 SNAD / Neutral / IE）
           │
           ▼
    postprocess.py
（清理 LLM 輸出、保證為合法 JSON）
           │
           ▼
     outcome_ai.py
（產生最後買家與賣家的討論結果）
           │
           ▼
       summary.py
（組合 Case Summary 文字敘述與前面的摘要 如option和判定結果）
           │
           ▼
data/analysis/caseX_analysis.json
（最終輸出：eligibility + snadResult + recommendation + summary）
````

上述流程會被：

* `arbitration_pipeline.py` 在 CLI 模式下直接呼叫
* `build.py` 封裝成一個可供 API 使用的 pipeline 函式

---

### 2️⃣ API & 前端嵌入架構（v3.1+）

```text
Frontend (c2c-dispute-ui_v2.1)
      │
      │  GET /api/analysis/{case_id}
      ▼
Backend FastAPI (app/main.py)
      │
      ▼
   build.py
（內部呼叫 Stage1/2/3 模組）
      │
      ▼
 全部結果組成 JSON 回傳
      │
      ▼
Frontend Staff Console 顯示：
- Listing / Chat
- Eligibility (R1/R2/R3)
- SNAD / Neutral / IE
- Policy Anchors
- Option A / B 建議
- Final Case Summary
```

前端只需要關心一個 API：

```http
GET /api/analysis/{case_id}
```

就能取得包含 eligibility、snadResult、recommendation、summary 的整包分析結果。

---

### 3️⃣ AI Summary Trigger 架構（v3.2 新增）

```text
Chat Log / Message Events
        │
        ▼
summary_trigger.py
（偵測沉默間隔 / 對話結束時機）
        │
        ├─ 若達到觸發條件：
        │       ▼
        │   呼叫 summary.py / LLM
        │   生成 AI 案件摘要（summary block）
        │
        └─ 若未達條件：
                ▼
           不動作（等待更多訊息）
```

目前專案尚未串接真實資料庫與即時訊息系統，因此：

* `summary_trigger.py` 以模擬/假資料為主
* 架構上已預留：未來只要接上 DB 與訊息事件（例如：訊息時間戳、客服升級按鈕），即可讓 AI Summary 在實務環境中自動運作。


```
```

##🔧 **Stage 1 — Extract & Normalize（資料抽取與規範化）**

由 `extractor.py` 完成，負責：

* 解析 listing 資訊
* 解析 buyer complaint
* 整理 chat history（對話時間軸）
* 規範所有 metadata
* 建立結構化 case dict

---

## 🏛 **Stage 2 — Policy-Driven SNAD Decision Engine（政策導向之 SNAD 決策引擎）**

Stage 2 是 v3 的核心，由多支模組一起完成：

---

### 🔹 `rflags.py` — Red Flags 偵測

讀取案件中的：

* 交易方式
* 領貨後經過多久開啟爭議
* 是否已按下完成訂單

---

### 🔹 `policy.py` — 政策 Anchor 載入

將 虛構NextBuy的二手交易平台 政策以代碼表示：

* SND-501 / 502 / 503
* ELI-301 / 302 / 303
* OUT-801 / 802 / 803
* FEE-A / B / C
* EVD-701…等

根據LLM產生的對應結果，引用平台政策。

---

### 🔹 `llm_stage2.py` — SNAD / Neutral / IE 判定

使用 ver3 強化 Prompt：

* SNAD 必須指出客觀 mismatch
* 主觀感受一律 Neutral（若尺寸標籤無誤）
* Neutral / 證據不足 都仍需 REASON
* 嚴格限制 JSON 格式

輸出格式：

```json
{
  "snadResult": {
    "label": "SNAD | Neutral | Insufficient Evidence",
    "reason": "English reason explaining the judgment."
  }
}
```

---

## 🗂 **Stage 3 — Post-Process, Recommendation, Summary**

### 🔹 `postprocess.py`

* 修復 LLM JSON
* 移除模型雜訊字串
* 強行轉成合法 dict

### 🔹 `outcome_ai.py`

* 最終討論結果

### 🔹 `summary.py`

生成完整 Case Summary：

* 商品代碼
* 判定結果
* 判定原因
* 最終討論結果

---

## ⚡ **v3.2 新增功能：AI Summary Trigger（summary_trigger.py）**

平台真實運作下必須具備：

* 雙方 24h 未回覆 → 自動總結
* 對話間隔 > X 時間 → 自動總結
* 升級客服按鈕 → 立即產生總結

目前版本仍未串資料庫，但後端已預留：

✔ 可監聽訊息事件
✔ 可套用真實 timestamp
✔ 可與客服後台整合

---

## 🌐 前後端串接（v3.1 完成）

後端提供 API：

```
GET /api/analysis/{case_id}
```

UI (c2c-dispute-ui_v2.1) 可顯示：

* Listing
* Chat log
* Eligibility
* SNAD 判定
* Policy anchors
* Options A/B
* AI Final Summary

---

## 📂 專案結構（v3.2 最新）

```
dispute_pipeline_v3/
│
├── README.md
├── requirements.txt
│
├── src/
│   ├── __init__.py
│   ├── app/
│   │     └── main.py                 ← 前後端 API（v3.1）
│   │
│   ├── summary_trigger.py            ← AI 案件摘要觸發器（v3.2）
│   │
│   ├── pipeline/
│   │     ├── extractor.py
│   │     ├── rflags.py
│   │     ├── llm_stage2.py
│   │     ├── postprocess.py
│   │     ├── policy.py
│   │     ├── outcome_ai.py
│   │     ├── summary.py
│   │     └── build.py
│   │
│   ├── arbitration_pipeline.py       ← CLI 主入口
│   └── initial_judgement_chatbot.py  ← 初判對話機器人
│
└── data/
    ├── source/     ← case raw data
    └── analysis/   ← pipeline output
```

---

## ▶️ 使用方式

### **執行完整 pipeline：**

```bash
python src/arbitration_pipeline.py --case-id case1 --data-dir ./data/source --out-dir ./data/analysis --model openai:gpt-4o-mini
```

---

### **執行初判聊天機器人：**

```bash
python src/initial_judgement_chatbot.py --file ./data/source/case2_raw_raw.json --model openai:gpt-4o-mini
```

---

### **啟動後端 API（目前 demo 用）：**

```bash
uvicorn app.main:app --reload
```

---

# 🧪 已完成進度（期末版）

✔ ver3 模組化 Pipeline  
✔ Case1~Case7 全部能順利跑完  
✔ JSON 格式穩定、有 reason  
✔ 政策引用機制完整  
✔ 前後端 API 串接  
✔ AI Summary 觸發判定

---

## ❗ 已解決問題

### 1. JSON reason 消失

→ 修改 prompt：所有 label 都須產生 reason。

### 2. 模型誤判 Case2（fit 問題）

→ 新增 Fit Rule：主觀的合不合身，不得判 SNAD
→ 但小模型仍偶爾誤判 SNAD...
→ 在主判定SNAD與生成REASON的部分，改用雲端模型openai:gpt-4o-mini

### 3. Neutral 的 reason 偶爾仍會缺漏
→ 先使用預設 fallback reason 解決。
→ 在主判定SNAD與生成REASON的部分，改用雲端模型openai:gpt-4o-mini

---

## 🎨 UI 設計

![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252811370.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252857348.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252869133.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252892722.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252906611.jpg)

---

# 📜 部分政策範例
以下為虛構 NextBuy C2C 平台的政策摘要，用於 LLM 判定 SNAD / Neutral / IE。

## **1. SNAD（與描述不符）判定標準 — SND 系列**

### 📌 **SND-501 — 屬於 SNAD 的情況**

若商品存在以下情況之一，視為 SNAD：

* 與 listing 標示的 **尺寸、型號、版本**不符
* 與 listing 所述 **功能、狀況**不同
* **未揭露之重大瑕疵**（刮傷、裂痕、破損）
* **缺少 listing 中承諾的配件**
* **顏色差異明顯（非光線問題）**

> 裁定：賣家負責 → 退貨＋全額退款
> 運費由賣家承擔（FEE-A）


### 📌 **SND-502 — 不屬於 SNAD**

以下情況視為 **非 SNAD（Neutral）**：

* 買家主觀感受：

  * 「穿起來偏小 / 偏大」
  * 「跟我想像的不一樣」
  * 「質感不好」
* listing 已明確揭露的瑕疵
* 光線造成的輕微色差
* 使用痕跡屬合理範圍

> 裁定：雙方皆無過錯 → 可採部分退款（Option B）

### 📌 **SND-503 — 證據不足**

以下情況屬 **Insufficient Evidence**：

* 無開箱影片
* 無商品照片佐證
* 聊天紀錄不足以證明 mismatch
* 缺乏 listing / 實物對照資訊

> 裁定：需補件（EVD-701 ~ 704）

---

## **2. Eligibility（程序門檻）— ELI 系列**

### 📌 **ELI-301 — 受保護通道**

符合以下交易方式才可受理：

* App 內付款（escrow 託管）
* 超商 7-ELEVEN COD

不符合 → Out of Scope。


### 📌 **ELI-302 — 爭議時效內**

買家須在「領件後 X 小時內」提交爭議：

* 超過 72 小時 → 不受理（逾期）


### 📌 **ELI-303 — 訂單未完成**

買家若已按下「完成訂單」，則：

* 交易視為結束
* 不再受理 SNAD 退貨

---


## **3. 解決方案（Outcome）— OUT 系列**

### 📌 **OUT-801 — Option A：退貨＋全額退款**

適用於：

* SNAD（賣家責任）

賣家承擔運費（FEE-A）。

### 📌 **OUT-802 — Option B：保留＋部分退款**

適用於：

* 非 SNAD（Neutral）
* 避免進一步爭議

退款通常為 **15–30%**。

---

# 🔮 未來規劃

* 串接 DB 完整支援「真實對話時間」
* 整合 AI Summary Trigger 到 UI
* 自動產生平台內客服升級報告
* 能夠引導式對話的聊天室機器人

---

# 📄 License

MIT

---


