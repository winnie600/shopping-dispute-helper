# C2C 購物爭議助手 (Shopping dispute helper)

本專案實作一套 **C2C 平台「商品與描述不符（SNAD）」爭議分析流程**，
針對二手交易情境（例如：手機維修未揭露、商品外觀差異、功能不符描述）進行：

* 案件摘要抽取（Stage 1）
* Eligibility（R1/R2/R3）硬條件邏輯判定
* SNAD 判斷（SND-501~504）
* 證據清單（EVD-701~707）
* 客服摘要（CS Summary）

採用 **LLM + 規則式混合架構**，能在本地運行（使用 Ollama + Gemma）。

---

## 📁 專案架構

```
shopping-dispute-helper/
│
├── main.py                 # 主控制流程（Stage1 + Stage2）
├── stage1_extract.py       # Stage1：案件內容抽取（txt > pdf）
├── stage2_snad.py          # Stage2：Eligibility + SNAD + CS Summary
│
├── data/
│   ├── case1/
│   │    ├── case.txt
│   │    ├── product.json
│   │    ├── extracted_case.json
│   │    └── final_output.json
│   │
│   ├── case2/
│   ├── case3/
│   └── ...
│
└── requirements.txt        # 所需套件
```

---

# 🚀 如何執行

## 1. 建立環境

```
python -m venv venv
```

Windows：

```
venv\Scripts\activate
```

macOS / Linux：

```
source venv/bin/activate
```

---

## 2. 安裝依賴

```
pip install -r requirements.txt
```

---

## 3. 啟動 Ollama 並下載模型

你需要先啟動 Ollama：

```
ollama serve
```

再拉取模型：

```
ollama pull gemma3:1b
```

（若你的記憶體允許，也可使用 gemma3:4b或9b。）

---

## 4. 執行完整流程（Stage1 + Stage2）

以 Case1 為例：

```
python main.py --case-folder data/case1
```

---

## 5. 只執行 Stage1（抽取案件摘要）

```
python main.py --only extract --case-folder data/case1
```

輸出：

* extracted_case.json

---

## 6. 只執行 Stage2（SNAD 決策引擎）

```
python main.py --only decide --case-folder data/case1
```

輸出：

* final_output.json

---

# 📄 Input 輸入格式

每個 case 資料夾需包含：

---

## 1. **case.txt**（建議格式）

內容需包含：

* 商品刊登描述
* 聊天紀錄（含交易協商）
* 系統訊息（取件時間、付款時間）
* 買家提出的爭議內容

AI 不需看到任何「AI summary」，所以 case.txt 必須是**原始資料**。

---

## 2. **product.json**（由你撰寫、非 AI 推論）

此檔案提供 Stage2 所需的結構化資訊：

```json
{
  "order": {
    "transaction_type": "7-11_cod",
    "is_platform_protected": true,
    "order_status": "shipped"
  },
  "timestamps": {
    "picked_up_at": "2025-10-05T19:10:00",
    "dispute_opened_at": "2025-10-05T20:30:00"
  },
  "eligibility_flags": {
    "r1_platform_or_7_11_cod": true,
    "r2_within_dispute_window": true,
    "r3_not_completed": true
  }
}
```

---

# 🧠 Output（final_output.json）

由 Stage2 產生，包含：

```json
{
  "eligibility": {...},
  "snad_assessment": {...},
  "evidence_checklist": {...},
  "cs_summary": {...}
}
```

適用於：

* 客服回覆流程
* SNAD 爭議分類
* C2C 案件研究
* 學術/課程作業專案 demo

---

# 🔧 使用技術

* Python 3.10+
* Ollama（本地 LLM 服務）
* Gemma 3 模型（1B / 2B / 4B）
* PyPDF2（如需 PDF 解析）
* JSON-based decision pipeline

---

# 📦 requirements.txt（建議版本）

```
ollama
PyPDF2
```

目前 ver1 並無向量資料庫，因此不需要 sentence-transformers 或 faiss。

---

# 🎯 目前測試版專案亮點

* 結合 **硬條件 Eligibility（R1/R2/R3）** 與 **AI 判讀**
* 明確區分「結構化資訊（product.json）」與「自然語言資料（case.txt）」
* 無需雲端 API，完全能在本地電腦運行
* 具備良好擴充性，可加入：前端 UI（Streamlit / Web）
  
# 未來

* ai引導式問答
* prompt調整(中英文問題、準確度)
* 串接前端
* 非test的chat history
* 程序判斷R1、R2、R3 而非目前在product.json檔案用布林值的範例


  
