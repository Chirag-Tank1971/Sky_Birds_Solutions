import { MotionConfig, motion } from "motion/react";

// Thin brand-green progress bar pinned to the top of the window while
// something loads. The page stays visible and usable underneath.
export default function TopLoader() {
  return (
    <div
      role="progressbar"
      aria-label="Loading"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden bg-leaf/15"
    >
      {/* Progress feedback, so it keeps moving even with reduced motion. */}
      <MotionConfig reducedMotion="never">
        <motion.div
          className="h-full w-2/5 rounded-full bg-gradient-to-r from-leaf to-forest shadow-[0_0_10px_rgba(110,189,68,0.7)]"
          initial={{ x: "-100%" }}
          animate={{ x: "250%" }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], repeat: Infinity }}
          style={{ willChange: "transform" }}
        />
      </MotionConfig>
    </div>
  );
}
