export default function About1() {
  return (
    <section className="py-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-leaf">
            Who We Are
          </span>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Built by Sellers, For Sellers
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-gray-600 self-center">
          We understand the frustration of rising ad costs, complex marketplace fee structures, and sudden account issues. Our team combines over a decade of hands-on experience running multi-crore stores on Amazon, Flipkart, and Meesho to give you actionable roadmaps.
        </p>
      </div>

      {/* Cards */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-forest bg-mint px-2.5 py-1 rounded-full">
            Our Vision
          </span>
          <h3 className="text-lg font-bold text-gray-900 mt-4">Democratizing Online Commerce</h3>
          <p className="mt-2 text-xs leading-relaxed text-gray-600">
            To empower 1,00,000+ local manufacturers, retail owners, and budding entrepreneurs across India to build sustainable, highly profitable marketplace businesses.
          </p>
        </div>

        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-forest bg-mint px-2.5 py-1 rounded-full">
            Our Mission
          </span>
          <h3 className="text-lg font-bold text-gray-900 mt-4">No-Nonsense Training & Execution</h3>
          <p className="mt-2 text-xs leading-relaxed text-gray-600">
            To provide high-quality, up-to-date video tutorials, hands-on onboarding, and reliable management so sellers can maximize ROI and avoid costly beginner mistakes.
          </p>
        </div>
      </div>
    </section>
  );
}
