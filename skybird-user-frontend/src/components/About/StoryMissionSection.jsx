export default function StoryMissionSection() {
  const stats = [
    { value: "5+ Years", label: "Dedicated E-Commerce Experience" },
    { value: "50+ Courses", label: "Specialized Marketplace Lessons" },
    { value: "₹15 Cr+", label: "Verified Seller Revenue Boosted" },
    { value: "10,000+", label: "Happy Sellers Across 28 States" },
  ];

  return (
    <section className="py-8">
      <div className="rounded-3xl bg-forest p-8 sm:p-12 text-white shadow-xl">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-leaf/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-leaf">
            Our Impact
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold">The Numbers Behind Our Growth</h2>
          <p className="mt-2 text-xs text-white/80 leading-relaxed">
            From single product launches to multi-warehouse operations across India.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/10">
              <p className="text-2xl font-bold text-leaf sm:text-3xl">{item.value}</p>
              <p className="mt-1 text-xs text-white/75">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
