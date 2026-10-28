import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { motion } from "motion/react";

import {
  ArrowRight,
  BookOpen,
  Store,
  Laptop,
  TrendingUp,
  Users,
  BriefcaseBusiness,
  CheckCircle2,
  CheckCircle,
  ChevronDown,
} from "lucide-react";

import CourseCard from "../components/CourseCard";

import { fetchCourses, fetchPlatforms } from "../api/courses";
import { fetchSiteContent } from "../api/site";

import FAQ from "../components/Faq";

import Hero from "../components/Home/Hero1";
import HomeVideo from "../components/HomeVideo";
import TestimonialVideos from "../components/Home/TestimonialVideos";
import ClientLogos from "../components/ClientLogos";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },

  visible: {
    opacity: 1,

    y: 0,

    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},

  visible: { transition: { staggerChildren: 0.12 } },
};

const contentSections = [
  {
    number: "01",

    icon: Store,

    title: "Learn Amazon Selling from Scratch",

    intro:
      "Start with the essentials and build your understanding step by step.",

    paragraphs: [
      "It sometimes looks bizarre to start an Amazon business without having any knowledge of where to start. Our Amazon course is designed intricately to make the learning process simple and easy to understand.",

      "Our training emphasizes the essential knowledge that an aspiring seller requires, covering a wide range, ranging from understanding Amazon’s marketplace to learning about research, listings, pricing, inventory, order management, advertising, and sales strategies.",

      "Our Amazon course online format gives learners the flexibility to develop valuable skills from the comfort of wherever they are. It gives an opportunity to learn at your own pace while gaining proper feedback on the different aspects of Amazon selling.",

      "For those individuals who are completely new to online business, our Amazon course for beginners provides a structured learning path without taking previous e-commerce experience into consideration.",
    ],
  },

  {
    number: "02",

    icon: TrendingUp,

    title: "Amazon Sales Training for Business Growth",

    paragraphs: [
      "It requires creating a seller account and selling products online. A proper understanding of customers, products, competition, pricing, marketing, and marketplace operations is required to achieve successful e-commerce.",

      "Our Amazon sales training is keen on helping learners understand these important areas and develop a practical approach to online selling. Our training can provide a strong foundation irrespective of whether you want to launch a new online business or improve your existing e-commerce knowledge.",

      "We believe in practical, understandable and relevant education in today’s digital marketplace. It is for this reason that our courses emphasize concepts that learners can apply to real-world e-commerce situations.",
    ],
  },

  {
    number: "03",

    icon: BookOpen,

    title: "Amazon Seller Training Courses India",

    paragraphs: [
      "It is important for budding entrepreneurs in India to understand the Indian e-commerce ecosystem. Sky Birds Solution offers Amazon seller training courses India the opportunity to develop their knowledge of online selling and marketplace management.",

      "Our programs are specially designed for students, entrepreneurs, working professionals, and small-business owners. They are also applicable for anyone interested in sharpening their e-commerce skills.",
    ],
  },

  {
    number: "04",

    icon: Laptop,

    title: "Flexible Amazon Online Classes",

    paragraphs: [
      "Learning should be part of your schedule; therefore, Amazon online classes turns professional learning into more accessible and convenient.",

      "Online learning is an excellent platform for people working, managing a business, or living outside major cities; therefore, with proper guidance and consistent learning, you can build valuable digital business skills from virtually anywhere.",
    ],
  },

  {
    number: "05",

    icon: BriefcaseBusiness,

    title: "Explore Complete E-Commerce Training",

    paragraphs: [
      "Amazon forms a part of the rapidly evolving digital commerce industry. At Sky Birds Solution, we enable learners to get a comprehensive view of the world of e-commerce.",

      "Our e-commerce training covers important concepts with respect to online business, marketplace operations, digital selling, customer experience, product management and e-commerce growth.",

      "If you are looking for e-commerce online courses, e-commerce classes online, or an e-commerce course, our learning programs can help you develop a better understanding of how online businesses operate.",
    ],
  },

  {
    number: "07",

    icon: TrendingUp,

    title: "Learn E-commerce Management",

    paragraphs: [
      "There are multiple activities that are managed simultaneously while running an online business. The success of an e-commerce business is due to the contribution made by product selection, inventory, testing, customer service, order processing, marketing, and sales.",

      "Our e-commerce management course introduces learners to the key principles involved in managing an online business effectively. The skills developed can help you understand the complete e-commerce cycle instead of emphasizing only one part of online selling.",
    ],
  },

  {
    number: "08",

    icon: CheckCircle2,

    title: "Why Choose Sky Birds Solution?",

    paragraphs: [
      "We believe learning at Sky Birds Solution should be practical, accessible, and emphasized on real-world skills. Our approach is towards helping learners understand concepts and develop the confidence to apply their knowledge.",

      "We aim to become a trusted learning destination for aspiring digital entrepreneurs with the help of structured learning, flexible online access and emphasizing on Amazon and e-commerce.",
    ],
  },
];

