import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Tag, Users, RefreshCw, X } from "lucide-react";

const emptyForm = {
  title: "",
  code: "",
  discountType: "percentage",
  discountValue: "10",
  minPurchase: "0",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "1",
  startsAt: "",
  expiresAt: "",
  status: "active",
};
const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dateValue = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "—";

function CouponInput({
  form,
  setField,
  label,
  name,
  type = "text",
  required = false,
  ...props
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={form[name] ?? ""}
        onChange={(event) => setField(name, event.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        {...props}
      />
    </label>
  );
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState("coupons");
  const [filterCoupon, setFilterCoupon] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [couponRes, usageRes] = await Promise.all([
        API.get("/admin/coupons"),
        API.get("/admin/coupons/usage"),
      ]);
      setCoupons(couponRes.data?.data || []);
      setUsages(usageRes.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const filteredUsages = useMemo(
    () =>
      filterCoupon === "all"
        ? usages
        : usages.filter((usage) => usage.coupon?._id === filterCoupon),
    [usages, filterCoupon],
  );

  const setField = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const editCoupon = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      title: coupon.title || "",
      code: coupon.code || "",
      discountType: coupon.discountType || "percentage",
      discountValue: String(coupon.discountValue ?? 10),
      minPurchase: String(coupon.minPurchase ?? 0),
      maxDiscount: coupon.maxDiscount == null ? "" : String(coupon.maxDiscount),
      usageLimit: coupon.usageLimit == null ? "" : String(coupon.usageLimit),
      perUserLimit: String(coupon.perUserLimit ?? 1),
      startsAt: coupon.startsAt
        ? new Date(coupon.startsAt).toISOString().slice(0, 16)
        : "",
      expiresAt: coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().slice(0, 16)
        : "",
      status: coupon.status || "active",
    });
    // Editing opens in a modal; keep the current page position unchanged.
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        discountValue: Number(form.discountValue),
        minPurchase: Number(form.minPurchase || 0),
        maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
        usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
        perUserLimit: Number(form.perUserLimit || 1),
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
      };
      if (editingId) await API.put(`/admin/coupons/${editingId}`, payload);
      else await API.post("/admin/coupons", payload);
      toast.success(editingId ? "Coupon updated" : "Coupon created");
      reset();
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (coupon) => {
    try {
      const status = coupon.status === "active" ? "paused" : "active";
      await API.patch(`/admin/coupons/${coupon._id}/status`, { status });
      toast.success(`Coupon ${status}`);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update status");
    }
  };

  const removeCoupon = async (coupon) => {
    if (
      !window.confirm(
        `Delete coupon ${coupon.code}? Historical usage records will remain.`,
      )
    )
      return;
    try {
      await API.delete(`/admin/coupons/${coupon._id}`);
      toast.success("Coupon deleted");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete coupon");
    }
  };

  return (
    <div className="min-h-full bg-gray-50/70 p-4 sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create discounts and review coupon usage without changing checkout
            design.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab("coupons")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "coupons" ? "bg-primary-600 text-white" : "border border-gray-200 bg-white text-gray-600"}`}
        >
          <Tag className="mr-2 inline" size={15} />
          Manage Coupons
        </button>
        <button
          onClick={() => setTab("usage")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "usage" ? "bg-primary-600 text-white" : "border border-gray-200 bg-white text-gray-600"}`}
        >
          <Users className="mr-2 inline" size={15} />
          Usage History ({usages.length})
        </button>
      </div>

      {tab === "coupons" ? (
        <>
          <style>{`
            @keyframes couponBackdropIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes couponModalIn {
              from { opacity: 0; transform: translateY(14px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          <div
            className={
              editingId
                ? "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
                : ""
            }
          >
            {editingId && (
              <button
                type="button"
                aria-label="Close edit coupon dialog"
                onClick={reset}
                className="fixed inset-0 h-full w-full cursor-default bg-slate-950/50 backdrop-blur-sm"
                style={{ animation: "couponBackdropIn 180ms ease-out" }}
              />
            )}
            <form
              onSubmit={save}
              role={editingId ? "dialog" : undefined}
              aria-modal={editingId ? "true" : undefined}
              aria-labelledby={editingId ? "edit-coupon-title" : undefined}
              className={`mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${
                editingId
                  ? "relative z-10 m-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto shadow-2xl ring-1 ring-black/5"
                  : ""
              }`}
              style={
                editingId
                  ? {
                      animation:
                        "couponModalIn 220ms cubic-bezier(0.16, 1, 0.3, 1)",
                    }
                  : undefined
              }
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">
                  {editingId ? (
                    <span id="edit-coupon-title">Edit Coupon</span>
                  ) : (
                    "Create Coupon"
                  )}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500"
                  >
                    <X size={14} /> Cancel edit
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <CouponInput
                  form={form}
                  setField={setField}
                  label="Coupon Title"
                  name="title"
                  placeholder="Welcome Discount"
                />
                <CouponInput
                  form={form}
                  setField={setField}
                  label="Coupon Code"
                  name="code"
                  required
                  placeholder="WELCOME10"
                />
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Discount Type
                  </span>
                  <select
                    value={form.discountType}
                    onChange={(e) => setField("discountType", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed amount (₹)</option>
                  </select>
                </label>
                <CouponInput
                  form={form}
                  setField={setField}
                  label={
                    form.discountType === "percentage"
                      ? "Discount (%)"
                      : "Discount (₹)"
                  }
                  name="discountValue"
                  type="number"
                  min="0.01"
                  step="any"
                  max={form.discountType === "percentage" ? 100 : undefined}
                  required
                />
                <CouponInput
                  form={form}
                  setField={setField}
                  label="Minimum Purchase (₹)"
                  name="minPurchase"
                  type="number"
                  min="0"
                />
                <CouponInput
                  form={form}
                  setField={setField}
                  label="Maximum Discount (₹, optional)"
                  name="maxDiscount"
                  type="number"
                  min="0"
                />
                <CouponInput
                  form={form}
                  setField={setField}
                  label="Total Usage Limit (blank = unlimited)"
                  name="usageLimit"
                  type="number"
                  min="1"
                />
                <CouponInput
                  form={form}
                  setField={setField}
                  label="Usage Per User"
                  name="perUserLimit"
                  type="number"
                  min="1"
                  required
                />
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Status
                  </span>
                  <select
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </label>
                <CouponInput
                  form={form}
                  setField={setField}
                  label="Starts At (optional)"
                  name="startsAt"
                  type="datetime-local"
                />
                <CouponInput
                  form={form}
                  setField={setField}
                  label="Expires At (optional)"
                  name="expiresAt"
                  type="datetime-local"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600"
                >
                  Reset
                </button>
                <button
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  <Plus size={16} />
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-bold text-gray-900">All Coupons</h2>
            </div>
            {loading ? (
              <p className="p-8 text-center text-sm text-gray-500">
                Loading coupons…
              </p>
            ) : !coupons.length ? (
              <p className="p-8 text-center text-sm text-gray-500">
                No coupons created yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      {[
                        "Title / Code",
                        "Discount",
                        "Usage",
                        "Validity",
                        "Status",
                        "Actions",
                      ].map((x) => (
                        <th key={x} className="px-4 py-3 font-semibold">
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="hover:bg-gray-50/70">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">
                            {coupon.title || coupon.code}
                          </div>
                          <div className="mt-1 inline-flex rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                            {coupon.code}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : money(coupon.discountValue)}
                        </td>
                        <td className="px-4 py-3">
                          {coupon.usedCount || 0} / {coupon.usageLimit ?? "∞"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {dateValue(coupon.startsAt)}
                          <div>to {dateValue(coupon.expiresAt)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleStatus(coupon)}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${coupon.status === "active" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                          >
                            {coupon.status === "active" ? "Active" : "Paused"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => editCoupon(coupon)}
                              aria-label="Edit coupon"
                              className="rounded-lg p-2 text-primary-700 hover:bg-primary-50"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => removeCoupon(coupon)}
                              aria-label="Delete coupon"
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setFilterCoupon(coupon._id);
                                setTab("usage");
                              }}
                              className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                            >
                              Usage
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Coupon Usage History</h2>
              <p className="mt-1 text-xs text-gray-500">
                Successful payment records only. Select a coupon to inspect its
                individual usage.
              </p>
            </div>
            <select
              value={filterCoupon}
              onChange={(e) => setFilterCoupon(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All coupons</option>
              {coupons.map((coupon) => (
                <option key={coupon._id} value={coupon._id}>
                  {coupon.code}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <p className="p-8 text-center text-sm text-gray-500">
              Loading usage…
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    {[
                      "Coupon",
                      "Customer",
                      "Course",
                      "Original",
                      "Discount",
                      "Paid",
                      "Transaction / Date",
                    ].map((x) => (
                      <th key={x} className="px-4 py-3 font-semibold">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsages.map((usage) => (
                    <tr key={usage._id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold">
                          {usage.coupon?.title || usage.code}
                        </div>
                        <div className="font-mono text-xs text-gray-500">
                          {usage.code}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {usage.user?.name || "Customer"}
                        <div className="text-xs text-gray-500">
                          {usage.user?.email || usage.user?.mobile || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {usage.course?.title || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {money(usage.originalAmount)}
                      </td>
                      <td className="px-4 py-3 text-green-700">
                        −{money(usage.discountAmount)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {money(usage.finalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs">
                          {usage.transactionId || "—"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {dateValue(usage.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredUsages.length && (
                <p className="p-8 text-center text-sm text-gray-500">
                  No successful usage records found for this selection.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
