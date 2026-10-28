import { Link } from "react-router-dom";
import {
  Rocket,
  Layers,
  TrendingUp,
  ShieldCheck,
  Headphones,
  Video,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

const marketplaceServices = [
  {
    icon: Rocket,
    title: "Marketplace Seller Onboarding",
    badge: "Amazon • Meesho • Flipkart",
    desc: "Complete end-to-end seller account creation, GST compliance, brand approval/GTIN exemption, and bank KYC verification for lightning-fast launch.",
    points: [
      "Seller central registration & category ungating",
      "Brand authorization & trademark assistance",
      "Shipping configuration (Easy Ship, FBA, FBF)",
      "Zero-delay listing approval guarantee"
    ]
  },
  {
    icon: Layers,
    title: "Cataloging & SEO Listing Optimization",
    badge: "High Converting",
    desc: "High-ranking product titles, bullet points, backend search terms, lifestyle infographics, and Amazon A+ / Enhanced Brand Content (EBC).",
    points: [
      "Keyword research tailored to Indian buyers",
      "A+ Content / Rich product detail pages",
      "High CTR image gallery guidance",
      "Category tree mapping for top organic ranking"
    ]
  },
  {
    icon: TrendingUp,
    title: "PPC Advertising & ROAS Management",
    badge: "Maximizing ROI",
    desc: "Data-driven Sponsored Products, Sponsored Brands, and Display ad campaigns with automated bid adjustments to lower ACOS and boost profit margins.",
    points: [
      "Targeted negative keyword harvesting",
      "Flipkart PLA & PCA campaign setup",
      "Meesho ad budget and smart CPC bidding",
      "Weekly performance reports & audit"
    ]
  },
  {
    icon: ShieldCheck,
    title: "Account Health & Policy Protection",
    badge: "Safe Operations",
    desc: "Proactive account health monitoring, Late Dispatch Rate (LDR) prevention, Order Defect Rate (ODR) reduction, and suspension recovery guidance.",
    points: [
      "Daily account health checkups",
      "RTO & fake return reduction strategies",
      "Plan of Action (POA) assistance",
      "Customer rating & feedback optimization"
    ]
  },
  {
    icon: Headphones,
    title: "Full-Service Account Management",
    badge: "Dedicated Manager",
    desc: "Have seasoned e-commerce specialists handle your daily operations, inventory replenishment alerts, deal submissions, and promotional events.",
    points: [
      "Lightning deals and festive sales preparation",
      "Inventory forecasting & restocking alerts",
      "Competitor price & ranking tracking",
      "Direct WhatsApp / Call account manager support"
    ]
  },
  {
    icon: Video,
    title: "Video Learning & Live Masterclasses",
    badge: "Self-Paced & Secure",
    desc: "Step-by-step video courses covering the newest algorithm updates across Amazon India, Flipkart, and Meesho with protected in-app streaming.",
    points: [
      "Over 50+ hours of video lessons",
      "Protected streaming with zero downloads",
      "Case studies of 7-figure Indian sellers",
      "Certificate of course completion"
    ]
  }
];

export default function Services() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
      {/* Header */}
      <div className="max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-widest text-leaf">
          Comprehensive Seller Solutions
        </span>
        <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-5xl">
          E-Commerce Onboarding & Growth Services
        </h1>
        <p className="mt-4 text-ink/75 text-base sm:text-lg leading-relaxed">
          Whether you are launching your first product or scaling to ₹10 Lakhs+ monthly revenue, SkyBirds provides full-stack management, onboarding, and hands-on consulting across major Indian marketplaces.
        </p>
      </div>

      {/* Services Grid */}
      <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {marketplaceServices.map((service, index) => {
          const Icon = service.icon;
          return (
            <div
              key={service.title}
              className="group flex flex-col justify-between rounded-2xl border border-forest/10 bg-white p-7 shadow-sm hover:border-leaf/50 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint text-forest group-hover:bg-leaf group-hover:text-white transition">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-semibold text-forest bg-mint/80 px-2.5 py-1 rounded-full">
                    {service.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-bold text-ink group-hover:text-forest transition">
                  {service.title}
                </h3>
                <p className="mt-2.5 text-sm text-ink/70 leading-relaxed">
                  {service.desc}
                </p>

                <ul className="mt-6 space-y-2 text-xs text-ink/80 border-t border-forest/10 pt-4">
                  {service.points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-leaf shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:text-leaf transition group-hover:translate-x-1 duration-150"
                >
                  Inquire for this service <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner */}
      <div className="mt-20 rounded-3xl bg-gradient-to-r from-forest to-leaf p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Need a custom onboarding or ad strategy?</h2>
          <p className="mt-2 text-white/80 text-sm max-w-xl">
            Talk directly to our marketplace lead. We will review your catalog and outline a tailored roadmap for Amazon, Flipkart, and Meesho.
          </p>
        </div>
        <Link
          to="/contact"
          className="shrink-0 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-forest hover:bg-mint hover:scale-105 transition shadow-md"
        >
          Book Free Strategy Call
        </Link>
      </div>
    </div>
  );
}
