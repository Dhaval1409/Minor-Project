"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

/* ============ Icons ============ */

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9Z" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z" />
    </svg>
  );
}

function MovieIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z" />
    </svg>
  );
}

/* ============ FadingVideo ============ */

const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55;

function FadingVideo({
  src,
  className,
  style,
}: {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.style.opacity = "0";

    const fadeTo = (target: number, duration: number) => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      const start = parseFloat(video.style.opacity) || 0;
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = start + (target - start) * progress;
        video.style.opacity = String(value);
        if (progress < 1) {
          rafIdRef.current = requestAnimationFrame(step);
        } else {
          rafIdRef.current = null;
        }
      };
      rafIdRef.current = requestAnimationFrame(step);
    };

    const handleLoadedData = () => {
      video.style.opacity = "0";
      video.play().catch(() => {});
      fadeTo(1, FADE_MS);
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const remaining = video.duration - video.currentTime;
      if (!fadingOutRef.current && remaining <= FADE_OUT_LEAD && remaining > 0) {
        fadingOutRef.current = true;
        fadeTo(0, FADE_MS);
      }
    };

    const handleEnded = () => {
      video.style.opacity = "0";
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
        fadingOutRef.current = false;
        fadeTo(1, FADE_MS);
      }, 100);
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      playsInline
      preload="auto"
      className={className}
      style={{ opacity: 0, ...style }}
    />
  );
}

/* ============ BlurText ============ */

