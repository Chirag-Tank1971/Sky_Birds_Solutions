import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { BadgeCheck, Briefcase, Cake, Mail, Pencil, Phone, Plus } from "lucide-react"
import { getProfile, updateProfile, sendContactOtp, verifyContactOtp } from "../api/auth"
import { useUser } from "../context/UserContext"
import { EMAIL_RE, PROFESSIONS } from "../data/profile"
import OtpInput from "./OtpInput"
import { initWidget, widgetRetryOtp, widgetSendOtp, widgetVerifyOtp } from "../lib/msg91Widget"

const RESEND_SECONDS = 60
const inputClass =
  "mt-1.5 w-full rounded-xl border border-forest/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30"
const apiError = (err, fallback) => err.response?.data?.message || fallback

// Adds the email or mobile number the customer did not sign up with, verified by a 6-digit code.
function AddContact({ field, onDone, onCancel }) {
  const isEmail = field === "email"
  const [value, setValue] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState("enter")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [shake, setShake] = useState(0)
  // MSG91 widget settings when the API sends mobile OTPs through the widget; null otherwise.
  const [widget, setWidget] = useState(null)

  useEffect(() => {
    if (countdown <= 0) return undefined
    const timer = window.setTimeout(() => setCountdown((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  const identifier = isEmail ? value.trim().toLowerCase() : value
  const valid = isEmail ? EMAIL_RE.test(identifier) : /^\d{10}$/.test(value)
  const shown = isEmail ? identifier : `+91 ${value}`

  const send = async (e) => {
    e?.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError("")
    try {
      // Resending within widget mode goes straight to MSG91; otherwise ask our API (which may switch on widget mode).
      if (widget && step === "code") {
        await widgetRetryOtp()
      } else {
        const data = await sendContactOtp(identifier)
        if (data.widget) {
          await initWidget(data.widget)
          await widgetSendOtp(value)
        }
        setWidget(data.widget || null)
      }
      setStep("code")
      setOtp("")
      setCountdown(RESEND_SECONDS)
    } catch (err) {
      setError(err.response ? apiError(err, "Unable to send the code. Please try again.") : err.message || "Unable to send the code. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const verify = async (e) => {
    e.preventDefault()
    if (otp.length !== 6 || busy) return
    setBusy(true)
    setError("")
    try {
      const accessToken = widget ? await widgetVerifyOtp(otp) : undefined
      const data = await verifyContactOtp({ identifier, ...(accessToken ? { accessToken } : { otp }) })
      onDone(data.user)
    } catch (err) {
      setShake((n) => n + 1)
      setError(err.response ? apiError(err, "Invalid code. Please try again.") : err.message || "Invalid code. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-4 rounded-xl border border-leaf/30 bg-mint/40 p-4">
        {step === "enter" ? (
          <form onSubmit={send}>
            <label className="block text-sm font-medium text-ink">
              {isEmail ? "Email address" : "Mobile number"}
              {isEmail ? (
                <input
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  autoFocus
                  required
                />
              ) : (
                <div className="mt-1.5 flex overflow-hidden rounded-xl border border-forest/20 bg-white focus-within:border-leaf focus-within:ring-2 focus-within:ring-leaf/30">
                  <span className="flex items-center bg-mint px-3 text-sm font-medium text-forest">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={value}
                    onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full px-3 py-2.5 text-sm outline-none"
                    autoFocus
                    required
                  />
                </div>
              )}
            </label>
            <p className="mt-2 text-xs text-ink/50">
              We'll send a 6-digit code to verify it. You can then sign in with it too.
            </p>
            {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={!valid || busy} className="rounded-full bg-leaf px-5 py-2 text-sm font-semibold text-white transition hover:bg-forest disabled:opacity-50">
                {busy ? "Sending…" : "Send code"}
              </button>
              <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm font-semibold text-ink/60 hover:bg-white">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={verify}>
            <p className="text-sm text-ink">
              Enter the code sent to <span className="font-semibold">{shown}</span>
            </p>
            <div className="mt-3 max-w-sm">
              <OtpInput value={otp} onChange={setOtp} shakeKey={shake} autoFocus />
            </div>
            {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="submit" disabled={otp.length !== 6 || busy} className="rounded-full bg-leaf px-5 py-2 text-sm font-semibold text-white transition hover:bg-forest disabled:opacity-50">
                {busy ? "Verifying…" : "Verify"}
              </button>
              <button type="button" onClick={() => send()} disabled={countdown > 0 || busy} className="rounded-full px-4 py-2 text-sm font-semibold text-forest hover:bg-white disabled:text-ink/40 disabled:hover:bg-transparent">
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </button>
              <button type="button" onClick={() => { setStep("enter"); setError(""); setWidget(null) }} className="rounded-full px-4 py-2 text-sm font-semibold text-ink/60 hover:bg-white">
                Change
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  )
}

function Tile({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-forest/10 bg-[#fbfcfa] p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mint text-forest">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/45">{label}</p>
        <div className="mt-1 text-sm font-semibold text-ink">{children}</div>
      </div>
    </div>
  )
}

function ContactValue({ value, addLabel, onAdd }) {
  if (value) {
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="break-all">{value}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-[11px] font-semibold text-forest">
          <BadgeCheck className="h-3.5 w-3.5" /> Verified
        </span>
      </span>
    )
  }
  return (
    <button type="button" onClick={onAdd} className="mt-0.5 inline-flex items-center gap-1.5 rounded-full border border-dashed border-forest/40 bg-white px-3 py-1 text-sm font-semibold text-forest transition hover:border-leaf hover:bg-mint/60">
      <Plus className="h-4 w-4" /> {addLabel}
    </button>
  )
}

const initials = (name = "") =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "?"

export default function AccountDetails() {
  const { user, updateUser } = useUser()
  const [profile, setProfile] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: "", age: "", profession: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [adding, setAdding] = useState(null)

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((res) => { if (!cancelled && res.success) setProfile(res.data) })
      .catch(() => { if (!cancelled) setLoadError(true) })
    return () => { cancelled = true }
  }, [])

  // Saved confirmation disappears on its own.
  useEffect(() => {
    if (!saved) return undefined
    const timer = window.setTimeout(() => setSaved(false), 3500)
    return () => window.clearTimeout(timer)
  }, [saved])

  // Fall back to the signed-in user until the full profile loads.
  const p = profile || user || {}
  const memberSince = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : ""

  const startEdit = () => {
    setForm({ name: p.name || "", age: p.age ? String(p.age) : "", profession: p.profession || "" })
    setError("")
    setSaved(false)
    setAdding(null)
    setEditing(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await updateProfile({ name: form.name.trim(), age: Number(form.age), profession: form.profession })
      setProfile(res.data)
      updateUser({ name: res.data.name })
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setError(apiError(err, "Unable to save your details. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  const contactAdded = (updated) => {
    setProfile((prev) => ({ ...(prev || {}), email: updated.email, mobile: updated.mobile }))
    updateUser({ email: updated.email, mobile: updated.mobile })
    setAdding(null)
    setSaved(true)
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-[0_24px_50px_-35px_rgba(16,37,29,0.35)]">
      {/* Profile banner */}
      <div className="relative overflow-hidden bg-[#10251D] px-5 py-6 text-white sm:px-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-leaf/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-leaf text-xl font-bold text-[#10251D] shadow-lg shadow-black/20">
            {initials(p.name)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold sm:text-2xl">{p.name || "Learner"}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/60">
              {p.profession ? (
                <span className="rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white/85">{p.profession}</span>
              ) : null}
              {memberSince ? <span>Member since {memberSince}</span> : null}
            </div>
          </div>
          {!editing ? (
            <button type="button" onClick={startEdit} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 sm:w-auto">
              <Pencil className="h-4 w-4" /> Edit details
            </button>
          ) : null}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <AnimatePresence>
          {saved && !editing ? (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2 rounded-xl bg-mint/70 px-3.5 py-2.5 text-sm font-medium text-forest"
              role="status"
            >
              <BadgeCheck className="h-4 w-4" /> Your details have been saved.
            </motion.p>
          ) : null}
        </AnimatePresence>
        {loadError ? (
          <p className="mb-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">Some details couldn't be loaded. Refresh the page to try again.</p>
        ) : null}

        {editing ? (
          <>
          <form onSubmit={save} className="space-y-4">
            <h3 className="text-base font-bold text-ink">Edit your details</h3>
            <label className="block text-sm font-medium text-ink">
              Full name
              <input type="text" minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
            </label>
            <div className="grid grid-cols-[0.7fr_1.3fr] gap-3">
              <label className="block text-sm font-medium text-ink">
                Age
                <input type="number" inputMode="numeric" min={13} max={100} step={1} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value.replace(/\D/g, "").slice(0, 3) })} className={inputClass} required />
              </label>
              <label className="block text-sm font-medium text-ink">
                Profession
                <select value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className={inputClass} required>
                  <option value="" disabled>Select…</option>
                  {PROFESSIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
            {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-full bg-leaf px-5 py-2 text-sm font-semibold text-white transition hover:bg-forest disabled:opacity-50">
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={() => { setEditing(false); setAdding(null) }} className="rounded-full px-4 py-2 text-sm font-semibold text-ink/60 hover:bg-mint/40">
                Cancel
              </button>
            </div>
          </form>

          {/* Outside the form above: adding a contact has its own forms and saves on verification. */}
          <div className="mt-6 border-t border-forest/10 pt-5">
            <h3 className="text-base font-bold text-ink">Contact details</h3>
            <p className="mt-0.5 text-xs text-ink/50">Verified contacts can't be changed here. To change one, contact support.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Tile icon={Mail} label="Email">
                <ContactValue value={p.email} addLabel="Add email" onAdd={() => setAdding("email")} />
              </Tile>
              <Tile icon={Phone} label="Mobile">
                <ContactValue value={p.mobile ? `+91 ${p.mobile}` : ""} addLabel="Add mobile number" onAdd={() => setAdding("mobile")} />
              </Tile>
            </div>
            <AnimatePresence>
              {adding ? <AddContact key={adding} field={adding} onDone={contactAdded} onCancel={() => setAdding(null)} /> : null}
            </AnimatePresence>
          </div>
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Tile icon={Mail} label="Email">
                <ContactValue value={p.email} addLabel="Add email" onAdd={() => { setSaved(false); setAdding("email") }} />
              </Tile>
              <Tile icon={Phone} label="Mobile">
                <ContactValue value={p.mobile ? `+91 ${p.mobile}` : ""} addLabel="Add mobile number" onAdd={() => { setSaved(false); setAdding("mobile") }} />
              </Tile>
              <Tile icon={Cake} label="Age">
                {p.age || <span className="font-medium text-ink/40">Not added</span>}
              </Tile>
              <Tile icon={Briefcase} label="Profession">
                {p.profession || <span className="font-medium text-ink/40">Not added</span>}
              </Tile>
            </div>
            <AnimatePresence>
              {adding ? <AddContact key={adding} field={adding} onDone={contactAdded} onCancel={() => setAdding(null)} /> : null}
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  )
}
