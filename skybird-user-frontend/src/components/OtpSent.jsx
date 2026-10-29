import { motion } from "motion/react";
import { Send, Smartphone } from "lucide-react";

// Short "OTP sent" moment: a message flies into the phone, a check draws in
// and two ripples pulse out. Finite (no endless loops); remount it to replay.
export function OtpSentAnimation() {
  return (
    <div className="flex flex-col items-center" role="status">
      <div className="relative grid h-20 w-20 place-items-center">
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
          className="relative grid h-16 w-16 place-items-center rounded-full bg-mint text-forest"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.45, duration: 0.6 }}
        >
          <Smartphone size={28} strokeWidth={1.8} />

          {/* Message flies in and lands on the phone */}
          <motion.span
            aria-hidden="true"
            className="absolute text-leaf"
            initial={{ x: -46, y: 26, opacity: 0, rotate: -20, scale: 0.8 }}
            animate={{ x: [-46, 0], y: [26, 0], opacity: [0, 1, 0], rotate: 0, scale: [0.8, 1, 0.4] }}
            transition={{ duration: 0.75, delay: 0.15, ease: "easeInOut" }}
          >
            <Send size={16} fill="currentColor" />
          </motion.span>

          {/* Check badge draws itself once the message has landed */}
          <motion.span
            aria-hidden="true"
            className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-leaf text-white shadow-md ring-4 ring-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.5, delay: 0.75 }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
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

      <motion.p
        className="mt-3 text-sm font-semibold text-ink"
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
        Check your SMS inbox
      </motion.p>
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