function BlurText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");
  const stepDuration = 0.35;

  return (
    <p
      ref={ref}
      className={className}
      style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", rowGap: "0.1em" }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
          animate={
            visible
              ? {
                  filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
                  opacity: [0, 0.5, 1],
                  y: [50, -5, 0],
                }
              : {}
          }
          transition={{
            duration: stepDuration * 2,
            times: [0, 0.5, 1],
            ease: "easeOut",
            delay: (i * 100) / 1000,
          }}
          style={{ display: "inline-block", marginRight: "0.28em" }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}

/* ============ Navbar ============ */

const NAV_LINKS = ["Home", "Voyages", "Worlds", "Innovation", "Plan Launch"];

function Navbar() {
  return (
    <nav className="fixed top-4 left-0 right-0 px-8 lg:px-16 z-50 flex items-center justify-between">
      <div className="w-12 h-12 rounded-full liquid-glass flex items-center justify-center">
        <span className="font-heading italic text-white text-2xl lowercase">a</span>
      </div>

      <div className="hidden md:flex items-center liquid-glass rounded-full px-1.5 py-1.5">
        {NAV_LINKS.map((link) => (
          <a key={link} href="#" className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white transition-colors">
            {link}
          </a>
        ))}
        <button className="ml-1 flex items-center gap-1.5 whitespace-nowrap bg-white text-black rounded-full px-4 py-2 text-sm font-medium font-body hover:bg-white/90 transition-colors">
          Claim a Spot
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="w-12 h-12 invisible" />
    </nav>
  );
}

/* ============ Hero ============ */

const blurUpVariant = {
  hidden: { filter: "blur(10px)", opacity: 0, y: 20 },
  visible: { filter: "blur(0px)", opacity: 1, y: 0 },
};

function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <FadingVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
        className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
        style={{ width: "120%", height: "120%" }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <Navbar />

        <div className="flex-1 flex flex-col items-center justify-center pt-24 px-4 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={blurUpVariant}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
            className="liquid-glass rounded-full flex items-center pr-3 pl-1 py-1 mb-6"
          >
            <span className="bg-white text-black rounded-full px-3 py-1 text-xs font-semibold mr-2">New</span>
            <span className="text-sm text-white/90 font-body">Maiden Crewed Voyage to Mars Arrives 2026</span>
          </motion.div>

          <BlurText
            text="Venture Past Our Sky Across the Universe"
            className="font-heading italic text-white text-6xl md:text-7xl lg:text-[5.5rem] leading-[0.8] max-w-2xl tracking-[-4px]"
          />

          <motion.p
            initial="hidden"
            animate="visible"
            variants={blurUpVariant}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.8 }}
            className="mt-4 text-sm md:text-base text-white max-w-2xl font-body font-light leading-tight"
          >
            Discover the universe in ways once unimaginable. Our pioneering vessels and breakthrough engineering bring deep-space exploration within reach—secure and extraordinary.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={blurUpVariant}
            transition={{ duration: 0.7, ease: "easeOut", delay: 1.1 }}
            className="flex items-center gap-6 mt-6"
          >
            <button className="liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white flex items-center gap-2">
              Start Your Voyage
              <ArrowUpRight className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-white font-body">
              View Liftoff
              <PlayIcon className="h-4 w-4" />
            </button>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={blurUpVariant}
            transition={{ duration: 0.7, ease: "easeOut", delay: 1.3 }}
            className="flex items-stretch gap-4 mt-8"
          >
            <div className="liquid-glass p-5 w-[220px] rounded-[1.25rem] flex flex-col">
              <ClockIcon className="h-7 w-7 text-white" />
              <span className="font-heading italic text-white text-4xl tracking-[-1px] leading-none mt-3">34.5 Min</span>
              <span className="text-xs text-white font-body font-light mt-2">Average Videos Watch Time</span>
            </div>
            <div className="liquid-glass p-5 w-[220px] rounded-[1.25rem] flex flex-col">
              <GlobeIcon className="h-7 w-7 text-white" />
              <span className="font-heading italic text-white text-4xl tracking-[-1px] leading-none mt-3">2.8B+</span>
              <span className="text-xs text-white font-body font-light mt-2">Users Across the Globe</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={blurUpVariant}
          transition={{ duration: 0.7, ease: "easeOut", delay: 1.4 }}
          className="flex flex-col items-center gap-4 pb-8"
        >
          <span className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white">
            Collaborating with top aerospace pioneers globally
          </span>
          <div className="flex items-center gap-12 md:gap-16">
            {["Aeon", "Vela", "Apex", "Orbit", "Zeno"].map((name) => (
              <span key={name} className="font-heading italic text-white text-2xl md:text-3xl tracking-tight">
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ Capabilities ============ */

const CARDS = [
  {
    Icon: ImageIcon,
    title: "AI Scenery",
    tags: ["Natural Context", "Photo Realism", "Infinite Settings", "Eco-Vibe"],
    body: "AI analyzes your product to create indistinguishable natural environments — from Icelandic cliffs to misty forests.",
  },
  {
    Icon: MovieIcon,
    title: "Batch Production",
    tags: ["Scale Fast", "Visual Consistency", "Time Saver", "Ready to Post"],
    body: "Style your entire product line in minutes. Create a unified visual identity for catalogues and social media without weeks of retouching.",
  },
  {
    Icon: LightbulbIcon,
    title: "Smart Lighting",
    tags: ["Ray Tracing", "Physical Shadows", "Studio Quality", "Sunlight Sync"],
    body: "Automatic lighting and material adjustment. Achieve flawless integration with realistic shadows and sunlight.",
  },
];

function Capabilities() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-black">
      <FadingVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen">
        <div className="mb-auto">
          <div className="text-sm font-body text-white/80 mb-6">// Capabilities</div>
          <h2 className="font-heading italic text-white text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px]">
            Production
            <br />
            evolved
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {CARDS.map((card) => {
            const Icon = card.Icon;
            return (
              <div key={card.title} className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-11 h-11 liquid-glass rounded-[0.75rem] flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                    {card.tags.map((tag) => (
                      <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-1" />

                <div className="mt-6">
                  <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                    {card.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============ Page ============ */

export default function Page() {
  return (
    <>
      <Hero />
      <Capabilities />
    </>
  );
}