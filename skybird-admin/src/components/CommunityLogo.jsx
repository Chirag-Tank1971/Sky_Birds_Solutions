// Same logos students see for community links (the admin panel is a separate app from the user site).
const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className="h-5 w-5 fill-current">
    <path d="M16.02 3.2A12.65 12.65 0 0 0 5.1 22.22L3.3 28.8l6.75-1.77A12.7 12.7 0 1 0 16.02 3.2Zm0 22.95c-1.9 0-3.77-.51-5.4-1.49l-.39-.23-4 .99 1.07-3.9-.25-.4a10.47 10.47 0 1 1 8.97 5.03Zm5.75-7.85c-.31-.16-1.84-.91-2.13-1.01-.29-.11-.5-.16-.71.16-.21.31-.81 1.01-.99 1.22-.18.21-.36.24-.67.08-.31-.16-1.31-.48-2.49-1.53-.92-.82-1.54-1.84-1.72-2.15-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.61-.52-.53-.71-.54h-.6c-.21 0-.55.08-.84.39-.29.31-1.1 1.07-1.1 2.62s1.13 3.04 1.29 3.25c.16.21 2.22 3.39 5.38 4.75.75.32 1.34.51 1.8.65.76.24 1.45.21 2 .13.61-.09 1.84-.75 2.1-1.47.26-.73.26-1.35.18-1.48-.08-.13-.29-.21-.6-.37Z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
    <path d="M21.8 4.3 18.6 19.4c-.24 1.07-.87 1.33-1.76.83l-4.86-3.58-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.95 9.01-8.14c.39-.35-.08-.54-.6-.19L6.27 13.18l-4.78-1.5c-1.04-.33-1.06-1.04.22-1.55L20.4 2.96c.86-.31 1.61.21 1.4 1.34Z" />
  </svg>
);

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

export default function CommunityLogo({ item }) {
  if (item.thumbnail) {
    const shape = item.type === "community" ? "h-14 w-14 rounded-2xl object-contain" : "h-16 w-24 rounded-lg object-cover";
    return <img src={item.thumbnail} alt="" className={`shrink-0 ${shape}`} />;
  }
  const app = item.type === "community" ? appLogo(item.url) : null;
  if (!app) return null;
  return (
    <span role="img" aria-label={app.name} className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl [&>svg]:h-8 [&>svg]:w-8 ${app.className}`}>
      <app.Logo />
    </span>
  );
}
