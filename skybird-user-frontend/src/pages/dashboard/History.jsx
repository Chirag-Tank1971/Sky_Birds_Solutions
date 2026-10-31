import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History as HistoryIcon } from "lucide-react";
import RollText from "../../components/RollText";
import WatchHistoryList from "../../components/WatchHistoryList";
import { getWatchHistory } from "../../api/auth";

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
        <div className="mt-6">
          <WatchHistoryList items={items} />
        </div>
      )}
    </div>
  );
}
