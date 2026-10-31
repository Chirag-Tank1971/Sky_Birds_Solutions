import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Platforms from './pages/Platforms';
import Courses from './pages/Courses';
import CourseForm from './pages/CourseForm';
import Customers from './pages/Customers';
import Queries from './pages/Queries';
import SiteContent from './pages/SiteContent';
import Testimonials from './pages/Testimonials';
import Coupons from './pages/Coupons';
import LearnerContent from './pages/LearnerContent';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="platforms" element={<Platforms />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/new" element={<CourseForm />} />
        <Route path="courses/edit/:id" element={<CourseForm />} />
        <Route path="customers" element={<Customers />} />
        <Route path="queries" element={<Queries />} />
        <Route path="site-content" element={<SiteContent />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="learning-hub" element={<LearnerContent />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
