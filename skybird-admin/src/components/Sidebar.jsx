import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { navSections } from './nav';

const initials = (name = '', email = '') =>
  (name || email || 'A').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, admin } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-ink text-white transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="" className="h-10 w-10 rounded-lg bg-white/5 object-contain p-0.5" />
            <div className="leading-tight">
              <p className="text-[15px] font-bold">Sky Birds</p>
              <p className="text-xs font-medium text-white/50">Admin console</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/35">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-brand-leaf" />}
                        <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-brand-leaf' : 'text-white/50 group-hover:text-white/80'}`} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Account */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-leaf text-xs font-bold text-brand-ink">
              {initials(admin?.name, admin?.email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{admin?.name || 'Admin'}</p>
              <p className="truncate text-xs text-white/50">{admin?.email}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-white/50 transition hover:bg-red-500/15 hover:text-red-300"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
