// src/App.tsx
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';

// Inline ShoppingBag icon to avoid adding an external dependency (replaces 'lucide-react')
function ShoppingBag({ size = 20, fill = 'currentColor', className = '' }: { size?: number; fill?: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 2h12l1 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6l1-4z" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 10a3 3 0 0 0 6 0" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Import các Pages
import UserListing from './pages/UserListing';
import ChatInbox from './pages/ChatInbox';
import Policy from './pages/Policy';
import StaffConsole from './pages/StaffConsole';
import StaffDashboard from './pages/StaffDashboard';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-[#f8f9fa]">
        
        {/* --- HEADER / NAVIGATION --- */}
        <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                <ShoppingBag size={20} fill="currentColor" />
              </div>
              <div className="font-black text-xl tracking-tight flex items-baseline gap-2">
                NexBuy 
                <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border">
                  C2C DEMO v3.0
                </span>
              </div>
            </div>

            {/* Navigation Links (Đã sắp xếp lại theo yêu cầu) */}
            <nav className="hidden md:flex items-center gap-1 bg-gray-50/50 p-1 rounded-full border border-gray-200/60">
              <NavItem to="/listing" label="1. User Listing" />
              <NavItem to="/inbox" label="2. Inbox" />
              <NavItem to="/policy" label="3. Policy" />
              <div className="w-px h-4 bg-gray-300 mx-1" /> {/* Divider phân cách User và Staff */}
              <NavItem to="/staff" label="4. Staff Console" />
              <NavItem to="/dashboard" label="5. AI Dashboard" />
            </nav>

            {/* User Profile Mock */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-gray-900">Demo User</div>
                <div className="text-[10px] text-gray-500">Buyer / Seller</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-sm" />
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1">
          <Routes>
            {/* Mặc định chuyển hướng về tab đầu tiên: User Listing */}
            <Route path="/" element={<Navigate to="/listing" replace />} />
            
            {/* Định nghĩa các đường dẫn */}
            <Route path="/listing" element={<UserListing />} />
            <Route path="/inbox" element={<ChatInbox />} />
            <Route path="/policy" element={<Policy />} />
            <Route path="/staff" element={<StaffConsole />} />
            <Route path="/dashboard" element={<StaffDashboard />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

// Component phụ để render từng nút Nav (giúp code gọn hơn)
function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default App;