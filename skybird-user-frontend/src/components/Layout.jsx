import { useEffect, useRef } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { pageTransition } from "../lib/motion";
import SiteSEO from "./SiteSEO";

export default function Layout() {
  const location = useLocation();
  const outlet = useOutlet();
  const lenisRef = useRef(null);

  // Smooth, inertia-based scrolling (off when the visitor prefers reduced motion).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1, anchors: true });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // A new page starts at the top, once the old page has faded out.
  const scrollToTop = () => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteSEO />
      <Navbar />

      {/* The home hero runs under the floating header; other pages start below it (74px = header height). */}
      <main className={`flex-1 ${location.pathname === "/" ? "" : "pt-[74px]"}`}>
        {/* No initial={false} here: it would also stop every looping animation
            (rings, marquee, pulses) on the first page a visitor opens. */}
        <AnimatePresence mode="wait" onExitComplete={scrollToTop}>
          <motion.div
            key={location.pathname}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={pageTransition.transition}
            className="h-full"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
