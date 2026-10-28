// components/Hero.jsx
import { motion } from "motion/react";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: i * 0.1,
      ease: "easeOut",
    },
  }),
};

const float = {
  animate: {
    y: [0, -16, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-mint/70 via-white to-white">
      {/* Floating blobs */}
      <motion.div
        className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-leaf/20 blur-3xl"
        variants={float}
        animate="animate"
      />
      <motion.div
        className="pointer-events-none absolute -right-10 bottom-6 h-64 w-64 rounded-full bg-forest/15 blur-3xl"
        variants={float}
        animate="animate"
        transition={{ duration: 7.5, delay: 1.2 }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        {/* Left Content */}
        <div>
          <motion.span
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full bg-leaf/15 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-forest"
          >
            SkyBirds E-Commerce Academy
          </motion.span>

          <motion.h1
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-4 text-4xl font-extrabold leading-tight text-ink md:text-5xl lg:text-6xl"
          >
            Scale Your Sales on <span className="text-leaf">Amazon</span>,{" "}
            <span className="text-[#FF8A00]">Meesho</span> &{" "}
            <span className="text-[#2874F0]">Flipkart</span>.
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-5 max-w-lg text-base text-ink/75 leading-relaxed"
          >
            Master the exact algorithms, product listing SEO, pricing
            strategies, and high-ROAS ad campaigns trusted by top Indian
            e-commerce sellers. Stream protected masterclasses anytime.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-8 flex flex-wrap gap-3.5"
          >
            <Link
              to="/courses"
              className="btn-shine inline-flex items-center gap-2 rounded-full bg-leaf px-6 py-3 font-semibold text-white hover:bg-forest transition shadow-sm text-sm"
            >
              Browse Video Courses →
            </Link>
          </motion.div>

          {/* Trust metrics */}
          <motion.div
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-10 flex items-center gap-6 text-xs text-ink/60 border-t border-forest/10 pt-5"
          >
            <div>
              <span className="block font-bold text-base text-forest">
                10,000+
              </span>
              <span>Active Sellers Trained</span>
            </div>
            <div className="h-6 w-px bg-forest/15" />
            <div>
              <span className="block font-bold text-base text-forest">
                ₹15 Cr+
              </span>
              <span>Seller Revenue Generated</span>
            </div>
            <div className="h-6 w-px bg-forest/15" />
            <div>
              <span className="block font-bold text-base text-forest">100%</span>
              <span>Protected Streaming</span>
            </div>
          </motion.div>
        </div>

        {/* Right Platforms Showcase */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="grid gap-3.5 rounded-3xl bg-forest p-6 sm:p-8 text-white shadow-xl"
        >
          <div className="border-b border-white/10 pb-4 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-leaf">
              Supported Marketplaces
            </span>
            <h2 className="text-xl font-bold mt-1">
              Multi-Platform Growth Acceleration
            </h2>
          </div>

          {[
            {
              title: "Amazon India Seller Growth",
              badge: "FBA & PPC",
              badgeColor: "bg-amber-400/20 text-amber-300",
              desc: "Keyword indexing, Buy Box strategies, Sponsored Ads optimization, and A+ Brand Story setup.",
            },
            {
              title: "Meesho Order Scaling",
              badge: "0% Commission",
              badgeColor: "bg-rose-400/20 text-rose-300",
              desc: "Price recommendation mastery, Next-Day Dispatch (NDD), catalog boosting, and RTO return control.",
            },
            {
              title: "Flipkart Marketplace Mastery",
              badge: "FBF & PLA",
              badgeColor: "bg-blue-400/20 text-blue-300",
              desc: "Listing quality score, Big Billion Days event prep, PCA ads, and Flipkart Assured badge growth.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-2xl bg-white/10 p-4 backdrop-blur border border-white/10 hover:bg-white/15 transition"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-base text-white">{item.title}</p>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/75">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}