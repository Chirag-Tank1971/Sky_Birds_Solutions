import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Play, ArrowRight, ShieldCheck } from "lucide-react";
import { useUser } from "../context/UserContext";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const txnid = searchParams.get("txnid") || "TXN_" + Date.now();
  const courseId = searchParams.get("courseId");
  const { refreshPurchased } = useUser();

  useEffect(() => {
    refreshPurchased();
  }, [refreshPurchased]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6 shadow-sm">
        <CheckCircle className="h-10 w-10" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-leaf bg-mint px-3 py-1 rounded-full">
        Payment Successful
      </span>

      <h1 className="mt-4 text-3xl font-extrabold text-ink">
        Course Unlocked!
      </h1>

      <p className="mt-2 text-sm text-ink/70">
        Thank you for your purchase. Your payment was verified through PayU and the video course is now active on your dashboard.
      </p>

      <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-200 p-5 text-left text-xs space-y-2.5">
        <div className="flex justify-between">
          <span className="text-gray-500">Transaction ID:</span>
          <span className="font-mono font-bold text-gray-800">{txnid}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Payment Status:</span>
          <span className="font-semibold text-emerald-600 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Completed (PayU)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Access Type:</span>
          <span className="font-semibold text-gray-800">Lifetime Streaming</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        {courseId ? (
          <Link
            to={`/watch/${courseId}`}
            className="btn-shine flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-leaf px-6 py-3 font-semibold text-white hover:bg-forest transition text-sm shadow-sm"
          >
            <Play className="w-4 h-4" /> Start Watching Lesson
          </Link>
        ) : null}

        <Link
          to="/dashboard"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-forest/20 px-6 py-3 font-semibold text-forest hover:bg-mint transition text-sm bg-white"
        >
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
