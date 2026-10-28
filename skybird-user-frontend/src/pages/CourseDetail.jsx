import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import PaymentModal from "../components/PaymentModal";
import { formatPrice } from "../data/courses";
import { fetchCourseById } from "../api/courses";
import { useUser } from "../context/UserContext";

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { hasCourse, isAuthenticated, refreshPurchased } = useUser();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetchCourseById(courseId);
        if (cancelled) return;
        if (res.success) setCourse(res.data);
        else setError("Course not found");
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load course");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-leaf border-t-transparent" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-ink/70">{error || "Course not found"}</p>
        <Link to="/courses" className="mt-4 inline-block text-forest underline">
          ← Back to courses
        </Link>
      </div>
    );
  }

  const owned = hasCourse(course.id);

  const handleBuy = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/courses/${course.id}` } });
      return;
    }
    setBuyError("");
    setPayOpen(true);
  };

  async function handleSuccess() {
    setBuying(true);
    setBuyError("");

    try {
      // Backend has already verified payment and granted course access.
      await refreshPurchased();

      setPayOpen(false);
      navigate(`/watch/${course.id}`);
    } catch (err) {
      setBuyError(
        "Payment may be successful, but course access could not be refreshed. Please reload the page.",
      );
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold capitalize text-forest">
            {course.platform}
          </p>
          <h1 className="mt-1 text-4xl font-bold">{course.title}</h1>
          <p className="mt-4 text-ink/70">{course.description}</p>
          {course.thumbnail ? (
            <img decoding="async" loading="lazy"
              src={course.thumbnail}
              alt=""
              className="mt-8 h-72 w-full rounded-2xl object-cover"
            />
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border border-forest/10 bg-white p-6 shadow-sm">
          <p className="text-3xl font-bold text-forest">
            {formatPrice(course.price)}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink/70">
            <li>{course.duration || "—"} of video</li>
            <li>{course.lessons || course.videos?.length || 0} lessons</li>
            <li>{course.level || "Beginner"} level</li>
            <li>Stream only after payment</li>
          </ul>
          {owned ? (
            <Link
              to={`/watch/${course.id}`}
              className="btn-shine mt-6 block rounded-full bg-leaf py-2.5 text-center font-semibold text-white hover:bg-forest"
            >
              Watch now
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBuy}
              className="btn-shine mt-6 w-full rounded-full bg-leaf py-2.5 font-semibold text-white hover:bg-forest"
            >
              Buy & unlock
            </button>
          )}
          {buyError ? (
            <p className="mt-3 text-center text-sm text-red-600">{buyError}</p>
          ) : null}
        </aside>
      </div>

      {course.videos?.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl font-bold">Lessons</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {course.videos.map((video, index) => (
              <div
                key={video.id || index}
                className="rounded-xl border border-forest/10 bg-white p-4"
              >
                <p className="text-xs font-semibold text-forest">
                  Lesson {index + 1}
                </p>
                <p className="mt-1 font-semibold">{video.title}</p>
                <p className="mt-2 text-xs text-ink/50">{video.duration}</p>
                {owned ? (
                  <Link
                    to={`/watch/${course.id}?v=${video.id}`}
                    className="mt-3 inline-block text-sm font-semibold text-leaf hover:text-forest"
                  >
                    Play →
                  </Link>
                ) : (
                  <p className="mt-3 text-xs text-ink/40">Unlock to watch</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {payOpen ? (
        <PaymentModal
          course={course}
          onClose={() => !buying && setPayOpen(false)}
          onSuccess={handleSuccess}
          processing={buying}
        />
      ) : null}
    </div>
  );
}
