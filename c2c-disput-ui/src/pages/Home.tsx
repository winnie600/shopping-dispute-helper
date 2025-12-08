// src/pages/Home.tsx
export default function Home() {
  return (
    <div className="min-h-[70vh] grid place-items-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold">C2C Dispute AI Copilot – Demo UI</h1>
        <p className="mt-2 text-gray-600">Frontend-only (mock data).</p>
        <a href="/dashboard" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-black text-white">
          Start Demo
        </a>
      </div>
    </div>
  );
}