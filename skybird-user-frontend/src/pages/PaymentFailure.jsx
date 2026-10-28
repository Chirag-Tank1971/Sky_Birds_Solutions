import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, RotateCcw, Headphones, ArrowLeft } from "lucide-react";

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const txnid = searchParams.get("txnid");
  const courseId = searchParams.get("courseId");
  const msg = searchParams.get("msg") || "Payment could not be completed.";

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 mb-6 shadow-sm">
        <AlertCircle className="h-10 w-10" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
        Transaction Failed
      </span>

      <h1 className="mt-4 text-3xl font-extrabold text-ink">
        Payment Incomplete
      </h1>

      <p className="mt-2 text-sm text-ink/70">
        {msg}
      </p>

      {txnid && (
        <div className="mt-6 rounded-xl bg-gray-50 border border-gray-200 p-4 text-xs flex justify-between">
          <span className="text-gray-500">Transaction Ref:</span>
          <span className="font-mono text-gray-700">{txnid}</span>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        {courseId ? (
          <Link
            to={`/courses/${courseId}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-leaf px-6 py-3 font-semibold text-white hover:bg-forest transition text-sm shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> Try Payment Again
          </Link>
        ) : (
          <Link
            to="/courses"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-leaf px-6 py-3 font-semibold text-white hover:bg-forest transition text-sm shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </Link>
        )}

        <Link
          to="/contact"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-forest/20 px-6 py-3 font-semibold text-forest hover:bg-mint transition text-sm bg-white"
        >
          <Headphones className="w-4 h-4" /> Contact Support
        </Link>
      </div>
    </div>
  );
}
