import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Compass, PlayCircle, Search, ShieldCheck } from "lucide-react";
import CourseCard from "../../components/CourseCard";
import RollText from "../../components/RollText";
import WatchHistoryList from "../../components/WatchHistoryList";
import { getWatchHistory } from "../../api/auth";
import { useUser } from "../../context/UserContext";

export default function MyCourses() {
  const { purchasedCourses, purchasesStatus, refreshPurchased } = useUser();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getWatchHistory()
      .then((res) => {
        if (!cancelled) setRecent((res.data || []).filter((item) => !item.locked).slice(0, 3));
      })
      .catch(() => {
        // Optional section: the courses below still work without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = async () => {
    setLoading(true);
    await refreshPurchased();
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    refreshPurchased().then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshPurchased]);

  const owned = useMemo(() => purchasedCourses || [], [purchasedCourses]);
  const platforms = useMemo(() => [...new Set(owned.map((course) => course.platform).filter(Boolean))], [owned]);
  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return owned.filter(
      (course) =>
        (platform === "all" || course.platform === platform) &&
        (!text || (course.title || "").toLowerCase().includes(text))
    );
  }, [owned, query, platform]);

  const failed = purchasesStatus === "error" && owned.length === 0;
  const stats = [
    { label: "Purchased courses", value: failed ? "—" : owned.length, icon: BookOpen },
    {
      label: "Ready to learn",
      value: failed ? "—" : owned.filter((course) => course.status !== "upcoming").length,
      icon: PlayCircle,
    },
    { label: "Account status", value: "Active", icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest">Your learning journey</p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">Keep your momentum going.</h1>
          <p className="mt-2 text-ink/65">Pick up where you left off and continue learning.</p>
        </div>
        <Link
          to="/dashboard/explore"
          className="inline-flex items-center gap-2 rounded-full bg-[#10251D] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest"
        >
          <Compass size={16} /> <RollText>Explore courses</RollText> <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-forest/10 bg-white p-5 shadow-[0_24px_50px_-35px_rgba(16,37,29,0.35)]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/60">{label}</p>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest">
                <Icon size={18} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>

      {recent.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-forest/10 bg-white p-5 shadow-[0_24px_50px_-35px_rgba(16,37,29,0.35)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-ink">Continue watching</h2>
              <p className="mt-0.5 text-sm text-ink/55">Pick up right where you stopped.</p>
            </div>
            <Link to="/dashboard/history" className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:text-leaf">
              View all history <ArrowRight size={15} />
            </Link>
          </div>
          <WatchHistoryList items={recent} />
        </section>
      ) : null}

      <section className="mt-6 rounded-3xl border border-forest/10 bg-white p-5 shadow-[0_24px_50px_-35px_rgba(16,37,29,0.35)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">Your library</h2>
            <p className="mt-0.5 text-sm text-ink/55">All the courses you have access to, in one place.</p>
          </div>
          {owned.length > 0 ? (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <label className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
                <span className="sr-only">Search your courses</span>
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your courses"
                  className="w-full rounded-xl border border-forest/20 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30"
                />
              </label>
              <label>
                <span className="sr-only">Filter by platform</span>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="rounded-xl border border-forest/20 bg-white px-3 py-2.5 text-sm capitalize outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30"
                >
                  <option value="all">All platforms</option>
                  {platforms.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center pb-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-leaf border-t-transparent" />
          </div>
        ) : failed ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert">
            <p className="text-red-700">We couldn't load your courses. Please check your connection and try again.</p>
            <button type="button" onClick={retry} className="mt-4 rounded-full bg-leaf px-5 py-2 text-sm font-semibold text-white hover:bg-forest">
              <RollText>Try again</RollText>
            </button>
          </div>
        ) : owned.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-forest/30 bg-mint/40 p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white text-forest">
              <BookOpen size={20} />
            </span>
            <p className="mt-4 font-semibold text-ink">Your learning library is waiting</p>
            <p className="mt-1 text-sm text-ink/60">Once you purchase a course, it will appear here so you can start learning.</p>
            <Link to="/dashboard/explore" className="mt-5 inline-block rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-[#10251D] transition-colors hover:bg-forest hover:text-white">
              <RollText>Browse courses</RollText>
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-8 pb-4 text-center text-sm text-ink/60">No courses match your search.</p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((course) => (
              <CourseCard key={course.id || course._id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
