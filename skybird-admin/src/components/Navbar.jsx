import { Menu, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import NotificationMenu from './NotificationMenu';
import { pageTitle } from './nav';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://sky-birds-solutions.vercel.app';

const Navbar = ({ setSidebarOpen }) => {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/85 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="hidden text-xs font-medium text-gray-400 sm:block">Admin / {pageTitle(pathname)}</p>
            <h2 className="truncate text-base font-semibold text-gray-900">{pageTitle(pathname)}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={SITE_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:inline-flex"
          >
            View site <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <NotificationMenu />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
