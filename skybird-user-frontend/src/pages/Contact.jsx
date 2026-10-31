import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import API from "../api/axios";
import { fetchSiteContent } from "../api/site";
import { useSitePreviewVersion } from "../lib/sitePreview";
import { AlertCircle, ArrowUpRight, Clock, Loader2, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import RollText from "../components/RollText";
import Shine from "../components/Shine";

const TOPICS = ["Course inquiry", "Seller onboarding", "Account management", "Something else"];
const EMPTY_FORM = { name: "", email: "", phone: "", subject: "", message: "" };

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", bounce: 0, duration: 0.8, delay },
});

// Input with a label that floats up when focused or filled.
function Field({ label, required, as = "input", ...props }) {
  const Tag = as;
  return (
    <label className="group relative block">
      <Tag
        {...props}
        required={required}
        placeholder=" "
        className={`peer w-full rounded-xl border border-black/10 bg-[#f8faf6] px-4 pb-2.5 pt-6 text-sm text-ink outline-none transition focus:border-leaf focus:bg-white focus:ring-4 focus:ring-leaf/15 ${
          as === "textarea" ? "min-h-[140px] resize-none" : ""
        }`}
      />
      <span className="pointer-events-none absolute left-4 top-2 text-[11px] font-semibold text-forest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-slate-500 peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-forest">
        {label}
        {required ? " *" : ""}
      </span>
    </label>
  );
}

// Swooping flight path inside a 360x260 box; it ends past the top-right corner so the card clips the exit.
const FLIGHT_PATH = "M 30 230 C 110 230, 150 150, 190 160 S 230 230, 280 170 S 350 40, 430 -50";
const FLIGHT_EASE = [0.45, 0, 0.2, 1];

