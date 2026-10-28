import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useUser } from "../context/UserContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useUser();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
      isActive
        ? "bg-white/75 text-forest shadow-sm ring-1 ring-white/80"
        : "text-ink/80 hover:bg-white/90 hover:text-forest text-white"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 px-4 pt-3">
        {/* Glass Navbar */}
        <div
          className="
            mx-auto max-w-6xl
            rounded-full
            border border-white/60
            bg-black/90
            shadow-lg shadow-slate-900/5
            backdrop-blur-2xl
            backdrop-saturate-150
          "
        >
          <div className="flex min-h-[60px] items-center justify-between gap-4 px-5 sm:px-6">
            {/* Logo */}

            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex shrink-0 items-center gap-2.5"
            >
              <span className="-mt-2 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white">
                <img decoding="async" loading="eager" src="/assets/logo1.webp" alt="Sky Birds" />
              </span>

              <span className="flex flex-col leading-tight">
                <span className="text-base font-bold tracking-tight text-white">
                  Sky Birds
                </span>
                <span className="text-xs font-medium tracking-wider text-white/80 -mt-0.5">
                  Solution
                </span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={navLinkClass}
                >
                  {link.label}
                </NavLink>
              ))}

              {isAuthenticated && (
                <NavLink to="/dashboard" className={navLinkClass}>
                  My Dashboard
                </NavLink>
              )}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden shrink-0 items-center gap-3 md:flex">
              {isAuthenticated ? (
                <>
                  <div className="max-w-[160px] text-right">
                    <p className="truncate text-sm font-semibold text-ink">
                      {user?.name || "Learner"}
                    </p>

                    <p className="truncate text-xs text-ink/60">
                      {user?.mobile ? `+91 ${user.mobile}` : user?.email || ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      rounded-full border border-forest/20
                      bg-red-500 cursor-pointer px-4 py-2
                      text-sm font-semibold text-white
                      transition hover:bg-white/80
                    "
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="
                    rounded-full bg-leaf px-5 py-2
                    text-sm font-bold text-white
                    shadow-sm transition
                    hover:bg-forest hover:shadow-md
                  "
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="
                grid h-10 w-10 shrink-0 place-items-center
                rounded-full border border-white/80
                bg-white/50 text-forest
                transition hover:bg-white/90
                md:hidden
              "
              aria-label="Open menu"
              aria-expanded={open}
            >
              <span className="flex w-5 flex-col gap-[5px]">
                <span className="h-0.5 w-full rounded-full bg-current" />
                <span className="h-0.5 w-full rounded-full bg-current" />
                <span className="h-0.5 w-full rounded-full bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MOBILE SIDEBAR ================= */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
            />

            {/* Sidebar */}
            <motion.aside
              className="
                fixed right-0 top-0 z-[70]
                flex h-dvh w-[82%] max-w-[360px]
                flex-col
                border-l border-white/70
                bg-white/90
                shadow-2xl
                backdrop-blur-2xl
                md:hidden
              "
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between border-b border-forest/10 px-5 py-5">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-black shadow-sm">
                    <img decoding="async" loading="eager"
                      src="/assets/logo1.webp"
                      alt="Sky Birds"
                      className="h-full w-full object-contain"
                    />
                  </span>

                  <div>
                    <p className="text-base font-bold tracking-tight text-ink">
                      Sky Birds
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-ink/50">
                      Learning Platform
                    </p>
                  </div>
                </Link>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="
                    grid h-10 w-10 place-items-center
                    rounded-full
                    border border-forest/10
                    bg-white
                    text-ink/70
                    shadow-sm
                    transition
                    hover:bg-forest hover:text-white
                  "
                  aria-label="Close menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 6l12 12M18 6L6 18"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">
                  Menu
                </p>

                <nav className="flex flex-col gap-2">
                  {links.map((link, index) => (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.08 + index * 0.05,
                        duration: 0.25,
                      }}
                    >
                      <NavLink
                        to={link.to}
                        end={link.to === "/"}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                            isActive
                              ? "bg-forest text-white shadow-md"
                              : "text-ink/80 hover:bg-forest/5 hover:text-forest"
                          }`
                        }
                      >
                        <span>{link.label}</span>

                        <span className="text-lg leading-none">›</span>
                      </NavLink>
                    </motion.div>
                  ))}

                  {isAuthenticated && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.28,
                        duration: 0.25,
                      }}
                    >
                      <NavLink
                        to="/dashboard"
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                            isActive
                              ? "bg-forest text-white shadow-md"
                              : "text-ink/80 hover:bg-forest/5 hover:text-forest"
                          }`
                        }
                      >
                        <span>My Dashboard</span>
                        <span className="text-lg leading-none">›</span>
                      </NavLink>
                    </motion.div>
                  )}
                </nav>

                {/* User Section */}
                {isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="
                      mt-8 rounded-2xl
                      border border-forest/10
                      bg-forest/[0.04]
                      p-4
                    "
                  >
                    <p className="text-xs font-medium text-ink/50">
                      Signed in as
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-ink">
                      {user?.name || "Learner"}
                    </p>

                    <p className="mt-1 truncate text-xs text-ink/60">
                      {user?.mobile ? `+91 ${user.mobile}` : user?.email || ""}
                    </p>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="
                        mt-4 w-full rounded-xl
                        border border-red-200
                        bg-red-50
                        px-4 py-3
                        text-sm font-semibold text-red-600
                        transition
                        hover:bg-red-100
                      "
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Bottom Login */}
              {!isAuthenticated && (
                <div className="border-t border-forest/10 p-5">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="
                      flex w-full items-center justify-center
                      rounded-2xl
                      bg-leaf
                      px-4 py-3.5
                      text-sm font-bold text-white
                      shadow-md
                      transition
                      hover:bg-forest
                    "
                  >
                    Login / Register
                  </Link>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-forest/10 px-5 py-4">
                <p className="text-center text-[10px] text-ink/40">
                  © {new Date().getFullYear()} Sky Birds Academy
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
