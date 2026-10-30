import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import {
  Users, BookOpen, Layers, ShoppingCart, UserX, IndianRupee, TrendingUp, MessageSquare,
  ArrowRight, Plus, Settings, RefreshCw, Inbox,
} from 'lucide-react';

const inr = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const shortDate = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const timeAgo = (value) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return shortDate(value);
};
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

const KpiCard = ({ label, value, hint, icon: Icon, to }) => {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-primary-700">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-bold leading-none text-gray-900">{value}</p>
      <p className="mt-2 text-xs text-gray-500">{hint}</p>
    </>
  );
  return to ? (
    <Link to={to} className="card block p-5 transition hover:border-primary-300 hover:shadow-md">{body}</Link>
  ) : (
    <div className="card p-5">{body}</div>
  );
};

const CardHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const ViewAll = ({ to }) => (
  <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800">
    View all <ArrowRight className="h-3.5 w-3.5" />
  </Link>
);

const EmptyState = ({ icon: Icon = Inbox, title, text }) => (
  <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
    <span className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-400">
      <Icon className="h-5 w-5" />
    </span>
    <p className="mt-3 text-sm font-medium text-gray-700">{title}</p>
    {text && <p className="mt-1 max-w-xs text-xs text-gray-500">{text}</p>}
  </div>
);

