import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  TrendingUp,
  Award,
  CheckCircle,
  BookOpen,
  Store,
  Megaphone,
  Headset,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { fetchSiteContent } from "../api/site";
import { useSitePreviewVersion } from "../lib/sitePreview";
import RollText from "../components/RollText";

const defaultStats = [
  { value: "Since 2019", label: "E-Commerce Journey", icon: Award },
  { value: "500+", label: "Clients Worked With", icon: BookOpen },
  {
    value: "₹120 Cr+",
    label: "Revenue Generated Through Brand-Building Work",
    icon: TrendingUp,
  },
];

const defaultServices = [
  {
    icon: Store,
    title: "Account Setup",
    description:
      "Understand the foundations of launching on online marketplaces, from account readiness to your first steps as a seller.",
  },
  {
    icon: ShoppingBag,
    title: "Product Cataloguing",
    description:
      "Learn how product selection, listing quality, catalogue structure, and optimization shape marketplace performance.",
  },
  {
    icon: Megaphone,
    title: "Ads Management",
    description:
      "Explore marketplace advertising, campaign fundamentals, and the decisions that help sellers manage their budgets thoughtfully.",
  },
  {
    icon: BookOpen,
    title: "Practical Training",
    description:
      "Build practical skills through structured lessons informed by real marketplace work, research, and client experience.",
  },
];

const defaultPromises = [
  {
    title: "Practical, Real-World Learning",
    description:
      "Learn through practical insights, real business challenges, and lessons drawn from hands-on e-commerce experience.",
    icon: CheckCircle,
  },
  {
    title: "A Clear Learning Roadmap",
    description:
      "Follow structured lessons designed to make complex marketplace concepts easier to understand and apply.",
    icon: ShieldCheck,
  },
  {
    title: "Learn From Experience",
    description:
      "Understand common seller challenges and make more informed decisions as you build your e-commerce foundation.",
    icon: Headset,
  },
];

const defaultAbout = {
  hero: {
    badge: "My E-Commerce Journey",
    title: "From Learning E-Commerce",
    highlight: "to Helping Build 400+ Brands",
    description:
      "My journey started in 2019 as a digital marketing intern earning ₹1,500 a month. Since then, I have experienced e-commerce as a seller, an employee, and an agency owner—learning from setbacks, working with 500+ clients, and contributing to work associated with over ₹120 crore in revenue.",
    primaryCta: "Explore the Course",
    secondaryCta: "Get in Touch",
  },
  who: {
    badge: "The Journey",
    title: "A Setback Became a Turning Point",
    description:
      "In 2022, I started selling on Amazon, trusted the wrong people, lost ₹18,000, and stepped away from e-commerce for almost a year. In 2024, I returned with a different mindset, joined an e-commerce agency, worked with 500+ clients, researched international marketplaces, and learned how sellers navigate different business models. That experience shaped the practical approach I bring to this course.",
  },
  vision: {
    badge: "The Lesson",
    title: "Learn From Real Experience",
    description:
      "My own journey taught me that progress takes more than enthusiasm. Sellers need reliable information, practical understanding, and the confidence to evaluate opportunities before making important decisions.",
  },
  mission: {
    badge: "Why This Course",
    title: "Direction, Not Just Information",
    description:
      "I created this course to share the practical knowledge, strategies, and lessons I have gained over the years—so aspiring sellers can avoid common mistakes, make more informed decisions, and approach e-commerce with greater clarity and confidence.",
  },
  services: {
    badge: "What You’ll Learn",
    title: "Understand the Real Work Behind E-Commerce",
    description:
      "Build a foundation in the decisions and day-to-day activities involved in selling online, informed by marketplace exposure and real seller challenges.",
  },
  platforms: {
    badge: "Marketplace Experience",
    title: "Explore. Understand. Implement.",
    description:
      "My experience includes researching international marketplaces and learning how e-commerce works across different platforms, countries, and business models.",
    items: ["Amazon India", "Flipkart", "Meesho"],
  },
  impact: {
    badge: "Experience & Impact",
    title: "Lessons Learned Through Experience,",
    highlight: "Shared to Help You Move Forward",
    description:
      "My work across seller, agency, and business roles has contributed to building more than 400 brands and over ₹120 crore in revenue. These experiences reinforced the value of practical execution—not just theory.",
    empoweredValue: "400+",
    empoweredLabel: "Brands Helped Build",
  },
  cta: {
    title: "Your E-Commerce Journey Starts Here",
    description:
      "Whether you are exploring e-commerce for the first time or strengthening your business foundation, learn the practical lessons with a clearer roadmap and greater confidence.",
    primaryLabel: "Start Learning",
    secondaryLabel: "Get in Touch",
  },
};

