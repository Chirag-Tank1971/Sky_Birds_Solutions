import { useEffect, useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Search, Ban, CheckCircle, Trash2, Eye, X } from 'lucide-react';

// Deleted customers are kept as past users; their old mobile/email live in pastMobile/pastEmail.
const isPast = (c) => Boolean(c.deletedAt);
const mobileOf = (c) => c.mobile || c.pastMobile || '';
const emailOf = (c) => c.email || c.pastEmail || '';
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'past', label: 'Past users' },
];

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchCustomers = async () => {
    try {
      const { data } = await API.get('/admin/customers');
      if (data.success) setCustomers(data.data);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const toggleBlock = async (customer) => {
    try {
      await API.put(`/admin/customers/${customer._id}`, {
        isBlocked: !customer.isBlocked,
      });
      toast.success(customer.isBlocked ? 'Customer unblocked' : 'Customer blocked');
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer? They will be signed out, can no longer log in, and will be listed as a past user.')) return;
    try {
      await API.delete(`/admin/customers/${id}`);
      toast.success('Customer moved to past users');
      setSelected(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const pastCount = customers.filter(isPast).length;
  const activeCount = customers.length - pastCount;
  const counts = { all: customers.length, active: activeCount, past: pastCount };
  const query = search.trim().toLowerCase();
  const filtered = customers
    .filter((c) => (filter === 'all' ? true : filter === 'past' ? isPast(c) : !isPast(c)))
    .filter(
      (c) =>
        !query ||
        mobileOf(c).includes(query) ||
        (c.name && c.name.toLowerCase().includes(query)) ||
        emailOf(c).includes(query)
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 mt-1">
          {activeCount} active {activeCount === 1 ? 'customer' : 'customers'}
          {pastCount > 0 && ` · ${pastCount} past ${pastCount === 1 ? 'user' : 'users'}`}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Status filter */}
      <div className="inline-flex self-start rounded-lg border border-gray-200 bg-white p-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              filter === key ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label} <span className={filter === key ? 'text-white/70' : 'text-gray-400'}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by mobile, name or email..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Mobile</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Purchases</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Joined</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c._id} className={`hover:bg-gray-50 ${isPast(c) ? 'bg-gray-50/60' : ''}`}>
                  <td className="px-6 py-4">
                    <p className={`text-sm font-medium ${isPast(c) ? 'text-gray-500' : 'text-gray-900'}`}>{c.name || '—'}</p>
                    {emailOf(c) && <p className="text-xs text-gray-500">{emailOf(c)}</p>}
                    {(c.profession || c.age) && (
                      <p className="text-xs text-gray-400">{[c.profession, c.age && `${c.age} yrs`].filter(Boolean).join(' · ')}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{mobileOf(c) || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {c.purchasedCourses?.length || 0} courses
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    {isPast(c) ? (
                      <>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">Past user</span>
                        <p className="mt-1 text-xs text-gray-400">Deleted {new Date(c.deletedAt).toLocaleDateString('en-IN')}</p>
                      </>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {c.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelected(c)}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!isPast(c) && (<>
                      <button
                        onClick={() => toggleBlock(c)}
                        className={`p-1.5 rounded-lg transition ${
                          c.isBlocked
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-orange-500 hover:bg-orange-50'
                        }`}
                        title={c.isBlocked ? 'Unblock' : 'Block'}
                      >
                        {c.isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Customer Details</h3>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Name</p>
                  <p className="text-sm font-medium">{selected.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Mobile</p>
                  <p className="text-sm font-medium font-mono">{mobileOf(selected) || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase">Email</p>
                  <p className="text-sm font-medium break-all">{emailOf(selected) || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  {isPast(selected) ? (
                    <p className="text-sm font-medium text-gray-600">
                      Past user · deleted {new Date(selected.deletedAt).toLocaleDateString('en-IN')}
                    </p>
                  ) : (
                    <p className={`text-sm font-medium ${selected.isBlocked ? 'text-red-600' : 'text-green-600'}`}>
                      {selected.isBlocked ? 'Blocked' : 'Active'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Joined</p>
                  <p className="text-sm font-medium">
                    {new Date(selected.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">
                  Purchased Courses ({selected.purchasedCourses?.length || 0})
                </p>
                {selected.purchasedCourses?.length > 0 ? (
                  <div className="space-y-2">
                    {selected.purchasedCourses.map((item, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium">
                          {item.course?.title || item.course?.id || 'Course'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Purchased: {new Date(item.purchasedAt).toLocaleDateString('en-IN')}
                          {item.course?.price && ` • ₹${item.course.price}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No purchases yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
