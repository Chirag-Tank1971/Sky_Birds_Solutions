import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight, CalendarDays, ClipboardList, PlayCircle, Trophy, Users } from "lucide-react";
import { getLearningContent } from "../../api/auth";
import { TelegramIcon, WhatsAppIcon } from "../../components/FloatingContactButtons";

const PAGES = {
  sessions: { type: "session", icon: CalendarDays, eyebrow: "Live learning", title: "My Sessions", text: "Live sessions and their recordings will appear here.", linkLabel: "Join session" },
  communities: {
    type: "community",
    icon: Users,
    eyebrow: "Learn together",
    title: "Communities",
    text: "Community spaces will appear here.",
    linkLabel: "Join",
  },
  resources: { type: "resource", icon: ClipboardList, eyebrow: "Your learning resources", title: "My Resources", text: "Worksheets, PDFs and study packs shared by your learning team will appear here.", linkLabel: "Open" },
  rewards: { type: "reward", icon: Trophy, eyebrow: "Earn as you learn", title: "Rewards", text: "Rewards for your learning progress will appear here.", linkLabel: "Claim" },
};

const linkClass = "inline-flex items-center gap-1.5 rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-[#10251D] transition hover:bg-forest hover:text-white";

// The app's own logo for a community link, when no image was uploaded.
function appLogo(url) {
  let host;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  if (["t.me", "telegram.me", "telegram.org"].includes(host)) return { Logo: TelegramIcon, className: "bg-[#229ED9] text-white", name: "Telegram" };
  if (["wa.me", "chat.whatsapp.com", "whatsapp.com"].includes(host)) return { Logo: WhatsAppIcon, className: "bg-[#25D366] text-white", name: "WhatsApp" };
  return null;
}

function ContentImage({ item, type, Icon }) {
  if (item.thumbnail) {
    // Communities use logos, which must show whole; other items use wide photos.
    const shape = type === "community" ? "h-14 w-14 rounded-2xl object-contain" : "h-24 w-40 rounded-xl object-cover";
    return <img src={item.thumbnail} alt="" loading="lazy" decoding="async" className={`shrink-0 ${shape}`} />;
  }
  const app = type === "community" ? appLogo(item.url) : null;
  if (app) {
    return (
      <span role="img" aria-label={app.name} className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl [&>svg]:h-8 [&>svg]:w-8 ${app.className}`}>
        <app.Logo />
      </span>
    );
  }
  return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-forest"><Icon size={18} /></span>;
}

function ContentCard({ item, page, Icon }) {
  return (
    <li className="flex flex-wrap items-start gap-4 rounded-2xl border border-forest/10 bg-white p-5">
      <ContentImage item={item} type={page.type} Icon={Icon} />
      <div className="min-w-[12rem] flex-1">
        <h3 className="break-words font-semibold text-ink">{item.title}</h3>
        {item.startsAt ? (
          <p className="mt-0.5 text-sm font-medium text-forest">
            {new Date(item.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {item.durationMinutes} min
          </p>
        ) : null}
        {item.description ? <p className="mt-1 whitespace-pre-line text-sm text-ink/65">{item.description}</p> : null}
        {item.courseTitle ? <p className="mt-1 text-xs text-ink/50">{item.courseTitle}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {page.linkLabel} <ArrowRight size={15} />
          </a>
        ) : null}
        {item.ended && item.recordingUrl ? (
          <a href={item.recordingUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <PlayCircle size={15} /> Watch recording
          </a>
        ) : null}
        {item.ended && !item.recordingUrl ? <span className="text-sm text-ink/50">Recording not available</span> : null}
      </div>
    </li>
  );
}

// Sections admins fill in from the admin panel; shows "coming soon" until something is published.
export default function ComingSoon() {
  const { pathname } = useLocation();
  const page = PAGES[pathname.split("/").filter(Boolean).pop()];
  const { icon: Icon, eyebrow, title, text, type } = page;
  const [result, setResult] = useState({ type: null, items: [], failed: false });

  useEffect(() => {
    let cancelled = false;
    getLearningContent(type)
      .then((res) => {
        if (!cancelled) setResult({ type, items: res.data || [], failed: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ type, items: [], failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const loading = result.type !== type;
  const upcoming = result.items.filter((item) => !item.ended);
  const past = result.items.filter((item) => item.ended).reverse();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">{title}</h1>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-leaf border-t-transparent" />
        </div>
      ) : result.failed ? (
        <p className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700" role="alert">
          We couldn't load this section. Please try again.
        </p>
      ) : result.items.length > 0 ? (
        <>
          {upcoming.length > 0 ? (
            <ul className="mt-7 space-y-3">
              {upcoming.map((item) => <ContentCard key={item.id} item={item} page={page} Icon={Icon} />)}
            </ul>
          ) : null}
          {past.length > 0 ? (
            <>
              <h2 className="mt-8 text-xl font-bold text-ink">Past sessions</h2>
              <ul className="mt-3 space-y-3">
                {past.map((item) => <ContentCard key={item.id} item={item} page={page} Icon={Icon} />)}
              </ul>
            </>
          ) : null}
        </>
      ) : (
        <section className="relative mt-7 overflow-hidden rounded-3xl bg-[#10251D] px-6 py-14 text-center text-white">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-leaf/20 blur-3xl" />
          <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-leaf">
            <Icon size={24} />
          </span>
          <p className="relative mt-5 text-xl font-bold">Coming soon</p>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-white/65">{text}</p>
        </section>
      )}
    </div>
  );
}
