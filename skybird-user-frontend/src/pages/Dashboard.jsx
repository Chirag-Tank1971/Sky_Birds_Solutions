import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { formatPrice } from "../data/courses"
import { useUser } from "../context/UserContext"
import RollText from "../components/RollText";

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

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Owned courses"
          value={purchasesStatus === "error" && owned.length === 0 ? "—" : owned.length}
        />
        <Stat
          label="Account"
          value={user?.mobile ? `+91 ${user.mobile}` : user?.email || "—"}
          small
        />
        <Stat label="Name" value={user?.name || "—"} small />
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

function Stat({ label, value, small }) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
        {label}
      </p>
      <p className={`mt-2 font-bold text-ink ${small ? "text-base" : "text-3xl"}`}>
        {value}
      </p>
    </div>
  )
}
