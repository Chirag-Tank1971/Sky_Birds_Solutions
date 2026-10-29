import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";

const clients = [
  { name: "african magic", logo: "/assets/clients/african magic.webp" },
  { name: "amicraft", logo: "/assets/clients/amicraft.webp" },
  { name: "asebhari", logo: "/assets/clients/asebhari.webp" },
  { name: "blackwood", logo: "/assets/clients/blackwood.webp" },
  { name: "brar", logo: "/assets/clients/brar.webp" },
  { name: "chamunda (2)", logo: "/assets/clients/chamunda (2).webp" },
  { name: "chamunda", logo: "/assets/clients/chamunda.webp" },
  { name: "d & c", logo: "/assets/clients/d & c.webp" },
  { name: "DEL JONNES", logo: "/assets/clients/DEL JONNES.webp" },
  { name: "divyam", logo: "/assets/clients/divyam.webp" },
  { name: "Ele touch", logo: "/assets/clients/Ele touch.webp" },
  { name: "gopinath", logo: "/assets/clients/gopinath.webp" },
  { name: "Healthy eats", logo: "/assets/clients/Healthy eats.webp" },
  { name: "Home e shop", logo: "/assets/clients/Home e shop.webp" },

  { name: "homemiq", logo: "/assets/clients/homemiq.webp" },
  { name: "homezza", logo: "/assets/clients/homezza.webp" },
  { name: "Homzy", logo: "/assets/clients/Homzy.webp" },
  { name: "Insectra", logo: "/assets/clients/Insectra.webp" },
  { name: "Itaiwon", logo: "/assets/clients/Itaiwon.webp" },
  { name: "kajal", logo: "/assets/clients/kajal.webp" },
  { name: "kalarav", logo: "/assets/clients/kalarav.webp" },
  { name: "Kiimora", logo: "/assets/clients/Kiimora.webp" },
  { name: "krivazone", logo: "/assets/clients/krivazone.webp" },
  { name: "Kumijashi", logo: "/assets/clients/Kumijashi.webp" },
  { name: "lemon deal", logo: "/assets/clients/lemon deal.webp" },
  { name: "Loccus", logo: "/assets/clients/Loccus.webp" },
  { name: "m password", logo: "/assets/clients/m password.webp" },
  { name: "MP", logo: "/assets/clients/MP.webp" },

  { name: "nilkanth", logo: "/assets/clients/nilkanth.webp" },
  { name: "nipar", logo: "/assets/clients/nipar.webp" },
  { name: "pd", logo: "/assets/clients/pd.webp" },
  { name: "petstreet", logo: "/assets/clients/petstreet.webp" },
  { name: "rajput furniture", logo: "/assets/clients/rajput furniture.webp" },
  { name: "rangmani", logo: "/assets/clients/rangmani.webp" },
  { name: "Ratnavali", logo: "/assets/clients/Ratnavali.webp" },
  { name: "rb", logo: "/assets/clients/rb.webp" },
  { name: "rudzo", logo: "/assets/clients/rudzo.webp" },
  { name: "shijamiku", logo: "/assets/clients/shijamiku.webp" },
  { name: "shopvexa", logo: "/assets/clients/shopvexa.webp" },
  { name: "Solacewave", logo: "/assets/clients/Solacewave.webp" },
  { name: "Sonani", logo: "/assets/clients/Sonani.webp" },
  { name: "SP", logo: "/assets/clients/SP.webp" },

  { name: "steeluxe", logo: "/assets/clients/steeluxe.webp" },
  { name: "tennecy", logo: "/assets/clients/tennecy.webp" },
  { name: "tharman", logo: "/assets/clients/tharman.webp" },
  { name: "toytech", logo: "/assets/clients/toytech.webp" },
  { name: "Ustine", logo: "/assets/clients/Ustine.webp" },
  { name: "vastra", logo: "/assets/clients/vastra.webp" },
  { name: "web retail", logo: "/assets/clients/web retail.webp" },
  { name: "wishbone", logo: "/assets/clients/wishbone.webp" },
];

const SLOTS = 18; // 9 hexagons on each side of the centre
const SWAP_EVERY_MS = 2200;
const HEX = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

// Hexagon positions in a cluster, in units of the hexagon width (--w).
// The middle row is pushed towards the outside, like a honeycomb.
const STEP_X = 1.12;
const STEP_Y = 0.93;
const clusterPositions = (side) =>
  [0, 1, 2].flatMap((row) =>
    [0, 1, 2].map((col) => {
      const shifted = side === "left" ? row !== 1 : row === 1;
      return { x: col * STEP_X + (shifted ? STEP_X / 2 : 0), y: row * STEP_Y };
    }),
  );

const popIn = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.25, duration: 0.7 } },
};

// Logo files are squares with their own background. Sample a corner pixel so
// the hexagon can take that colour and the square edges disappear.
const backgroundCache = new Map();
function logoBackground(img) {
  if (backgroundCache.has(img.src)) return backgroundCache.get(img.src);
  let color = "#ffffff";
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 2, 2, 1, 1, 0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a > 200) color = `rgb(${r}, ${g}, ${b})`;
  } catch {
    // Unreadable image: keep the white hexagon.
  }
  backgroundCache.set(img.src, color);
  return color;
}

