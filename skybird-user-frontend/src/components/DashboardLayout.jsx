import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Compass,
  CreditCard,
  LogOut,
  Menu,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import SiteSEO from "./SiteSEO";

const sections = [
  {
    title: "Your space",
    items: [
      { to: "/dashboard", label: "My Courses", icon: BookOpen },
      { to: "/dashboard/explore", label: "Explore Courses", icon: Compass },
      { to: "/dashboard/sessions", label: "My Sessions", icon: CalendarDays },
      { to: "/dashboard/communities", label: "Communities", icon: Users },
      { to: "/dashboard/assessments", label: "My Assessments", icon: ClipboardList },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/dashboard/transactions", label: "Transactions", icon: CreditCard },
      { to: "/dashboard/rewards", label: "Rewards", icon: Trophy },
      { to: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];
const allItems = sections.flatMap((section) => section.items);

export default function DashboardLayout() {
  const { user, logout } = useUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const name = user?.name || "Learner";
  const initial = name.charAt(0).toUpperCase();
  const title = allItems.find((item) => item.to === pathname.replace(/\/$/, ""))?.label || "Dashboard";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <SiteSEO />

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      ) : null}

      {/* Invisible while closed so hidden links can't take keyboard focus on small screens. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-[#10251D] text-white transition-[transform,visibility] duration-300 lg:visible lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img decoding="async" src="/assets/logo1.webp" alt="" className="-mt-1 h-9 w-9" />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">Sky Birds</span>
              <span className="-mt-0.5 text-xs font-medium tracking-wider text-white/80">Solution</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full text-white/70 hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf text-sm font-bold text-[#10251D]">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-white/55">Student account</p>
          </div>
        </div>

        <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-3" aria-label="Dashboard">
          {sections.map((section) => (
            <div key={section.title} className="mt-3">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                {section.title}
              </p>
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "text-[#10251D]" : "text-white/75 hover:bg-white/[0.07] hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <motion.span
                          layoutId="dashboard-active"
                          className="absolute inset-0 rounded-xl bg-leaf"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                        />
                      ) : null}
                      <Icon size={17} className="relative shrink-0" />
                      <span className="relative">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            <ArrowLeft size={17} /> Back to website
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/15"
          >
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-forest/10 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-forest/15 text-ink lg:hidden"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45">Learning portal</p>
            <p className="truncate text-lg font-bold text-ink">{title}</p>
          </div>
          <p className="hidden max-w-[260px] truncate text-sm text-ink/60 sm:block">Welcome back, {name}</p>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint text-sm font-bold text-forest">
            {initial}
          </span>
        </header>

        <main className="flex-1">
          {/* Keyed so each section replays the page reveal, as site pages do. */}
          <div key={pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
