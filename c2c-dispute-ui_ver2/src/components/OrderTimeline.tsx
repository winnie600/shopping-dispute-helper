// src/components/OrderTimeline.tsx
import React from 'react';

export type TimelineItem = {
  key: string;
  title: string;
  ts?: string; // ISO-like string "YYYY-MM-DD HH:mm"
};

function StepDot({ active }: { active: boolean }) {
  return (
    <div
      className={`w-3 h-3 rounded-full border ${
        active ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
      }`}
    />
  );
}

export default function OrderTimeline({
  items,
}: {
  items: TimelineItem[];
}) {
  const lastDone = Math.max(
    -1,
    ...items.map((it, i) => (it.ts ? i : -1))
  );

  return (
    <div className="card p-4">
      <h3 className="font-semibold mb-3">Order Timeline</h3>
      <ol className="relative ml-4 border-l border-gray-200">
        {items.map((it, i) => {
          const done = i <= lastDone;
          return (
            <li key={it.key} className="mb-4 ml-4">
              <div className="absolute -left-1.5 mt-1.5">
                <StepDot active={done} />
              </div>
              <div className="flex items-center justify-between">
                <div className={`font-medium ${done ? '' : 'text-gray-500'}`}>{it.title}</div>
                <div className="text-xs text-gray-500">{it.ts ? it.ts : ''}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
