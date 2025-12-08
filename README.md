# C2C網購爭議協助幫手

## Description
這是一個能幫助解決C2C電商購物買家與賣家的退貨爭議問題的ai助手，尤其在C2C交易中往往退貨仰賴雙方的溝通，容易引發糾紛。這個AI助手能夠判別商品與描述不符的退貨分類,並判定買賣家責任,給出解決方法，實現AI智能判斷輔助和流程自動化。

## Target user
客服人員: 節省審查時間,提升準確度。  
買家 / 賣家:更快速且明確的回覆,降低爭議摩擦。  
平台管理者: 取得自動化報告。

## Requirement
前端:  
後端: langchain-ollama typing-extensions>=4.6


## System architecture

## Build Setup (Local)

好的！以下是 **完全依照你現在的專案（後端 Only、ver2 Pipeline、無前端整合、無 RAG、FastAPI + Ollama）** 所量身打造的 **README.md**。

你可以直接複製貼到 GitHub 使用。

---

## 🔍 專案簡介

本專案是一個 **以 LLM 為核心的自動化 C2C 買賣爭議判定系統**，主要處理：

* **SNAD（Significantly Not As Described）商品與描述不符**
* **Neutral（買家主觀感受 / 無法證明 mismatch）**
* **Insufficient Evidence（證據不足）**

本系統使用 **Gemma 3 (1B)** 作為模型，並透過 **精心設計的 ver2 Prompt** 完成判斷。
不採用 RAG，因為案件文本量小，直接置入 prompt 最穩定且可控。

---

## 🧠 系統特色

### ✔ **一套明確的三階段 Pipeline**

1. **Stage 1 — Extractor**
   解析並整理 listing、chat history、metadata。

2. **Stage 2 — SNAD Decision Engine（ver2 最終採用）**
   使用嚴格政策導向 prompt，產生：

   * SNAD / Neutral / Insufficient Evidence
   * reason（SNAD only）
   * policy anchors

3. **Stage 3 — Formatter**
   僅格式化，不修改 LLM 的判定。

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
Case JSON
   │
   ▼
Stage 1 Extractor
   │
   ▼
Stage 2 SNAD Decision (LLM, ver2 prompt)
   │
   ▼
Stage 3 Formatter
   │
   ▼
Final JSON
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

### 4️⃣ 啟動後端

```bash
uvicorn app.main:app --reload
```

---

## 📂 專案結構

```

```

---

## 🧪 使用方式

執行：

```bash
python run_pipeline.py case2
```

將輸出：

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

* ver2 SNAD Pipeline（最終版）
* Case1/Case2/Case3 均可穩定跑完
* 政策引用完善
* JSON 結構一致
* Neutral 不再誤判 SNAD
* 取消 RAG，prompt 完全可控
* main.py + run_pipeline.py 可直接執行

---

## ❗ 遇到的問題（已解決）

### 1. ver3 模組化版本推理不穩

→ 回到 ver2，一次 prompt 產生所有內容。

### 2. Case2 被判成 SNAD

→ fit/snugness 一律視為主觀 → Neutral。

### 3. JSON reason 欄位空白

→ Neutral 不需 reason → 由 prompt 修正。

### 4. RAG chunk 錯誤

→ 文本量太小，不適合 RAG → 改 direct prompt。

---

## 🔮 未來規劃


---

## License
MIT
