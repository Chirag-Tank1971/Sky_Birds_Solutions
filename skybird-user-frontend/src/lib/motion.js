export const easeOut = [0.22, 1, 0.36, 1];

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: {
    duration: 0.25,
    ease: easeOut,
  },
};

export const stagger = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: easeOut },
  },
};

export const inView = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: easeOut },
};

export const hoverLift = {
  whileHover: { y: -4, boxShadow: "0 14px 32px rgba(46, 107, 46, 0.12)" },
  whileTap: { scale: 0.99 },
  transition: { type: "spring", stiffness: 400, damping: 25 },
};

export const tap = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
};
