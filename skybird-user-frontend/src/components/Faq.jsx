import { useState } from "react";

const faqs = [
  {
    question: "How can I reset my password?",
    answer:
      "Go to the login page and click 'Forgot password'. Enter your registered email address and follow the instructions sent to your inbox to create a new password.",
  },
  {
    question: "How do I update my billing information?",
    answer:
      "Navigate to Account Settings → Billing. From there you can update your payment method, billing address, and view past invoices.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "You can reach our support team 24/7 via the Help Center chat, by emailing support@skybird.com, or by submitting a ticket from your account dashboard.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "Go to Account Settings → Privacy & Security → Delete Account. Confirm your password and follow the on-screen steps. Note that this action is permanent and cannot be undone.",
  },
  {
    question: "How do I list an item for sale?",
    answer:
      "Click the 'Sell' button in the top navigation, fill in the product details, upload high-quality photos, set your price and shipping options, then publish your listing.",
  },
  {
    question: "What are the seller fees on Skybird?",
    answer:
      "Skybird charges a 5% commission on successful sales plus a small payment processing fee. There are no listing fees or monthly subscriptions for basic sellers.",
  },
  {
    question: "How does shipping work?",
    answer:
      "Sellers can choose their preferred shipping method. Buyers see estimated delivery times at checkout. Tracking numbers are automatically shared once the order is shipped.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Go to My Orders, select the order, and click 'Track Package'. You will see real-time updates from the carrier once a tracking number is available.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-semibold text-center text-gray-900 mb-10">
        Frequently asked questions
      </h2>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className={`rounded-xl border  transition-all duration-200 ${
                isOpen
                  ? "border-indigo-300 bg-indigo-50 cursor-pointer"
                  : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
              >
                <span
                  className={`font-medium ${
                    isOpen ? "text-[#3C7D33]" : "text-gray-800"
                  }`}
                >
                  {faq.question}
                </span>
                <span
                  className={`text-xl font-light ${
                    isOpen ? "text-indigo-600" : "text-gray-400"
                  }`}
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
