// src/pages/StaffDashboard.tsx
import { useState, useEffect } from 'react';
import { CASES } from '../data/cases';
import { 
  Server, Database, Brain, Terminal, 
  CheckCircle, Search, 
  ArrowRight, Cpu, Code
} from 'lucide-react';

// --- MOCK BACKEND DATA (AI Logic Simulation - FULL 8 CASES) ---
const BACKEND_LOGS: Record<number, any> = {
  // CASE 1: iPhone 12 (Che giấu sửa chữa)
  1: {
    step1_input: {
      user_intent: "dispute_request",
      listing_features: { title: "iPhone 12", condition: "Like New", claim: "無重大維修" },
      evidence_features: { ocr_text: "Genuine Apple Part - Display Replaced", image_class: "screen_screenshot" }
    },
    step2_rag: {
      query_vector: [0.12, 0.88, 0.04, "undisclosed_repair"],
      retrieved_chunks: [
        { id: "SND-A2", score: 0.98, content: "未揭露之重大維修：商品經過維修或更換零件（如螢幕），若未事先告知即屬違規。" },
        { id: "DEF-101", score: 0.85, content: "SNAD 定義：實收商品與刊登描述不符。" }
      ]
    },
    step3_reasoning: [
      "Check 1: Listing claims 'No major repairs'.",
      "Check 2: Evidence shows 'Display Replaced'.",
      "Logic: Replacement (Even Genuine) != Original Factory Condition.",
      "Violation: Matches Policy [SND-A2].",
      "Conclusion: Seller Fault."
    ],
    step4_output: { verdict: "SNAD", sub_type: "undisclosed_repair", confidence: 0.985, action: "force_refund_option_a" }
  },

  // CASE 2: Jordan 1 (Size giày - Trung lập)
  2: {
    step1_input: {
      user_intent: "dispute_request",
      listing_features: { title: "Jordan 1 University Blue", size: "US9" },
      evidence_features: { image_class: "shoe_tag", ocr_text: "US 9 / 27cm" }
    },
    step2_rag: {
      query_vector: [0.45, 0.33, 0.91, "size_mismatch"],
      retrieved_chunks: [
        { id: "SND-B1", score: 0.95, content: "尺寸/版型問題：商品標示尺寸正確，但買家穿著不合身，屬於中立爭議。" },
        { id: "KB-NIKE-01", score: 0.92, content: "External Knowledge: AJ1 University Blue fits 0.5 size small." }
      ]
    },
    step3_reasoning: [
      "Check 1: Seller sent US9. Buyer received US9.",
      "Check 2: No shipping error detected.",
      "Check 3: Knowledge Base indicates known fit issue for this model.",
      "Conclusion: Neutral Dispute (Fit Issue)."
    ],
    step4_output: { verdict: "NEUTRAL", sub_type: "fit_issue", confidence: 0.95, action: "negotiation_option_b" }
  },

  // CASE 3: Sony XM4 (Thiếu phụ kiện - Mơ hồ)
  3: {
    step1_input: {
      user_intent: "missing_item_report",
      listing_features: { title: "Sony WH-1000XM4", desc: "配件如圖", photos_contain_cable: false },
      evidence_features: { image_analysis: "headphones_only", missing_objects: ["cable_usb_c", "cable_3.5mm"] }
    },
    step2_rag: {
      query_vector: [0.22, 0.76, 0.11, "missing_accessories"],
      retrieved_chunks: [
        { id: "SND-B2", score: 0.94, content: "配件認知落差：若賣家未明確承諾全配，且照片中無配件，屬中立爭議。" },
        { id: "KB-SONY-XM4", score: 0.90, content: "Official Box Content: Headphone, Case, USB-C Cable, Audio Cable." }
      ]
    },
    step3_reasoning: [
      "Check 1: Official spec includes cables.",
      "Check 2: Seller listing said 'Accessory as shown' (Ambiguous).",
      "Check 3: Listing photos did NOT show cables.",
      "Conclusion: Information Asymmetry (Neutral)."
    ],
    step4_output: { verdict: "NEUTRAL", sub_type: "ambiguous_missing_parts", confidence: 0.91, action: "partial_refund_option_b" }
  },

  // CASE 4: Philips Blender (Vỡ do vận chuyển)
  4: {
    step1_input: {
      user_intent: "damaged_item_report",
      listing_features: { title: "Philips HR2221", packaging_promise: "Bubble wrap 3 layers" },
      evidence_features: { 
        buyer_img: "cracked_glass_jar", 
        seller_img: "bubble_wrapped_securely",
        box_condition: "intact"
      }
    },
    step2_rag: {
      query_vector: [0.88, 0.12, 0.05, "shipping_damage"],
      retrieved_chunks: [
        { id: "SND-B3", score: 0.97, content: "物流運送損壞：賣家已盡包裝責任，但商品仍受損。需申請保險理賠。" },
        { id: "PKG-STD-01", score: 0.89, content: "Fragile items must be wrapped in bubble wrap." }
      ]
    },
    step3_reasoning: [
      "Check 1: Item damaged upon arrival (Crack detected).",
      "Check 2: Seller proof shows proper packaging (Bubble wrap detected).",
      "Check 3: Outer box intact -> Internal Shock Damage.",
      "Conclusion: Logistics Fault."
    ],
    step4_output: { verdict: "NEUTRAL / LOGISTICS", sub_type: "shipping_damage", confidence: 0.96, action: "escalate_to_cs_insurance" }
  },

  // CASE 5: Switch (Đổi ý - Từ chối)
  5: {
    step1_input: {
      user_intent: "return_request",
      reason_text: "用不習慣 (Not used to it)",
      item_status: "functional"
    },
    step2_rag: {
      query_vector: [0.05, 0.02, 0.98, "change_of_mind"],
      retrieved_chunks: [
        { id: "REJ-01", score: 0.99, content: "改變心意：二手交易不適用鑑賞期。若商品無故障，不支持因不喜歡而退貨。" }
      ]
    },
    step3_reasoning: [
      "Check 1: User admitted item is functional.",
      "Check 2: Reason is subjective ('Not used to it').",
      "Policy Check: Matches REJ-01 (Change of Mind).",
      "Conclusion: Request Rejected."
    ],
    step4_output: { verdict: "REJECTED", sub_type: "change_of_mind", confidence: 0.99, action: "auto_close_case" }
  },

  // CASE 6: Hoodie (Sai màu nghiêm trọng)
  6: {
    step1_input: {
      user_intent: "wrong_color_report",
      listing_image: { color_space: "High_Exposure_Beige" },
      evidence_image: { color_space: "Dark_Brown_Muddy" }
    },
    step2_rag: {
      query_vector: [0.75, 0.20, 0.05, "color_mismatch"],
      retrieved_chunks: [
        { id: "SND-A3", score: 0.96, content: "誤導性圖片：照片與實物色差過大（Delta-E > 20），造成誤導。" }
      ]
    },
    step3_reasoning: [
      "Check 1: Analyzed histograms of both images.",
      "Check 2: Calculated Delta-E color difference > 20.",
      "Check 3: Seller photo is overexposed (Lighting issue).",
      "Conclusion: Significant Misrepresentation."
    ],
    step4_output: { verdict: "SNAD", sub_type: "misleading_imagery", confidence: 0.94, action: "force_refund_option_a" }
  },

  // CASE 7: Dyson V8 (Pin chai - Kỳ vọng đồ cũ)
  7: {
    step1_input: {
      user_intent: "battery_issue_report",
      text_analysis: { claimed: "20 mins", actual: "12 mins" },
      item_age: "2 years"
    },
    step2_rag: {
      query_vector: [0.30, 0.60, 0.10, "used_item_condition"],
      retrieved_chunks: [
        { id: "SND-B4", score: 0.92, content: "二手商品預期落差：消耗品（如電池）之自然衰退屬正常範圍，非賣家詐欺。" }
      ]
    },
    step3_reasoning: [
      "Check 1: Battery is a consumable part.",
      "Check 2: 12 mins is ~60% of original capacity (Reasonable for 2yo item).",
      "Check 3: Testing conditions vary (Max vs Normal mode).",
      "Conclusion: Expectation Mismatch (Neutral)."
    ],
    step4_output: { verdict: "NEUTRAL", sub_type: "used_expectation", confidence: 0.88, action: "partial_refund_option_b" }
  },

  // CASE 8: AirPods Pro (Hàng giả - Lừa đảo)
  8: {
    step1_input: {
      user_intent: "counterfeit_report",
      listing_features: { title: "AirPods Pro 2", price: 3450, claim: "StudioA Invoice" },
      evidence_features: { serial_check: "mismatch", invoice_analysis: "forged_pixels_detected" }
    },
    step2_rag: {
      query_vector: [0.99, 0.01, 0.05, "counterfeit_risk"],
      retrieved_chunks: [
        { id: "SND-A4", score: 0.99, content: "仿冒品/假貨：賣方聲稱為正品但經判定為仿冒品。屬嚴重違規。" },
        { id: "BAN-1002", score: 0.97, content: "欺詐/偽造證據：立即停權並凍結款項。" }
      ]
    },
    step3_reasoning: [
      "Check 1: Serial Number on box does not match internal chip.",
      "Check 2: Invoice image shows artifacts consistent with Photoshop editing.",
      "Risk Assessment: CRITICAL.",
      "Conclusion: Fraud."
    ],
    step4_output: { verdict: "FRAUD", sub_type: "counterfeit", confidence: 0.999, action: "freeze_account_escalate_cs" }
  }
};

