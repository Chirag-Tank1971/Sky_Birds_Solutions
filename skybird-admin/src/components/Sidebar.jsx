import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  BookOpen, 
  Users, 
  MessageSquare,
  LogOut,
  GraduationCap,
  Settings,
  Video,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/platforms', icon: Layers, label: 'Platforms' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/queries', icon: MessageSquare, label: 'Queries' },
  { to: '/site-content', icon: Settings, label: 'Website Content' },
  { to: '/testimonials', icon: Video, label: 'Testimonials' },
  { to: '/coupons', icon: Tag, label: 'Coupons' },
]; 

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, admin } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="p-2 bg-primary-600 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">SkyBirds</h1>
            <p className="text-xs text-gray-500">Seller Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to} 
              end={item.to === '/'}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive 
                  ? 'bg-primary-50 text-primary-700 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">{admin?.name || 'Admin'}</p>
            <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
