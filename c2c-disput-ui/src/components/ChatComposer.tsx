import { useMemo, useRef, useState } from 'react';
import type { Attachment, ChatEntry } from '../types';

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
  role?: ChatEntry['sender']; // thường là Buyer trong UI người dùng
}) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canSend = useMemo(() => text.trim().length > 0 || files.length > 0, [text, files]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    const arr: Attachment[] = [];
    for (const f of Array.from(fileList)) {
      if (!f.type.startsWith('image/')) continue;
      const dataUrl = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(f);
      });
      arr.push({ type: 'image', url: dataUrl, name: f.name });
    }
    setFiles((prev) => [...prev, ...arr]);
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

  return (
    <div className="border-t p-3">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onAttachClick}
          className="px-3 py-2 rounded-lg border text-sm"
          title="Attach evidence (mock)"
        >
          📎 Attach
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.currentTarget.files)}
        />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e)=>setText(e.target.value)}
            rows={2}
            placeholder="Type your message…"
            className="w-full px-3 py-2 rounded-lg border"
          />
          {!!files.length && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative">
                  <img src={f.url} alt={f.name || 'evidence'} className="w-full h-20 object-cover rounded-lg border" />
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className="px-3 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-40"
        >
          Send
        </button>
      </div>
      <div className="mt-1 text-[11px] text-gray-500">
        Demo: Ảnh chỉ lưu tạm trong phiên; gửi sẽ hiển thị như bubble kèm thumbnail.
      </div>
    </div>
  );
}
