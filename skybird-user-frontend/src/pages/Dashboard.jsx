import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { formatPrice } from "../data/courses"
import { useUser } from "../context/UserContext"
import RollText from "../components/RollText";
import AccountDetails from "../components/AccountDetails";
import { ArrowRight, BookOpen, Headset } from "lucide-react";

export default function Dashboard() {
  const { user, purchasedCourses, purchasesStatus, refreshPurchased } = useUser()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await refreshPurchased()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [refreshPurchased])

  const owned = purchasedCourses || []

  const retry = async () => {
    setLoading(true)
    await refreshPurchased()
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest">
        My dashboard
      </p>
      <h1 className="mt-2 text-4xl font-bold">
        Hello, {user?.name || "Learner"}
      </h1>
      <p className="mt-2 text-ink/70">
        {user?.mobile || user?.email
          ? `Logged in with ${user.mobile ? `+91 ${user.mobile}` : user.email}`
          : "Your purchased courses appear here."}
      </p>

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-[1fr_300px]">
        <AccountDetails />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-3xl border border-forest/10 bg-white p-6 shadow-[0_24px_50px_-35px_rgba(16,37,29,0.35)]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-forest">
              <BookOpen className="h-5 w-5" />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink/45">Your courses</p>
            <p className="mt-1 text-4xl font-bold text-ink">
              {purchasesStatus === "error" && owned.length === 0 ? "—" : owned.length}
            </p>
            <p className="mt-1 text-sm text-ink/55">{owned.length === 1 ? "course unlocked" : "courses unlocked"}</p>
            <Link
              to="/courses"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-leaf"
            >
              Browse courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-[#10251D] p-6 text-white">
            <div className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-leaf/25 blur-3xl" />
            <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-leaf">
              <Headset className="h-5 w-5" />
            </span>
            <p className="relative mt-4 text-lg font-bold">Need help?</p>
            <p className="relative mt-1 text-sm text-white/60">Questions about a course or your account? Our team usually replies the same business day.</p>
            <Link
              to="/contact"
              className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-[#10251D] transition hover:bg-white"
            >
              Contact support <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <h2 className="mt-12 text-2xl font-bold">Your courses</h2>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-leaf border-t-transparent" />
        </div>
      ) : purchasesStatus === "error" && owned.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert">
          <p className="text-red-700">We couldn't load your courses. Please check your connection and try again.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 inline-block rounded-full bg-leaf px-5 py-2 text-sm font-semibold text-white"
          >
            <RollText>Try again</RollText>
          </button>
        </div>
      ) : owned.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-forest/30 bg-mint/50 p-8 text-center">
          <p className="text-ink/70">No courses yet. Buy a course to unlock videos.</p>
          <Link
            to="/courses"
            className="mt-4 inline-block rounded-full bg-leaf px-5 py-2 text-sm font-semibold text-white"
          >
            <RollText>Browse courses</RollText>
          </Link>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-forest/10 overflow-hidden rounded-2xl border border-forest/10 bg-white">
          {owned.map((course) => (
            <div
              key={course.id || course._id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                {course.thumbnail ? (
                  <img decoding="async" loading="lazy"
                    src={course.thumbnail}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : null}
                <div>
                  <p className="font-semibold">{course.title}</p>
                  <p className="text-sm capitalize text-ink/50">
                    {course.platform}
                    {course.duration ? ` · ${course.duration}` : ""}
                    {course.price != null ? ` · ${formatPrice(course.price)}` : ""}
                  </p>
                  {course.purchasedAt ? (
                    <p className="text-xs text-ink/40">
                      Purchased{" "}
                      {new Date(course.purchasedAt).toLocaleDateString("en-IN")}
                    </p>
                  ) : null}
                </div>
              </div>
              <Link
                to={`/watch/${course.id}`}
                className="rounded-full bg-leaf px-4 py-1.5 text-sm font-semibold text-white hover:bg-forest"
              >
                <RollText>Watch</RollText>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
