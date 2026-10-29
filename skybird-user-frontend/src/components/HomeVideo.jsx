import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Compass,
  GraduationCap,
  Rocket,
  Store,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import RollText from "./RollText";

// "Who our training is for" section of the home page.
const audiences = [
  { icon: Compass, title: "Curious beginners", text: "Who want to explore e-commerce" },
  { icon: GraduationCap, title: "Students", text: "Interested in digital business" },
  { icon: Rocket, title: "Entrepreneurs", text: "Planning to start an online store" },
  { icon: Store, title: "Existing sellers", text: "Who want to improve their knowledge" },
  { icon: BriefcaseBusiness, title: "Professionals", text: "Seeking new digital skills" },
  { icon: TrendingUp, title: "Business owners", text: "Interested in expanding online" },
];

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { type: "spring", bounce: 0, duration: 0.9, delay },
});

export default function HomeVideo() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24">
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-mint/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-leaf/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Heading */}
        <motion.div {...rise()} className="mx-auto max-w-4xl text-center">

          <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[46px]">
            Build Skills with Our <span className="text-leaf">E-Commerce Courses</span>
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-[17px]">
            The right training, when chosen, can make your journey of learning
            organized and productive. Our main purpose is to offer some of the
            best e-commerce courses for learners who prefer practical rather
            than theoretical knowledge.
          </p>
        </motion.div>

        {/* Bento: highlight card + six audience cards */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          <motion.div {...rise(0.1)} className="sm:col-span-2 lg:row-span-2">
            <HighlightSlider />
          </motion.div>

          {audiences.slice(0, 4).map((item, i) => (
            <AudienceCard key={item.title} item={item} delay={0.15 + i * 0.07} />
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {audiences.slice(4).map((item, i) => (
            <AudienceCard key={item.title} item={item} delay={0.45 + i * 0.07} wide />
          ))}
        </div>
      </div>
    </section>
  );
}

const slides = [
  {
    eyebrow: "Who it's for",
    title: "Our training is useful for those who want to learn e-commerce through practical, step-by-step guidance.",
    points: ["Beginners", "Sellers", "Business owners"],
  },
  {
    eyebrow: "What you'll learn",
    title: "Everything it takes to sell on Amazon, from finding a product to growing your store.",
    points: ["Product research", "Listing creation", "Inventory & fulfillment"],
  },
  {
    eyebrow: "How it works",
    title: "Short, practical video lessons you can watch anytime and apply to your own business.",
    points: ["Learn", "Practice", "Grow"],
  },
  {
    eyebrow: "Your outcome",
    title: "Build the confidence to start, run and scale your online business the right way.",
    points: ["Launch", "Optimize", "Scale"],
  },
];
const SLIDE_MS = 5500;

function HighlightSlider() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next) => {
    setDirection(next > index || (index === slides.length - 1 && next === 0) ? 1 : -1);
    setIndex((next + slides.length) % slides.length);
  }, [index]);

  // Auto-advance; restarts whenever the slide changes or play resumes.
  useEffect(() => {
    if (paused) return undefined;
    const timer = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, go]);

  const slide = slides[index];

  return (
    <div
      className="relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-[28px] bg-[#10251D] p-7 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-leaf/25 blur-3xl" />

      {/* Progress bars, one per slide */}
      <div className="relative flex gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.eyebrow}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show slide ${i + 1}: ${s.eyebrow}`}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/15"
          >
            {/* Past slides full, future empty; the active one fills over the slide's time. */}
            <motion.span
              key={i === index ? `active-${index}-${paused}` : `idle-${i}`}
              className="block h-full origin-left rounded-full bg-leaf"
              initial={{ scaleX: i < index ? 1 : 0 }}
              animate={{ scaleX: i < index || (i === index && paused) ? 1 : i === index ? 1 : 0 }}
              transition={i === index && !paused ? { duration: SLIDE_MS / 1000, ease: "linear" } : { duration: 0 }}
            />
          </button>
        ))}
      </div>

      {/* Slide */}
      <div className="relative mt-7 flex-1" aria-live="polite">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ type: "spring", bounce: 0, duration: 0.55 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf">{slide.eyebrow}</p>
            <h3 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{slide.title}</h3>
            <div className="mt-6 flex flex-wrap gap-2">
              {slide.points.map((point, i) => (
                <motion.span
                  key={point}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08, type: "spring", bounce: 0, duration: 0.5 }}
                  className="flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-sm font-semibold text-white/85"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-leaf/20 text-[10px] text-leaf">{i + 1}</span>
                  {point}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="relative mt-8 flex items-center gap-3">
        <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition hover:bg-white/10">
          <ChevronLeft size={18} />
        </button>
        <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition hover:bg-white/10">
          <ChevronRight size={18} />
        </button>
        <span className="text-xs font-medium tabular-nums text-white/50">
          {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
        <Link
          to="/courses"
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 text-sm font-bold text-[#10251D] transition-colors hover:bg-white"
        >
          <RollText>Explore Courses</RollText>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function AudienceCard({ item: { icon: Icon, title, text }, delay, wide }) {
  return (
    <motion.div
      {...rise(delay)}
      className={`group relative overflow-hidden rounded-[24px] border border-black/[0.06] bg-[#f7f9f5] p-6 transition-colors duration-300 hover:border-leaf/40 hover:bg-white ${
        wide ? "flex items-center gap-5" : ""
      }`}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-forest shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-leaf group-hover:text-white">
        <Icon size={22} />
      </span>
      <div className={wide ? "" : "mt-6"}>
        <h4 className="text-lg font-bold text-ink">{title}</h4>
        <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
      </div>
    </motion.div>
  );
}
