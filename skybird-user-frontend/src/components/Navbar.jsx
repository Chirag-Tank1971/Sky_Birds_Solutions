import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useUser } from "../context/UserContext";
import RollText from "./RollText";
import AccountMenu from "./AccountMenu";

const links = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useUser();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [navHover, setNavHover] = useState(null);
  const navigate = useNavigate();
  const navLinks = isAuthenticated ? [...links, { to: "/dashboard", label: "Dashboard" }] : links;

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* -mb pulls the page up under the header so it floats over the hero; Layout adds the space back on other pages. */}
      <header className="sticky top-0 z-50 -mb-[74px] px-4 pt-3">
        {/* Navbar: same solid dark green as the footer, so nothing shows through */}
        <div
          className="
            mx-auto max-w-6xl
            rounded-2xl
            border border-white/10
            bg-[#10251D]
            shadow-lg shadow-slate-900/10
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

            {/* Desktop Navigation: pill track with a gliding hover highlight and active pill */}
            <nav
              className="hidden items-center gap-0.5 rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10 md:flex"
              onMouseLeave={() => setNavHover(null)}
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onMouseEnter={() => setNavHover(link.to)}
                  className={({ isActive }) =>
                    `relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                      isActive ? "text-[#10251D]" : "text-white/75 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-full bg-leaf"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                        />
                      )}
                      {!isActive && navHover === link.to && (
                        <motion.span
                          layoutId="nav-hover"
                          className="absolute inset-0 rounded-full bg-white/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                        />
                      )}
                      <span className="relative">
                        <RollText>{link.label}</RollText>
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Desktop account button + small menu */}
            <div className="hidden shrink-0 md:block">
              <AccountMenu user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="
                grid h-10 w-10 shrink-0 place-items-center
                rounded-full border border-white/15
                bg-white/10 text-white
                transition hover:bg-white/20
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

      {/* ================= MOBILE MENU ================= */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-[60] bg-black/30 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            {/* Floating card under the navbar, same dark green */}
            <motion.aside
              className="fixed right-4 top-[84px] z-[70] w-[min(300px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[#10251D] p-2 text-white shadow-2xl shadow-black/30 md:hidden"
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
            >
              <nav className="flex flex-col" onMouseLeave={() => setHovered(null)}>
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 + index * 0.04 }}
                    onMouseEnter={() => setHovered(link.to)}
                  >
                    <NavLink
                      to={link.to}
                      end={link.to === "/"}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                          isActive ? "text-leaf" : "text-white/80 hover:text-white"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Highlight that glides between hovered items */}
                          {hovered === link.to && (
                            <motion.span
                              layoutId="mobile-menu-hover"
                              className="absolute inset-0 rounded-xl bg-white/[0.07]"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                            />
                          )}
                          <span className="relative flex items-center gap-2.5">
                            <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-leaf" : "bg-white/20 group-hover:bg-white/50"}`} />
                            {link.label}
                          </span>
                          <span
                            className="relative text-xs text-white/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white/80"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </>
                      )}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              <div className="mx-2 my-2 h-px bg-white/10" />

              {isAuthenticated ? (
                <div className="flex items-center gap-2.5 px-2 pb-1 pt-1">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-leaf text-xs font-bold text-[#10251D]">
                    {(user?.name || "L").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{user?.name || "Learner"}</p>
                    <p className="truncate text-[11px] text-white/50">
                      {user?.mobile ? `+91 ${user.mobile}` : user?.email || ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="shrink-0 rounded-full border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500 hover:text-white"
                  >
                    <RollText>Logout</RollText>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="m-1 flex items-center justify-center rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-[#10251D] transition hover:bg-white"
                >
                  <RollText>Sign in / Sign up</RollText>
                </Link>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