function Hex({ client, x, y }) {
  const [background, setBackground] = useState(() => backgroundCache.get(new URL(client.logo, window.location.href).href) || "#ffffff");
  return (
    <motion.div
      variants={popIn}
      title={client.name}
      className="group absolute h-[calc(var(--w)*1.1547)] w-[var(--w)] transition-[scale] duration-300 hover:scale-105"
      style={{ left: `calc(var(--w) * ${x})`, top: `calc(var(--w) * ${y})` }}
    >
      <div
        className="relative h-full w-full transition-colors duration-500"
        style={{ clipPath: HEX, backgroundColor: background }}
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={client.logo}
            src={client.logo}
            alt={client.name}
            loading="lazy"
            decoding="async"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onLoad={(event) => setBackground(logoBackground(event.currentTarget))}
            // Even padding keeps every logo clear of the hexagon's angled corners.
            className="absolute inset-0 m-auto h-[76%] w-[76%] object-contain"
          />
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Cluster({ side, slots, className = "" }) {
  return (
    <motion.div
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      // One shadow for the whole cluster is far cheaper than one per hexagon.
      className={`relative h-[calc(var(--w)*3.01)] w-[calc(var(--w)*3.8)] shrink-0 drop-shadow-[0_10px_18px_rgba(32,29,29,0.08)] ${className}`}
    >
      {clusterPositions(side).map((pos, i) => (
        <Hex key={i} client={clients[slots[i]]} {...pos} />
      ))}
    </motion.div>
  );
}

export default function ClientLogos() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { amount: 0.2 });
  // Which client each of the 18 hexagons shows; tiles swap one at a time so
  // all 50 brands appear over time.
  const [slots, setSlots] = useState(() => clients.slice(0, SLOTS).map((_, i) => i));
  const nextClient = useRef(SLOTS);

  useEffect(() => {
    if (!inView) return undefined; // only cycle while the section is on screen
    const timer = setInterval(() => {
      setSlots((current) => {
        let candidate = nextClient.current % clients.length;
        while (current.includes(candidate)) candidate = (candidate + 1) % clients.length;
        nextClient.current = candidate + 1;
        const next = [...current];
        next[Math.floor(Math.random() * SLOTS)] = candidate;
        return next;
      });
    }, SWAP_EVERY_MS);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto overflow-hidden rounded-3xl bg-[radial-gradient(60%_60%_at_50%_55%,rgba(110,189,68,0.12),transparent_70%),linear-gradient(180deg,#fafafa,#f2f2f2)] px-4 py-16 sm:py-20"
    >
      <div className="relative mx-auto max-w-7xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          {/* Badge */}
          <div
            className="
              mx-auto inline-flex
              items-center gap-2
              rounded-full
              border border-forest/10
              bg-forest/5
              px-4 py-2
              text-[10px]
              font-bold
              uppercase
              tracking-[0.2em]
              text-forest
            "
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf" />
            </span>
            Our Clients
          </div>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Trusted by <span className="text-forest">Growing Brands</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            Businesses across different industries trust Sky Birds to build,
            manage and grow their e-commerce presence.
          </p>
        </motion.div>

        {/* Honeycomb: left cluster, Sky Birds hexagon, right cluster */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="flex flex-col items-center justify-center gap-8 [--w:84px] sm:[--w:104px] lg:flex-row lg:gap-10 lg:[--w:92px] xl:[--w:112px]"
        >
          <Cluster side="left" slots={slots.slice(0, 9)} className="order-2 lg:order-1" />

          <motion.div
            variants={popIn}
            className="relative order-1 h-[calc(var(--w)*2.6*1.1547)] w-[calc(var(--w)*2.6)] shrink-0 lg:order-2"
          >
            <div className="absolute inset-[12%] rounded-full bg-leaf/40 blur-2xl" />
            <div
              className="relative grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_30%,#2e6b2e,#201d1d_70%)]"
              style={{ clipPath: HEX }}
            >
              <img
                src="/assets/logo1.webp"
                alt="Sky Birds Solution"
                loading="lazy"
                decoding="async"
                className="h-[52%] w-[52%] object-contain"
              />
            </div>
          </motion.div>

          {/* Phones show one cluster; it still cycles through every brand. */}
          <Cluster side="right" slots={slots.slice(9)} className="order-3 hidden lg:block" />
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="
            mx-auto mt-12
            flex max-w-2xl
            flex-wrap
            items-center
            justify-center
            gap-3
          "
        >
          <div className="rounded-full border border-blue-100 bg-blue-50 px-5 py-2.5 text-xs font-semibold text-blue-700">
            50+ Brands
          </div>

          <div className="rounded-full border border-purple-100 bg-purple-50 px-5 py-2.5 text-xs font-semibold text-purple-700">
            Multiple Industries
          </div>

          <div className="rounded-full border border-emerald-100 bg-emerald-50 px-5 py-2.5 text-xs font-semibold text-emerald-700">
            E-Commerce Growth
          </div>
        </motion.div>
      </div>
    </section>
  );
}
