import { useEffect, useState } from "react";
import API from "../api/axios";
import { fetchSiteContent } from "../api/site";
import { Mail, Phone, MapPin, CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  const [support, setSupport] = useState({
    email: "support@skybirds.in",
    mobile: "+91 98765 43210 / +91 80000 12345",
    location: "SkyBirds E-Commerce Academy, Cyber City, Sector 24, Gurugram, Haryana - 122002",
    heading: "How Can Our Marketplace Team Help You?",
    description: "Have questions about our video courses, seller onboarding services, or account management? Send us a message and our specialists will respond promptly.",
    responseTime: "Typical response time: Under 4 business hours",
  });

  useEffect(() => {
    fetchSiteContent().then((res) => {
      if (res.success) setSupport((prev) => ({ ...prev, ...(res.data?.support || {}) }));
    }).catch(() => {});
  }, []);

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
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setStatus("error");
        setStatusMessage(data.message || "Failed to submit query. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setStatusMessage(err.response?.data?.message || "Failed to send message. Please check your connection.");
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-leaf">
          Direct Seller Support
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {support.heading}
        </h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          {support.description}
        </p>
      </div>

      {/* Card */}
      <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
        <div className="grid lg:grid-cols-[340px_1fr]">
          {/* Left – Contact Info */}
          <div className="relative overflow-hidden bg-forest p-8 text-white flex flex-col justify-between">
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-leaf/20" />
            <div className="absolute -bottom-4 -right-4 h-28 w-28 rounded-full bg-leaf/30" />

            <div className="relative">
              <span className="text-xs font-bold uppercase tracking-wider text-leaf">
                SkyBirds Headquarters
              </span>
              <h3 className="text-xl font-bold mt-1">Get in Touch</h3>
              <p className="mt-3 text-xs leading-relaxed text-white/80">
                Talk with an e-commerce growth manager who understands Amazon India, Meesho, and Flipkart seller challenges.
              </p>

              <div className="mt-8 space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-leaf">
                    <Phone className="w-4 h-4" />
                  </span>
                  <span>{support.mobile}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-leaf">
                    <Mail className="w-4 h-4" />
                  </span>
                  <span>{support.email}</span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-leaf">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <span>{support.location}</span>
                </div>
              </div>
            </div>

            <div className="relative mt-8 pt-4 border-t border-white/10 text-[11px] text-white/70">
              ⚡ {support.responseTime}
            </div>
          </div>

          {/* Right – Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-5">
            {status === "success" && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="rahul@example.com"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Mobile / WhatsApp Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Topic / Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Course Inquiry or Seller Onboarding"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Your Message / Store Details *
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Tell us about your products or question..."
                className="w-full resize-none rounded-lg border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={status === "loading"}
                className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-leaf px-7 py-3 text-xs font-bold text-white transition hover:bg-forest disabled:opacity-60 shadow-sm"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Query...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit Inquiry
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
