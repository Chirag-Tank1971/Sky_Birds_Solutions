import { useState } from "react";
import { formatPrice } from "../data/courses";
import API from "../api/axios";
import { ShieldCheck, Loader2 } from "lucide-react";
import Shine from "./Shine";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentModal({
  course,
  onClose,
  onSuccess,
  processing,
}) {
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");

  async function handleApplyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage("Enter a coupon code first.");
      setAppliedCoupon(null);
      return;
    }

    setCouponLoading(true);
    setCouponMessage("");
    try {
      const { data } = await API.post("/coupons/validate", {
        code,
        amount: Number(course.price),
      });
      if (!data.success || !data.data) {
        throw new Error(data.message || "Coupon could not be applied");
      }
      setAppliedCoupon(data.data);
      setCouponCode(data.data.code || code);
      setCouponMessage(
        `✓ Coupon applied! You saved ${formatPrice(data.data.discountAmount)}.`,
      );
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage(
        err.response?.data?.message || err.message || "Invalid coupon code.",
      );
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponMessage("");
    setCouponCode("");
  }

  async function handleRazorpayCheckout() {
    // The backend must create the Razorpay order and return orderId, keyId,
    // amount (in paise), currency, and optionally customer/prefill details.
    const { data } = await API.post("/payment/razorpay/initiate", {
      courseId: course.id,
      couponCode: appliedCoupon?.code || "",
    });

    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to initialize Razorpay payment");
    }

    // Free course or a 100% coupon: the server has already unlocked it.
    if (data.data.free) {
      try {
        await onSuccess?.();
      } catch {
        // Access is already granted server-side.
      }
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded)
      throw new Error(
        "Unable to load Razorpay checkout. Please check your connection and try again.",
      );

    const order = data.data;
    if (
      !order.orderId ||
      !order.keyId ||
      !Number.isFinite(Number(order.amount))
    ) {
      throw new Error(
        "Razorpay order details are incomplete. Please check the backend response.",
      );
    }

    await new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: Number(order.amount),
        currency: order.currency || "INR",
        name: order.name || "Sky Birds Solution",
        description: order.description || course.title,
        order_id: order.orderId,
        prefill: order.prefill || {},
        notes: {
          courseId: String(course.id),
          couponCode: appliedCoupon?.code || "",
        },
        theme: { color: "#2f6b45" },
        handler: async (response) => {
          try {
            // Always verify the signature on the server before granting course access.
            const verifyResponse = await API.post("/payment/razorpay/verify", {
              courseId: course.id,
              couponCode: appliedCoupon?.code || "",
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (!verifyResponse.data?.success) {
              throw new Error(
                verifyResponse.data?.message || "Payment verification failed.",
              );
            }
            try {
              await onSuccess?.();
            } catch {
              // Payment has already been verified server-side; avoid reporting it as a failed payment.
            }
            resolve();
          } catch (err) {
            reject(
              new Error(
                err.response?.data?.message ||
                  err.message ||
                  "Payment verification failed.",
              ),
            );
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Payment was cancelled.")),
        },
      });

      checkout.on("payment.failed", (response) => {
        reject(
          new Error(
            response.error?.description ||
              "Razorpay payment failed. Please try again.",
          ),
        );
      });
      checkout.open();
    });
  }

  async function handleCheckout(event) {
    event.preventDefault();
    if (busy) return;
    setPaying(true);
    setErrorMsg("");

    try {
      await handleRazorpayCheckout();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          "Payment could not be started. Please try again.",
      );
    } finally {
      setPaying(false);
    }
  }

  const busy = paying || processing;
  const basePrice = Number(course.price);
  const payableAmount = appliedCoupon ? appliedCoupon.finalAmount : basePrice;

  return (
    <div data-lenis-prevent className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="min-w-0">
            <span className="inline-flex rounded bg-mint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest">
              Secure Checkout
            </span>
            <h2 className="mt-1 break-words text-lg font-bold text-gray-900">
              {course.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close payment modal"
            className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
          <span className="text-xs font-medium text-gray-500">
            Total Payable Amount:
          </span>
          <div className="text-right">
            {appliedCoupon && (
              <div className="text-xs text-gray-400 line-through">
                {formatPrice(basePrice)}
              </div>
            )}
            <span className="text-2xl font-extrabold text-forest">
              {formatPrice(payableAmount)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="payment-coupon"
            className="block text-xs font-semibold text-gray-600"
          >
            Have a coupon?
          </label>
          <div className="flex gap-2">
            <input
              id="payment-coupon"
              value={couponCode}
              onChange={(event) => {
                setCouponCode(event.target.value.toUpperCase());
                if (appliedCoupon) setAppliedCoupon(null);
                setCouponMessage("");
              }}
              placeholder="Enter coupon code"
              disabled={busy || couponLoading || Boolean(appliedCoupon)}
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm uppercase outline-none transition focus:border-leaf focus:ring-2 focus:ring-leaf/20"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                disabled={busy}
                className="rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 sm:px-4"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={busy || couponLoading}
                className="rounded-xl bg-forest px-3 text-sm font-semibold text-white transition hover:bg-leaf disabled:opacity-60 sm:px-4"
              >
                {couponLoading ? "Checking..." : "Apply"}
              </button>
            )}
          </div>
          {couponMessage && (
            <div
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${appliedCoupon ? "border border-green-200 bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              role="status"
            >
              {couponMessage}
            </div>
          )}
          {appliedCoupon && (
            <div className="flex items-center justify-between gap-3 text-xs text-green-700">
              <span>Discount ({appliedCoupon.code})</span>
              <span className="font-bold">
                −{formatPrice(appliedCoupon.discountAmount)}
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div
            className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700"
            role="alert"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCheckout} className="space-y-4 pt-1">
          <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-[11px] text-gray-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
            <span>
              Pay securely with UPI, cards, net banking, and supported wallets
              through Razorpay.
            </span>
          </div>

          <button
            type="submit"
            disabled={busy || couponLoading}
            className="relative overflow-hidden flex w-full items-center justify-center gap-2 rounded-full bg-leaf py-3 text-sm font-bold text-white shadow-sm transition hover:bg-forest disabled:opacity-70"
          >
            <Shine />
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening secure checkout...
              </>
            ) : (
              Number(payableAmount) === 0
                ? "Unlock for free"
                : `Pay Now (${formatPrice(payableAmount)})`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
