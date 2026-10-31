import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import Layout from "./components/Layout";
import TopLoader from "./components/TopLoader";
import PageReveal from "./components/PageReveal";
import Home from "./pages/Home";
// Split secondary routes into separate chunks so the home page has less JS to parse.
const About = lazy(() => import("./pages/About"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const MyCourses = lazy(() => import("./pages/dashboard/MyCourses"));
const Transactions = lazy(() => import("./pages/dashboard/Transactions"));
const History = lazy(() => import("./pages/dashboard/History"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const ComingSoon = lazy(() => import("./pages/dashboard/ComingSoon"));
const Watch = lazy(() => import("./pages/Watch"));
const Login = lazy(() => import("./pages/Login"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

function LazyPage({ component: Component }) {
  return (
    <Suspense fallback={<><TopLoader /><div className="min-h-[60vh] bg-canvas" /></>}>
      <PageReveal>
        <Component />
      </PageReveal>
    </Suspense>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useUser();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<LazyPage component={About} />} />
            <Route path="/courses" element={<LazyPage component={Courses} />} />
            <Route path="/courses/:courseId" element={<LazyPage component={CourseDetail} />} />
            <Route path="/contact" element={<LazyPage component={Contact} />} />
            <Route path="/login" element={<LazyPage component={Login} />} />
            <Route path="/privacy-policy" element={<LazyPage component={PrivacyPolicy} />} />
            <Route path="/terms" element={<LazyPage component={Terms} />} />
            <Route
              path="/watch/:courseId"
              element={
                <ProtectedRoute>
                  <LazyPage component={Watch} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<LazyPage component={NotFound} />} />
          </Route>
          {/* The learner dashboard has its own sidebar, so it sits outside the site Layout. */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Suspense fallback={<TopLoader />}>
                  <DashboardLayout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route index element={<LazyPage component={MyCourses} />} />
            <Route path="explore" element={<LazyPage component={Courses} />} />
            <Route path="history" element={<LazyPage component={History} />} />
            <Route path="sessions" element={<LazyPage component={ComingSoon} />} />
            <Route path="communities" element={<LazyPage component={ComingSoon} />} />
            <Route path="assessments" element={<LazyPage component={ComingSoon} />} />
            <Route path="transactions" element={<LazyPage component={Transactions} />} />
            <Route path="rewards" element={<LazyPage component={ComingSoon} />} />
            <Route path="settings" element={<LazyPage component={Settings} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
