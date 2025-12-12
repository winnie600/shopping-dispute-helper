import { CASES } from '../data/cases';
import type { CaseId } from '../types';

type Props = {
  value?: CaseId;
  onChange: (id: CaseId) => void;
};

export default function CaseSelector({ value, onChange }: Props) {
  return (
    <div className="grid gap-3">
      {CASES.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`card p-4 text-left ${value === c.id ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="text-sm text-gray-500">Case ID: {c.id}</div>
          <div className="font-medium">{c.title}</div>
        </button>
      ))}
    </div>
  );
}
