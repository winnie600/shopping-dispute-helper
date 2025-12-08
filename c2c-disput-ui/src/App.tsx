// src/App.tsx — stable routes
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';

import Demo from './pages/Demo';
import ChatInbox from './pages/ChatInbox';
import StaffConsole from './pages/StaffConsole';
import StaffDashboard from './pages/StaffDashboard';
import Policy from './pages/Policy';
import Home from './pages/Home';            // NEW
import UserListing from './pages/UserListing'; // NEW

function Layout() {
  return (
    <div className="min-h-dvh bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-4">
          <div className="font-bold">C2C Dispute AI Copilot</div>
          <nav className="flex-1 flex items-center gap-2 text-sm">
            <Nav to="/dashboard">Dashboard</Nav>
            <Nav to="/demo">Demo</Nav>
            <Nav to="/inbox">Inbox</Nav>
            <Nav to="/staff">Staff</Nav>
            <Nav to="/policy">Policy</Nav>
            <Nav to="/listing">User Listing</Nav> {/* NEW */}
            <Nav to="/home">Home</Nav>            {/* NEW */}
          </nav>
          <div className="text-xs text-gray-500">UI-only demo</div>
        </div>
      </header>
      <main className="py-6">
        <Outlet />
      </main>
    </div>
  );
}

function Nav({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-2 py-1 rounded-lg ${isActive ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`
      }
    >
      {children}
    </NavLink>
  );
}

function NotFound() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card p-6 text-center">
        <div className="text-2xl font-bold">404</div>
        <div className="text-sm text-gray-600 mt-1">Page not found</div>
        <div className="mt-4">
          <NavLink to="/dashboard" className="px-3 py-2 rounded-lg border text-sm">
            Go to Dashboard
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<StaffDashboard />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/inbox" element={<ChatInbox />} />
          <Route path="/staff" element={<StaffConsole />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/listing" element={<UserListing />} /> {/* NEW */}
          <Route path="/home" element={<Home />} />           {/* NEW */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
