import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSiteContent } from "../api/site";
import { useUser } from "../context/UserContext";
import RollText from "./RollText";

// Inline SVG icons — no external icon library required
function Icon({ name, size = 20, className = "" }) {
  const paths = {
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r=".7" fill="currentColor" />
      </>
    ),
    facebook: (
      <path
        fill="currentColor"
        stroke="none"
        d="M13.5 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.8-.1-1.6-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.3v2.4H7.5v3.2h2.8V21z"
      />
    ),
    whatsapp: (
      <>
        <path
          d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.9-1.3A9.5 9.5 0 1 0 12 2.5Z"
          fill="none"
        />
        <path
          d="M8.1 7.3c-.3-.6-.6-.6-.9-.6h-.7c-.3 0-.7.2-1 .5-.4.4-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.8 5.9 5.1 2.9 1.1 3.5.9 4.1.8.6-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.1-.3-.2-.7-.4l-2.1-1c-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.3-.7.1-.4-.2-1.5-.6-2.8-1.8-1-.9-1.7-2-1.9-2.4-.2-.4 0-.5.2-.7l.5-.6.4-.6c.1-.2 0-.4 0-.6Z"
          fill="currentColor"
          stroke="none"
        />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19a19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 8.9a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.8 2.1Z" />
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    arrow: (
      <>
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </>
    ),
    telegram: (
      <>
        <path
          d="M22 3 2.8 10.4c-1.3.5-1.3 1.2-.2 1.5l4.9 1.5 1.9 6c.2.7.1 1 .9 1 .6 0 .9-.3 1.2-.6l2.8-2.7 5.8 4.3c1.1.6 1.9.3 2.2-1L25 4.5C25.4 3 24.4 2.3 22 3Z"
          transform="translate(-1.5 -1.5) scale(.96)"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="m7.5 13.2 10.9-6.8-8.4 8.1-.3 3.1"
          fill="none"
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
      </>
    ),
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function Footer() {
  const { isAuthenticated } = useUser();
  const [support, setSupport] = useState({
    email: "support@skybirds.in",
    phone: "",
    whatsapp: "",
  });

  useEffect(() => {
    let cancelled = false;

    fetchSiteContent()
      .then((res) => {
        if (!cancelled && res?.success) {
          setSupport((prev) => ({
            ...prev,
            ...(res.data?.support || {}),
          }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const email = support.email || "support@skybirds.in";
  const phone = support.phone || support.mobile || "";
  const whatsapp = support.whatsapp || phone;

  const whatsappUrl = whatsapp
    ? `https://wa.me/${String(whatsapp).replace(/\D/g, "")}`
    : "https://wa.me/";

  const configuredSocialLinks = Array.isArray(support.socialLinks)
    ? support.socialLinks.filter((item) => item && item.url && item.url.trim())
    : [];

  const socialLinks = [
    ...configuredSocialLinks.map((item, index) => ({
      name: item.name || item.platform || `Social link ${index + 1}`,
      href: item.url,
      icon: ["instagram", "facebook", "whatsapp", "telegram"].includes(
        String(item.platform || item.name || "").toLowerCase(),
      )
        ? String(item.platform || item.name).toLowerCase()
        : "link",
      color: item.color || "hover:bg-emerald-600",
    })),
    ...(!configuredSocialLinks.some(
      (item) =>
        String(item.platform || item.name || "").toLowerCase() === "whatsapp",
    ) && whatsapp
      ? [
          {
            name: "WhatsApp",
            href: whatsappUrl,
            icon: "whatsapp",
            color: "hover:bg-green-600",
          },
        ]
      : []),
  ];

  const quickLinks = [
    { label: "Home", to: "/" },
    { label: "Courses", to: "/courses" },
    { label: "About SkyBirds", to: "/about" },
    { label: "Contact Us", to: "/contact" },
    isAuthenticated
      ? { label: "My Dashboard", to: "/dashboard" }
      : { label: "Login to Account", to: "/login" },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#10251D] text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-green-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 py-14 sm:grid-cols-2 md:py-16 lg:grid-cols-4 lg:gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-5 inline-flex items-center gap-3">
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl p-1.5 shadow-lg">
                <img decoding="async" loading="lazy"
                  src="/assets/logo1.webp"
                  alt="SkyBirds Logo"
                  className="h-full w-full object-contain"
                />
              </span>

              <span>
                <span className="block text-2xl font-extrabold tracking-tight">
                  Sky Birds
                </span>
                <span className="text-xs font-medium tracking-[0.2em] text-emerald-300">
                  SOLUTION
                </span>
              </span>
            </Link>

            <p className="max-w-sm text-sm leading-7 text-white/65">
              India's marketplace learning and seller onboarding platform. Grow
              your business across Amazon, Meesho and Flipkart with practical
              guidance and expert support.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  title={item.name}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-colors duration-300 hover:border-transparent ${item.color}`}
                >
                  <Icon name={item.icon} size={19} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-leaf">
              Quick Links
            </h3>

            <ul className="space-y-4 text-sm text-white/65">
              {quickLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="group inline-flex items-center gap-2 transition-colors hover:text-emerald-300"
                  >
                    <Icon
                      name="arrow"
                      size={14}
                      className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                    <RollText>{item.label}</RollText>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-leaf">
              Legal & Policies
            </h3>

            <ul className="space-y-4 text-sm text-white/65">
              <li>
                <Link
                  to="/privacy-policy"
                  className="transition hover:text-emerald-300"
                >
                  <RollText>Privacy Policy</RollText>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="transition hover:text-emerald-300">
                  <RollText>Terms & Conditions</RollText>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-leaf">
              Get in Touch
            </h3>

            <div className="space-y-5">
              <a
                href={`mailto:${email}`}
                className="group flex items-start gap-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-emerald-300 transition group-hover:bg-emerald-500 group-hover:text-white">
                  <Icon name="mail" size={19} />
                </span>
                <span className="min-w-0 pt-1">
                  <span className="mb-1 block text-xs text-white/45">
                    Email us
                  </span>
                  <span className="break-all text-sm text-white/80 transition group-hover:text-emerald-300">
                    {email}
                  </span>
                </span>
              </a>

              {phone && (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="group flex items-start gap-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-emerald-300 transition group-hover:bg-emerald-500 group-hover:text-white">
                    <Icon name="phone" size={19} />
                  </span>
                  <span className="pt-1">
                    <span className="mb-1 block text-xs text-white/45">
                      Call us
                    </span>
                    <span className="text-sm text-white/80 transition group-hover:text-emerald-300">
                      {phone}
                    </span>
                  </span>
                </a>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-emerald-300 transition group-hover:bg-green-600 group-hover:text-white">
                  <Icon name="whatsapp" size={19} />
                </span>
                <span>
                  <span className="mb-1 block text-xs text-white/45">
                    WhatsApp Support
                  </span>
                  <span className="text-sm text-white/80 transition group-hover:text-emerald-300">
                    Chat with our team
                  </span>
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs leading-6 text-white/45">
            © {new Date().getFullYear()} SkyBirds Academy. All rights reserved.{" "}
            <a
              href="https://marketbloomss.com/"
              target="blank"
              className="underline"
            >
              Design by Market Bloomss
            </a>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/45 sm:justify-end">
            <Link
              to="/privacy-policy"
              className="transition hover:text-emerald-300"
            >
              Privacy
            </Link>
            <Link to="/terms" className="transition hover:text-emerald-300">
              Terms
            </Link>
            <a
              href={`mailto:${email}`}
              className="transition hover:text-emerald-300"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
