import { Menu } from 'lucide-react';
import NotificationMenu from './NotificationMenu';

const Navbar = ({ setSidebarOpen }) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-gray-800">Admin Dashboard</h2>
        </div>

        <div className="flex items-center gap-3">
          <NotificationMenu />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
