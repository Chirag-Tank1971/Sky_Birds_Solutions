import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { assetUrl } from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Search } from 'lucide-react';

const STATUS_STYLES = {
  live: 'bg-green-50 text-green-800 border-green-200',
  upcoming: 'bg-amber-50 text-amber-800 border-amber-200',
  private: 'bg-blue-50 text-blue-800 border-blue-200',
  unlive: 'bg-gray-100 text-gray-700 border-gray-200',
};
const statusOf = (course) => course.status || (course.isActive === false ? 'unlive' : 'live');

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCourses = async () => {
    try {
      const { data } = await API.get('/admin/courses');
      if (data.success) setCourses(data.data);
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const changeStatus = async (course, status) => {
    try {
      const { data } = await API.patch(`/admin/courses/${course.id}/status`, { status });
      setCourses((prev) => prev.map((c) => (c._id === course._id ? { ...c, ...data.data } : c)));
      toast.success(data.message || 'Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change the status');
    }
  };

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.platform.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-500 mt-1">{courses.length} total courses</p>
        </div>
        <Link
          to="/courses/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium self-start"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Course</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Platform</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Price</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Level</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Videos</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {c.thumbnail ? (
                        <img
                          src={assetUrl(c.thumbnail)}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                          No img
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.title}</p>
                        <p className="text-xs text-gray-500 font-mono">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {c.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{c.price}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.level}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.videos?.length || 0}</td>
                  <td className="px-6 py-4">
                    <select
                      value={statusOf(c)}
                      onChange={(e) => changeStatus(c, e.target.value)}
                      aria-label={`Status of ${c.title}`}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary-500 ${STATUS_STYLES[statusOf(c)]}`}
                    >
                      <option value="live">Live</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="private">Private</option>
                      <option value="unlive">Unlive</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/courses/edit/${c.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Manage
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    No courses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Courses;
