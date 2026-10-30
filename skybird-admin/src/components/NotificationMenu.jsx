import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  MessageSquare,
  ShoppingCart,
  UserPlus,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCheck,
  Loader2,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const REFRESH_MS = 60 * 1000;

const ACTIVITY_ICONS = {
  query: { icon: MessageSquare, className: 'bg-blue-50 text-blue-600' },
  purchase: { icon: ShoppingCart, className: 'bg-green-50 text-green-600' },
  signup: { icon: UserPlus, className: 'bg-purple-50 text-purple-600' },
};

const ALERT_STYLES = {
  error: { icon: AlertCircle, className: 'bg-red-50 text-red-600', border: 'border-red-100' },
  warning: { icon: AlertTriangle, className: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
  info: { icon: Info, className: 'bg-sky-50 text-sky-600', border: 'border-sky-100' },
};

function timeAgo(value) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const NotificationMenu = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], alerts: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingRead, setMarkingRead] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await API.get('/admin/notifications');
      if (res.success) {
        // Default every field so a partial response can't crash the whole admin layout.
        setData({ items: res.data?.items || [], alerts: res.data?.alerts || [], unreadCount: res.data?.unreadCount || 0 });
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load now, every minute, and whenever the tab regains focus.
  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    window.addEventListener('focus', load);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, [load]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    setOpen((value) => !value);
    if (!open) load();
  };

  const markAllRead = async () => {
    setMarkingRead(true);
    try {
      await API.post('/admin/notifications/read-all');
      setData((prev) => ({ ...prev, unreadCount: 0, items: prev.items.map((item) => ({ ...item, unread: false })) }));
    } catch {
      toast.error('Could not mark notifications as read');
    } finally {
      setMarkingRead(false);
    }
  };

  const go = (link) => {
    if (!link) return;
    setOpen(false);
    navigate(link);
  };

  const { items, alerts, unreadCount } = data;
  const urgentAlerts = alerts.filter((alert) => alert.level !== 'info').length;
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}${urgentAlerts ? `, ${urgentAlerts} need attention` : ''}`}
        className="relative p-2 rounded-lg hover:bg-gray-100"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {badgeLabel}
          </span>
        ) : urgentAlerts > 0 ? (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
        ) : null}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={load}
                title="Refresh"
                aria-label="Refresh notifications"
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={markAllRead}
                disabled={!unreadCount || markingRead}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                {markingRead ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                Mark all read
              </button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : error && !items.length && !alerts.length ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button type="button" onClick={load} className="mt-2 text-sm font-medium text-primary-700 hover:underline">
                  Try again
                </button>
              </div>
            ) : (
              <>
                {alerts.length > 0 && (
                  <section className="border-b border-gray-100 px-3 py-3">
                    <h4 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Needs attention
                    </h4>
                    <ul className="space-y-2">
                      {alerts.map((alert) => {
                        const style = ALERT_STYLES[alert.level] || ALERT_STYLES.info;
                        const Icon = style.icon;
                        const Tag = alert.link ? 'button' : 'div';
                        return (
                          <li key={alert.id}>
                            <Tag
                              {...(alert.link ? { type: 'button', onClick: () => go(alert.link) } : {})}
                              className={`flex w-full items-start gap-3 rounded-lg border ${style.border} p-2.5 text-left ${alert.link ? 'hover:bg-gray-50' : ''}`}
                            >
                              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.className}`}>
                                <Icon className="w-4 h-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-gray-900">{alert.title}</span>
                                <span className="mt-0.5 block text-xs leading-relaxed text-gray-600">{alert.message}</span>
                              </span>
                              {alert.link && <ChevronRight className="mt-1.5 w-4 h-4 shrink-0 text-gray-300" />}
                            </Tag>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                <section className="px-3 py-3">
                  <h4 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Recent activity
                  </h4>
                  {items.length === 0 ? (
                    <p className="px-1 py-6 text-center text-sm text-gray-500">No activity in the last 30 days.</p>
                  ) : (
                    <ul className="space-y-1">
                      {items.map((item) => {
                        const style = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.query;
                        const Icon = style.icon;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => go(item.link)}
                              className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover:bg-gray-50 ${item.unread ? 'bg-primary-50/40' : ''}`}
                            >
                              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.className}`}>
                                <Icon className="w-4 h-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className={`block text-sm ${item.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                  {item.title}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-gray-600">{item.message}</span>
                                <span className="mt-0.5 block text-[11px] text-gray-400">{timeAgo(item.createdAt)}</span>
                              </span>
                              {item.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-label="Unread" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
