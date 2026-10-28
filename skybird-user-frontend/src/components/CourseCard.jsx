import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { formatPrice } from "../data/courses";
import { useUser } from "../context/UserContext";
import { hoverLift } from "../lib/motion";

export default function CourseCard({ course }) {
  const { hasCourse } = useUser();
  const owned = hasCourse(course.id);

  return (
    <motion.article
      layout
      {...hoverLift}
      className="overflow-hidden rounded-2xl border  border-gray-200 bg-white"
    >
      {/* Thumbnail */}
      <div className="relative h-60 overflow-hidden bg-mint p-4 bg-white">
        <motion.img
          src={course.thumbnail}
          alt=""
          className="h-full w-full object-cover rounded-md"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.45 }}
        />
        <span className="absolute left-3 top-3 rounded-full bg-[#2D6B2E] px-2.5 py-0.5 text-xs font-semibold capitalize text-white">
          {course.platform}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold leading-snug text-ink">
          {course.title}
        </h3>

        {/* Stars */}
        <div className="mt-2 flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className="h-4 w-4 fill-amber-400 text-amber-400"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Lesson + Duration chips */}
        <div className="mt-3 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink/70">
            <svg
              className="h-4 w-4 shrink-0 text-ink/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wide text-ink/40">
                Lesson
              </span>
              <span className="font-medium text-ink">
                {course.lessons} Lesson
              </span>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink/70">
            <svg
              className="h-4 w-4 shrink-0 text-ink/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wide text-ink/40">
                Duration
              </span>
              <span className="font-medium text-ink">{course.duration}</span>
            </div>
          </div>
        </div>

        {/* Price + Button */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-bold text-forest">
            {formatPrice(course.price)}
          </p>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to={`/courses/${course.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-forest/20 bg-white px-4 py-1.5 text-sm font-medium text-forest transition hover:bg-forest hover:text-white"
            >
              {owned ? "Watch" : "View Details"}
              <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
}