// Folded paper plane that flies off along a drawn trail once the message is sent.
function PlaneFlight() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[360px] -translate-x-1/2 -translate-y-1/2">
      <svg viewBox="0 0 360 260" className="absolute inset-0 h-full w-full overflow-visible">
        <motion.path
          d={FLIGHT_PATH}
          fill="none"
          stroke="#6ebd44"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.8 }}
          animate={{ pathLength: 1, opacity: 0 }}
          transition={{ pathLength: { duration: 1.3, ease: FLIGHT_EASE }, opacity: { duration: 0.5, delay: 1.1 } }}
        />
      </svg>
      <motion.div
        className="absolute left-0 top-0 [perspective:400px]"
        style={{ offsetPath: `path("${FLIGHT_PATH}")`, offsetRotate: "auto" }}
        initial={{ offsetDistance: "0%", opacity: 0 }}
        animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.3, ease: FLIGHT_EASE, opacity: { duration: 1.3, times: [0, 0.1, 0.85, 1] } }}
      >
        {/* Roll and pitch on the inner layer give the flat SVG a 3D banking feel. */}
        <motion.svg
          viewBox="0 0 24 24"
          className="h-11 w-11 drop-shadow-[0_8px_10px_rgba(16,37,29,0.3)]"
          initial={{ rotateX: 0, scale: 0.8 }}
          animate={{ rotateX: [0, 35, -30, 20, 0], scale: [0.8, 1.15, 1, 1.1, 0.9] }}
          transition={{ duration: 1.3, ease: "easeInOut" }}
        >
          <path d="M1 3 L23 12 L7 12 Z" fill="#6ebd44" />
          <path d="M7 12 L23 12 L4 20 Z" fill="#2e6b2e" />
          <path d="M7 12 L23 12 L10 15.5 Z" fill="#10251D" opacity="0.55" />
        </motion.svg>
      </motion.div>
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  const [support, setSupport] = useState({
    email: "team@skybirdssolution.com",
    mobile: "+91 70414 92302",
    location: "SkyBirds solution, 2nd floor, Green Palladia, 218, opp. Raj World Shopping Center, Palanpur, Surat, Gujarat 395009",
    heading: "How Can Our Marketplace Team Help You?",
    description: "Have questions about our video courses, seller onboarding services, or account management? Send us a message and our specialists will respond promptly.",
    responseTime: "Typical response time: Under 4 business hours",
  });

  const previewVersion = useSitePreviewVersion();
  useEffect(() => {
    fetchSiteContent().then((res) => {
      if (res.success) setSupport((prev) => ({ ...prev, ...(res.data?.support || {}) }));
    }).catch(() => {});
  }, [previewVersion]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setStatusMessage("");

    try {
      const { data } = await API.post("/contact", form);
      if (data.success) {
        setStatus("success");
        setStatusMessage(data.message || "Thank you! Our marketplace specialist will contact you soon.");
        setForm(EMPTY_FORM);
      } else {
        setStatus("error");
        setStatusMessage(data.message || "Failed to submit query. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setStatusMessage(err.response?.data?.message || "Failed to send message. Please check your connection.");
    }
  }

  const text = support.contactPage || {};
  const topics = Array.isArray(text.topics) && text.topics.length ? text.topics : TOPICS;
  // The first number in the support phone field is used for call/WhatsApp links.
  const phoneDigits = String(support.mobile || "").split("/")[0].replace(/\D/g, "");
  const whatsappDigits = String(support.whatsapp || "").replace(/\D/g, "") || phoneDigits;
  const quickActions = [
    { icon: Phone, label: text.callLabel || "Call us", value: support.mobile, href: phoneDigits && `tel:+${phoneDigits}` },
    { icon: MessageCircle, label: text.whatsappLabel || "WhatsApp", value: text.whatsappText || "Chat with our team", href: whatsappDigits && `https://wa.me/${whatsappDigits}`, external: true },
    { icon: Mail, label: text.emailLabel || "Email", value: support.email, href: support.email && `mailto:${support.email}` },
  ];

  return (
    <section data-edit="support.contactPage" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-leaf/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <motion.div {...rise()}>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              {support.heading}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{support.description}</p>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-3">
            {quickActions.map(({ icon: Icon, label, value, href, external }, i) => (
              <motion.a
                key={label}
                {...rise(0.1 + i * 0.08)}
                href={href || undefined}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="group relative overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-leaf/40 hover:shadow-[0_18px_40px_-20px_rgba(16,37,29,0.35)]"
              >
                <div className="flex items-start justify-between max-sm:float-left max-sm:mr-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest transition-colors duration-300 group-hover:bg-leaf group-hover:text-white">
                    <Icon size={18} />
                  </span>
                  <ArrowUpRight size={16} className="max-sm:hidden text-slate-300 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest" />
                </div>
                <p className="text-xs font-medium text-slate-500 sm:mt-4">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {String(value || "").split("@").map((part, j) => (j ? <span key={j}>@<wbr />{part}</span> : part))}
                </p>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Form + office */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          {/* Form card */}
          <motion.div
            {...rise(0.2)}
            className="relative overflow-hidden rounded-[28px] border border-black/[0.06] bg-white p-6 lg:order-2 shadow-[0_30px_60px_-35px_rgba(16,37,29,0.35)] sm:p-9"
          >
            <AnimatePresence mode="wait" initial={false}>
              {status === "success" ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  className="relative flex min-h-[420px] flex-col items-center justify-center text-center"
                  role="status"
                >
                  <PlaneFlight />
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.6, delay: 1.1 }}
                    className="relative grid h-16 w-16 place-items-center rounded-full bg-leaf text-white shadow-[0_0_0_10px_rgba(110,189,68,0.15)]"
                  >
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 1.35 }} />
                    </svg>
                  </motion.span>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 1.25 }}
                    className="relative flex flex-col items-center"
                  >
                    <h2 className="mt-6 text-2xl font-bold text-ink">{text.successTitle || "Message sent"}</h2>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{statusMessage}</p>
                    <button
                      type="button"
                      onClick={() => setStatus(null)}
                      className="mt-7 rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-forest transition hover:bg-mint"
                    >
                      <RollText>Send another message</RollText>
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-xl font-bold text-ink">{text.formTitle || "Send us a message"}</h2>
                    <p className="mt-1 text-sm text-slate-500">{text.formSubtitle || "We usually reply the same business day."}</p>
                  </div>

                  <AnimatePresence>
                    {status === "error" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 overflow-hidden rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-800"
                        role="alert"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                        <span>{statusMessage}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Topic chips fill the subject field */}
                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-600">{text.topicsLabel || "What can we help with?"}</p>
                    <div className="flex flex-wrap gap-2">
                      {topics.map((topic) => {
                        const active = form.subject === topic;
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, subject: active ? "" : topic }))}
                            aria-pressed={active}
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                              active
                                ? "border-leaf bg-leaf text-[#10251D]"
                                : "border-black/10 bg-white text-slate-600 hover:border-leaf/50 hover:text-forest"
                            }`}
                          >
                            {topic}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={text.nameLabel || "Full name"} name="name" value={form.name} onChange={handleChange} maxLength={120} required autoComplete="name" />
                    <Field label={text.emailFieldLabel || "Email address"} type="email" name="email" value={form.email} onChange={handleChange} maxLength={254} required autoComplete="email" />
                    <Field label={text.phoneLabel || "Mobile / WhatsApp"} type="tel" name="phone" value={form.phone} onChange={handleChange} maxLength={30} autoComplete="tel" />
                    <Field label={text.subjectLabel || "Subject"} name="subject" value={form.subject} onChange={handleChange} maxLength={200} required />
                  </div>
                  <Field as="textarea" label={text.messageLabel || "Your message or store details"} name="message" value={form.message} onChange={handleChange} maxLength={5000} required rows={5} />

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <p className="text-xs text-slate-500">{text.requiredNote || "Fields marked * are required."}</p>
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#10251D] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-forest disabled:opacity-60"
                    >
                      <Shine />
                      {status === "loading" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <RollText>Sending...</RollText>
                        </>
                      ) : (
                        <>
                          <RollText>{text.submitLabel || "Send message"}</RollText>
                          <Send className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Office card */}
          <motion.div
            {...rise(0.3)}
            className="relative flex flex-col overflow-hidden rounded-[28px] bg-[#10251D] text-white lg:order-1"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-leaf/20 blur-3xl" />
            <div className="relative p-7 sm:p-8">
              <h2 className="text-xl font-bold">{text.officeTitle || "Visit our office"}</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {text.officeText || "Talk with an e-commerce growth manager who understands Amazon India, Meesho, and Flipkart seller challenges."}
              </p>
              <div className="mt-6 flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-leaf">
                  <MapPin size={18} />
                </span>
                <p className="text-sm leading-6 text-white/90">{support.location}</p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-leaf">
                  <Clock size={18} />
                </span>
                <p className="text-sm text-white/90">{support.responseTime}</p>
              </div>
            </div>

            {support.location ? (
              <div className="relative mx-3 mb-3 mt-auto min-h-[220px] flex-1 overflow-hidden rounded-[20px]">
                <iframe
                  title="Office location map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(support.location)}&output=embed`}
                  className="absolute inset-0 h-full w-full border-0 grayscale-[30%]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
