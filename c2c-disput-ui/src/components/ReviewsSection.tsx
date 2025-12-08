import { useMemo, useState } from 'react';
import type { Review } from '../data/reviews';
import { MOCK_REVIEWS } from '../data/reviews';

function Stars({ n }: { n: number }) {
  return (
    <div className="inline-flex">
      {Array.from({length:5}).map((_,i)=>(
        <svg key={i} viewBox="0 0 20 20" className={`w-4 h-4 ${i < n ? '' : 'opacity-30'}`} aria-hidden>
          <path d="M10 1.5 12.7 7l6 .5-4.6 4 1.3 5.8L10 14.9 4.6 17.3l1.3-5.8L1.3 7.5 7.3 7z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const [page, setPage] = useState(1);
  const pageSize = 3;

  const all = useMemo(() => [...MOCK_REVIEWS].sort(
    (a,b)=> +new Date(b.createdAt.replace(' ','T')) - +new Date(a.createdAt.replace(' ','T'))
  ), []);
  const total = all.length;
  const avg = useMemo(()=> (all.reduce((s,r)=>s+r.rating,0)/Math.max(total,1)), [all, total]);

  const slice = all.slice((page-1)*pageSize, page*pageSize);
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  const breakdown = useMemo(()=>{
    const map = new Map<number, number>();
    for (let i=1;i<=5;i++) map.set(i, 0);
    all.forEach(r=> map.set(r.rating, (map.get(r.rating)??0)+1));
    return map;
  }, [all]);

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Ratings & Reviews</h3>
        <div className="text-sm">
          <span className="font-semibold">{avg.toFixed(1)}</span> / 5 <Stars n={Math.round(avg)} /> <span className="text-gray-500">({total})</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-2 text-sm">
        {[5,4,3,2,1].map(star => {
          const cnt = breakdown.get(star) ?? 0;
          const pct = total ? Math.round((cnt/total)*100) : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="w-8">{star}★</span>
              <div className="flex-1 h-2 rounded bg-gray-200 overflow-hidden"><div className="h-full bg-black" style={{width:`${pct}%`}} /></div>
              <span className="w-8 text-right text-xs text-gray-600">{cnt}</span>
            </div>
          );
        })}
      </div>

      {/* List */}
      <ul className="mt-3 space-y-3">
        {slice.map(r=>(
          <li key={r.id} className="rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{r.author}</div>
              <div className="text-xs text-gray-500">{new Date(r.createdAt.replace(' ','T')).toLocaleDateString()}</div>
            </div>
            <div className="mt-1"><Stars n={r.rating} /></div>
            <div className="mt-1 text-sm">{r.text}</div>
          </li>
        ))}
      </ul>

      {/* Pager */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-2 py-1 rounded-lg border text-sm" disabled={page===1}>Prev</button>
        <div className="text-xs text-gray-600">Page {page}/{maxPage}</div>
        <button onClick={()=>setPage(p=>Math.min(maxPage,p+1))} className="px-2 py-1 rounded-lg border text-sm" disabled={page===maxPage}>Next</button>
      </div>
    </section>
  );
}