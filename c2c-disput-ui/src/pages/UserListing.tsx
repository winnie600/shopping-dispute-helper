// src/pages/UserListing.tsx
import { useMemo } from 'react';
import { CASES } from '../data/cases';
import type { CaseData } from '../types';
import ProductGallery from '../components/ProductGallery';

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs">
      {children}
    </span>
  );
}
function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-gray-500">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function SellerCard() {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 grid place-items-center font-semibold">S</div>
        <div>
          <div className="font-medium">seller_demo</div>
          <div className="text-xs text-gray-500">Joined 2021 · 4.8★ (125)</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="px-3 py-2 rounded-lg bg-black text-white text-sm" disabled>Chat with seller</button>
        <button className="px-3 py-2 rounded-lg border text-sm" disabled>Buy Now</button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button className="px-3 py-2 rounded-lg border text-sm" disabled>Make offer</button>
        <button className="px-3 py-2 rounded-lg border text-sm">Report listing</button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-gray-50 p-2 text-xs">
          <div className="text-gray-500">Listings</div>
          <div className="font-semibold">58</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-xs">
          <div className="text-gray-500">Sold</div>
          <div className="font-semibold">212</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-xs">
          <div className="text-gray-500">Response</div>
          <div className="font-semibold">≈1h</div>
        </div>
      </div>
    </div>
  );
}

function SimilarListings({ pick = 3 }: { pick?: number }) {
  const items = CASES.slice(0, pick);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map((c) => (
        <a key={c.id} className="card overflow-hidden group" href="#" onClick={(e)=>e.preventDefault()}>
          <div className="aspect-[4/3] bg-gray-100">
            {/* thumb demo */}
            <img
              src={c.listingInfo.photos[0]?.url}
              alt={c.title}
              className="h-full w-full object-cover group-hover:scale-[1.02] transition"
              onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.opacity='0'; }}
            />
          </div>
          <div className="p-3">
            <div className="line-clamp-2 text-sm">{c.title}</div>
            <div className="mt-1 font-semibold">{c.listingInfo.listedPrice}</div>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function UserListing() {
  // Demo lấy case1 để render “giống Carousell”
  const data: CaseData = useMemo(() => CASES[0], []);
  const { listingInfo } = data;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between text-sm">
        <nav className="text-gray-500">
          <a href="#" className="hover:underline" onClick={(e)=>e.preventDefault()}>Home</a>
          <span> / </span>
          <a href="#" className="hover:underline" onClick={(e)=>e.preventDefault()}>Women’s Shoes</a>
          <span> / </span>
          <span className="text-gray-700">Mary Jane</span>
        </nav>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded-lg border">Share</button>
          <button className="px-2 py-1 rounded-lg border">♥ Save</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Media & Description */}
        <div className="lg:col-span-7 space-y-4">
          {/* Gallery — giữ ProductGallery: click thumbnail để zoom modal */}
          <Section title="Photos">
            <ProductGallery photos={listingInfo.photos} title={listingInfo.title} />
          </Section>

          {/* Description / Details / Tags */}
          <Section title="Description">
            <div className="text-sm whitespace-pre-wrap">
              {listingInfo.title}
              {'\n'}
              {listingInfo.attributes}
              {'\n'}
              {listingInfo.disclosedFlaws}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill>{listingInfo.condition}</Pill>
              <Pill>7-ELEVEN COD</Pill>
              <Pill>Returns</Pill>
            </div>
          </Section>

          <Section title="Product details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoRow k="Price" v={listingInfo.listedPrice} />
              <InfoRow k="Condition" v={listingInfo.condition} />
              <InfoRow k="Category" v="Women · Shoes · Mary Jane" />
              <InfoRow k="Item ID" v="D-8065-UK3" />
            </div>
          </Section>

          <Section title="Shipping & Meet-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium">Shipping</div>
                <div className="text-gray-600">7-ELEVEN COD NT$60 · Arrives in 1–3 days</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium">Meet-up</div>
                <div className="text-gray-600">Taipei City · MRT stations only</div>
              </div>
            </div>
          </Section>

          <Section title="Safety tips">
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Chat in-app only. Do not move to external messengers.</li>
              <li>Cash on Delivery at convenience stores for safety.</li>
              <li>Check item condition and keep unboxing video.</li>
            </ul>
          </Section>

          <Section title="Similar listings">
            <SimilarListings pick={3} />
          </Section>
        </div>

        {/* Right: Sticky actions panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="lg:sticky lg:top-4 space-y-4">
            <div className="card p-4">
              <h1 className="text-lg font-semibold">{listingInfo.title}</h1>
              <div className="mt-1 text-2xl font-bold">{listingInfo.listedPrice}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill>{listingInfo.condition}</Pill>
                <Pill>Free returns</Pill>
                <Pill>Fast ship</Pill>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="px-3 py-2 rounded-lg bg-black text-white" disabled>Buy Now</button>
                <button className="px-3 py-2 rounded-lg border" disabled>Make offer</button>
                <button className="col-span-2 px-3 py-2 rounded-lg border" disabled>Chat with seller</button>
              </div>
            </div>

            <div className="card p-3 bg-green-50 border-green-200">
              <div className="text-sm text-green-800">
                ✅ Protected Purchase: in-app chat & 7-ELEVEN COD supported. Returns available if not as described.
              </div>
            </div>

            <SellerCard />
          </div>
        </div>
      </div>
    </div>
  );
}
