import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, History as HistoryIcon, Lock, PlayCircle } from "lucide-react";
import RollText from "../../components/RollText";
import { getWatchHistory } from "../../api/auth";
import { formatTime } from "../../data/courseModules";

const watchedOn = (date) =>
  new Date(date).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function History() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getWatchHistory()
      .then((res) => {
        if (!cancelled) setItems(res.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "We couldn't load your history.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Watch history</h1>
      <p className="mt-2 text-ink/65">Lessons you've watched, most recent first.</p>

      {error ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700" role="alert">{error}</p>
      ) : items === null ? (
        <div className="mt-10 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-leaf border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-forest/30 bg-mint/40 p-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white text-forest">
            <HistoryIcon size={20} />
          </span>
          <p className="mt-4 font-semibold text-ink">Nothing here yet</p>
          <p className="mt-1 text-sm text-ink/60">Lessons you watch will appear here so you can pick up where you left off.</p>
          <Link to="/dashboard" className="mt-5 inline-block rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-[#10251D] transition-colors hover:bg-forest hover:text-white">
            <RollText>Go to my courses</RollText>
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
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
            const key = `${item.courseId}:${item.lessonId}`;
            const row = "flex items-center gap-3 rounded-2xl border border-forest/10 bg-white p-4";
            return (
              <li key={key}>
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
      )}
    </div>
  );
}
