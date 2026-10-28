import { useEffect, useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  X
} from 'lucide-react';

const Queries = () => {
  const [queries, setQueries] = useState([]);
  const [counts, setCounts] = useState({ total: 0, new: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (search) params.search = search;

      const { data } = await API.get('/admin/contacts', { params });
      if (data.success) {
        setQueries(data.data || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      toast.error('Failed to load contact queries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQueries();
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const { data } = await API.put(`/admin/contacts/${id}/status`, { status: newStatus });
      if (data.success) {
        toast.success('Status updated');
        setQueries((prev) =>
          prev.map((q) => (q._id === id ? { ...q, status: newStatus } : q))
        );
        if (selectedQuery && selectedQuery._id === id) {
          setSelectedQuery((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this query?')) return;
    try {
      const { data } = await API.delete(`/admin/contacts/${id}`);
      if (data.success) {
        toast.success('Query deleted');
        setQueries((prev) => prev.filter((q) => q._id !== id));
        if (selectedQuery && selectedQuery._id === id) {
          setSelectedQuery(null);
        }
      }
    } catch (err) {
      toast.error('Failed to delete query');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            New
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <CheckCircle2 className="w-3 h-3 text-gray-500" />
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Queries</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and respond to marketplace inquiries and onboarding requests
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            activeTab === 'all'
              ? 'bg-primary-50/50 border-primary-500 ring-2 ring-primary-500/20'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-xs font-medium text-gray-500">Total Queries</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{counts.total}</p>
        </div>

        <div
          onClick={() => setActiveTab('new')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            activeTab === 'new'
              ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-xs font-medium text-emerald-600">New Inquiries</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{counts.new}</p>
        </div>

        <div
          onClick={() => setActiveTab('in_progress')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            activeTab === 'in_progress'
              ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-xs font-medium text-amber-600">In Progress</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{counts.inProgress}</p>
        </div>

        <div
          onClick={() => setActiveTab('resolved')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            activeTab === 'resolved'
              ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-400/20'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-xs font-medium text-gray-500">Resolved</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">{counts.resolved}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveTab('all');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : queries.length === 0 ? (
          <div className="text-center py-16 px-4">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No customer queries found</p>
            <p className="text-gray-400 text-sm mt-1">Inquiries submitted on the website will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {queries.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-900">{q.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{q.email}</p>
                      {q.phone && <p className="text-xs text-gray-400">{q.phone}</p>}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-medium text-gray-900 truncate">{q.subject}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{q.message}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(q.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={q.status}
                        onChange={(e) => handleStatusChange(q._id, e.target.value)}
                        disabled={updatingId === q._id}
                        className="text-xs font-semibold rounded-lg border border-gray-200 px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                      >
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setSelectedQuery(q)}
                        title="View Details"
                        className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q._id)}
                        title="Delete Query"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Query Detail Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{selectedQuery.subject}</h3>
                  {getStatusBadge(selectedQuery.status)}
                </div>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selectedQuery.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuery(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl text-sm">
              <div>
                <span className="text-xs font-medium text-gray-400 block">From</span>
                <span className="font-semibold text-gray-900">{selectedQuery.name}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-400 block">Email</span>
                <a
                  href={`mailto:${selectedQuery.email}`}
                  className="text-primary-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {selectedQuery.email}
                </a>
              </div>
              {selectedQuery.phone && (
                <div className="col-span-2">
                  <span className="text-xs font-medium text-gray-400 block">Phone</span>
                  <a
                    href={`tel:${selectedQuery.phone}`}
                    className="text-gray-800 flex items-center gap-1 font-medium"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {selectedQuery.phone}
                  </a>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                Message
              </label>
              <div className="bg-gray-50 p-4 rounded-xl text-gray-800 text-sm whitespace-pre-wrap leading-relaxed border border-gray-100">
                {selectedQuery.message}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Status:</span>
                <select
                  value={selectedQuery.status}
                  onChange={(e) => handleStatusChange(selectedQuery._id, e.target.value)}
                  className="text-xs font-semibold rounded-lg border border-gray-300 px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <button
                onClick={() => setSelectedQuery(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Queries;
