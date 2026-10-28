import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { 
  Users, BookOpen, Layers, ShoppingCart, 
  UserX, TrendingUp, ArrowRight 
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, link }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    {link && (
      <Link to={link} className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-4 font-medium">
        View all <ArrowRight className="w-4 h-4" />
      </Link>
    )}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/admin/stats');
        if (data.success) setStats(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your course platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers ?? 0}
          icon={Users}
          color="bg-blue-500"
          link="/customers"
        />
        <StatCard
          title="Active Courses"
          value={stats?.totalCourses ?? 0}
          icon={BookOpen}
          color="bg-green-500"
          link="/courses"
        />
        <StatCard
          title="Platforms"
          value={stats?.totalPlatforms ?? 0}
          icon={Layers}
          color="bg-purple-500"
          link="/platforms"
        />
        <StatCard
          title="Total Purchases"
          value={stats?.totalPurchases ?? 0}
          icon={ShoppingCart}
          color="bg-orange-500"
        />
        <StatCard
          title="Blocked Customers"
          value={stats?.blockedCustomers ?? 0}
          icon={UserX}
          color="bg-red-500"
          link="/customers"
        />
        <StatCard
          title="Revenue Potential"
          value="—"
          icon={TrendingUp}
          color="bg-teal-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/courses/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            <BookOpen className="w-4 h-4" />
            Add New Course
          </Link>
          <Link
            to="/platforms"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            <Layers className="w-4 h-4" />
            Manage Platforms
          </Link>
          <Link
            to="/customers"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            <Users className="w-4 h-4" />
            View Customers
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
