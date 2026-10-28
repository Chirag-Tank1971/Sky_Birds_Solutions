import { useEffect, useState } from "react";
import { fetchSiteContent } from "../api/site";

export default function PrivacyPolicy() {
  const [content, setContent] = useState("Your privacy policy content can be managed from the admin panel.");
  useEffect(() => { fetchSiteContent().then((res) => { if (res.success && res.data?.legal?.privacy) setContent(res.data.legal.privacy); }).catch(() => {}); }, []);
  return <LegalPage title="Privacy Policy" content={content} />;
}

function LegalPage({ title, content }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
      <div className="mt-8 rounded-2xl border border-forest/10 bg-white p-6 shadow-sm sm:p-10">
        {String(content || "").split(/\n\s*\n/).map((paragraph, index) => <p key={index} className="mb-5 whitespace-pre-wrap text-sm leading-7 text-slate-700 last:mb-0">{paragraph}</p>)}
      </div>
    </main>
  );
}
