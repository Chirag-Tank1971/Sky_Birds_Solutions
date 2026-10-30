const easeOut = [0.22, 1, 0.36, 1];

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: {
    duration: 0.25,
    ease: easeOut,
  },
};
