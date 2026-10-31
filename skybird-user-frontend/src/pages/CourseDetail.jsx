import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Lock, PlayCircle } from "lucide-react";
import PaymentModal from "../components/PaymentModal";
import { formatPrice } from "../data/courses";
import { groupLessons, moduleSummary } from "../data/courseModules";
import { fetchCourseById } from "../api/courses";
import { useUser } from "../context/UserContext";
import RollText from "../components/RollText";
import Shine from "../components/Shine";

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

  // The tab shows the course name (SiteSEO leaves course pages to set their own title).
  useEffect(() => {
    if (course?.title) document.title = `${course.title} | Sky Birds Solution`;
  }, [course?.title]);

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
  const groups = groupLessons(course);
  const summary = moduleSummary(course);
  const orderedLessons = groups.flatMap((group) => group.lessons);

  const lessonCard = (video) => (
    <div
      key={video.id}
      className={`relative overflow-hidden rounded-xl border p-4 ${
        video.upcoming ? "border-dashed border-forest/20 bg-[#f4f6f2]" : "border-forest/10 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-forest">Lesson {orderedLessons.indexOf(video) + 1}</p>
        {video.upcoming ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            <Lock size={11} /> Upcoming
          </span>
        ) : null}
      </div>
      <p className={`mt-1 font-semibold ${video.upcoming ? "text-ink/60" : ""}`}>{video.title}</p>
      <p className="mt-2 text-xs text-ink/50">{video.duration}</p>
      {video.upcoming ? (
        <p className="mt-3 text-xs font-medium text-ink/45">Unlocks soon</p>
      ) : owned ? (
        <Link
          to={`/watch/${course.id}?v=${video.id}`}
          className="mt-3 inline-block text-sm font-semibold text-leaf hover:text-forest"
        >
          <PlayCircle size={15} className="mr-1 inline -mt-0.5" />Play →
        </Link>
      ) : (
        <p className="mt-3 text-xs text-ink/40">Unlock to watch</p>
      )}
    </div>
  );

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
    } catch {
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
            <li>
              {(course.videos || []).filter((video) => !video.upcoming).length || course.lessons || 0} lessons
              {(course.videos || []).some((video) => video.upcoming)
                ? ` + ${course.videos.filter((video) => video.upcoming).length} upcoming`
                : ""}
            </li>
            {summary ? <li>{summary}</li> : null}
            <li>{course.level || "Beginner"} level</li>
            <li>Stream only after payment</li>
          </ul>
          {owned ? (
            <Link
              to={`/watch/${course.id}`}
              className="relative overflow-hidden mt-6 block rounded-full bg-leaf py-2.5 text-center font-semibold text-white hover:bg-forest"
            >
              <Shine />
              <RollText>Watch now</RollText>
            </Link>
          ) : course.status === "upcoming" ? (
            <div className="mt-6 rounded-2xl bg-mint/60 px-4 py-3 text-center">
              <p className="font-semibold text-forest">Coming soon</p>
              <p className="mt-0.5 text-xs text-ink/60">This course isn't open for enrolment yet. Check back soon.</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleBuy}
              className="relative overflow-hidden mt-6 w-full rounded-full bg-leaf py-2.5 font-semibold text-white hover:bg-forest"
            >
              <Shine />
              <RollText>Buy & unlock</RollText>
            </button>
          )}
          {buyError ? (
            <p className="mt-3 text-center text-sm text-red-600">{buyError}</p>
          ) : null}
        </aside>
      </div>

      {course.videos?.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl font-bold">{summary ? "Course modules" : "Lessons"}</h2>
          {summary ? (
            <div className="mt-4 space-y-3">
              {groups.map((group, index) => (
                <details key={group.id || "content"} open={index === 0} className="group/module overflow-hidden rounded-2xl border border-forest/10 bg-white">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-ink">{group.title}</h3>
                      {group.description ? <p className="mt-0.5 text-sm text-ink/60">{group.description}</p> : null}
                      <p className="mt-1 text-xs text-ink/50">{group.lessons.length} {group.lessons.length === 1 ? "lesson" : "lessons"}</p>
                    </div>
                    {group.upcoming ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                        <Lock size={11} /> Coming soon
                      </span>
                    ) : null}
                    <ChevronDown size={18} className="shrink-0 text-ink/50 transition-transform group-open/module:rotate-180" />
                  </summary>
                  <div className="grid gap-3 border-t border-forest/10 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.lessons.map(lessonCard)}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {orderedLessons.map(lessonCard)}
            </div>
          )}
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
