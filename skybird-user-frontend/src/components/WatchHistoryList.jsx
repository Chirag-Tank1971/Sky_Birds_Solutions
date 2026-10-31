import { Link } from "react-router-dom";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { formatTime } from "../data/courseModules";

const watchedOn = (date) =>
  new Date(date).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function WatchHistoryList({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const percent = item.completed ? 100 : item.duration ? Math.min(100, Math.round((item.position / item.duration) * 100)) : 0;
        const body = (
          <>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.locked ? "bg-gray-100 text-slate-400" : item.completed ? "bg-mint text-forest" : "bg-leaf/15 text-forest"}`}>
              {item.locked ? <Lock size={18} /> : item.completed ? <CheckCircle2 size={18} /> : <PlayCircle size={18} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{item.lessonTitle}</span>
              <span className="mt-0.5 block truncate text-xs text-ink/60">
                {item.courseTitle}{item.moduleTitle ? ` · ${item.moduleTitle}` : ""}
              </span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-gray-100">
                <span className="block h-full rounded-full bg-leaf" style={{ width: `${percent}%` }} />
              </span>
              <span className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-xs text-ink/55">
                <span>
                  {item.locked ? "Temporarily unavailable" : item.completed ? "Completed" : `Stopped at ${formatTime(item.position)}${item.duration ? ` of ${formatTime(item.duration)}` : ""}`}
                </span>
                <span>{watchedOn(item.lastWatchedAt)}</span>
              </span>
            </span>
          </>
        );
        const row = "flex items-center gap-3 rounded-2xl border border-forest/10 bg-white p-4";
        return (
          <li key={`${item.courseId}:${item.lessonId}`}>
            {item.locked ? (
              <div className={row}>{body}</div>
            ) : (
              <Link to={`/watch/${encodeURIComponent(item.courseId)}?v=${encodeURIComponent(item.lessonId)}`} className={`${row} transition hover:border-leaf/50 hover:bg-mint/20`}>
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