const audiences = [
  "Who want to explore e-commerce",

  "Students interested in digital business",

  "Entrepreneurs planning to start an online store",

  "Existing sellers who want to improve their knowledge",

  "Professionals seeking new digital skills",

  "Business owners interested in expanding online",
];

const faqs = [
  {
    q: "Who can join Sky Birds Solution courses?",

    a: "Our programs are designed for students, entrepreneurs, working professionals, small-business owners, aspiring sellers, and existing sellers who want to improve their e-commerce knowledge.",
  },

  {
    q: "Do I need prior experience to learn Amazon selling?",

    a: "No previous e-commerce experience is required for the beginner learning path described in our Amazon course content.",
  },

  {
    q: "Can I learn at my own pace?",

    a: "The online course format gives learners flexibility to learn from wherever they are and develop skills at their own pace.",
  },

  {
    q: "What topics are covered in the training?",

    a: "Topics include marketplace fundamentals, product research, listings, pricing, inventory, order management, advertising, sales strategies, customer experience, and e-commerce growth.",
  },

  {
    q: "Is the training focused on practical knowledge?",

    a: "Sky Birds Solution emphasizes practical, understandable learning and concepts learners can apply to real-world e-commerce situations.",
  },

  {
    q: "Where can I explore available courses?",

    a: "Visit the Courses page to browse the available training programs.",
  },
];

