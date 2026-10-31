import { useState } from "react";
import { BadgeCheck, Lock } from "lucide-react";
import { changePassword } from "../../api/auth";
import AccountDetails from "../../components/AccountDetails";
import { useUser } from "../../context/UserContext";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-forest/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30";
const emptyForm = { currentPassword: "", newPassword: "", confirm: "" };

function ChangePassword() {
  const { setToken } = useUser();
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const field = (name) => ({
    value: form[name],
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
    className: inputClass,
    required: true,
  });

  const submit = async (e) => {
    e.preventDefault();
    setDone(false);
    if (form.newPassword !== form.confirm) {
      setError("The new passwords don't match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await changePassword(form);
      // The old token stops working once the password changes.
      setToken(res.token);
      setForm(emptyForm);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to change your password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 rounded-3xl border border-forest/10 bg-white p-5 shadow-[0_24px_50px_-35px_rgba(16,37,29,0.35)] sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint text-forest">
          <Lock size={18} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">Change password</h2>
          <p className="text-sm text-ink/55">You'll stay signed in here and be signed out on other devices.</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-5 max-w-md space-y-4">
        <label className="block text-sm font-medium text-ink">
          Current password
          <input type="password" autoComplete="current-password" maxLength={128} {...field("currentPassword")} />
        </label>
        <label className="block text-sm font-medium text-ink">
          New password
          <input type="password" autoComplete="new-password" minLength={8} maxLength={128} {...field("newPassword")} />
        </label>
        <label className="block text-sm font-medium text-ink">
          Confirm new password
          <input type="password" autoComplete="new-password" minLength={8} maxLength={128} {...field("confirm")} />
        </label>
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error}</p> : null}
        {done ? (
          <p className="flex items-center gap-2 rounded-xl bg-mint/70 px-3.5 py-2.5 text-sm font-medium text-forest" role="status">
            <BadgeCheck className="h-4 w-4" /> Your password has been changed.
          </p>
        ) : null}
        <button type="submit" disabled={busy} className="rounded-full bg-leaf px-5 py-2 text-sm font-semibold text-white transition hover:bg-forest disabled:opacity-50">
          {busy ? "Saving…" : "Change password"}
        </button>
      </form>
    </section>
  );
}

export default function Settings() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest">Account settings</p>
      <h1 className="mb-7 mt-2 text-3xl font-bold text-ink sm:text-4xl">Your profile</h1>
      <AccountDetails />
      <ChangePassword />
    </div>
  );
}
