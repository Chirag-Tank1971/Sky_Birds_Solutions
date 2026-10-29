import { easeIn, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { BarChart3, Boxes, FileText, Search, Tag, Truck } from "lucide-react";

// Topic tags floating around the hero heading: an icon badge plus a pill in
// the same pastel. Positions are percentages of the hero's content width.
const tags = [
  { label: "Product Research", icon: Search, pos: "left-[4%] top-[150px]", circle: "bg-[#cfe9bf]", pill: "bg-[#e3f3d8] text-forest", size: "md" },
  { label: "Listing Creation", icon: FileText, pos: "left-0 top-[340px]", circle: "bg-leaf text-white", pill: "bg-[#8fd06a] text-ink", size: "lg" },
  { label: "Inventory Management", icon: Boxes, pos: "left-[9%] top-[540px]", circle: "bg-[#e5efb3]", pill: "bg-[#eef5c9] text-[#4b5a17]", size: "sm" },
  { label: "Order Fulfillment", icon: Truck, pos: "right-[2%] top-[180px]", circle: "bg-[#bfe5d4]", pill: "bg-[#d5efe3] text-[#1f5c45]", size: "lg" },
  { label: "Marketing & Growth", icon: BarChart3, pos: "right-0 top-[380px]", circle: "bg-[#cfe9bf]", pill: "bg-[#e3f3d8] text-forest", size: "md" },
  { label: "Pricing Strategy", icon: Tag, pos: "right-[10%] top-[560px]", circle: "bg-[#dfe8d8]", pill: "bg-[#ecf1e8] text-ink", size: "sm" },
];

const sizes = {
  sm: { circle: "h-6 w-6", icon: 11, pill: "px-2.5 py-1 text-[11px]" },
  md: { circle: "h-7 w-7", icon: 13, pill: "px-3 py-1 text-xs" },
  lg: { circle: "h-8 w-8", icon: 14, pill: "px-3.5 py-1.5 text-[13px]" },
};

// Out-of-focus pills in the background for depth.
const ghosts = [
  "left-[22%] top-[110px] w-12 bg-[#e5efb3]",
  "left-[12%] top-[250px] w-20 bg-[#bfe5d4]",
  "left-[6%] top-[470px] w-14 bg-[#8fd06a]",
  "right-[24%] top-[120px] w-20 bg-[#bfe5d4]",
  "right-[8%] top-[500px] w-20 bg-[#cfe9bf]",
];

// Scrolling down shrinks the whole tag layer to nothing while it slides
// towards the cards below, so the tags look pulled into them (as on nominal.so).
const SCROLL_RANGE = [0, 550];

export default function FloatingTags() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, SCROLL_RANGE, [1, 0], { ease: easeIn });
  const y = useTransform(scrollY, SCROLL_RANGE, [0, 260], { ease: easeIn });

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden h-[680px] max-w-7xl xl:block"
      style={reduceMotion ? undefined : { scale, y, transformOrigin: "50% 100%" }}
    >
      {ghosts.map((cls) => (
        <span key={cls} className={`absolute h-4 rounded-full opacity-60 blur-[5px] ${cls}`} />
      ))}

      {tags.map(({ label, icon: Icon, pos, circle, pill, size }, index) => {
        const s = sizes[size];
        return (
          <motion.div
            key={label}
            className={`absolute ${pos}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.8, delay: 0.6 + index * 0.1 }}
          >
            {/* Gentle drift, each tag on its own rhythm. */}
            <motion.div
              className="flex items-center gap-1.5"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5 + (index % 3), ease: "easeInOut", repeat: Infinity, delay: index * 0.4 }}
            >
              <span className={`grid shrink-0 place-items-center rounded-full ${s.circle} ${circle}`}>
                <Icon size={s.icon} strokeWidth={2.4} />
              </span>
              <span className={`whitespace-nowrap rounded-full font-semibold ${s.pill} ${pill}`}>{label}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
