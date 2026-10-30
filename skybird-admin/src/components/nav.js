import { LayoutDashboard, Layers, BookOpen, Users, MessageSquare, Settings, Video, Tag } from 'lucide-react';

// Shared by the sidebar (links) and the top bar (page title).
export const navSections = [
  {
    label: 'Overview',
    items: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/courses', icon: BookOpen, label: 'Courses' },
      { to: '/platforms', icon: Layers, label: 'Platforms' },
      { to: '/coupons', icon: Tag, label: 'Coupons' },
    ],
  },
  {
    label: 'Customers',
    items: [
      { to: '/customers', icon: Users, label: 'Customers' },
      { to: '/queries', icon: MessageSquare, label: 'Queries' },
    ],
  },
  {
    label: 'Website',
    items: [
      { to: '/site-content', icon: Settings, label: 'Website Content' },
      { to: '/testimonials', icon: Video, label: 'Testimonials' },
    ],
  },
];

export function pageTitle(pathname) {
  if (pathname.startsWith('/courses/new')) return 'New course';
  if (pathname.startsWith('/courses/edit')) return 'Edit course';
  const items = navSections.flatMap((section) => section.items);
  const match = items
    .filter((item) => (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match?.label || 'Dashboard';
}
