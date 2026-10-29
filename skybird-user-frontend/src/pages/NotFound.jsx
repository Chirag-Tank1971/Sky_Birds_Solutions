import { useEffect } from "react";
import { Link } from "react-router-dom";
import RollText from "../components/RollText";
import Shine from "../components/Shine";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found | Sky Birds Solution";
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest">404</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">Page not found</h1>
      <p className="mt-3 text-ink/70">
        The page you're looking for doesn't exist or has moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="relative overflow-hidden rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest"
        >
          <Shine />
          <RollText>Go to home</RollText>
        </Link>
        <Link
          to="/courses"
          className="rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-forest hover:bg-mint"
        >
          <RollText>Browse courses</RollText>
        </Link>
        <Link
          to="/contact"
          className="rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-forest hover:bg-mint"
        >
          <RollText>Contact us</RollText>
        </Link>
      </div>
    </div>
  );
}
