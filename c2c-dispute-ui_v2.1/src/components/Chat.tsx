// src/components/Chat.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import type { ChatEntry } from '../types';
// Lightweight inline SVG icons to avoid a hard dependency on 'lucide-react' and its types.
const Bot = ({ size = 16, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props} aria-hidden>
    <rect x="3" y="7" width="18" height="11" rx="2" />
    <path d="M8 7V5a4 4 0 0 1 8 0v2" />
    <path d="M8 14h.01M16 14h.01" strokeLinecap="round" />
  </svg>
);
const Store = ({ size = 16, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props} aria-hidden>
    <path d="M3 9.5L12 4l9 5.5" />
    <path d="M21 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6" />
    <path d="M7 14v5h10v-5" />
  </svg>
);
const AlertCircle = ({ size = 16, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4" />
    <path d="M12 17h.01" />
  </svg>
);

// Hàm xử lý nút bấm trong tin nhắn (giữ nguyên logic cũ)
function parseContent(text: string) {
  const parts = text.split(/\[\s*(?:按鈕|Button):\s*(.*?)\s*\]/g);
  if (parts.length === 1) return <span className="whitespace-pre-wrap">{text}</span>;
  return (
    <div className="flex flex-col gap-2">
      <span className="whitespace-pre-wrap">{parts[0]}</span>
      {parts.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {parts.slice(1).map((part, i) => {
            if (i % 2 !== 0) return <span key={i}>{part}</span>;
            if (!part.trim()) return null;
            return (
              <button key={i} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md shadow-sm hover:bg-indigo-700 transition-colors" onClick={() => alert(`Clicked: ${part}`)}>
                {part}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Component hiển thị tin nhắn hệ thống (Căn giữa)
function SystemMessage({ text, timestamp }: { text: string; timestamp: string }) {
  return (
    <div className="flex flex-col items-center my-6">
      <span className="bg-gray-100 text-gray-500 text-[11px] px-3 py-1 rounded-full">
        {text} • {timestamp.split(' ')[1]}
      </span>
    </div>
  );
}

// Component hiển thị bong bóng chat
function Bubble({ e }: { e: ChatEntry }) {
  const isBuyer = e.sender === 'Buyer';
  const isAI = e.sender === 'AI';

  // Cấu hình Style dựa trên vai trò
  const config = {
    Buyer:  { align: 'justify-end',  bg: 'bg-blue-600 text-white rounded-tr-none', icon: null, name: 'You' },
    Seller: { align: 'justify-start', bg: 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm', icon: Store, name: 'Seller' },
    AI:     { align: 'justify-start', bg: 'bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-tl-none shadow-sm', icon: Bot, name: 'NexBuy AI' },
  };

  const role = isBuyer ? 'Buyer' : isAI ? 'AI' : 'Seller';
  const style = config[role];
  const Icon = style.icon;

  return (
    <div className={`flex w-full ${style.align} gap-2 mb-4`}>
      {/* Avatar cho bên trái (Seller/AI) */}
      {!isBuyer && Icon && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isAI ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}`}>
          <Icon size={16} />
        </div>
      )}

      <div className={`flex flex-col max-w-[80%] ${isBuyer ? 'items-end' : 'items-start'}`}>
        {/* Tên người gửi */}
        {!isBuyer && <span className="text-[10px] text-gray-400 mb-1 ml-1">{style.name}</span>}

        {/* Nội dung tin nhắn */}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${style.bg} ${e.highlight ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}>
          {/* Cảnh báo highlight */}
          {e.highlight && (
            <div className="flex items-center gap-1.5 text-xs font-bold mb-2 pb-2 border-b border-white/20">
              <AlertCircle size={14} />
              <span>Important Update</span>
            </div>
          )}
          
          {parseContent(e.text)}

          {/* Ảnh đính kèm */}
          {!!e.attachments?.length && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {e.attachments.map((a, idx) => (
                <img key={idx} src={a.url} alt="attachment" className="w-full h-24 object-cover rounded-lg border bg-gray-100" />
              ))}
            </div>
          )}
        </div>
        
        {/* Thời gian */}
        <span className="text-[10px] text-gray-300 mt-1 px-1">
          {e.timestamp.split(' ')[1]}
        </span>
      </div>
    </div>
  );
}

export default function ChatList({ items }: { items: ChatEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Nhóm tin nhắn theo ngày
  const groups = useMemo(() => {
    const m = new Map<string, ChatEntry[]>();
    for (const e of items) {
      const day = e.timestamp.split(' ')[0];
      if (!m.has(day)) m.set(day, []);
      m.get(day)!.push(e);
    }
    return Array.from(m.entries());
  }, [items]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  return (
    <div className="flex flex-col">
      {groups.map(([day, logs]) => (
        <div key={day}>
          <div className="flex justify-center my-4">
            <span className="text-[10px] bg-gray-200 text-gray-500 px-3 py-1 rounded-full">{day}</span>
          </div>
          {logs.map((e, i) => (
            e.sender === 'System' 
              ? <SystemMessage key={i} text={e.text} timestamp={e.timestamp} /> 
              : <Bubble key={i} e={e} />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}