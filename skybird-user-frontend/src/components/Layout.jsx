import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { pageTransition } from "../lib/motion";
import SiteSEO from "./SiteSEO";

export default function Layout() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteSEO />
      <Navbar />

      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
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
