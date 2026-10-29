import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchTestimonials } from "../../api/site";

const fallbackTestimonials = [
  {
    id: "local-3",
    name: "Khushboo",
    role: "Sky Birds Learner",
    quote: "The practical lessons made e-commerce easy to understand.",
    videoUrl: "/assets/reviews/review3.mp4",
  },
  {
    id: "local-4",
    name: "Pihu",
    role: "Sky Birds Learner",
    quote: "A clear and helpful course for learning online selling.",
    videoUrl: "/assets/reviews/review4.mp4",
  },
  {
    id: "local-2",
    name: "Dilraj",
    role: "Sky Birds Learner",
    quote: "I learned the basics of marketplace management effectively.",
    videoUrl: "/assets/reviews/review2.mp4",
  },
  {
    id: "local-1",
    name: "Neeraj",
    role: "Sky Birds Learner",
    quote: "Hands-on learning made me more confident in e-commerce.",
    videoUrl: "/assets/reviews/review1.mp4",
  },
];

function TestimonialCard({ item }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.25),
      { threshold: [0, 0.25, 0.5], rootMargin: "120px" },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !item.videoUrl || !isVisible) {
      if (video) {
        video.pause();
        setPlaying(false);
      }
      return undefined;
    }

    let hls;
    let cancelled = false;
    // Browsers block http:// media on an https:// page, so upgrade the link.
    const url = window.location.protocol === "https:"
      ? item.videoUrl.replace(/^http:\/\//i, "https://")
      : item.videoUrl;
    const start = () => {
      if (cancelled) return;
      video.muted = true;
      video.play().then(() => {
        if (!cancelled) setPlaying(true);
      }).catch(() => {
        if (!cancelled) setPlaying(false);
      });
    };

    if (url.endsWith(".m3u8") && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 12,
        maxMaxBufferLength: 24,
        backBufferLength: 10,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, start);
    } else {
      video.src = url;
      video.load();
      video.addEventListener("loadedmetadata", start, { once: true });
      // Some browsers can play before metadata is emitted.
      start();
    }

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
      setPlaying(false);
    };
  }, [item.videoUrl, isVisible]);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <article
      ref={cardRef}
      className="group relative h-[480px] w-[280px] shrink-0 overflow-hidden rounded-[22px] bg-black shadow-xl sm:h-[520px] sm:w-[300px]"
      onContextMenu={(event) => event.preventDefault()}
    >
      <video
        ref={videoRef}
        poster={item.poster || undefined}
        muted
        loop
        playsInline
        preload="none"
        controls={false}
        controlsList="nodownload noplaybackrate nofullscreen"
        disablePictureInPicture
        disableRemotePlayback
        className="absolute inset-0 h-full w-full select-none object-cover"
        onContextMenu={(event) => event.preventDefault()}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/85" />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Turn sound on" : "Mute video"}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause video" : "Play video"}
        className="absolute left-1/2 top-1/2 z-20 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-forest opacity-0 shadow-xl backdrop-blur transition-all duration-300 group-hover:opacity-100 hover:scale-110"
      >
        {playing ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 sm:text-xs">
          Student Testimonial
        </p>
        <p className="mt-2 text-base font-bold leading-6 text-white sm:text-lg">
          “{item.quote}”
        </p>
        <div className="mt-4">
          <p className="text-sm font-bold text-white">{item.name}</p>
          <p className="mt-0.5 text-xs text-white/65">{item.role}</p>
        </div>
      </div>
    </article>
  );
}

export default function TestimonialVideos() {
  const scrollRef = useRef(null);
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    let cancelled = false;
    fetchTestimonials()
      .then((res) => {
        if (
          !cancelled &&
          res.success &&
          Array.isArray(res.data) &&
          res.data.length
        )
          setTestimonials(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -330 : 330,
      behavior: "smooth",
    });
  };

  return (
    <section className="overflow-hidden bg-ink py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-leaf">
            Student Stories
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Real Sellers.<span className="text-leaf"> Real Stories.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
            Hear directly from learners and sellers about their experience with
            Sky Birds Solution.
          </p>
        </div>

        <div className="mt-8 hidden justify-end gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white transition hover:border-leaf hover:bg-leaf"
            aria-label="Previous testimonials"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white transition hover:border-leaf hover:bg-leaf"
            aria-label="Next testimonials"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="mt-6 flex gap-4 overflow-x-auto scroll-smooth pb-5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-4 sm:justify-center sm:overflow-visible"
        >
          {testimonials.map((item) => (
            <div key={item.id} className="snap-center">
              <TestimonialCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
