import { useEffect, useMemo, useState } from "react";
import CourseCard from "../components/CourseCard";
import { fetchCourses, fetchPlatforms } from "../api/courses";

export default function Courses() {
  const [platform, setPlatform] = useState("all");
  const [courses, setCourses] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [courseRes, platformRes] = await Promise.all([
          fetchCourses(),
          fetchPlatforms(),
        ]);
        if (cancelled) return;
        if (courseRes.success) setCourses(courseRes.data || []);
        if (platformRes.success) setPlatforms(platformRes.data || []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Failed to load courses. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (platform === "all") return courses;
    return courses.filter((course) => course.platform === platform);
  }, [platform, courses]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          E-Commerce Growth Masterclasses
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink/65">
          Practical video training for online marketplace sellers.
          Learn step-by-step strategies for product launch, rank boosting, and ads management.
        </p>
      </div>

      {/* Segmented filter, centred */}
      <div className="mt-10 flex justify-center">
        <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-full bg-black/[0.05] p-1.5">
        <FilterChip
          active={platform === "all"}
          onClick={() => setPlatform("all")}
        >
          All Platforms
        </FilterChip>
        {platforms.map((item) => (
          <FilterChip
            key={item.id}
            active={platform === item.id}
            onClick={() => setPlatform(item.id)}
          >
            {item.name}
          </FilterChip>
        ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-16 flex flex-col items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-leaf border-t-transparent" />
          <p className="mt-4 text-sm text-ink/60 font-medium">Loading marketplace courses...</p>
        </div>
      ) : error ? (
        <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-block px-5 py-2 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
          >
            Retry Loading
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-forest/30 bg-mint/40 p-12 text-center text-ink/60">
          <p className="text-base font-semibold">No courses found for this filter.</p>
          <p className="text-xs mt-1 text-ink/50">Check back soon for new seller training batches!</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((course) => (
            <div key={course.id || course._id}>
              <CourseCard course={course} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition-colors ${
        active
          ? "bg-[#10251D] text-white shadow-sm"
          : "text-ink/75 hover:bg-white hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
