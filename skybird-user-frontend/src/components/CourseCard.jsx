import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Layers, BarChart3, CalendarDays, Clock3, Lock, PlayCircle, Sparkles, Store } from "lucide-react";
import { moduleSummary } from "../data/courseModules";
import { formatPrice } from "../data/courses";
import { useUser } from "../context/UserContext";
import RollText from "./RollText";

const addedOn = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

// size="lg" is the large two-up card used on the home page.
export default function CourseCard({ course, size = "md" }) {
  const { hasCourse } = useUser();
  const owned = hasCourse(course.id);
  const upcomingLessons = (course.videos || []).filter((video) => video.upcoming).length;
  const lessons = (course.videos?.length ? course.videos.length - upcomingLessons : Number(course.lessons)) || 0;
  const upcoming = course.status === "upcoming";
  const modules = moduleSummary(course);
  const large = size === "lg";
  const href = owned ? `/watch/${encodeURIComponent(course.id)}` : `/courses/${course.id}`;

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
      className={`group flex h-full flex-col overflow-hidden rounded-[22px] border border-black/[0.06] bg-[#f4f6f2] ${large ? "p-5" : "p-4"}`}
    >
      {/* Thumbnail */}
      <Link
        to={href}
        className={`relative block overflow-hidden rounded-2xl bg-mint ${large ? "aspect-[16/10]" : "aspect-[3/2]"}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
        {upcoming ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#10251D]/45 backdrop-blur-[3px]">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-[#10251D] shadow-lg">
              <Lock size={20} />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#10251D] shadow">
              <Sparkles size={12} /> Coming soon
            </span>
          </div>
        ) : owned ? (
          <span className="absolute left-3 top-3 rounded-full bg-leaf px-3 py-1 text-xs font-bold text-white shadow">
            Enrolled
          </span>
        ) : null}
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-[#10251D] shadow">
          {formatPrice(course.price)}
        </span>
      </Link>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-leaf/15 px-3 py-1.5 text-xs font-semibold capitalize text-forest">
          <Store size={13} />
          {course.platform}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-leaf/15 px-3 py-1.5 text-xs font-semibold text-forest">
          <BarChart3 size={13} />
          {course.level || "Beginner"}
        </span>
      </div>

      {/* Title */}
      <h3 className={`mt-3 font-semibold leading-snug text-ink line-clamp-2 ${large ? "text-2xl" : "text-xl"}`}>
        {course.title}
      </h3>

      {/* Meta list with a thin rule on the left */}
      <ul className="mt-4 space-y-2.5 border-l-2 border-black/15 pl-4 text-[15px] text-ink/80">
        {course.createdAt ? (
          <li className="flex items-center gap-2.5">
            <CalendarDays size={17} className="shrink-0 text-ink/70" />
            Added: {addedOn(course.createdAt)}
          </li>
        ) : null}
        <li className="flex items-center gap-2.5">
          <PlayCircle size={17} className="shrink-0 text-ink/70" />
          {lessons} {lessons === 1 ? "Lesson" : "Lessons"}
          {upcomingLessons ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
              <Lock size={10} /> +{upcomingLessons} upcoming
            </span>
          ) : null}
        </li>
        {modules ? (
          <li className="flex items-center gap-2.5">
            <Layers size={17} className="shrink-0 text-ink/70" />
            {modules}
          </li>
        ) : null}
        {course.duration ? (
          <li className="flex items-center gap-2.5">
            <Clock3 size={17} className="shrink-0 text-ink/70" />
            {course.duration} of video content
          </li>
        ) : null}
      </ul>

      {/* Button */}
      <div className="mt-auto pt-6">
        <Link
          to={href}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#10251D] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-forest"
        >
          <RollText>{owned ? "Continue learning" : upcoming ? "See what's coming" : "View course"}</RollText>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </motion.article>
  );
}
