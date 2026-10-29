import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { BarChart3, Clock3, PlayCircle, Store } from "lucide-react";
import { formatPrice } from "../data/courses";
import { useUser } from "../context/UserContext";
import RollText from "./RollText";

export default function CourseCard({ course }) {
  const { hasCourse } = useUser();
  const owned = hasCourse(course.id);
  const lessons = Number(course.lessons) || 0;

  return (
    <motion.article
      layout
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-4"
    >
      {/* Thumbnail */}
      <div className="relative h-56 overflow-hidden rounded-xl bg-mint">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold capitalize text-forest">
          <Store size={13} />
          {course.platform}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-mint px-3 py-1 text-xs font-semibold text-forest">
          <BarChart3 size={13} />
          {course.level || "Beginner"}
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-3 text-lg font-semibold leading-snug text-ink">
        {course.title}
      </h3>

      {/* Meta list with a thin line on the left */}
      <ul className="mt-4 space-y-2 border-l border-black/15 pl-4 text-sm text-ink/80">
        <li className="flex items-center gap-2.5">
          <PlayCircle size={16} className="shrink-0 text-ink/70" />
          {lessons} {lessons === 1 ? "Lesson" : "Lessons"}
        </li>
        {course.duration ? (
          <li className="flex items-center gap-2.5">
            <Clock3 size={16} className="shrink-0 text-ink/70" />
            {course.duration} of video content
          </li>
        ) : null}
      </ul>

      {/* Price + Button */}
      <div className="mt-auto pt-5">
        <p className="text-lg font-bold text-forest">{formatPrice(course.price)}</p>

        <Link
          to={`/courses/${course.id}`}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-leaf px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-forest"
        >
          <RollText>{owned ? "Watch" : "View Details"}</RollText>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </motion.article>
  );
}
