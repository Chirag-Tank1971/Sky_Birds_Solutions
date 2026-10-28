import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
// Split secondary routes into separate chunks so the home page has less JS to parse.
const About = lazy(() => import("./pages/About"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Watch = lazy(() => import("./pages/Watch"));
const Login = lazy(() => import("./pages/Login"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailure = lazy(() => import("./pages/PaymentFailure"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));

function LazyPage({ component: Component }) {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-[#f7faf4]" aria-label="Loading page" />}>
      <Component />
    </Suspense>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useUser();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
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
            {/* <Route path="/services" element={<Services />} /> */}
            <Route path="/courses" element={<LazyPage component={Courses} />} />
            <Route path="/courses/:courseId" element={<LazyPage component={CourseDetail} />} />
            <Route path="/contact" element={<LazyPage component={Contact} />} />
            <Route path="/login" element={<LazyPage component={Login} />} />
            <Route path="/payment/success" element={<LazyPage component={PaymentSuccess} />} />
            <Route path="/payment/failure" element={<LazyPage component={PaymentFailure} />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
