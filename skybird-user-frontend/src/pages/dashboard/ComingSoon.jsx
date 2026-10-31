import { useLocation } from "react-router-dom";
import { ArrowRight, CalendarDays, ClipboardList, Trophy, Users } from "lucide-react";

const PAGES = {
  sessions: { icon: CalendarDays, eyebrow: "Live learning", title: "My Sessions", text: "Live sessions and their recordings will appear here." },
  communities: {
    icon: Users,
    eyebrow: "Learn together",
    title: "Communities",
    text: "Community spaces are coming here soon. Until then, join our learners on Telegram.",
    action: { href: "https://t.me/sbsecomlearninghub", label: "Join on Telegram" },
  },
  assessments: { icon: ClipboardList, eyebrow: "Your learning resources", title: "My Assessments", text: "Worksheets, PDFs and study packs shared by your learning team will appear here." },
  rewards: { icon: Trophy, eyebrow: "Earn as you learn", title: "Rewards", text: "Rewards for your learning progress will appear here." },
};

// shortcut: placeholder for sections with no backend yet, replace each with a real page once its data exists.
export default function ComingSoon() {
  const { pathname } = useLocation();
  const { icon: Icon, eyebrow, title, text, action } = PAGES[pathname.split("/").filter(Boolean).pop()];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">{title}</h1>

      <section className="relative mt-7 overflow-hidden rounded-3xl bg-[#10251D] px-6 py-14 text-center text-white">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-leaf/20 blur-3xl" />
        <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-leaf">
          <Icon size={24} />
        </span>
        <p className="relative mt-5 text-xl font-bold">Coming soon</p>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-white/65">{text}</p>
        {action ? (
          <a
            href={action.href}
            target="_blank"
            rel="noreferrer"
            className="relative mt-6 inline-flex items-center gap-1.5 rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-[#10251D] transition hover:bg-white"
          >
            {action.label} <ArrowRight size={16} />
          </a>
        ) : null}
      </section>
    </div>
  );
}
