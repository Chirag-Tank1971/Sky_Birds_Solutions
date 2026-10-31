import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { getTransactions } from "../../api/auth";
import { formatPrice } from "../../data/courses";
import RollText from "../../components/RollText";

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    getTransactions()
      .then((res) => {
        if (cancelled) return;
        setItems(res.data || []);
        setStatus("loaded");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest">Payment history</p>
      <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">Your transactions</h1>
      <p className="mt-2 text-ink/65">Every course you have purchased, with its payment details.</p>

      <section className="mt-7 overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-[0_24px_50px_-35px_rgba(16,37,29,0.35)]">
        {status === "loading" ? (
          <div className="flex justify-center p-10">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-leaf border-t-transparent" />
          </div>
        ) : status === "error" ? (
          <p className="m-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700" role="alert">
            We couldn't load your transactions. Refresh the page to try again.
          </p>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-mint text-forest">
              <CreditCard size={20} />
            </span>
            <p className="mt-4 font-semibold text-ink">No transactions yet</p>
            <p className="mt-1 text-sm text-ink/60">Your course purchases will appear here.</p>
            <Link to="/dashboard/explore" className="mt-5 inline-block rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-[#10251D] transition-colors hover:bg-forest hover:text-white">
              <RollText>Browse courses</RollText>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-forest/10">
            {items.map((item) => (
              <li key={item._id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 sm:px-6">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="font-semibold text-ink">{item.courseTitle || "Course"}</p>
                  <p className="mt-0.5 break-all text-xs text-ink/50">
                    {item.provider === "free" ? "Free enrolment" : `Payment ID: ${item.paymentId || item.orderId}`}
                  </p>
                  {item.couponCode ? (
                    <p className="mt-0.5 text-xs text-forest">
                      Coupon {item.couponCode}{item.discountAmount ? ` · ${formatPrice(item.discountAmount)} off` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink">{item.provider === "free" ? "Free" : formatPrice(item.amount / 100)}</p>
                  {item.paidAt ? (
                    <p className="text-xs text-ink/50">
                      {new Date(item.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
