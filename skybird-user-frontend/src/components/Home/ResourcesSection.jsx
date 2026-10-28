import { Link } from "react-router-dom";
import { CheckCircle2, TrendingUp, ShieldCheck, DollarSign, Target, Zap } from "lucide-react";

export default function ResourcesSection() {
  const features = [
    {
      icon: DollarSign,
      title: "Accurate Profit & ROI Calculator",
      desc: "Calculate exact referral fees, closing charges, and GST to set profitable selling prices.",
    },
    {
      icon: Zap,
      title: "Fast Seller Onboarding",
      desc: "Get your store live on Meesho, Amazon & Flipkart in under 48 hours without paperwork hassle.",
    },
    {
      icon: TrendingUp,
      title: "High-ROAS Ad Strategies",
      desc: "Step-by-step guides to run Amazon PPC and Flipkart PLA campaigns with low ACOS.",
    },
    {
      icon: ShieldCheck,
      title: "Return & RTO Management",
      desc: "Proven tactics to cut down fake returns and protect your account health.",
    },
    {
      icon: Target,
      title: "Category Keyword Vault",
      desc: "Handpicked high-volume search terms to index your listings on page 1.",
    },
    {
      icon: CheckCircle2,
      title: "Algorithm Ranking Secrets",
      desc: "Understand how Amazon A9 and Meesho ranking algorithms reward fast dispatchers.",
    },
  ];

  return (
    <section className="bg-gray-50/70 py-16 sm:py-24 border-t border-forest/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-center mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-leaf">
            Seller Playbooks & Frameworks
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
            Everything You Need to Scale Your Store
          </h2>
          <p className="mt-3 text-sm text-ink/70">
            From zero to thousands of orders per month: tested tools, frameworks, and masterclasses.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-leaf/40 hover:shadow-md transition"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-forest mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-xs text-ink/70 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