// Single-series bar chart: bars anchored to the baseline, per-bar hover/focus tooltip, table for screen readers.
const RevenueChart = ({ data }) => {
  const [active, setActive] = useState(null);
  const max = Math.max(...data.map((d) => d.revenue), 0);
  const top = max > 0 ? max * 1.1 : 1;
  const empty = max === 0;

  return (
    <div className="px-5 pb-5 pt-4">
      <div className="relative h-56">
        {/* Recessive gridlines */}
        {[0, 0.5, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-dashed border-gray-100" style={{ bottom: `${f * 100}%` }}>
            {!empty && f > 0 && <span className="absolute -top-2.5 right-0 bg-white pl-1 text-[10px] text-gray-400">{inr(top * f)}</span>}
          </div>
        ))}

        <div className="absolute inset-0 flex items-end gap-1.5 pr-12">
          {data.map((d, i) => {
            const pct = (d.revenue / top) * 100;
            return (
              <button
                key={d.date}
                type="button"
                className="group relative flex h-full flex-1 items-end focus:outline-none"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${shortDate(d.date)}: ${inr(d.revenue)} from ${d.orders} orders`}
              >
                <span
                  className={`w-full rounded-t-[4px] transition-colors ${d.revenue > 0 ? 'bg-primary-500 group-hover:bg-primary-600 group-focus-visible:bg-primary-600' : 'bg-gray-100'}`}
                  style={{ height: d.revenue > 0 ? `${Math.max(pct, 2)}%` : '2px' }}
                />
                {active === i && (
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-left text-xs text-white shadow-lg">
                    <span className="block font-semibold">{inr(d.revenue)}</span>
                    <span className="block text-white/60">{shortDate(d.date)} · {d.orders} {d.orders === 1 ? 'order' : 'orders'}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {empty && (
          <div className="absolute inset-0 grid place-items-center pr-12">
            <p className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-card">No paid orders in the last 14 days</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-1.5 pr-12 text-[10px] text-gray-400">
        {data.map((d, i) => (
          <span key={d.date} className="flex-1 text-center">{i % 3 === 0 || i === data.length - 1 ? shortDate(d.date) : ''}</span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Revenue per day, last 14 days</caption>
        <thead><tr><th>Date</th><th>Revenue</th><th>Orders</th></tr></thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}><td>{shortDate(d.date)}</td><td>{inr(d.revenue)}</td><td>{d.orders}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Skeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-14 w-72 rounded-lg bg-gray-200/70" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-gray-200/70" />)}
    </div>
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="h-80 rounded-xl bg-gray-200/70 xl:col-span-2" />
      <div className="h-80 rounded-xl bg-gray-200/70" />
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const adminName = (() => {
    try { return JSON.parse(localStorage.getItem('adminUser') || '{}').name || ''; } catch { return ''; }
  })();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await API.get('/admin/stats');
      if (data.success) setStats(data.data);
      else setError(true);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading && !stats) return <Skeleton />;

  if (error && !stats) {
    return (
      <div className="card">
        <EmptyState icon={RefreshCw} title="Couldn't load the dashboard" text="Check your connection and try again." />
        <div className="flex justify-center pb-8">
          <button onClick={fetchStats} className="btn-secondary"><RefreshCw className="h-4 w-4" /> Retry</button>
        </div>
      </div>
    );
  }

  const s = stats || {};
  const trend = s.revenueTrend || [];
  const trendTotal = trend.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{greeting()}{adminName ? `, ${adminName.split(' ')[0]}` : ''}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchStats} disabled={loading} className="btn-secondary px-3" title="Refresh" aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/site-content" className="btn-secondary"><Settings className="h-4 w-4" /> Website</Link>
          <Link to="/courses/new" className="btn-primary"><Plus className="h-4 w-4" /> New course</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total revenue" value={inr(s.totalRevenue)} hint={`${s.paidOrders || 0} paid orders all time`} icon={IndianRupee} />
        <KpiCard label="Last 30 days" value={inr(s.revenue30d)} hint={`${s.orders30d || 0} orders in the last 30 days`} icon={TrendingUp} />
        <KpiCard label="Customers" value={(s.totalCustomers || 0).toLocaleString('en-IN')} hint={`+${s.newCustomers30d || 0} joined in the last 30 days`} icon={Users} to="/customers" />
        <KpiCard label="Open queries" value={s.newQueries || 0} hint={`${s.totalQueries || 0} queries in total`} icon={MessageSquare} to="/queries" />
      </div>

      {/* Revenue + attention */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <CardHeader title="Revenue, last 14 days" subtitle={`${inr(trendTotal)} from paid orders`} />
          <RevenueChart data={trend} />
        </div>

        <div className="card flex flex-col">
          <CardHeader title="Needs attention" subtitle="New customer queries" action={<ViewAll to="/queries" />} />
          {(s.recentQueries || []).length ? (
            <ul className="divide-y divide-gray-100">
              {s.recentQueries.map((q) => (
                <li key={q._id}>
                  <Link to="/queries" className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-gray-50">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">{q.subject || 'No subject'}</span>
                      <span className="block truncate text-xs text-gray-500">{q.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">{timeAgo(q.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="All caught up" text="No new queries waiting for a reply." />
          )}
          {s.blockedCustomers > 0 && (
            <Link to="/customers" className="mt-auto flex items-center gap-2 border-t border-gray-100 px-5 py-3 text-xs font-medium text-red-600 hover:bg-red-50">
              <UserX className="h-4 w-4" /> {s.blockedCustomers} blocked {s.blockedCustomers === 1 ? 'customer' : 'customers'}
            </Link>
          )}
        </div>
      </div>

      {/* Recent purchases + sign-ups */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <CardHeader title="Recent purchases" subtitle="Latest paid orders" />
          {(s.recentPayments || []).length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                    <th className="px-5 py-2.5">Customer</th>
                    <th className="px-5 py-2.5">Course</th>
                    <th className="px-5 py-2.5 text-right">Amount</th>
                    <th className="px-5 py-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {s.recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="max-w-[180px] truncate px-5 py-3 font-medium text-gray-900">{p.customer}</td>
                      <td className="max-w-[240px] px-5 py-3 text-gray-600">
                        <span className="block truncate">{p.courseTitle || '—'}</span>
                        {p.couponCode && <span className="mt-0.5 inline-block rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700">{p.couponCode}</span>}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-gray-900">{inr(p.amount)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-gray-500">{shortDate(p.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={ShoppingCart} title="No purchases yet" text="Paid orders will appear here as soon as customers buy a course." />
          )}
        </div>

        <div className="card">
          <CardHeader title="New sign-ups" subtitle="Latest customers" action={<ViewAll to="/customers" />} />
          {(s.recentCustomers || []).length ? (
            <ul className="divide-y divide-gray-100">
              {s.recentCustomers.map((c) => (
                <li key={c._id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
                    {(c.name || c.email || '?').trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">{c.name || 'Unnamed'}</span>
                    <span className="block truncate text-xs text-gray-500">{c.mobile ? `+91 ${c.mobile}` : c.email}{c.profession ? ` · ${c.profession}` : ''}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Users} title="No customers yet" />
          )}
        </div>
      </div>

      {/* Catalog */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active courses', value: s.totalCourses, icon: BookOpen, to: '/courses' },
          { label: 'Platforms', value: s.totalPlatforms, icon: Layers, to: '/platforms' },
          { label: 'Course enrollments', value: s.totalPurchases, icon: ShoppingCart, to: '/customers' },
        ].map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="card flex items-center gap-4 p-4 transition hover:border-primary-300">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gray-100 text-gray-600"><Icon className="h-5 w-5" /></span>
            <span>
              <span className="block text-xl font-bold text-gray-900">{value ?? 0}</span>
              <span className="block text-xs text-gray-500">{label}</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
