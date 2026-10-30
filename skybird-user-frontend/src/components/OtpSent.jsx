import { motion } from "motion/react";
import { Mail, Send, Smartphone } from "lucide-react";

// Short "OTP sent" moment: a message flies into the phone, a check draws in
// and two ripples pulse out. Finite (no endless loops); remount it to replay.
// channel: "mobile" (SMS) or "email".
export function OtpSentAnimation({ channel = "mobile" }) {
  const Icon = channel === "email" ? Mail : Smartphone;
  return (
    <div className="flex items-center justify-center gap-3.5" role="status">
      <div className="relative grid h-14 w-14 shrink-0 place-items-center">
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-leaf/50"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.7], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, delay: 0.75 + i * 0.35, ease: "easeOut", repeat: 1, repeatDelay: 0.6 }}
          />
        ))}

        <motion.div
          className="relative grid h-12 w-12 place-items-center rounded-full bg-mint text-forest"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.45, duration: 0.6 }}
        >
          <Icon size={21} strokeWidth={1.8} />

          {/* Message flies in and lands on the phone */}
          <motion.span
            aria-hidden="true"
            className="absolute text-leaf"
            initial={{ x: -34, y: 18, opacity: 0, rotate: -20, scale: 0.8 }}
            animate={{ x: [-34, 0], y: [18, 0], opacity: [0, 1, 0], rotate: 0, scale: [0.8, 1, 0.4] }}
            transition={{ duration: 0.75, delay: 0.15, ease: "easeInOut" }}
          >
            <Send size={13} fill="currentColor" />
          </motion.span>

          {/* Check badge draws itself once the message has landed */}
          <motion.span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-leaf text-white shadow-md ring-[3px] ring-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.5, delay: 0.75 }}
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.95, ease: "easeOut" }}
              />
            </svg>
          </motion.span>
        </motion.div>
      </div>

      <div className="text-left">
      <motion.p
        className="text-sm font-semibold text-ink"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      >
        Code sent!
      </motion.p>
      <motion.p
        className="mt-0.5 text-xs text-ink/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.05, duration: 0.4 }}
      >
        {channel === "email" ? "Check your email inbox (and spam folder)" : "Check your SMS inbox"}
      </motion.p>
      </div>
    </div>
  );
}

// Small ring that empties as the resend countdown runs.
export function CountdownRing({ seconds, total }) {
  const r = 9;
  const length = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid h-6 w-6 place-items-center align-middle" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="absolute inset-0 -rotate-90">
        <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={2.5} />
        <motion.circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={length}
          initial={false}
          animate={{ strokeDashoffset: length * (1 - seconds / total) }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </svg>
      <span className="text-[9px] font-bold tabular-nums">{seconds}</span>
    </span>
  );
}
