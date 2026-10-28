import { Link } from "react-router-dom";
import { ShoppingBag, TrendingUp, Award, CheckCircle } from "lucide-react";

export default function TeamPurposeSection() {
  return (
    <section className="py-8">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left Content */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-leaf">
            Our Purpose & Vision
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Helping Indian Brands Dominate <span className="text-leaf">E-Commerce</span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-gray-600">
            At SkyBirds Academy, our mission is simple: eliminate the confusion and high costs of online selling. We provide practical, step-by-step video courses and onboarding management for Amazon India, Flipkart, and Meesho sellers.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-white hover:bg-forest transition shadow-sm"
            >
              Browse Courses →
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Contact Specialists
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-gray-200 pt-6">
            <div>
              <p className="text-xl font-bold text-forest">10,000+</p>
              <p className="text-xs text-gray-500 mt-0.5">Sellers Guided</p>
            </div>
            <div>
              <p className="text-xl font-bold text-forest">3 Platforms</p>
              <p className="text-xs text-gray-500 mt-0.5">Full Coverage</p>
            </div>
            <div>
              <p className="text-xl font-bold text-forest">4.9 / 5.0</p>
              <p className="text-xs text-gray-500 mt-0.5">Learner Rating</p>
            </div>
          </div>
        </div>

        {/* Right Visual */}
        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-forest/10 shadow-xl bg-forest p-8 text-white">
            <h3 className="text-xl font-bold mb-2">The SkyBirds Promise</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-6">
              Every course and service is built from real store management data, not theoretical fluff.
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 bg-white/10 p-3.5 rounded-xl">
                <CheckCircle className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">100% Practical Action Steps</p>
                  <p className="text-white/70 mt-0.5">Learn by following along inside actual seller central accounts.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 p-3.5 rounded-xl">
                <CheckCircle className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Protected Secure Video Stream</p>
                  <p className="text-white/70 mt-0.5">Your purchased courses stay in your account forever with zero lag.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 p-3.5 rounded-xl">
                <CheckCircle className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Dedicated Seller Support</p>
                  <p className="text-white/70 mt-0.5">Have questions? Our support team responds quickly to all queries.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
