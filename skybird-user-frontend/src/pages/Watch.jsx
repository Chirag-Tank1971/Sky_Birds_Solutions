import { useCallback, useEffect, useState } from "react"
import {
  Link,
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Lock,
  PlayCircle,
  ShieldCheck,
  Video,
} from "lucide-react"
import ProtectedVideo from "../components/ProtectedVideo"
import { fetchCourseById } from "../api/courses"
import { formatTime, groupLessons, nextLesson } from "../data/courseModules"
import { getCourseProgress } from "../api/auth"
import { useUser } from "../context/UserContext"

export default function Watch() {
  const { courseId } = useParams()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const videoId = searchParams.get("v")
  const { hasCourse, isAuthenticated, purchasesStatus } = useUser()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  // lessonId -> saved progress. Null until loaded, so a lesson doesn't start before its saved position is known.
  const [progress, setProgress] = useState(null)
  const [toggledGroups, setToggledGroups] = useState({})

  useEffect(() => {
    if (!isAuthenticated) return undefined
    let cancelled = false
    getCourseProgress(courseId)
      .then((res) => {
        if (!cancelled) setProgress(Object.fromEntries((res.data || []).map((item) => [item.lessonId, item])))
      })
      .catch(() => {
        // Without saved progress lessons still play, from the start.
        if (!cancelled) setProgress({})
      })
    return () => {
      cancelled = true
    }
  }, [courseId, isAuthenticated])

  const handleProgress = useCallback((lessonId, position, duration, completed) => {
    setProgress((prev) => ({
      ...prev,
      [lessonId]: {
        ...prev?.[lessonId],
        lessonId,
        position,
        duration,
        completed: Boolean(completed || prev?.[lessonId]?.completed || (duration && position / duration >= 0.95)),
        lastWatchedAt: new Date().toISOString(),
      },
    }))
  }, [])

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

  // The purchase list saved in the browser can be out of date (bought on another
  // device, or unlocked later by the payment webhook). Wait for the server's list
  // before sending an owner to the buy page.
  const waitingForPurchases = Boolean(course) && !hasCourse(course.id) && purchasesStatus === "idle"

  if (loading || waitingForPurchases) {
    return (
      <div className="min-h-[70vh] bg-canvas">
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
      <div className="min-h-[70vh] bg-canvas px-4 py-20">
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
  const groups = groupLessons(course)
  const orderedLessons = groups.flatMap((group) => group.lessons)
  const showModules = groups.some((group) => group.id)

  // No lesson chosen (or an unknown one) goes to the next lesson below, once saved progress is known.
  if (videoId) selectedVideo = orderedLessons.find((v) => v.id === videoId) || null

  const saved = progress || {}
  const selectedSaved = selectedVideo ? saved[selectedVideo.id] : null
  // A finished lesson, or one stopped in its last seconds, starts again from the beginning.
  const startAt =
    selectedSaved && !selectedSaved.completed && !(selectedSaved.duration && selectedSaved.position >= selectedSaved.duration - 10)
      ? selectedSaved.position
      : 0
  const next = nextLesson(orderedLessons, saved)
  const completedCount = orderedLessons.filter((v) => !v.upcoming && saved[v.id]?.completed).length
  const playableCount = orderedLessons.filter((v) => !v.upcoming).length
  const lessonLink = (lesson) => `/watch/${encodeURIComponent(course.id)}?v=${encodeURIComponent(lesson.id)}`

  if (!selectedVideo && next.lesson) {
    // This page stays mounted during its exit animation, when the address is already another page's.
    if (progress && pathname.startsWith("/watch/")) return <Navigate to={lessonLink(next.lesson)} replace />
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-canvas">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-leaf/20 border-t-leaf" />
      </div>
    )
  }

  const title = selectedVideo?.title || course.title
  // The API sends hasVideo instead of the video's ID; older API versions still send videoId.
  const secureVideoId = Boolean(selectedVideo?.hasVideo || selectedVideo?.videoId)
  const overallPercent = playableCount ? Math.round((completedCount / playableCount) * 100) : 0

  const playable = orderedLessons.filter((v) => !v.upcoming)
  const selectedIndex = selectedVideo ? playable.indexOf(selectedVideo) : -1
  const previousLesson = selectedIndex > 0 ? playable[selectedIndex - 1] : null
  const followingLesson = selectedIndex >= 0 ? playable[selectedIndex + 1] || null : null
  const selectedModule = selectedVideo ? groups.find((group) => group.lessons.includes(selectedVideo)) : null

  // The module being watched (or next up) starts open; the student can open or close any of them.
  const focusLesson = selectedVideo || next.lesson
  const isGroupOpen = (group) => toggledGroups[group.id] ?? (!showModules || group.lessons.includes(focusLesson))
  const toggleGroup = (group) => setToggledGroups((prev) => ({ ...prev, [group.id]: !isGroupOpen(group) }))

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Course bar */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/dashboard"
              aria-label="Back to dashboard"
              title="Back to dashboard"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-forest/10 bg-white text-forest shadow-sm transition hover:bg-mint"
            >
              <ArrowLeft size={17} />
            </Link>
            <h1 className="min-w-0 truncate text-lg font-bold text-ink sm:text-xl">{course.title}</h1>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-64">
            <div
              role="progressbar"
              aria-label="Course progress"
              aria-valuenow={overallPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 flex-1 overflow-hidden rounded-full bg-black/10"
            >
              <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${overallPercent}%` }} />
            </div>
            <span className="shrink-0 text-xs font-semibold text-slate-600">{overallPercent}% complete</span>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Player column */}
          <div className="min-w-0">
            {!selectedVideo ? (
              <div className="rounded-2xl border border-forest/10 bg-white p-6 text-center shadow-sm sm:p-10">
                <h2 className="text-xl font-bold text-ink">No lessons available yet</h2>
                <p className="mt-2 text-sm text-slate-500">Lessons will appear here as soon as they're published.</p>
              </div>
            ) : secureVideoId && !progress ? (
              <div className="flex aspect-video items-center justify-center rounded-2xl bg-black">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            ) : secureVideoId ? (
              <div className="overflow-hidden rounded-2xl bg-black shadow-lg shadow-forest/10">
                <ProtectedVideo
                  key={selectedVideo.id}
                  title={title}
                  courseId={course.id}
                  videoId={selectedVideo.id}
                  startAt={startAt}
                  onProgress={(position, duration, completed) => handleProgress(selectedVideo.id, position, duration, completed)}
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-forest/20 bg-white p-8 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-mint text-forest">
                    {selectedVideo.upcoming ? <Lock size={24} /> : <Video size={24} />}
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-ink">
                    {selectedVideo.upcoming ? "This lesson is coming soon" : "No video available"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {selectedVideo.upcoming
                      ? "It will unlock here once it's published. Meanwhile, continue with the available lessons."
                      : "No video is available for this lesson yet."}
                  </p>
                </div>
              </div>
            )}

            {selectedVideo ? (
              <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 basis-72">
                  {showModules && selectedModule ? (
                    <p className="text-xs font-semibold uppercase tracking-wider text-forest">{selectedModule.title}</p>
                  ) : null}
                  <h2 className="mt-1 break-words text-xl font-bold text-ink sm:text-2xl">{selectedVideo.title}</h2>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {selectedVideo.duration ? (
                      <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {selectedVideo.duration}</span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} /> Secure playback</span>
                    {saved[selectedVideo.id]?.completed ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-forest"><CheckCircle2 size={13} /> Completed</span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {previousLesson ? (
                    <Link to={lessonLink(previousLesson)} className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-white px-4 py-2.5 text-sm font-semibold text-forest transition hover:bg-mint">
                      <ChevronLeft size={16} /> Previous
                    </Link>
                  ) : null}
                  {followingLesson ? (
                    <Link to={lessonLink(followingLesson)} className="inline-flex items-center gap-1.5 rounded-full bg-leaf px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest">
                      Next lesson <ChevronRight size={16} />
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* Course content */}
          {orderedLessons.length > 0 ? (
            <aside aria-label="Course content" className="flex flex-col overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm lg:sticky lg:top-[86px] lg:max-h-[calc(100vh-102px)]">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-base font-bold text-ink">Course content</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {playableCount} {playableCount === 1 ? "lesson" : "lessons"} available
                  {orderedLessons.length > playableCount ? ` · ${orderedLessons.length - playableCount} upcoming` : ""}
                </p>
              </div>

              <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
                {groups.map((group) => {
                  const open = isGroupOpen(group)
                  const groupPlayable = group.lessons.filter((v) => !v.upcoming)
                  const groupDone = groupPlayable.filter((v) => saved[v.id]?.completed).length
                  return (
                    <div key={group.id || "content"}>
                      {showModules ? (
                        <button
                          type="button"
                          onClick={() => toggleGroup(group)}
                          aria-expanded={open}
                          className="flex w-full items-center gap-3 bg-gray-50 px-5 py-3.5 text-left transition hover:bg-gray-100"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-ink">{group.title}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {group.upcoming ? "Coming soon" : `${groupDone} of ${groupPlayable.length} completed`}
                            </span>
                          </span>
                          {group.upcoming ? <Lock size={14} className="shrink-0 text-amber-700" /> : null}
                          <ChevronDown size={16} className={`shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                      ) : null}

                      {open ? (
                        <ul>
                          {group.lessons.map((v) => {
                            const isActive = selectedVideo?.id === v.id
                            const record = saved[v.id]
                            const number = String(orderedLessons.indexOf(v) + 1).padStart(2, "0")

                            if (v.upcoming) {
                              return (
                                <li key={v.id} className="flex items-center gap-3 px-5 py-3 text-slate-400" aria-disabled="true">
                                  <Lock size={15} className="w-7 shrink-0" />
                                  <span className="min-w-0 flex-1 truncate text-sm">{v.title}</span>
                                  <span className="shrink-0 text-xs">Upcoming</span>
                                </li>
                              )
                            }

                            return (
                              <li key={v.id}>
                                <Link
                                  to={lessonLink(v)}
                                  aria-current={isActive ? "true" : undefined}
                                  className={`flex items-center gap-3 border-l-[3px] py-3 pl-[17px] pr-5 transition ${isActive ? "border-leaf bg-mint/50" : "border-transparent hover:bg-gray-50"}`}
                                >
                                  <span className={`grid w-7 shrink-0 place-items-center text-xs font-semibold ${record?.completed || isActive ? "text-forest" : "text-slate-400"}`}>
                                    {isActive ? <PlayCircle size={17} aria-label="Now playing" /> : record?.completed ? <CheckCircle2 size={17} aria-label="Completed" /> : number}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className={`block text-sm leading-5 ${isActive ? "font-semibold text-forest" : "text-ink"}`}>{v.title}</span>
                                    {!record?.completed && record && !isActive ? (
                                      <span className="mt-0.5 block text-xs text-slate-500">Stopped at {formatTime(record.position)}</span>
                                    ) : null}
                                  </span>
                                  {v.duration ? <span className="shrink-0 text-xs text-slate-400">{v.duration}</span> : null}
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  )
}