export default function Home() {
  const [platforms, setPlatforms] = useState([]);

  const [featured, setFeatured] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showPreloader, setShowPreloader] = useState(true);

  const [openFaq, setOpenFaq] = useState(0);
  const [siteContent, setSiteContent] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [courseRes, platformRes, resSite] = await Promise.all([
          fetchCourses(),

          fetchPlatforms(),
          fetchSiteContent(),
        ]);

        if (cancelled) return;

        if (courseRes.success) setFeatured((courseRes.data || []).slice(0, 6));

        if (platformRes.success) setPlatforms(platformRes.data || []);

        if (resSite.success) setSiteContent(resSite.data || {});
      } catch {
        /* graceful fallback */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    // Keep the branded intro visible briefly, then move the logo toward the navbar.
    const timer = window.setTimeout(() => setShowPreloader(false), 1000);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const home = siteContent?.home || {};
  const hero = home.hero || {};
  const sections =
    Array.isArray(home.contentSections) && home.contentSections.length
      ? home.contentSections
      : contentSections;
  const dynamicFaqs =
    Array.isArray(home.faqs) && home.faqs.length ? home.faqs : faqs;

  const logoTargetX =
    typeof window !== "undefined"
      ? Math.max(16, (window.innerWidth - 1152) / 2 + 20) +
        18 -
        window.innerWidth / 2
      : -140;
  const logoTargetY =
    typeof window !== "undefined" ? 42 - window.innerHeight / 2 : -300;

  return (
    <div className="overflow-hidden bg-white text-ink">
      {showPreloader && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#f8fbf8] via-white to-[#e8f3e7]"
          initial={{ opacity: 1 }}
          animate={{ opacity: loading ? 1 : 0 }}
          transition={{
            duration: 0.65,
            delay: loading ? 0 : 0.95,
            ease: "easeInOut",
          }}
          style={{ pointerEvents: loading ? "auto" : "none" }}
          aria-label="Loading Sky Birds"
          role="status"
        >
          <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#d9ecd6]/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-[#dce9f7]/70 blur-3xl" />
          <motion.div
            className="relative flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.78, y: 12 }}
            animate={
              loading
                ? { opacity: 1, scale: 1, x: 0, y: 0 }
                : { opacity: 1, scale: 0.72, x: logoTargetX, y: logoTargetY }
            }
            transition={{
              duration: loading ? 0.65 : 0.95,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.div
              className="grid h-20 w-20 place-items-center rounded-3xl border border-white/80 bg-black/90 p-3 shadow-xl shadow-forest/10 sm:h-24 sm:w-24"
              animate={{ rotate: loading ? [0, -4, 4, 0] : 0 }}
              transition={{
                duration: 1.6,
                repeat: loading ? Infinity : 0,
                ease: "easeInOut",
              }}
            >
              <img decoding="async" loading="eager"
                src="/assets/logo1.webp"
                alt="Sky Birds"
                className="h-full w-full object-contain"
              />
            </motion.div>
            <motion.div
              className="text-center"
              animate={{ opacity: loading ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-2xl font-extrabold tracking-tight text-forest">
                Sky Birds
              </p>
              <p className="mt-1 text-xs font-medium tracking-[0.18em] text-slate-500">
                YOUR LEARNING JOURNEY
              </p>
              <div className="mx-auto mt-5 h-1 w-36 overflow-hidden rounded-full bg-forest/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-leaf to-forest"
                  animate={{ x: ["-100%", "0%", "100%"] }}
                  transition={{
                    duration: 1.25,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ width: "55%" }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      {/* <Hero /> */}

      <section className="relative isolate overflow-hidden bg-[#f4f8f4]">
        {/* Background Decorations */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-leaf/15 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-[#cfe8d0]/50 blur-3xl" />
          <div className="absolute right-[35%] top-[20%] h-32 w-32 rounded-full bg-white/70 blur-2xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.08fr_.92fr] lg:gap-12 lg:px-8 lg:py-16">
          {/* LEFT CONTENT */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="relative z-10"
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-leaf/20 bg-white/80 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-forest shadow-sm backdrop-blur sm:px-4 sm:text-xs">
                <motion.span
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="h-2 w-2 rounded-full bg-leaf"
                />
                {hero.badge || "Practical learning. Real-world skills."}
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeUp}
              className="mt-5 max-w-3xl text-[2.35rem] font-black leading-[1.04] tracking-[-0.035em] text-ink sm:text-5xl lg:text-[3.7rem]"
            >
              {hero.title || "Learn E-Commerce."}
              <span className="block">
                <span className="text-leaf">{hero.highlight || "Grow"}</span>{" "}
                {hero.titleSuffix || "Your Business."}
              </span>
            </motion.h1>

            {/* Sub Heading */}
            <motion.h2
              variants={fadeUp}
              className="mt-4 max-w-2xl text-base font-bold leading-6 text-forest sm:text-lg"
            >
              {hero.subtitle ||
                "Master Amazon & E-Commerce with Practical Training"}
            </motion.h2>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7"
            >
              {hero.description ||
                "Sky Birds Solution helps beginners, aspiring sellers, business owners, and professionals understand online marketplaces through practical, career-focused learning."}
            </motion.p>

            {/* CTA */}
            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="group inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-3 text-sm font-bold text-white shadow-lg shadow-leaf/20 transition-all duration-300 hover:-translate-y-1 hover:bg-forest hover:shadow-xl"
              >
                {hero.primaryCta || "Explore Courses"}
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-white/80 px-5 py-3 text-sm font-bold text-forest shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-leaf hover:bg-white"
              >
                {"About Sky Birds Solution"}
              </Link>
            </motion.div>

            {/* Small Trust Points */}
            <motion.div
              variants={fadeUp}
              className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-leaf" />
                {(hero.trustPoints && hero.trustPoints[0]) ||
                  "Practical Training"}
              </span>

              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-leaf" />
                {(hero.trustPoints && hero.trustPoints[1]) ||
                  "Amazon & E-Commerce"}
              </span>

              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-leaf" />
                {(hero.trustPoints && hero.trustPoints[2]) ||
                  "Learn at Your Pace"}
              </span>
            </motion.div>
          </motion.div>

          {/* RIGHT VISUAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, x: 30 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative mx-auto w-full max-w-[480px]"
          >
            {/* Glow */}
            <div className="absolute -inset-5 rounded-[2rem] bg-leaf/10 blur-2xl" />

            {/* Main Image Card */}
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden rounded-[1.75rem] border-[6px] border-white bg-white shadow-2xl"
            >
              <img decoding="async"
                src={hero.imageUrl || "/assets/owner.webp"}
                alt="Small business owner managing an online business"
                className="aspect-[1/0.95] w-full object-cover"
                loading="lazy"
              />

              {/* Image Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent" />

              {/* Image Text */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 sm:text-xs">
                  {hero.imageEyebrow || "Your learning journey"}
                </p>

                <h3 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
                  {hero.imageTitle || "From Learning to Doing."}
                </h3>

                <p className="mt-1.5 max-w-sm text-xs leading-5 text-white/80 sm:text-sm">
                  {hero.imageDescription ||
                    "Build practical knowledge for today's online marketplace."}
                </p>
              </div>
            </motion.div>

            {/* Floating Learning Card */}
            <motion.div
              animate={{
                y: [0, -8, 0],
                rotate: [0, 0.5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -left-3 top-6 hidden rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl backdrop-blur sm:block lg:-left-8"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f4e8] text-forest">
                  <BookOpen size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold text-ink">
                    {hero.floatOneTitle || "Learn at your pace"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {hero.floatOneText || "Flexible online learning"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Floating Course Card */}
            <motion.div
              animate={{
                y: [0, 7, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute -bottom-4 -right-2 hidden rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:block lg:-right-7"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-leaf text-white">
                  <TrendingUp size={17} />
                </div>

                <div>
                  <p className="text-xs font-bold text-ink">
                    {hero.floatTwoTitle || "E-Commerce Skills"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {hero.floatTwoText || "Learn • Apply • Grow"}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20 pb-0">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-9 flex flex-col justify-between gap-4 border-b border-forest/10 pb-5 sm:flex-row sm:items-end"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-[.18em] text-leaf">
              {home.featured?.eyebrow || "Start learning"}
            </span>

            <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
              {home.featured?.title || "Featured Video Courses"}
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-700">
              Explore training designed to help you understand online selling
              and marketplace operations.
            </p>
          </div>

          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm font-bold text-forest hover:text-leaf"
          >
            {home.featured?.buttonLabel || "See all courses"}{" "}
            <ArrowRight size={16} />
          </Link>
        </motion.div>

        {loading && featured.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-leaf border-t-transparent" />
          </div>
        ) : featured.length === 0 ? (
          <p className="py-8 text-center text-slate-600">
            No courses available at the moment.
          </p>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.08 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {featured.map((course) => (
              <motion.div
                key={course.id || course._id}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* clients */}
      <ClientLogos />

      <div className="bg-gray-200">
        <section className="overflow-hidden rounded-3xl max-w-7xl m-auto   py-10">
          <HomeVideo
            src="/assets/Mod_1_Part_1_Enhanced.mp4"
            poster="/assets/video-poster.webp"
            className="aspect-video w-full"
          />
        </section>
      </div>

      <TestimonialVideos />

      <section className="bg-[#f7f9f7] py-16 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto mb-12 max-w-3xl text-center"
          >
            <span className="text-xs font-bold uppercase tracking-[.18em] text-leaf">
              Your learning path
            </span>

            <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
              Explore Amazon &amp; E-Commerce, Step by Step
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-700">
              Discover the key areas covered in our practical learning programs.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.08 }}
            className="space-y-6"
          >
            {sections.map((section, i) => {
              const Icon = section.icon;

              return (
                <motion.article
                  key={section.title}
                  variants={fadeUp}
                  className={`group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-leaf/40 hover:shadow-xl ${
                    i === 0
                      ? "lg:p-10"
                      : i === 7
                        ? "bg-gradient-to-br from-[#f4faf2] via-white to-[#edf7ec] lg:p-10"
                        : "p-6 sm:p-8"
                  }`}
                >
                  {/* Decorative background */}

                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-leaf/[.05] transition-transform duration-700 group-hover:scale-150" />

                  {/* ================= 1 ================= */}

                  {i === 0 && (
                    <div className="relative grid gap-8 lg:grid-cols-[0.85fr_1.5fr] lg:items-center">
                      <div className="relative">
                        <div className="absolute -left-4 -top-8 text-[100px] font-black leading-none text-leaf/[.07]">
                          01
                        </div>

                        <div className="relative">
                          <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf4e9] px-4 py-2 text-xs font-bold tracking-[.14em] text-leaf">
                            <Icon size={15} />
                            01
                          </span>

                          <h3 className="mt-5 max-w-md text-3xl font-black leading-tight text-ink sm:text-4xl">
                            {section.title}
                          </h3>

                          {section.intro && (
                            <p className="mt-4 max-w-md text-base font-medium leading-7 text-forest">
                              {section.intro}
                            </p>
                          )}

                          <div className="mt-7 flex items-center gap-3">
                            <div className="h-1 w-14 rounded-full bg-leaf" />

                            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                              Start your journey
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative space-y-4 rounded-3xl bg-[#f8fbf7] p-6 sm:p-8">
                        {section.paragraphs.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex gap-4 border-b border-gray-200/70 pb-4 last:border-0 last:pb-0"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-leaf shadow-sm">
                              {idx + 1}
                            </span>

                            <p className="text-sm leading-7 text-slate-700 sm:text-[15px]">
                              {p}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ================= 2 ================= */}

                  {i === 1 && (
                    <div className="relative">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-leaf to-[#5d9b58] text-white shadow-lg shadow-leaf/20">
                            <Icon size={25} />
                          </span>

                          <div>
                            <p className="text-xs font-bold tracking-[.18em] text-leaf">
                              02
                            </p>

                            <h3 className="mt-1 text-2xl font-black text-ink">
                              {section.title}
                            </h3>
                          </div>
                        </div>

                        <div className="hidden text-6xl font-black text-leaf/[.08] sm:block">
                          02
                        </div>
                      </div>

                      <div className="mt-7 grid gap-4 md:grid-cols-3">
                        {section.paragraphs.map((p, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5 transition hover:border-leaf/20 hover:bg-[#f6fbf5]"
                          >
                            <span className="text-2xl font-black text-leaf/30">
                              0{idx + 1}
                            </span>

                            <p className="mt-3 text-sm leading-7 text-slate-700">
                              {p}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ================= 3 ================= */}

                  {i === 2 && (
                    <div className="relative grid gap-7 md:grid-cols-[180px_1fr] md:items-center">
                      <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-[10px] border-[#eaf4e9] bg-white shadow-inner">
                        <span className="text-4xl font-black text-leaf">
                          03
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <Icon size={22} className="text-leaf" />

                          <h3 className="text-2xl font-black text-ink">
                            {section.title}
                          </h3>
                        </div>

                        <div className="mt-5 space-y-4">
                          {section.paragraphs.map((p, idx) => (
                            <p
                              key={idx}
                              className={`text-sm leading-7 sm:text-[15px] ${
                                idx === 0
                                  ? "rounded-2xl bg-[#f4faf2] p-5 font-medium text-forest"
                                  : "text-slate-700"
                              }`}
                            >
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================= 4 ================= */}

                  {i === 3 && (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#edf7eb] to-[#f9fcf8] p-6 sm:p-8">
                      <div className="absolute right-5 top-3 text-[90px] font-black text-leaf/[.06]">
                        04
                      </div>

                      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-leaf shadow-md">
                          <Laptop size={29} />
                        </div>

                        <div className="max-w-3xl">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold tracking-[.18em] text-leaf">
                              04
                            </span>
                          </div>

                          <h3 className="mt-2 text-2xl font-black text-ink">
                            {section.title}
                          </h3>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            {section.paragraphs.map((p, idx) => (
                              <p
                                key={idx}
                                className="text-sm leading-7 text-slate-700"
                              >
                                {p}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================= 5 ================= */}

                  {i === 4 && (
                    <div className="relative">
                      <div className="mb-7 flex items-end justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold tracking-[.18em] text-leaf">
                            05
                          </span>

                          <h3 className="mt-2 text-2xl font-black text-ink sm:text-3xl">
                            {section.title}
                          </h3>
                        </div>

                        <div className="hidden h-14 w-14 items-center justify-center rounded-full bg-[#eaf4e9] text-leaf sm:flex">
                          <BriefcaseBusiness size={24} />
                        </div>
                      </div>

                      <div className="relative ml-2 border-l-2 border-[#dcebd9] pl-7">
                        {section.paragraphs.map((p, idx) => (
                          <div key={idx} className="relative mb-6 last:mb-0">
                            <span className="absolute -left-[37px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-leaf" />

                            <p className="text-sm leading-7 text-slate-700 sm:text-[15px]">
                              {p}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ================= 6 ================= */}

                  {/* ================= 7 ================= */}

                  {i === 6 && (
                    <div className="relative grid gap-7 md:grid-cols-[110px_1fr]">
                      <div className="flex md:justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-ink text-white shadow-lg">
                          <TrendingUp size={30} />
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-[#eaf4e9] px-3 py-1 text-xs font-bold text-leaf">
                            07
                          </span>

                          <h3 className="text-2xl font-black text-ink">
                            {section.title}
                          </h3>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          {section.paragraphs.map((p, idx) => (
                            <div
                              key={idx}
                              className={`rounded-2xl p-5 ${
                                idx === 0 ? "bg-ink text-white" : "bg-[#f5faf3]"
                              }`}
                            >
                              <p
                                className={`text-sm leading-7 ${
                                  idx === 0 ? "text-white/90" : "text-slate-700"
                                }`}
                              >
                                {p}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================= 8 ================= */}

                  {i === 7 && (
                    <div className="relative  lg:items-center">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf text-white shadow-lg">
                            <CheckCircle2 size={24} />
                          </span>

                          <div>
                            <span className="text-xs font-bold tracking-[.18em] text-leaf">
                              08
                            </span>

                            <h3 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
                              {section.title}
                            </h3>
                          </div>
                        </div>

                        <div className="mt-6 space-y-4">
                          {section.paragraphs.map((p, idx) => (
                            <p
                              key={idx}
                              className="  text-sm leading-7 text-slate-700 sm:text-[15px]"
                            >
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="overflow-hidden rounded-3xl"
        >
          <img decoding="async"
            src="/assets/img2.webp"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85";
            }}
            alt="People learning and collaborating on business ideas"
            loading="lazy"
            className="aspect-[5/4] w-full object-cover"
          />
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.span
            variants={fadeUp}
            className="text-xs font-bold uppercase tracking-[.18em] text-leaf"
          >
            {home.learning?.eyebrow || "Learn with purpose"}
          </motion.span>

          <motion.h2
            variants={fadeUp}
            className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl"
          >
            {home.learning?.title ||
              "Practical learning for every stage of your e-commerce journey"}
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-5 text-base leading-8 text-slate-700"
          >
            Our programs are designed to support learners at different stages of
            their e-commerce journey, that varies from introductory concepts to
            advanced business strategies.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-4 text-base leading-8 text-slate-700"
          >
            We believe learning at Sky Birds Solution should be practical,
            accessible, and emphasized on real-world skills. Our approach is
            towards helping learners understand concepts and develop the
            confidence to apply their knowledge.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-7">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-leaf"
            >
              {home.learning?.buttonLabel || "Find your course"}{" "}
              <ArrowRight size={17} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="bg-[#f7f9f7] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-9 text-center"
          >
            <span className="text-xs font-bold uppercase tracking-[.18em] text-leaf">
              {home.faq?.eyebrow || "Need to know"}
            </span>

            <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
              {home.faq?.title || "Frequently Asked Questions"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              Quick answers about learning Amazon selling and e-commerce with
              Sky Birds Solution.
            </p>
          </motion.div>

          <div className="space-y-3">
            {dynamicFaqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                >
                  <span className="font-bold text-ink">{faq.q}</span>

                  <ChevronDown
                    size={19}
                    className={`shrink-0 text-leaf transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === i ? "auto" : 0,

                    opacity: openFaq === i ? 1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm leading-7 text-slate-700 sm:px-6">
                    {faq.a}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <motion.section
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-16 text-center shadow-xl sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[80%] -translate-x-1/2 rounded-full bg-leaf/30 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-white/85">
              {home.cta?.eyebrow || "Your next chapter starts here"}
            </p>

            <h2 className="mx-auto mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {home.cta?.title ||
                "Start your E-Commerce Learning Journey Today"}
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white/90">
              {home.cta?.paragraph1 ||
                "The world of online business continues to create opportunities for people who are ready to develop the right skills. The right education can give you a stronger starting point irrespective of whether your goal is to become an Amazon seller, understand market sales, launch an online business or build a career in e-commerce."}
            </p>

            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-white/90">
              Explore our e-commerce classes, discover our Amazon training
              programs, and take the next step towards building your digital
              business knowledge with Sky Words Solutions.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/courses"
                className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-forest shadow-lg transition hover:scale-105 hover:bg-leaf hover:text-white"
              >
                {hero.primaryCta || "Explore Courses"}
              </Link>

              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition hover:text-white"
              >
                {home.cta?.secondaryLabel || "Contact Us"}{" "}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
