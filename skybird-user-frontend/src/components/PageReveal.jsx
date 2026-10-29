import { useLayoutEffect, useRef } from "react";
import { animate, inView } from "motion";

const settle = { type: "spring", bounce: 0, duration: 0.9 };
const STAGGER = 0.08;
const MAX_TARGETS = 80;

// Landing animation for any page: its main blocks fade and rise in one after
// another, cards inside grids animate one by one, and blocks further down
// animate when scrolled into view (once). Content that appears later, such
// as a course list after loading or a page that swaps its spinner for real
// content, is revealed the same way.
export default function PageReveal({ children }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = new WeakSet();
    const stops = [];
    let count = 0;
    let inFrame = 0;
    let frameReset = false;

    const show = (el) => {
      // Elements entering in the same frame are staggered.
      const delay = Math.min(inFrame++, 8) * STAGGER;
      if (!frameReset) {
        frameReset = true;
        requestAnimationFrame(() => {
          inFrame = 0;
          frameReset = false;
        });
      }
      const keyframes = reduceMotion ? { opacity: [0, 1] } : { opacity: [0, 1], y: [24, 0] };
      animate(el, keyframes, { ...settle, delay }).then(() => {
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
      });
    };

    const visit = (el) => {
      if (!(el instanceof HTMLElement)) return;
      const style = getComputedStyle(el);
      if (style.position === "fixed" || style.display === "none") return;
      // A grid of cards animates card by card.
      if (style.display === "grid" && el.children.length > 2) {
        [...el.children].forEach(visit);
        return;
      }
      if (seen.has(el) || count >= MAX_TARGETS) return;
      seen.add(el);
      count += 1;
      el.style.opacity = "0";
      let shown = false;
      // Plays once, as soon as any part is on screen (a percentage threshold
      // would never be met by very tall blocks such as a long policy page).
      stops.push(inView(el, () => {
        if (shown) return;
        shown = true;
        show(el);
      }, { amount: "some" }));
    };

    // Step through single-child wrappers to reach the page's real blocks.
    const scan = () => {
      let container = root;
      for (let i = 0; i < 4 && container.children.length === 1; i += 1) {
        container = container.children[0];
      }
      [...container.children].forEach(visit);
    };

    scan();
    let pending = false;
    const observer = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      // Runs before the next paint, so new content never flashes in unanimated.
      requestAnimationFrame(() => {
        pending = false;
        scan();
      });
    });
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      stops.forEach((stop) => stop());
      observer.disconnect();
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
