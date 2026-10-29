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
  Plus,
} from "lucide-react";

import CourseCard from "../components/CourseCard";

import { fetchCourses, fetchPlatforms } from "../api/courses";
import { fetchSiteContent } from "../api/site";

import FAQ from "../components/Faq";

import HomeVideo from "../components/HomeVideo";
import TestimonialVideos from "../components/Home/TestimonialVideos";
import ClientLogos from "../components/ClientLogos";
import RollText from "../components/RollText";
import TopLoader from "../components/TopLoader";
import FloatingTags from "../components/Home/FloatingTags";

// Short rise on a no-bounce spring, so elements settle in rather than fly in.
const fadeUp = {
  hidden: { opacity: 0, y: 10 },

  visible: {
    opacity: 1,

    y: 0,

    transition: { type: "spring", bounce: 0, duration: 1 },
  },
};

const stagger = {
  hidden: {},

  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
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

    title: "Amazon Seller Training Courses",

    paragraphs: [
      "It is important for budding entrepreneurs in India to understand the Indian e-commerce ecosystem. Sky Birds Solution offers Amazon seller training courses that give them the opportunity to develop their knowledge of online selling and marketplace management.",

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
  // Real totals for the hero stats card (all courses, not just the featured six).
  const [courseStats, setCourseStats] = useState({ courses: 0, lessons: 0 });

  const [loading, setLoading] = useState(true);

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

        if (courseRes.success) {
          const allCourses = courseRes.data || [];
          setFeatured(allCourses.slice(0, 6));
          setCourseStats({
            courses: allCourses.length,
            lessons: allCourses.reduce((sum, course) => sum + (Number(course.lessons) || 0), 0),
          });
        }

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

  const home = siteContent?.home || {};
  const hero = home.hero || {};
  const sections =
    Array.isArray(home.contentSections) && home.contentSections.length
      ? home.contentSections
      : contentSections;
  const dynamicFaqs =
    Array.isArray(home.faqs) && home.faqs.length ? home.faqs : faqs;

  return (
    <div className="overflow-hidden bg-white text-ink">
      {/* Page stays visible while data loads; a thin bar shows progress. */}
      {loading && <TopLoader />}


      <section className="hero-mesh relative isolate overflow-hidden">
        <FloatingTags />
        {/* Slowly rotating decorative rings behind the heading */}
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[620px] w-[620px] -translate-x-1/2 sm:h-[760px] sm:w-[760px]">
          <motion.div
            className="absolute inset-0 rounded-full border border-dashed border-forest/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-[12%] rounded-full border border-leaf/25"
            animate={{ rotate: -360 }}
            transition={{ duration: 40, ease: "linear", repeat: Infinity }}
          >
            <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-leaf" />
          </motion.div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-14 pt-[122px] sm:px-6 sm:pt-[138px] lg:px-8 lg:pb-20 lg:pt-[154px]">
          {/* CENTRED INTRO */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="relative z-10 mx-auto max-w-4xl text-center"
          >
            {/* Heading */}
            <motion.h1
              variants={fadeUp}
              className="mx-auto text-[2.15rem] font-black leading-[1.02] tracking-[-0.04em] text-ink sm:text-6xl lg:text-[4.5rem]"
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
              className="mx-auto mt-5 max-w-2xl text-base font-bold leading-6 text-forest sm:text-lg"
            >
              {hero.subtitle ||
                "Master Marketplace & E-Commerce with Practical Training"}
            </motion.h2>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7"
            >
              {hero.description ||
                "Sky Birds Solution helps beginners, aspiring sellers, business owners, and professionals understand online marketplaces through practical, career-focused learning."}
            </motion.p>

            {/* CTA */}
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/courses"
                className="group inline-flex items-center gap-2 rounded-full bg-leaf px-6 py-3.5 text-sm font-bold text-white transition-colors duration-300 hover:bg-forest"
              >
                <RollText>{hero.primaryCta || "Explore Courses"}</RollText>
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-[10px] bg-black/[0.06] px-6 py-3.5 text-sm font-bold text-ink backdrop-blur transition-colors duration-300 hover:bg-black/[0.1]"
              >
                <RollText>About Sky Birds Solution</RollText>
              </Link>
            </motion.div>

            {/* Small Trust Points */}
            <motion.div
              variants={fadeUp}
              className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600"
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

          {/* BENTO GRID */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-12 lg:grid-rows-[230px_230px]"
          >
            {/* Main photo */}
            <motion.div
              variants={fadeUp}
              className="relative min-h-[340px] overflow-hidden rounded-[28px] bg-forest sm:col-span-2 lg:col-span-5 lg:row-span-2 lg:min-h-0"
            >
              <img
                decoding="async"
                src={hero.imageUrl || "/assets/owner.webp"}
                alt="Small business owner managing an online business"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 sm:text-xs">
                  {hero.imageEyebrow || "Your learning journey"}
                </p>
                <h3 className="mt-1 text-2xl font-extrabold text-white">
                  {hero.imageTitle || "From Learning to Doing."}
                </h3>
                <p className="mt-1.5 max-w-sm text-sm leading-5 text-white/80">
                  {hero.imageDescription ||
                    "Build practical knowledge for today's online marketplace."}
                </p>
              </div>
            </motion.div>

            {/* Real course stats */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col justify-between rounded-[28px] border border-black/[0.08] bg-white/85 p-6 backdrop-blur lg:col-span-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-4xl font-black tracking-tight text-ink">
                    {loading ? (
                      <span className="inline-block h-9 w-14 animate-pulse rounded-lg bg-black/[0.07] align-middle" aria-label="Loading" />
                    ) : (
                      courseStats.courses || "New"
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {loading
                      ? <span className="inline-block h-4 w-40 animate-pulse rounded bg-black/[0.06] align-middle" />
                      : courseStats.courses === 1
                      ? "Practical video course"
                      : courseStats.courses > 1
                        ? "Practical video courses"
                        : "Courses coming soon"}
                  </p>
                </div>
                {/* Overlapping course thumbnails */}
                <div className="flex -space-x-3">
                  {featured
                    .filter((course) => course.thumbnail)
                    .slice(0, 3)
                    .map((course) => (
                      <img
                        key={course.id || course._id}
                        src={course.thumbnail}
                        alt=""
                        loading="lazy"
                        className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
                      />
                    ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-black/[0.06] pt-4 text-sm text-slate-600">
                {courseStats.lessons > 0 && (
                  <span className="flex items-center gap-2">
                    <Laptop size={16} className="text-leaf" />
                    <strong className="font-bold text-ink">{courseStats.lessons}</strong> video lessons
                  </span>
                )}
                {platforms.length > 0 && (
                  <span className="flex items-center gap-2">
                    <Store size={16} className="text-leaf" />
                    <strong className="font-bold text-ink">{platforms.length}</strong>{" "}
                    {platforms.length === 1 ? "marketplace" : "marketplaces"}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Learn at your pace + weekly bars */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col justify-between rounded-[28px] border border-black/[0.08] bg-white/85 p-6 backdrop-blur lg:col-span-3"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest">
                  <BookOpen size={19} />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">
                    {hero.floatOneTitle || "Learn at your pace"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {hero.floatOneText || "Flexible online learning"}
                  </p>
                </div>
              </div>
              <div aria-hidden="true" className="mt-4 flex h-20 items-end gap-1.5">
                {[45, 70, 55, 90, 65, 80, 100].map((height, index) => (
                  <motion.span
                    key={index}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", bounce: 0, duration: 1, delay: 0.3 + index * 0.06 }}
                    style={{ height: `${height}%`, transformOrigin: "bottom" }}
                    className={`flex-1 rounded-full ${index === 6 ? "bg-leaf" : "bg-mint"}`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Pill-shaped photo */}
            <motion.div
              variants={fadeUp}
              className="relative min-h-[220px] overflow-hidden rounded-full bg-forest sm:col-span-2 lg:col-span-7 lg:min-h-0"
            >
              <img
                decoding="async"
                src="/assets/img1.webp"
                alt="Learners working on e-commerce marketing together"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-forest/85 via-forest/40 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex items-center gap-4 pl-10 sm:pl-14">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-leaf text-white">
                  <TrendingUp size={21} />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-white sm:text-2xl">
                    {hero.floatTwoTitle || "E-Commerce Skills"}
                  </p>
                  <p className="mt-1 text-sm text-white/80">
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
            <RollText>{home.featured?.buttonLabel || "See all courses"}</RollText>
            <ArrowRight size={16} />
          </Link>
        </motion.div>

        {loading && featured.length === 0 ? (
          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Loading courses"
          >
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="animate-pulse rounded-2xl border border-black/[0.06] bg-white p-4"
              >
                <div className="h-56 rounded-xl bg-black/[0.06]" />
                <div className="mt-4 flex gap-1.5">
                  <div className="h-6 w-20 rounded-full bg-black/[0.06]" />
                  <div className="h-6 w-20 rounded-md bg-black/[0.06]" />
                </div>
                <div className="mt-4 h-5 w-3/4 rounded bg-black/[0.08]" />
                <div className="mt-4 space-y-2 border-l border-black/10 pl-4">
                  <div className="h-4 w-1/3 rounded bg-black/[0.05]" />
                  <div className="h-4 w-1/2 rounded bg-black/[0.05]" />
                </div>
                <div className="mt-6 h-11 rounded-full bg-black/[0.06]" />
              </div>
            ))}
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
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* clients */}
      <ClientLogos />

      <HomeVideo />

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

                  {/* Sections 5 and 6 share this layout. */}
                  {(i === 4 || i === 5) && (
                    <div className="relative">
                      <div className="mb-7 flex items-end justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold tracking-[.18em] text-leaf">
                            {String(i + 1).padStart(2, "0")}
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
          className="overflow-hidden rounded-[50%]"
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
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-leaf"
            >
              <RollText>{home.learning?.buttonLabel || "Find your course"}</RollText>
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
                className={`overflow-hidden rounded-xl border bg-black/[0.035] transition-colors duration-300 ${
                  openFaq === i ? "border-leaf" : "border-transparent"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="group flex w-full items-center gap-4 px-5 py-5 text-left sm:px-6"
                >
                  {/* "+" turns into "×" when open */}
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf text-white transition-transform duration-300 ease-out ${
                      openFaq === i ? "rotate-[135deg]" : ""
                    }`}
                  >
                    <Plus size={15} strokeWidth={2.5} />
                  </span>

                  <span
                    className={`font-bold transition-colors duration-300 group-hover:text-forest ${
                      openFaq === i ? "text-forest" : "text-ink"
                    }`}
                  >
                    {faq.q}
                  </span>
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
                  <p className="px-5 pb-5 pl-[3.75rem] text-sm leading-7 text-slate-700 sm:pl-16 sm:pr-6">
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
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={stagger}
      >
        <div className="grid items-center gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Oval photo */}
          <motion.div
            variants={fadeUp}
            className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[50%] bg-mint lg:max-w-none"
          >
            <img
              decoding="async"
              src="/assets/owner1.webp"
              alt="Sky Birds Solution founder"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </motion.div>

          {/* Solid green block */}
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-[28px] bg-forest px-6 py-12 sm:px-12 sm:py-14"
          >
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-leaf/30 blur-3xl" />

            <div className="relative z-10">

              <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-[3.25rem]">
                {home.cta?.title ||
                  "Start your E-Commerce Learning Journey Today"}
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/90">
                {home.cta?.paragraph1 ||
                  "The world of online business continues to create opportunities for people who are ready to develop the right skills. The right education can give you a stronger starting point irrespective of whether your goal is to become an Amazon seller, understand market sales, launch an online business or build a career in e-commerce."}
              </p>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/90">
                {home.cta?.paragraph2 ||
                  "Explore our e-commerce classes, discover our Amazon training programs, and take the next step towards building your digital business knowledge with Sky Birds Solution."}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/courses"
                  className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-forest transition-colors hover:bg-leaf hover:text-white"
                >
                  <RollText>{hero.primaryCta || "Explore Courses"}</RollText>
                </Link>

                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-2 rounded-[10px] bg-ink px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-black"
                >
                  <RollText>{home.cta?.secondaryLabel || "Contact Us"}</RollText>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
