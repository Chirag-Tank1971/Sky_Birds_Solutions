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
const Dashboard = lazy(() => import("./pages/Dashboard"));
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
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <LazyPage component={Dashboard} />
                </ProtectedRoute>
              }
            />
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
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
