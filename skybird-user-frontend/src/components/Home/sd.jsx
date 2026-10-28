import { Link } from "react-router-dom";
import { Rocket, ShieldCheck, Video, Users, ArrowRight } from "lucide-react";

export default function HomeServices() {
  const cards = [
    {
      title: "Amazon Seller Growth",
      desc: "FBA logistics, brand registry, A+ content, and PPC bidding tactics tailored for high conversion.",
      tag: "Amazon India",
      bg: "bg-amber-50/70 border-amber-200",
    },
    {
      title: "Meesho Order Scaling",
      desc: "Unlock massive volume with smart cataloging, pricing algorithms, and 0% commission mastery.",
      tag: "Meesho",
      bg: "bg-rose-50/70 border-rose-200",
    },
    {
      title: "Flipkart FBF & PLA Ads",
      desc: "Optimize listing quality scores and master Product Listing Ads for Flipkart Assured badge.",
      tag: "Flipkart",
      bg: "bg-blue-50/70 border-blue-200",
    },
    {
      title: "Seller Onboarding Service",
      desc: "Complete GST registration, category ungating, brand authorization, and initial catalog upload.",
      tag: "Full Service",
      bg: "bg-emerald-50/70 border-emerald-200",
    },
    {
      title: "Protected Video Learning",
      desc: "Self-paced HD masterclasses with zero downloadable files and instant dashboard access.",
      tag: "Video Academy",
      bg: "bg-purple-50/70 border-purple-200",
    },
    {
      title: "1-on-1 Account Support",
      desc: "Direct guidance from seasoned marketplace account managers to troubleshoot issues.",
      tag: "Support",
      bg: "bg-teal-50/70 border-teal-200",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="max-w-2xl text-center mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-leaf">
          Our Specializations
        </span>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Complete Marketplace Growth Ecosystem
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Everything from video masterclasses to full account onboarding and management.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm hover:shadow-md transition ${card.bg}`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-white px-2.5 py-1 rounded-full border border-forest/10">
                {card.tag}
              </span>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                {card.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                {card.desc}
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-gray-200/60">
              <Link
                to="/services"
                className="inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-leaf transition"
              >
                Learn details <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
