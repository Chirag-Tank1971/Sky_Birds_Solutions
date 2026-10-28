import { motion } from "motion/react";

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

const colors = [
  "from-blue-50 to-cyan-50",
  "from-orange-50 to-amber-50",
  "from-purple-50 to-pink-50",
  "from-emerald-50 to-teal-50",
  "from-rose-50 to-orange-50",
  "from-indigo-50 to-blue-50",
  "from-yellow-50 to-lime-50",
  "from-pink-50 to-fuchsia-50",
];

const borderColors = [
  "border-blue-100",
  "border-orange-100",
  "border-purple-100",
  "border-emerald-100",
  "border-rose-100",
  "border-indigo-100",
  "border-yellow-100",
  "border-pink-100",
];

// Split all logos into rows
const rows = [];

for (let i = 0; i < clients.length; i += 15) {
  rows.push(clients.slice(i, i + 15));
}

function ClientCard({ client, index }) {
  const colorIndex = index % colors.length;

  return (
    <div
      className={`
        group relative
        flex h-[70px] w-[90px] md:h-[105px]
        md:w-[125px]
        shrink-0
        flex-col
        items-center
        justify-center
        overflow-hidden
        rounded-2xl
        border
        ${borderColors[colorIndex]}
        bg-gradient-to-br
        ${colors[colorIndex]}
        p-3
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:scale-[1.03]
        hover:shadow-xl
      `}
    >
      {/* Decorative circle */}
      <div
        className="
          pointer-events-none
          absolute -right-5 -top-5
          h-14 w-14
          rounded-full
          bg-white/50
          blur-sm
          transition-transform
          duration-500
          group-hover:scale-150
        "
      />

      {/* Logo */}
      <div className="relative flex h-[62px] w-full items-center justify-center">
        <img decoding="async"
          src={client.logo}
          alt={client.name}
          loading="lazy"
          className="
            max-h-[55px]
            max-w-[100px]
            object-contain
            transition-all
            duration-500
            group-hover:scale-110
          "
        />
      </div>

      {/* Name */}
      <span
        className="
          relative
          mt-1
          max-w-full
          truncate
          text-[14px]
          font-semibold
          text-black
          transition-colors
          duration-300
          group-hover:text-forest
        "
      >
        {client.name}
      </span>
    </div>
  );
}


 

   
function ClientRow({ clients: rowClients, rowIndex }) {
  const isReverse = rowIndex % 2 === 1;

  return (
    <div
      className="relative w-full overflow-hidden py-2"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
      }}
    >
      <div
        className={`client-marquee-track ${
          isReverse ? "client-marquee-reverse" : ""
        }`}
      >
        {[0, 1].map((group) => (
          <div
            key={group}
            className="client-marquee-group"
            aria-hidden={group === 1}
          >
            {rowClients.map((client, index) => (
              <ClientCard
                key={`${client.name}-${rowIndex}-${group}`}
                client={client}
                index={index + rowIndex}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
} 





export default function ClientLogos() {
  return (
    <section className="relative mx-auto overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 py-20 pb-10 sm:py-2">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-10 h-72 w-72 rounded-full bg-sky-200/45 blur-[100px]" />

        <div className="absolute right-[5%] top-1/3 h-80 w-80 rounded-full bg-indigo-200/40 blur-[110px]" />

        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-200/35 blur-[100px]" />
      </div>

      <div className="relative  max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-12 max-w-3xl px-4 text-center"
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

        {/* Client Rows */}
        <div className="space-y-3">
          {rows.map((row, index) => (
            <ClientRow
              key={`client-row-${index}`}
              clients={row}
              rowIndex={index}
            />
          ))}
        </div>

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
            px-4
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
