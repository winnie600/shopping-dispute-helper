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

# 🔧 **Stage 1 — Extract & Normalize（資料抽取與規範化）**

由 `extractor.py` 完成，負責：

* 解析 listing 資訊
* 解析 buyer complaint
* 整理 chat history（對話時間軸）
* 規範所有 metadata
* 建立結構化 case dict

---

# 🏛 **Stage 2 — Policy-Driven SNAD Decision Engine（政策導向之 SNAD 決策引擎）**

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

LLM 僅能引用 whitelist 內政策。

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

# 🗂 **Stage 3 — Post-Process, Recommendation, Summary**

### 🔹 `postprocess.py`

* 修復 LLM JSON
* 移除模型雜訊字串
* 強行轉成合法 dict

### 🔹 `outcome_ai.py`

依據 label 產生：

* Option A（退貨 + 全額退款）
* Option B（部分退款）
* 或建議補件

### 🔹 `summary.py`

生成完整 Case Summary：

* 核心事件
* 重點對話
* 判定摘要
* 最終建議方案

---

# ⚡ **v3.2 新增功能：AI Summary Trigger（summary_trigger.py）**

平台真實運作下必須具備：

* 雙方 24h 未回覆 → 自動總結
* 對話間隔 > X 時間 → 自動總結
* 升級客服按鈕 → 立即產生 summary

目前版本仍未串資料庫，但後端已預留：

✔ 可監聽訊息事件
✔ 可套用真實 timestamp
✔ 可與客服後台整合

---

# 🌐 前後端串接（v3.1 完成）

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

# 📂 專案結構（v3.2 最新）

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

# ▶️ 使用方式

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
✔ Case1/Case2/Case3 全部能順利跑完
✔ JSON 格式穩定、有 reason
✔ 政策引用機制完整
✔ 前後端 API 串接
✔ AI Summary Trigger（v3.2）

---

# ❗ 已解決問題

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

# 🎨 UI 設計

![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252811370.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252857348.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252869133.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252892722.jpg)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/UI_photo_ver2/messageImage_1765252906611.jpg)

---

# 📜 政策


---

# 🔮 未來規劃

* 串接 DB 完整支援「真實對話時間」
* 整合 AI Summary Trigger 到 UI
* 自動產生平台內客服升級報告

---

# 📄 License

MIT

---


