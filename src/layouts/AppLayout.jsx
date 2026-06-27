import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../utils/navigation';
import { ROLE_LABELS } from '../utils/constants';

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6 border-b border-white/10">
        <p className="font-[var(--font-display)] text-xs font-semibold tracking-widest uppercase text-[var(--color-gold)]">
          Wolkite University
        </p>
        <p className="font-[var(--font-display)] text-lg font-bold text-white mt-0.5">Campus Hub</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-card)] text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-[var(--color-terracotta)] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
          <p className="text-xs text-white/50">{ROLE_LABELS[user.role]}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-card)] text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150"
        >
          <LogOut size={18} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-parchment)] lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-[var(--color-ink)] sticky top-0 h-screen shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile topbar */}
      <header className="lg:hidden sticky top-0 z-30 bg-[var(--color-ink)] px-4 py-3 flex items-center justify-between">
        <p className="font-[var(--font-display)] text-base font-bold text-white">Wolkite Campus Hub</p>
        <button onClick={() => setMobileOpen(true)} className="text-white p-1.5" aria-label="Open menu">
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-72 bg-[var(--color-ink)] h-full flex flex-col">
            <div className="flex justify-end px-3 pt-3">
              <button onClick={() => setMobileOpen(false)} className="text-white p-1.5" aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 -mt-2">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
