import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const roll = { type: "spring", bounce: 0, duration: 0.45 };

// Button/link label that rolls up on hover: the label slides out upward while
// an identical copy slides in from below. Put it inside an <a> or <button>;
// hovering or keyboard-focusing that parent triggers it. With reduced motion
// the two labels cross-fade instead of sliding.
export default function RollText({ children }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const host = ref.current?.closest("a, button");
    if (!host) return undefined;
    const on = () => setActive(true);
    const off = () => setActive(false);
    const onFocus = () => host.matches(":focus-visible") && setActive(true);
    host.addEventListener("pointerenter", on);
    host.addEventListener("pointerleave", off);
    host.addEventListener("focus", onFocus);
    host.addEventListener("blur", off);
    return () => {
      host.removeEventListener("pointerenter", on);
      host.removeEventListener("pointerleave", off);
      host.removeEventListener("focus", onFocus);
      host.removeEventListener("blur", off);
    };
  }, []);

  const first = reduceMotion ? { opacity: active ? 0 : 1 } : { y: active ? "-105%" : "0%" };
  const second = reduceMotion ? { opacity: active ? 1 : 0 } : { y: active ? "0%" : "105%" };

  return (
    <span ref={ref} className="roll-text">
      <motion.span initial={false} animate={first} transition={roll}>
        {children}
      </motion.span>
      <motion.span aria-hidden="true" initial={false} animate={second} transition={roll}>
        {children}
      </motion.span>
    </span>
  );
}
