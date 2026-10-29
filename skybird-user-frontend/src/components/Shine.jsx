import { motion, useReducedMotion } from "motion/react";

// A soft light sweep across a button, repeating every few seconds.
// Place it as the first child of a `relative overflow-hidden` button or link.
export default function Shine() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
      }}
      initial={{ x: "-120%" }}
      animate={{ x: "120%" }}
      transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.9 }}
    />
  );
}
