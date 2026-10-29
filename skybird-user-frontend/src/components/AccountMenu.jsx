import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import RollText from "./RollText";

// Navbar account button with a small dropdown menu (desktop).
export default function AccountMenu({ user, isAuthenticated, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = user?.name || "Learner";
  const items = [{ to: "/dashboard", label: "My Dashboard", icon: LayoutDashboard }];

  // Logged out: Sign in + Sign up. Both use the same page, which detects
  // whether the mobile number already has an account.
  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-2 rounded-full bg-leaf px-5 py-2 text-sm font-bold text-[#10251D] shadow-[0_0_0_4px_rgba(110,189,68,0.15)] transition hover:bg-white hover:shadow-[0_0_0_6px_rgba(255,255,255,0.12)]"
      >
        <LogIn size={16} strokeWidth={2.4} />
        <RollText>Sign in / Sign up</RollText>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          isAuthenticated
            ? "flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-3 text-sm font-semibold text-white transition hover:bg-white/10"
            : "group flex items-center gap-2 rounded-full bg-leaf py-2 pl-4 pr-3 text-sm font-bold text-[#10251D] shadow-[0_0_0_4px_rgba(110,189,68,0.15)] transition hover:bg-white hover:shadow-[0_0_0_6px_rgba(255,255,255,0.12)]"
        }
      >
        {isAuthenticated ? (
          <>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-leaf text-xs font-bold text-[#10251D]">
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-[110px] truncate">{name.split(" ")[0]}</span>
          </>
        ) : (
          <>
            <LogIn size={16} strokeWidth={2.4} />
            Login
          </>
        )}
        <ChevronDown size={15} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="absolute right-0 top-[calc(100%+12px)] w-60 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[#10251D] p-1.5 text-white shadow-2xl shadow-black/30"
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
          >
            {isAuthenticated && (
              <div className="px-3 pb-2 pt-2">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="truncate text-xs text-white/50">{user?.mobile ? `+91 ${user.mobile}` : user?.email || ""}</p>
              </div>
            )}
            {isAuthenticated && <div className="mx-2 mb-1 h-px bg-white/10" />}

            {items.map(({ to, label, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 + i * 0.03, duration: 0.2 }}
              >
                <Link
                  role="menuitem"
                  to={to}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  <Icon size={16} className="text-white/45 transition-colors group-hover:text-leaf" />
                  {label}
                  <span className="ml-auto text-xs text-white/0 transition-all group-hover:translate-x-0.5 group-hover:text-white/60">→</span>
                </Link>
              </motion.div>
            ))}

            {isAuthenticated && (
              <>
                <div className="mx-2 my-1 h-px bg-white/10" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-500/15"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
