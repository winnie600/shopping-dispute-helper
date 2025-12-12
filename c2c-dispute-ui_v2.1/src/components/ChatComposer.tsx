// src/components/ChatComposer.tsx
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Attachment, ChatEntry } from '../types';

// Minimal inline SVG icons to avoid depending on 'lucide-react'
type IconProps = { size?: number; className?: string };

const Paperclip = ({ size = 20, className = '' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 1 1 5.66 5.66L8.36 18.86a2 2 0 1 1-2.83-2.83L16.73 6.72" />
  </svg>
);

const Send = ({ size = 18, className = '' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const X = ({ size = 12, className = '' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function nowTs() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ChatComposer({
  onSend,
  role = 'Buyer',
}: {
  onSend: (e: ChatEntry) => void;
  role?: ChatEntry['sender'];
}) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canSend = useMemo(() => text.trim().length > 0 || files.length > 0, [text, files]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    const arr: Attachment[] = [];
    // Giới hạn demo: chỉ lấy 4 ảnh đầu tiên để tránh vỡ layout
    for (const f of Array.from(fileList).slice(0, 4)) {
      if (!f.type.startsWith('image/')) continue;
      const dataUrl = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(f);
      });
      arr.push({ type: 'image', url: dataUrl, name: f.name });
    }
    setFiles((prev) => [...prev, ...arr]);
    // Reset input để cho phép chọn lại cùng file nếu muốn
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function onAttachClick() {
    inputRef.current?.click();
  }

  function send() {
    if (!canSend) return;
    onSend({
      timestamp: nowTs(),
      sender: role,
      text: text.trim(),
      attachments: files.length ? files : undefined,
    });
    setText('');
    setFiles([]);
  }

  // Gửi bằng Enter (giữ Shift+Enter để xuống dòng)
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Khu vực Preview ảnh (nếu có) */}
      {files.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 px-1">
          {files.map((f, i) => (
            <div key={i} className="relative group shrink-0">
              <img 
                src={f.url} 
                alt="preview" 
                className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm" 
              />
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 shadow-md hover:bg-red-500 transition-colors"
                title="Remove"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-3xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
        {/* Nút Attach */}
        <button
          type="button"
          onClick={onAttachClick}
          className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors shrink-0"
          title="Upload Evidence"
        >
          <Paperclip size={20} />
        </button>
        
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.currentTarget.files)}
        />

        {/* Text Area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type a message..."
          className="flex-1 bg-transparent border-none focus:ring-0 py-3 px-2 text-sm max-h-32 min-h-[44px] resize-none text-gray-800 placeholder-gray-400"
          style={{ height: 'auto', minHeight: '44px' }}
        />

        {/* Nút Send */}
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className={`p-3 rounded-full shrink-0 transition-all duration-200 ${
            canSend 
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105 active:scale-95' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send size={18} className={canSend ? 'ml-0.5' : ''} />
        </button>
      </div>
      
      <div className="text-center">
         <span className="text-[10px] text-gray-400">
           Press Enter to send • Support JPG, PNG evidence
         </span>
      </div>
    </div>
  );
}