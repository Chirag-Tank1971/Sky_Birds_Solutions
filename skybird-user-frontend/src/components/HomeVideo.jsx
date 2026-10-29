"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function HomeVideo({
  src = "/assets/Mod_1_Part_1_Enhanced.mp4",
  poster = "/assets/video-poster.webp",
}) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Load and play the large video only while its section is near the viewport.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      setIsVideoVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVideoVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: "160px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    if (!isVideoVisible) {
      video.pause();
      return undefined;
    }

    video.muted = true;
    video.play().catch(() => {});
    return () => video.pause();
  }, [isVideoVisible, src]);

  // Prevent right click
  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  // Prevent Ctrl/Cmd + S
  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && ["s", "S"].includes(event.key)) {
      event.preventDefault();
    }
  };

  // Scroll-triggered entrances (play once, when 15% of the element is visible).
  const reveal = (x, delay = 0) => ({
    initial: { opacity: 0, x },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { type: "spring", bounce: 0, duration: 0.9, delay },
  });

  const audiences = [
    "Who want to explore e-commerce",
    "Students interested in digital business",
    "Entrepreneurs planning to start an online store",
    "Existing sellers who want to improve their knowledge",
    "Professionals seeking new digital skills",
    "Business owners interested in expanding online",
  ];

  return (
    <section
      ref={sectionRef}
      className="home-video-section relative overflow-hidden bg-gray-50 py-16 sm:py-20 lg:py-16"
    >
      {/* Background Decorations */}
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#dff3fb] opacity-60 blur-3xl" />

      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#eaf7ed] opacity-60 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* =====================================================
      FULL WIDTH HEADING
  ====================================================== */}
        <motion.div {...reveal(45, 0.15)} className="mx-auto max-w-5xl text-center">
          {/* Small Label */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#63b5d3]" />

            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4fa8c9]">
              Learn With Purpose
            </span>

            <span className="h-px w-8 bg-[#63b5d3]" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-gray-900 sm:text-4xl lg:text-[46px]">
            Build Skills with Our{" "}
            <span className="relative inline-block text-[#4fa8c9]">
              E-Commerce Courses
              <span className="absolute -bottom-1 left-0 -z-10 h-2 w-full rounded-full bg-[#d9f1fa]" />
            </span>
          </h2>

          {/* Paragraph */}
          <p className="mx-auto mt-6 max-w-4xl text-base leading-7 text-gray-600 sm:text-[17px]">
            The right training, when chosen, can make your journey of learning
            organized and productive. Our main purpose is to offer some of the
            best e-commerce courses for learners who prefer practical rather
            than theoretical knowledge.
          </p>
        </motion.div>

        {/* =====================================================
      AUDIENCE + VIDEO
  ====================================================== */}
        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* =====================================================
        LEFT — AUDIENCE
    ====================================================== */}
          <motion.div {...reveal(45, 0.15)}>
            {/* Highlight Box */}
            <div className="rounded-2xl border border-[#e4eef2] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e9f7fc]">
                  <Sparkles size={18} className="text-[#4fa8c9]" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Our training is useful for those:
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Who want to learn e-commerce through practical, step-by-step
                    guidance.
                  </p>
                </div>
              </div>
            </div>

            {/* Audience Points */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {audiences.map((item, index) => (
                <motion.div
                  key={item}
                  {...reveal(20, 0.25 + index * 0.1)}
                  className="flex items-start gap-3 rounded-xl px-4 py-2 transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#cce8f2] hover:shadow-md"
                >
                  <CheckCircle2
                    size={18}
                    strokeWidth={2.2}
                    className="mt-0.5 shrink-0 text-[#62b5d3]"
                  />

                  <span className="text-sm font-medium leading-5 text-gray-700">
                    {item}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* =====================================================
        RIGHT — VIDEO
    ====================================================== */}
          <motion.div {...reveal(-45)} className="relative">
            {/* Top Floating Badge */}
            <div className="absolute -top-5 left-5 z-20 hidden items-center gap-2 rounded-full border border-white bg-white/95 px-4 py-2 shadow-lg backdrop-blur sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f7fc]">
                <Sparkles size={14} className="text-[#4fa8c9]" />
              </span>

              <span className="text-xs font-bold text-gray-700">
                Learn • Practice • Grow
              </span>
            </div>

            {/* Glow Behind Video */}
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-[#dff3fb] via-white to-[#eaf7ed] opacity-70 blur-2xl" />

            {/* Video Card */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-2 shadow-[0_25px_70px_rgba(0,0,0,0.10)] sm:p-3">
              <div
                className="relative overflow-hidden rounded-[1.5rem]"
                onContextMenu={handleContextMenu}
                onKeyDown={handleKeyDown}
              >
                <video
                  ref={videoRef}
                  src={isVideoVisible ? src : undefined}
                  poster={isVideoVisible ? poster : undefined}
                  autoPlay={isVideoVisible}
                  muted={isMuted}
                  loop
                  playsInline
                  preload={isVideoVisible ? "metadata" : "none"}
                  controls={false}
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  disableRemotePlayback
                  className="block aspect-video h-full w-full select-none object-cover"
                  onContextMenu={handleContextMenu}
                />
                
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !isMuted;
                    setIsMuted(nextMuted);

                    if (videoRef.current) {
                      videoRef.current.muted = nextMuted;
                    }
                  }}
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                  className="absolute bottom-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                {/* Transparent Protection Layer */}
                <div
                  className="absolute inset-0 z-10"
                  onContextMenu={handleContextMenu}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Bottom Floating Card */}
            {/* <div className="absolute -bottom-6 right-4 z-20 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:right-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Learning Approach
              </p>

              <p className="mt-1 text-sm font-bold text-gray-800">
                Practical & Result-Focused
              </p>
            </div> */}
          </motion.div>
        </div>
      </div>

    </section>
  );
}
