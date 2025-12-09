// src/pages/UserListing.tsx
import { useMemo, useState } from 'react';
import { CASES, CASE_OPTIONS } from '../data/cases';

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

export default function UserListing() {
  const [caseId, setCaseId] = useState<number>(1);
  const data = useMemo(() => CASES.find((c) => c.id === caseId)!, [caseId]);

  const [activeIdx, setActiveIdx] = useState(0);
  const photos = data.photoLinks ?? [];

  if (activeIdx !== 0 && !photos[activeIdx]) setActiveIdx(0);

  return (
    <div className="max-w-[1200px] mx-auto p-4 space-y-4">
      {/* breadcrumb + 選擇案例 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          {(data.category?.path ?? ['首頁', 'User Listing']).join(' / ')}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">選擇案例</label>
          <div className="relative">
            <select
              className="appearance-none rounded-lg border px-3 py-2 pr-8 text-sm bg-white shadow-sm"
              value={caseId}
              onChange={(e) => setCaseId(Number(e.target.value))}
            >
              {CASE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              ▾
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* 左側：圖片 + 說明 + 詳情 */}
        <section className="col-span-12 lg:col-span-7 space-y-4">
          {/* 圖片畫廊 */}
          <div className="rounded-xl border bg-white p-4">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border bg-gray-50">
              {photos[activeIdx] ? (
                <img
                  src={photos[activeIdx].url}
                  alt={photos[activeIdx].note ?? 'photo'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-gray-400">無圖片</div>
              )}
            </div>
            {photos.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`shrink-0 rounded-md border overflow-hidden ${
                      activeIdx === i ? 'ring-2 ring-black' : ''
                    }`}
                    aria-label={`縮圖 ${i + 1}`}
                  >
                    <img src={p.url} alt={p.note ?? `thumb-${i + 1}`} className="h-16 w-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 商品說明 */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <h3 className="font-semibold">商品說明</h3>

            {/* 擬真描述（長文） */}
            <pre className="whitespace-pre-wrap text-sm leading-[1.85]">{data.longDescription}</pre>

            {/* 賣家揭露 */}
            {data.disclosures && data.disclosures.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-1">賣家揭露的瑕疵：</div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {data.disclosures.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 屬性 chips */}
            {data.attributes && data.attributes.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-medium">商品屬性：</div>
                <div className="flex flex-wrap gap-2">
                  {data.attributes.map((a, i) => (
                    <Tag key={i}>
                      {a.name}：{a.value}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {/* 補充描述（若有） */}
            {data.descBullets && data.descBullets.length > 0 && (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {data.descBullets.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Tag>{data.conditionTag}</Tag>
              <Tag>7-ELEVEN 取貨付款</Tag>
              <Tag>可退貨</Tag>
            </div>
          </div>

          {/* 商品資訊 */}
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold mb-3">商品資訊</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-gray-500">價格</div>
                <div className="font-medium">{data.price}</div>
              </div>
              <div>
                <div className="text-gray-500">成色</div>
                <div className="font-medium">{data.conditionTag}</div>
              </div>
              <div>
                <div className="text-gray-500">分類</div>
                <div className="font-medium">{(data.category?.path ?? []).join(' · ') || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">商品編號</div>
                <div className="font-medium">D-{String(data.id).padStart(4, '0')}</div>
              </div>
            </div>
          </div>

          {/* 運送 & 面交（示意） */}
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold mb-3">運送 & 面交</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <div className="text-gray-500 mb-1">運送</div>
                <div>7-ELEVEN 取貨付款 NT$60 · 1–3 天到貨</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-gray-500 mb-1">面交</div>
                <div>台北市 · 僅捷運站</div>
              </div>
            </div>
          </div>
        </section>

        {/* 右側：操作卡 */}
        <aside className="col-span-12 lg:col-span-5 space-y-4">
          <div className="rounded-xl border bg-white p-4 space-y-3 sticky top-4">
            <h2 className="text-xl font-semibold leading-snug">{data.title}</h2>
            <div className="text-2xl font-semibold">{data.price}</div>
            <div className="flex gap-2">
              <Tag>{data.conditionTag}</Tag>
              <Tag>可退貨</Tag>
              <Tag>快速出貨</Tag>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="flex-1 rounded-lg bg-black text-white py-2">直接購買</button>
              <button className="flex-1 rounded-lg border py-2">出價</button>
            </div>
            <button className="w-full rounded-lg border py-2">與賣家聊天</button>
            <div className="mt-2 rounded-lg bg-green-50 text-green-800 text-sm p-3">
              ✅ 受保護的交易：支援站內聊天與 7-ELEVEN 貨到付款。若與描述不符可申請退貨。
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-200" />
              <div>
                <div className="font-medium">seller_demo</div>
                <div className="text-xs text-gray-500">加入 2021 · 4.8★（125）</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="rounded-lg border p-2">
                <div className="text-xs text-gray-500">在售</div>
                <div className="font-semibold">58</div>
              </div>
              <div className="rounded-lg border p-2">
                <div className="text-xs text-gray-500">已售</div>
                <div className="font-semibold">212</div>
              </div>
              <div className="rounded-lg border p-2">
                <div className="text-xs text-gray-500">回覆時間</div>
                <div className="font-semibold">≈1h</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border py-2">出價</button>
              <button className="flex-1 rounded-lg border py-2">檢舉此商品</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
