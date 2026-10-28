import { useEffect, useState } from "react"
import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from "react-router-dom"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  PlayCircle,
  Video,
} from "lucide-react"
import ProtectedVideo from "../components/ProtectedVideo"
import { fetchCourseById } from "../api/courses"
import { useUser } from "../context/UserContext"

export default function Watch() {
  const { courseId } = useParams()
  const [searchParams] = useSearchParams()
  const videoId = searchParams.get("v")
  const { hasCourse, isAuthenticated } = useUser()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      try {
        const res = await fetchCourseById(courseId)

        if (cancelled) return

        if (res.success) {
          setCourse(res.data)
        } else {
          setError("Course not found")
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Failed to load course"
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [courseId])

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `/watch/${courseId}` }}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#f7faf8]">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-leaf/20 border-t-leaf" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading your course...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-[70vh] bg-[#f7faf8] px-4 py-20">
        <div className="mx-auto max-w-lg rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-500">
            <Video size={25} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-ink">
            Unable to load course
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "Course not found"}
          </p>

          <Link
            to="/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-3 text-sm font-bold text-white transition hover:bg-forest"
          >
            <ArrowLeft size={16} />
            Back to courses
          </Link>
        </div>
      </div>
    )
  }

  if (!hasCourse(course.id)) {
    return <Navigate to={`/courses/${course.id}`} replace />
  }

  // Only safe lesson metadata is returned by the public course API.
  // The actual HLS URL is issued by the protected playback API.
  let selectedVideo = null

  if (videoId && course.videos?.length) {
    selectedVideo =
      course.videos.find((v) => v.id === videoId) || null
  } else if (course.videos?.length) {
    selectedVideo = course.videos[0]
  }

  const title = selectedVideo?.title || course.title
  const secureVideoId = selectedVideo?.videoId || ""

  return (
    <main className="min-h-screen bg-[#f7faf8] max-w-7xl m-auto">
      {/* Soft Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-leaf/5 blur-3xl" />
        <div className="absolute -left-40 top-[45%] h-96 w-96 rounded-full bg-mint/40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* TOP NAV */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-forest transition hover:text-leaf"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border border-forest/10 bg-white shadow-sm transition group-hover:-translate-x-1">
              <ArrowLeft size={16} />
            </span>

            <span>Back to Dashboard</span>
          </Link>

          {/* Course badge */}
          <div className="hidden items-center gap-2 rounded-full border border-forest/10 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm sm:flex">
            <BookOpen size={14} className="text-leaf" />
            Course Learning
          </div>
        </div>

        {/* COURSE HEADER */}
        <div className="mt-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">
                Now Learning
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl lg:text-4xl">
                {course.title}
              </h1>

              {title !== course.title ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <ChevronRight
                    size={15}
                    className="text-leaf"
                  />
                  <span>{title}</span>
                </div>
              ) : null}
            </div>

            {/* Lesson Info */}
            {selectedVideo ? (
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-forest/10 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm">
                  <Clock3
                    size={14}
                    className="text-leaf"
                  />
                  {selectedVideo.duration || "Video lesson"}
                </div>

                <div className="flex items-center gap-2 rounded-full border border-leaf/20 bg-mint/60 px-4 py-2.5 text-xs font-bold text-forest">
                  <CheckCircle2 size={14} />
                  Enrolled
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* VIDEO */}
        <div className="mt-7">
          {secureVideoId ? (
            <div className="relative overflow-hidden rounded-[1.5rem] border border-black/5 bg-black shadow-2xl shadow-forest/10 sm:rounded-[2rem]">
              {/* Top Video Bar */}
              <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex min-w-0 items-center gap-2 text-white">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur-md">
                    <PlayCircle size={16} />
                  </div>

                  <p className="truncate text-xs font-semibold sm:text-sm">
                    {title}
                  </p>
                </div>

                <span className="hidden rounded-full bg-black/25 px-3 py-1.5 text-[10px] font-semibold text-white/80 backdrop-blur-md sm:block">
                  Secure Playback
                </span>
              </div>

              <ProtectedVideo
                title={title}
                courseId={course.id}
                videoId={selectedVideo?.id}
              />
            </div>
          ) : (
            <div className="flex min-h-[350px] items-center justify-center rounded-[1.5rem] border border-dashed border-forest/20 bg-white p-8 text-center shadow-sm sm:min-h-[450px] sm:rounded-[2rem]">
              <div className="max-w-sm">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mint text-forest">
                  <Video size={28} />
                </div>

                <h2 className="mt-5 text-lg font-bold text-ink">
                  No video available
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  No video is available for this course yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* LESSONS */}
        {course.videos?.length > 1 ? (
          <section className="mt-10">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">
                  Course Content
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-ink sm:text-2xl">
                  All Lessons
                </h2>
              </div>

              <p className="text-xs font-medium text-slate-500">
                {course.videos.length} lessons available
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm">
              <div className="divide-y divide-gray-100">
                {course.videos.map((v, i) => {
                  const isActive = videoId === v.id

                  return (
                    <Link
                      key={v.id || i}
                      to={`/watch/${course.id}?v=${v.id}`}
                      className={`group flex items-center gap-3 px-4 py-4 transition sm:px-5 ${
                        isActive
                          ? "bg-mint/60"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {/* Number */}
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold transition ${
                          isActive
                            ? "bg-leaf text-white shadow-sm"
                            : "bg-gray-100 text-slate-500 group-hover:bg-mint group-hover:text-forest"
                        }`}
                      >
                        {isActive ? (
                          <PlayCircle size={17} />
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </div>

                      {/* Lesson */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-semibold ${
                            isActive
                              ? "text-forest"
                              : "text-ink"
                          }`}
                        >
                          {v.title}
                        </p>

                        {isActive ? (
                          <p className="mt-1 text-[11px] font-medium text-leaf">
                            Currently playing
                          </p>
                        ) : null}
                      </div>

                      {/* Duration */}
                      <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-400">
                        <Clock3 size={13} />
                        <span>{v.duration}</span>
                      </div>

                      <ChevronRight
                        size={16}
                        className={`shrink-0 transition ${
                          isActive
                            ? "text-leaf"
                            : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-forest"
                        }`}
                      />
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}