const DEFAULT_LOG = {
  step1_input: { status: "waiting_for_data" },
  step2_rag: { status: "idle" },
  step3_reasoning: ["Waiting for trigger..."],
  step4_output: { status: "pending" }
};

export default function StaffDashboard() {
  const [selectedCase, setSelectedCase] = useState<number>(CASES[0].id);
  const [loadingStep, setLoadingStep] = useState(0); // 0: Idle, 1: Input, 2: RAG, 3: Reasoning, 4: Done
  
  // Simulation Effect
  useEffect(() => {
    setLoadingStep(0);
    const t1 = setTimeout(() => setLoadingStep(1), 300);
    const t2 = setTimeout(() => setLoadingStep(2), 1200);
    const t3 = setTimeout(() => setLoadingStep(3), 2200);
    const t4 = setTimeout(() => setLoadingStep(4), 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [selectedCase]);

  const activeLog = BACKEND_LOGS[selectedCase] || DEFAULT_LOG;

  return (
    <div className="max-w-[1600px] mx-auto p-6 min-h-screen bg-[#f8f9fa] font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Cpu className="text-purple-600" size={32} />
            AI 模型監控後台 (Model Backend Monitor)
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-11">
            Real-time visualization of LLM inference, RAG retrieval, and decision logic.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-gray-900 text-green-400 px-4 py-2 rounded-lg shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          SYSTEM STATUS: ONLINE
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        
        {/* Left Sidebar: Ticket Stream */}
        <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Server size={16} /> 進件流 (Incoming Tickets)
            </h3>
            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium">Live</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
            {CASES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCase(c.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedCase === c.id 
                    ? 'bg-purple-50 border-purple-300 shadow-sm ring-1 ring-purple-200' 
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-mono text-gray-500">#{String(c.id).padStart(4, '0')}</span>
                  <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-600">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-800 truncate mb-1">{c.title}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${selectedCase === c.id ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'}`}></span>
                  {selectedCase === c.id ? 'Analyzing...' : 'Queued'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Logic Visualization (Visual Flow) */}
        <div className="col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Step 1: Input Analysis */}
          <div className={`transition-all duration-500 transform ${loadingStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-4'}`}>
            <div className="bg-white p-4 rounded-xl border-l-4 border-blue-500 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-sm uppercase tracking-wide">
                <Search size={16} /> STEP 1: Feature Extraction
              </div>
              <div className="text-xs text-gray-600 space-y-2 bg-blue-50/30 p-2 rounded">
                <div className="flex justify-between border-b border-blue-100 pb-1">
                  <span className="font-medium">User Intent:</span> 
                  <span className="font-mono bg-white px-1 border rounded text-blue-600">
                    {activeLog.step1_input?.user_intent || "unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Feature Analysis:</span> 
                  <span className="font-mono bg-white px-1 border rounded text-green-600">Completed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center text-gray-300"><ArrowRight className="rotate-90" size={20} /></div>

          {/* Step 2: RAG */}
          <div className={`transition-all duration-500 transform ${loadingStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-4'}`}>
            <div className="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-orange-700 font-bold text-sm uppercase tracking-wide">
                <Database size={16} /> STEP 2: RAG Retrieval
              </div>
              <div className="text-xs text-gray-600 bg-orange-50/30 p-2 rounded">
                <div className="mb-2 font-mono text-[10px] text-gray-400 break-all">
                  Query Vector: {JSON.stringify(activeLog.step2_rag?.query_vector?.slice(0, 3) || [])}...
                </div>
                <div className="bg-orange-50 p-2 rounded text-orange-800 border border-orange-100 italic">
                  <span className="font-bold">Match Found:</span> "{activeLog.step2_rag?.retrieved_chunks?.[0]?.id || 'Searching...'}"
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center text-gray-300"><ArrowRight className="rotate-90" size={20} /></div>

          {/* Step 3: Reasoning */}
          <div className={`transition-all duration-500 transform ${loadingStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-4'}`}>
            <div className="bg-white p-4 rounded-xl border-l-4 border-purple-500 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold text-sm uppercase tracking-wide">
                <Brain size={16} /> STEP 3: CoT Reasoning
              </div>
              <div className="space-y-1.5 bg-purple-50/30 p-2 rounded">
                {(activeLog.step3_reasoning || []).map((step: string, i: number) => (
                  <div key={i} className="text-xs flex items-start gap-2 text-gray-700">
                    <span className="text-purple-500 font-bold mt-0.5">•</span> 
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center text-gray-300"><ArrowRight className="rotate-90" size={20} /></div>

          {/* Step 4: Output */}
          <div className={`transition-all duration-500 transform ${loadingStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-4'}`}>
            <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm text-center">
              <div className="flex items-center justify-center gap-2 mb-2 text-green-800 font-bold text-sm uppercase tracking-wide">
                <CheckCircle size={16} /> STEP 4: Final Verdict
              </div>
              <div className="font-bold text-xl text-green-700 mb-1">
                {activeLog.step4_output?.verdict || 'PROCESSING...'}
              </div>
              <div className="text-xs text-green-600 bg-white inline-block px-2 py-1 rounded border border-green-200">
                Confidence: {activeLog.step4_output?.confidence ? (activeLog.step4_output.confidence * 100).toFixed(1) + '%' : '-'}
              </div>
            </div>
          </div>

        </div>

        {/* Right: Terminal / JSON View (Placeholder for Real Model Embedding) */}
        <div className="col-span-5 bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-700 flex flex-col overflow-hidden text-gray-300 font-mono text-xs">
          
          {/* Terminal Header */}
          <div className="bg-[#2d2d2d] px-4 py-2 border-b border-black flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-gray-400" />
              <span className="font-bold text-gray-200">backend_logs.json</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-600">
            
            {/* Input Log */}
            {loadingStep >= 1 && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="text-blue-400 mb-1 flex items-center gap-2">
                  <ArrowRight size={10} /> // Incoming Payload
                </div>
                <pre className="text-green-300 bg-black/30 p-2 rounded border-l-2 border-blue-500 whitespace-pre-wrap">
                  {JSON.stringify(activeLog.step1_input, null, 2)}
                </pre>
              </div>
            )}

            {/* RAG Log */}
            {loadingStep >= 2 && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300 delay-75">
                <div className="text-orange-400 mb-1 flex items-center gap-2">
                  <ArrowRight size={10} /> // RAG Retrieval (Vector DB Search)
                </div>
                <pre className="text-yellow-100 bg-black/30 p-2 rounded border-l-2 border-orange-500 whitespace-pre-wrap">
                  {JSON.stringify(activeLog.step2_rag, null, 2)}
                </pre>
              </div>
            )}

            {/* Final Output Log */}
            {loadingStep >= 4 && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300 delay-150">
                <div className="text-purple-400 mb-1 flex items-center gap-2">
                  <ArrowRight size={10} /> // Generated Response
                </div>
                <pre className="text-white font-bold bg-white/10 p-2 rounded border-l-2 border-purple-500 whitespace-pre-wrap">
                  {JSON.stringify(activeLog.step4_output, null, 2)}
                </pre>
                <div className="mt-4 text-gray-500 border-t border-gray-700 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Code size={12} /> // Real-time Model Integration Area
                  </div>
                  <div className="text-xs text-gray-600 italic">
                    &gt; Embedding model code here...
                    <br/>
                    &gt; Process finished with exit code 0
                    <span className="animate-pulse ml-1">_</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}