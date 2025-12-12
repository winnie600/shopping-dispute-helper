// src/pages/ChatInbox.tsx
import { useMemo, useState, useEffect, useRef } from 'react';
import { CASES } from '../data/cases';
import type { ListingCase } from '../data/cases';
import { CHAT_LOGS } from '../data/chatLogs';
import type { CaseId, ChatEntry } from '../types';
import ChatList from '../components/Chat';
import ChatComposer from '../components/ChatComposer';
import { logActivity } from '../utils/eventBus';

/**
 * Lightweight local SVG icon components to avoid depending on 'lucide-react'
 * Each accepts a size and className similar to the original icons.
 */
type IconProps = { size?: number; className?: string };

const Search = ({ size = 16, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="11" cy="11" r="7"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const MoreVertical = ({ size = 16, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="12" cy="5" r="2"></circle>
    <circle cx="12" cy="12" r="2"></circle>
    <circle cx="12" cy="19" r="2"></circle>
  </svg>
);

const ShieldCheck = ({ size = 16, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 2l7 3v5c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V5l7-3z"></path>
    <path d="M9 12l2 2 4-4"></path>
  </svg>
);

const Truck = ({ size = 16, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="1.5"></circle>
    <circle cx="18.5" cy="18.5" r="1.5"></circle>
  </svg>
);

// ChevronLeft removed because it was unused.

/** ------------ helpers: CaseId <-> number mapping ------------ */
const NUM_TO_CASEID: Record<number, CaseId> = {
  1: 'case1', 2: 'case2', 3: 'case3', 4: 'case4',
  5: 'case5', 6: 'case6', 7: 'case7', 8: 'case8',
};
const CASEID_TO_NUM: Record<CaseId, number> = {
  case1: 1, case2: 2, case3: 3, case4: 4,
  case5: 5, case6: 6, case7: 7, case8: 8,
};

type Thread = {
  id: CaseId;
  title: string;
  price: string;
  lastMsg: string;
  lastTime: string; // Thêm thời gian tin nhắn cuối
  unread: number;
  avatar: string; // Thêm avatar người bán (giả lập)
  isOnline?: boolean;
};

function nowTs() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Hàm giả lập thời gian hiển thị (vd: 10:30, Yesterday)
function formatTimeDisplay(ts: string) {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    : `${date.getMonth() + 1}/${date.getDate()}`;
}

/** Build thread list */
function buildThreads(): Thread[] {
  return CASES.map((c) => {
    const id = NUM_TO_CASEID[c.id];
    const log = CHAT_LOGS[CASEID_TO_NUM[id]] ?? [];
    const last = log[log.length - 1];
    
    // Giả lập avatar dựa trên ID (để demo)
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.id}`; 

    return {
      id,
      title: c.title,
      price: c.price,
      lastMsg: last ? (last.text.length > 30 ? last.text.substring(0, 30) + '...' : last.text) : 'Start chatting...',
      lastTime: last ? formatTimeDisplay(last.timestamp) : '',
      unread: log.filter(m => m.sender !== 'Buyer').length > 0 ? 1 : 0, // Logic chưa đọc (giả định)
      avatar,
      isOnline: Math.random() > 0.5, // Giả lập trạng thái online
    };
  });
}

/** Sidebar thông tin listing (Design cải tiến) */
function ListingSidebar({ item }: { item: ListingCase }) {
  const cover = item.photoLinks?.[0]?.url;
  
  return (
    <aside className="hidden xl:flex flex-col w-[320px] shrink-0 border-l bg-white h-full overflow-y-auto">
      {/* Listing Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-800">Listing Details</h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Product Card */}
        <div className="group cursor-pointer">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            {cover ? (
              <img
                src={cover}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image'; }}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
              {item.conditionTag}
            </div>
          </div>
          
          <div className="mt-3 space-y-1">
            <div className="text-lg font-bold text-gray-900">{item.price}</div>
            <div className="text-sm text-gray-700 line-clamp-2 leading-snug font-medium">{item.title}</div>
          </div>
        </div>

        {/* Protection Badge */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
            <ShieldCheck size={18} />
            <span>NexBy Protection</span>
          </div>
          <p className="text-xs text-blue-600/80 leading-relaxed">
            Payment is held until you confirm the item is as described. 
            <span className="block mt-1 font-medium">• 7-Eleven COD Protected</span>
            <span className="block font-medium">• 24h Dispute Window</span>
          </p>
        </div>

        {/* Delivery Info */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery Method</h4>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Truck size={20} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">7-Eleven Pickup</div>
              <div className="text-xs text-gray-500">~ NT$60 • 2-3 Days</div>
            </div>
          </div>
        </div>

        {/* Seller Info (Giả lập) */}
        <div className="space-y-3 pt-4 border-t">
           <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Seller Information</h4>
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}`} alt="Seller" />
             </div>
             <div>
               <div className="text-sm font-medium text-gray-900">Seller_{item.id}</div>
               <div className="text-xs text-gray-500">Last active: 5m ago</div>
             </div>
           </div>
        </div>
      </div>
    </aside>
  );
}

export default function ChatInbox() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<CaseId | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  /** Seed logs */
  const [logs, setLogs] = useState<Record<CaseId, ChatEntry[]>>(() => {
    const obj = {} as Record<CaseId, ChatEntry[]>;
    Object.entries(CHAT_LOGS).forEach(([k, entries]) => {
      const num = Number(k);
      const caseId = NUM_TO_CASEID[num];
      if (caseId) obj[caseId] = [...entries];
    });
    return obj;
  });

  // Init threads & select first one
  useEffect(() => {
    const t = buildThreads();
    setThreads(t);
    if (t.length > 0 && !activeId) setActiveId(t[0].id);
  }, []);

  // Update threads khi logs thay đổi (để cập nhật lastMsg)
  useEffect(() => {
    setThreads(prev => prev.map(t => {
      const log = logs[t.id] ?? [];
      const last = log[log.length - 1];
      return {
        ...t,
        lastMsg: last ? (last.text.length > 30 ? last.text.substring(0, 30) + '...' : last.text) : '',
        lastTime: last ? formatTimeDisplay(last.timestamp) : t.lastTime
      };
    }));
  }, [logs]);

  /** Active listing */
  const activeCase: ListingCase | undefined = useMemo(() => {
    if (!activeId) return undefined;
    const num = CASEID_TO_NUM[activeId];
    return CASES.find((c) => c.id === num);
  }, [activeId]);

  const activeLog = activeId ? logs[activeId] ?? [] : [];

  /** Scroll to bottom khi chat mới */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeLog, activeId]);

  function push(e: ChatEntry) {
    if (!activeId) return;
    setLogs((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), e] }));
  }

  /* --- Actions --- */
  function onReturnRefund() {
    if (!activeId) return;
    const ts = nowTs();
    // Buyer request
    const reqMsg: ChatEntry = {
      timestamp: ts,
      sender: 'Buyer',
      text: '我要申請退貨退款。\n原因：商品與描述不符 / 未揭露瑕疵。',
      highlight: true,
    };
    push(reqMsg);
    logActivity({ ts, caseId: activeId, actor: 'Buyer', type: 'RETURN_REQUEST', note: 'Return requested' });

    // AI Response (delay 500ms tạo cảm giác thật)
    setTimeout(() => {
      const ts2 = nowTs();
      const aiText = 
        '已收到退貨/退款申請。\n' +
        '賣家需在 24 小時內回應：接受 / 拒絕 / 提出方案。\n\n' +
        '💡 提示：\n' +
        '• 買家：請上傳開箱影片或照片證明。\n' +
        '• 賣家：請提供出貨證明或反證。';
      
      const aiMsg: ChatEntry = { timestamp: ts2, sender: 'AI', text: aiText };
      push(aiMsg);
      logActivity({ ts: ts2, caseId: activeId, actor: 'AI', type: 'MESSAGE', note: 'AI Guidance' });
    }, 600);
  }

  function onCompleted() {
    if (!activeId) return;
    const ts = nowTs();
    push({ timestamp: ts, sender: 'System', text: '訂單已完成 (Order Completed). 款項將撥付給賣家。', highlight: true });
    logActivity({ ts, caseId: activeId, actor: 'System', type: 'COMPLETED', note: 'Order completed' });
  }

  function handleSend(entry: ChatEntry) {
    if (!activeId) return;
    push(entry);
    const ts = entry.timestamp;
    
    // Log
    if (entry.attachments?.length) {
      logActivity({
        ts, caseId: activeId, actor: entry.sender, type: 'EVIDENCE',
        note: 'Evidence attached', attachmentCount: entry.attachments.length,
      });
    } else {
      logActivity({
        ts, caseId: activeId, actor: entry.sender, type: 'MESSAGE',
        note: entry.text.slice(0, 80),
      });
    }
  }

  if (!activeId || !activeCase) {
    return <div className="p-8 text-center text-gray-500">Loading chats...</div>;
  }

  return (
    <div className="mx-auto max-w-[1400px] h-[calc(100vh-64px)] flex flex-col">
      {/* Header Mobile/Tablet (Optional) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-white">
        <h1 className="font-bold text-lg">Messages</h1>
      </div>

      <div className="flex-1 flex overflow-hidden bg-white border-x border-gray-200 shadow-sm my-4 md:rounded-xl md:border-y">
        
        {/* Left: Thread List */}
        <aside className="w-[350px] flex flex-col border-r bg-white shrink-0">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all" 
                placeholder="Search inbox" 
              />
            </div>
          </div>
          
          <ul className="flex-1 overflow-y-auto">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  className={`w-full text-left px-4 py-4 flex gap-3 transition-colors hover:bg-gray-50 border-b border-gray-50 ${
                    activeId === t.id ? 'bg-blue-50/60 hover:bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                  }`}
                  onClick={() => setActiveId(t.id)}
                >
                  <div className="relative shrink-0">
                    <img src={t.avatar} alt="" className="w-12 h-12 rounded-full bg-gray-200 object-cover" />
                    {t.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`text-sm truncate ${t.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {t.title}
                      </span>
                      <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{t.lastTime}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate pr-2 ${t.unread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                        {t.lastMsg}
                      </p>
                      {t.unread > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                          {t.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Middle: Chat Area */}
        <section className="flex-1 flex flex-col min-w-0 bg-white relative">
          {/* Chat Header */}
          <header className="h-16 border-b flex items-center justify-between px-6 bg-white shrink-0 z-10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCase.id}`} className="w-full h-full" alt=""/>
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gray-900 truncate">{activeCase.title}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  Active now • {activeCase.price}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {/* Action Buttons (Demo Purposes) */}
              <button 
                onClick={onReturnRefund}
                className="hidden sm:flex px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors items-center gap-1"
              >
                <ShieldCheck size={16} />
                申請退貨 (Return)
              </button>
              <button 
                onClick={onCompleted}
                className="hidden sm:flex px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors"
              >
                完成訂單 (Complete)
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <MoreVertical size={20} />
              </button>
            </div>
          </header>

          {/* Chat List (Messages) */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa]">
             {/* Security Notice */}
             <div className="flex justify-center mb-6">
                <div className="bg-yellow-50 text-yellow-800 text-xs px-3 py-1.5 rounded-full border border-yellow-100 flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck size={12} />
                  Never transfer money outside of NexBy. Keep chats within the app.
                </div>
             </div>
             
             <ChatList items={activeLog} />
          </div>

          {/* Composer */}
          <div className="shrink-0 bg-white border-t p-4">
            <ChatComposer onSend={handleSend} role="Buyer" />
          </div>
        </section>

        {/* Right: Sidebar Info */}
        <ListingSidebar item={activeCase} />
        
      </div>
    </div>
  );
}