export default function About() {
  const [siteContent, setSiteContent] = useState(null);
  const previewVersion = useSitePreviewVersion();

  useEffect(() => {
    let cancelled = false;
    fetchSiteContent()
      .then((res) => {
        if (!cancelled && res.success) setSiteContent(res.data || {});
      })
      .catch(() => { })
      .finally(() => { });
    return () => {
      cancelled = true;
    };
  }, [previewVersion]);

  const content = siteContent?.about || {};
  const trainer = content.trainer || {};
  const promisesIntro = content.promisesIntro || {};
  const about = {
    ...defaultAbout,
    ...content,
    hero: { ...defaultAbout.hero, ...(content.hero || {}) },
    who: { ...defaultAbout.who, ...(content.who || {}) },
    vision: { ...defaultAbout.vision, ...(content.vision || {}) },
    mission: { ...defaultAbout.mission, ...(content.mission || {}) },
    services: { ...defaultAbout.services, ...(content.services || {}) },
    platforms: { ...defaultAbout.platforms, ...(content.platforms || {}) },
    impact: { ...defaultAbout.impact, ...(content.impact || {}) },
    cta: { ...defaultAbout.cta, ...(content.cta || {}) },
  };

  const stats =
    Array.isArray(content.stats) && content.stats.length
      ? content.stats.map((item, index) => ({
        ...item,
        icon: defaultStats[index]?.icon || Award,
      }))
      : defaultStats;

  const services =
    Array.isArray(content.servicesList) && content.servicesList.length
      ? content.servicesList.map((item, index) => ({
        ...item,
        icon: defaultServices[index]?.icon || BookOpen,
      }))
      : defaultServices;

  const promises =
    Array.isArray(content.promises) && content.promises.length
      ? content.promises.map((item, index) => ({
        ...item,
        icon: defaultPromises[index]?.icon || CheckCircle,
      }))
      : defaultPromises;

  return (
    <main className="mx-auto max-w-7xl space-y-20 px-2 py-12 sm:px-6 sm:py-16 lg:px-8">
      {/* About Trainer */}
      <section data-edit="about.trainer" aria-labelledby="about-trainer-heading">
        <div className="overflow-hidden rounded-[2rem] border border-forest/10 bg-gradient-to-br from-white via-mint/20 to-leaf/10 shadow-sm">
          <div className="grid items-center gap-8 p-2 sm:gap-10 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:p-12">
            <div className="order-2 min-w-0 lg:order-1">
              <h2
                id="about-trainer-heading"
                className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
              >
                <span className="mt-1 block text-forest">
                  {trainer.title || "From a Beginner to Building Brands"}
                </span>
              </h2>
              <p className="mt-5 text-sm leading-7 text-gray-600 sm:text-base sm:leading-8">
                {trainer.description ||
                  "In 2019, I began as a digital marketing intern, working 12-hour days for ₹1,500 a month. In 2022, my first attempt at selling on Amazon ended in a ₹18,000 loss and a difficult pause. I started again in 2024, bringing those lessons into agency work, researching marketplaces, and helping solve real challenges for sellers."}
              </p>
              {/* <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base sm:leading-8">
                The focus is on making complex processes easier to understand,
                building confidence through practical learning, and helping you
                apply what you learn to real business tasks.
              </p> */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-forest/10 bg-white/80 p-4">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint text-forest">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {trainer.pointOneTitle || "Learn From My Journey"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      {trainer.pointOneText || "Learn from the mistakes, research, and experience that shaped my approach."}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-forest/10 bg-white/80 p-4">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint text-forest">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {trainer.pointTwoTitle || "Built Around Real Challenges"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      {trainer.pointTwoText || "Understand the decisions sellers face while building an online business."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <Link
                  to="/courses"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-leaf px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-forest sm:w-auto"
                >
                  <RollText>{trainer.buttonLabel || "Explore the Course"}</RollText> <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="order-1 mx-auto w-full max-w-sm lg:order-2 lg:max-w-none">
              <div className="relative mx-auto max-w-[340px]">
                <div className="absolute -inset-3 rounded-[2rem] bg-leaf/15 blur-xl" />
                <div className="relative overflow-hidden rounded-[1.75rem] border border-white bg-white p-2 shadow-xl">
                  <img decoding="async"
                    src={trainer.imageUrl || "/assets/owner1.webp"}
                    alt={`${trainer.name || "Sambhav Sir"}, e-commerce course trainer`}
                    className="aspect-[4/5] w-full rounded-[1.25rem] object-cover object-center"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      const fallback = event.currentTarget.nextElementSibling;
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                  <div className="hidden aspect-[4/5] w-full flex flex-col items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-forest to-leaf text-white">
                    <span className="grid h-28 w-28 place-items-center rounded-full border border-white/30 bg-white/10 text-4xl font-extrabold">
                      SS
                    </span>
                    <span className="mt-5 text-xl font-bold">{trainer.name || "Sambhav Sir"}</span>
                    <span className="mt-1 text-sm text-white/75">
                      {trainer.role || "E-Commerce Trainer"}
                    </span>
                  </div>
                  <div className="absolute inset-x-2 bottom-2 rounded-b-[1.2rem] bg-gradient-to-t from-gray-950/90 via-gray-950/45 to-transparent px-5 pb-5 pt-12 text-white">
                    <p className="text-lg font-bold">{trainer.name || "Sambhav Sir"}</p>
                    <p className="mt-1 text-xs font-medium text-white/80">
                      {trainer.role || "E-Commerce Trainer"}
                    </p>
                  </div>
                </div>
                <div className="absolute -right-2 top-5 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg sm:-right-5">
                  <p className="text-xs font-bold text-forest">
                    {trainer.tagline || "Learn • Apply • Grow"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-edit="about.hero about.promisesIntro about.promises" className="relative overflow-hidden rounded-[2rem] border border-forest/10 bg-gradient-to-br from-white via-mint/30 to-leaf/10 px-2 py-12 sm:px-10 sm:py-16 lg:px-14">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-leaf/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-mint/60 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              {about.hero.title}
              <span className="mt-1 block text-forest">
                {about.hero.highlight}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-gray-600 sm:text-lg">
              {about.hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-full bg-leaf px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-forest"
              >
                <RollText>{about.hero.primaryCta}</RollText> <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-white/80 px-6 py-3.5 text-sm font-semibold text-forest transition hover:bg-white"
              >
                <RollText>{about.hero.secondaryCta}</RollText>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-forest/10 pt-6">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <CheckCircle className="h-4 w-4 text-leaf" />
                {about.hero.trustOne || "Practical Learning"}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <CheckCircle className="h-4 w-4 text-leaf" />
                {about.hero.trustTwo || "Expert Support"}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-leaf/10 blur-xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] bg-forest p-7 text-white shadow-2xl sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                    {promisesIntro.title || "Real Lessons."}
                    <span className="block text-leaf">
                      {promisesIntro.highlight || "Practical Direction."}
                    </span>
                  </h2>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10">
                  <TrendingUp className="h-6 w-6 text-leaf" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/75">
                {promisesIntro.description ||
                  "This course brings together practical insights from seller experience, agency work, marketplace research, and challenges encountered while working with hundreds of clients."}
              </p>
              <div className="mt-7 space-y-3">
                {promises.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4 transition hover:bg-white/[0.12]"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-leaf/15">
                        <Icon className="h-5 w-5 text-leaf" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs leading-6 text-white/65">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-edit="about.who about.vision about.mission">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {about.who.title}
            </h2>
          </div>
          <p className="self-center text-sm leading-relaxed text-gray-600">
            {about.who.description}
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-forest">
              {about.vision.badge}
            </span>
            <h3 className="mt-4 text-lg font-bold text-gray-900">
              {about.vision.title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              {about.vision.description}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-forest">
              {about.mission.badge}
            </span>
            <h3 className="mt-4 text-lg font-bold text-gray-900">
              {about.mission.title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              {about.mission.description}
            </p>
          </div>
        </div>
      </section>

      <section data-edit="about.services about.servicesList">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {about.services.title}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-gray-600">
            {about.services.description}
          </p>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-leaf/40 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-mint text-forest">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-gray-300">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>



      <section data-edit="about.impact about.stats">
        <div className="overflow-hidden rounded-[2rem] bg-forest p-7 text-white shadow-xl sm:p-10 lg:p-12">
          <div>
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {about.impact.title}
                <span className="block text-leaf">
                  {about.impact.highlight}
                </span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/70">
                {about.impact.description}
              </p>
            </div>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 transition hover:bg-white/[0.12] sm:p-6"
                >
                  <Icon className="h-5 w-5 text-leaf" />
                  <p className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/65">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section data-edit="about.cta" className="pb-4">
        <div className="rounded-3xl border border-leaf/20 bg-mint/30 px-6 py-10 text-center sm:px-10 sm:py-14">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-forest shadow-sm">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {about.cta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
            {about.cta.description}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-full bg-leaf px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-forest"
            >
              <RollText>{about.cta.primaryLabel}</RollText> <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-forest/20 bg-white px-6 py-3 text-sm font-semibold text-forest transition hover:bg-gray-50"
            >
              <RollText>{about.cta.secondaryLabel}</RollText>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
