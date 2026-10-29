import { useState } from "react";
import { motion } from "motion/react";

// Six animated digit boxes drawn over one real (invisible) input, so paste,
// SMS auto-fill, backspace and screen readers behave like a normal field.
// Changing `shakeKey` shakes the row (e.g. after a wrong code).
export default function OtpInput({ value, onChange, length = 6, shakeKey = 0, autoFocus = false }) {
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);

  return (
    <motion.div
      key={shakeKey}
      className="relative"
      animate={shakeKey ? { x: [0, -10, 10, -6, 6, -2, 0] } : undefined}
      transition={{ duration: 0.45 }}
    >
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={`Enter ${length}-digit OTP`}
        maxLength={length}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // Keep the caret at the end so typing always fills the next box.
        onSelect={(e) => e.currentTarget.setSelectionRange(value.length, value.length)}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
        required
        autoFocus={autoFocus}
      />

      <div className="grid grid-cols-6 gap-2 sm:gap-2.5" aria-hidden="true">
        {Array.from({ length }, (_, i) => {
          const digit = value[i];
          const isActive = focused && i === active && value.length < length;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, scale: isActive ? 1.05 : 1 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.45, delay: i * 0.04 }}
              className={`relative grid h-11 place-items-center rounded-xl border-2 text-lg font-bold text-ink transition-colors duration-200 sm:h-12 ${
                isActive
                  ? "border-leaf bg-white shadow-[0_0_0_4px_rgba(110,189,68,0.18)]"
                  : digit
                    ? "border-leaf/60 bg-mint/50"
                    : "border-black/10 bg-white"
              }`}
            >
              {digit ? (
                <motion.span
                  key={digit + i}
                  initial={{ scale: 0.4, opacity: 0, y: 6 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0.5, duration: 0.35 }}
                >
                  {digit}
                </motion.span>
              ) : isActive ? (
                <motion.span
                  className="h-6 w-0.5 rounded-full bg-leaf"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
