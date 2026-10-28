import { motion } from "motion/react";

/**
 * Floating WhatsApp + Telegram contact shortcuts.
 * Configure these with your real contact details before publishing:
 * VITE_WHATSAPP_NUMBER=91XXXXXXXXXX (digits only, include country code)
 * VITE_TELEGRAM_USERNAME=your_telegram_username (without @)
 */
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "";
const TELEGRAM_USERNAME = import.meta.env.VITE_TELEGRAM_USERNAME || "";

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

export default function FloatingContactButtons() {
  const whatsappHref = WHATSAPP_NUMBER
    ? `https://wa.me/+917041492302`
    : "/contact";
  const telegramHref = TELEGRAM_USERNAME
    ? `https://t.me/sbsecomlearninghub`
    : "/contact";

  return (
    <div className="fixed bottom-5 right-6 z-[1000] flex flex-row items-center gap-2 sm:bottom-7 sm:right-6">
      <motion.a
        href="https://t.me/sbsecomlearninghub"
        target={TELEGRAM_USERNAME ? "_blank" : undefined}
        rel={TELEGRAM_USERNAME ? "noreferrer" : undefined}
        aria-label="Contact us on Telegram"
        title="Telegram"
        initial={{ opacity: 0, x: 24, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.12 }}
        className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-[#229ED9] text-white shadow-lg shadow-sky-900/20 ring-2 ring-white/80 transition-colors hover:bg-[#168ac2]"
      >
        <TelegramIcon />
        <span className="pointer-events-none absolute right-[calc(100%+12px)] whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Chat on Telegram
        </span>
      </motion.a>

      <motion.a
        href="https://wa.me/+917041492302"
        target={WHATSAPP_NUMBER ? "_blank" : undefined}
        rel={WHATSAPP_NUMBER ? "noreferrer" : undefined}
        aria-label="Contact us on WhatsApp"
        title="WhatsApp"
        initial={{ opacity: 0, x: 24, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-900/25 ring-2 ring-white/80 transition-colors hover:bg-[#1fbd5b]"
      >
        <WhatsAppIcon />
        <span className="pointer-events-none absolute right-[calc(100%+12px)] whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Chat on WhatsApp
        </span>
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/35" />
      </motion.a>
    </div>
  );
}
