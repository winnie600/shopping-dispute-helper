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
python src\arbitration_pipeline.py --case-id case1 --data-dir .\data\source --out-dir .\data\analysis --model gemma3:1b --verbose
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

* ver2 SNAD Pipeline（最終版）
* Case1/Case2/Case3 均可穩定跑完
* 政策引用完善
* JSON 結構一致
* Neutral 不再誤判 SNAD
* 取消 RAG，prompt 完全可控
* main.py + run_pipeline.py 可直接執行

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

---

## UI設計
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2%202025-12-09%20023157.png)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2%202025-12-09%20023218.png)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2%202025-12-09%20023238.png)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2%202025-12-09%20023300.png)
![image](https://github.com/winnie600/shopping-dispute-helper/blob/main/%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2%202025-12-09%20023317.png)

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



## 🔮 未來規劃


---

## License
MIT
