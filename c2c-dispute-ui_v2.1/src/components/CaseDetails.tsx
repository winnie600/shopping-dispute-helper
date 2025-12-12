// src/components/CaseDetails.tsx
import type { CaseData } from '../types';
import ProductGallery from './ProductGallery';
import ChatList from './Chat';

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

export default function CaseDetails({ data }: { data: CaseData }) {
  const { listingInfo, chatLog, complaint, orderMeta } = data;

  return (
    <div className="space-y-4">
      {/* Listing */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Listing Information</h3>
          <div className="text-xs text-gray-500">{listingInfo.listedPrice}</div>
        </div>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Title</div>
            <div className="font-medium">{listingInfo.title}</div>
          </div>
          <div>
            <div className="text-gray-500">Condition</div>
            <div className="font-medium">{listingInfo.condition}</div>
          </div>
          <div>
            <div className="text-gray-500">Disclosed flaws</div>
            <div className="font-medium">{listingInfo.disclosedFlaws}</div>
          </div>
          <div>
            <div className="text-gray-500">Attributes</div>
            <div className="font-medium">{listingInfo.attributes}</div>
          </div>
        </div>

        {orderMeta && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {orderMeta.map((m) => (
              <div key={m.label} className="rounded-xl bg-gray-50 px-3 py-2">
                <MetaRow label={m.label} value={m.value} />
              </div>
            ))}
          </div>
        )}

        {/* Product photos (gallery + modal/zoom) */}
        <div className="mt-4">
          <ProductGallery photos={listingInfo.photos} title={listingInfo.title} />
        </div>
      </div>

      {/* Chat */}
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Pre-Transaction Chat</h3>
          <div className="text-xs text-gray-500">Grouped by day • Shows time • Auto-scroll</div>
        </div>
        <ChatList items={chatLog} />
      </div>

      {/* Complaint */}
      <div className="card p-4">
        <h3 className="font-semibold">Complaint & Evidence</h3>
        <p className="mt-2 prose-block">{complaint}</p>
        <div className="mt-3 text-xs text-gray-500">
          Checklist: Listing, Unboxing photo/video, Chat transcripts, Logistics proof.
        </div>
      </div>
    </div>
  );
}
