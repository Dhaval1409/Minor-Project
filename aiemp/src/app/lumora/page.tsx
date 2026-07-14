"use client"
import { useState, useRef, useCallback } from "react";
import { Menu, X } from "lucide-react";

const VIDEOS = [
  {
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4",
    label: "Golden Hour",
  },
  {
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_092026_dd05b805-ea0f-40b2-8c52-332b88502592.mp4",
    label: "Still Water",
  },
  {
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081042_df7202bf-bd80-4b2b-bbc6-1f09ba2870e9.mp4",
    label: "Deep Woods",
  },
  {
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_080959_4cac5234-3573-464e-a5b7-76b94b8a7d61.mp4",
    label: "Quiet Dawn",
  },
];

const NAV_LINKS = ["How It Works", "Features", "Pricing", "Community"];

const TRANSITION_MS = 1000;
const DARK_VIDEO_INDEX = 2; // "Deep Woods"

export default function App() {
  const [activeVideo, setActiveVideo] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const cooldownRef = useRef<number | null>(null);

  const isDark = activeVideo === DARK_VIDEO_INDEX;

  const handleSwitch = useCallback(
    (index: number) => {
      if (index === activeVideo || isTransitioning) return;
      setActiveVideo(index);
      setIsTransitioning(true);
      if (cooldownRef.current) window.clearTimeout(cooldownRef.current);
      cooldownRef.current = window.setTimeout(() => {
        setIsTransitioning(false);
      }, TRANSITION_MS);
    },
    [activeVideo, isTransitioning]
  );

  const heroTextColor = isDark ? "text-[#182C41]" : "text-white";
  const heroSubColor = isDark ? "text-[#182C41]/70" : "text-white/75";

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background video layer */}
      <div className="absolute inset-0 z-0">
        {VIDEOS.map((video, i) => (
          <video
            key={video.url}
            src={video.url}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === activeVideo ? 1 : 0 }}
          />
        ))}
      </div>

      {/* Transparent PNG overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none bg-cover bg-center train-bob"
        style={{
          backgroundImage:
            "url(https://soft-zoom-63098134.figma.site/_assets/v11/0b4a435b2df2747593c43d7a1c9b4578f7d8d90c.png)",
        }}
      />

      {/* Content layer */}
      <div className="relative z-[2] flex flex-col h-full px-4 sm:px-8 md:px-12">
        {/* Navigation */}
        <nav className="flex items-center justify-between pt-6 sm:pt-8">
          <span
            className="text-white text-xl sm:text-2xl italic"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Lumora
          </span>

          {/* Desktop nav */}
          <div
            className="hidden md:flex items-center gap-1 liquid-glass rounded-full px-2 py-2"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="px-4 py-2 text-sm text-white/90 hover:text-white transition-colors rounded-full"
              >
                {link}
              </a>
            ))}
            <button className="ml-1 px-5 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-white/90 transition-colors">
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden liquid-glass rounded-full p-2.5 relative w-11 h-11 flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <Menu
              size={20}
              className="absolute text-white transition-all duration-300 ease-in-out"
              style={{
                opacity: menuOpen ? 0 : 1,
                transform: menuOpen
                  ? "rotate(90deg) scale(0.75)"
                  : "rotate(0deg) scale(1)",
              }}
            />
            <X
              size={20}
              className="absolute text-white transition-all duration-300 ease-in-out"
              style={{
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen
                  ? "rotate(0deg) scale(1)"
                  : "rotate(-90deg) scale(0.75)",
              }}
            />
          </button>
        </nav>

        {/* Mobile menu overlay */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <div className="flex flex-col items-center gap-8">
              {NAV_LINKS.map((link, i) => (
                <a
                  key={link}
                  href="#"
                  onClick={() => setMenuOpen(false)}
                  className="text-white text-3xl transition-all"
                  style={{
                    transitionDuration: "500ms",
                    transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
                    transitionDelay: `${100 + i * 50}ms`,
                    transform: menuOpen ? "translateY(0)" : "translateY(1rem)",
                    opacity: menuOpen ? 1 : 0,
                  }}
                >
                  {link}
                </a>
              ))}
              <button
                onClick={() => setMenuOpen(false)}
                className="mt-4 px-8 py-3 bg-white text-black rounded-full font-medium transition-transform duration-500"
                style={{
                  transitionDelay: "300ms",
                  transform: menuOpen ? "scale(1)" : "scale(0.9)",
                  opacity: menuOpen ? 1 : 0,
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        )}

        {/* Hero content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div
            className={`liquid-glass rounded-full px-4 py-2 text-xs sm:text-sm transition-colors duration-700 ${heroTextColor}`}
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Over 10,000 minds already finding their clarity
          </div>

          <h1
            className={`text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.1] max-w-4xl transition-colors duration-700 ${heroTextColor}`}
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Clarity in an Endlessly
            <br />
            Noisy Universe
          </h1>

          <p
            className={`max-w-xl leading-relaxed transition-colors duration-700 ${heroSubColor}`}
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Rise above the chaos of pings, infinite scrolling, and relentless
            demands. Discover how to protect your presence and create with
            intention.
          </p>

          <div className="liquid-glass rounded-full p-1.5 flex items-center gap-1 w-full max-w-[320px] sm:max-w-sm">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Best Email"
              className={`flex-1 bg-transparent outline-none px-4 py-2 text-sm placeholder:opacity-60 min-w-0 transition-colors duration-700 ${heroTextColor}`}
              style={{ fontFamily: "system-ui, sans-serif" }}
            />
            <button className="shrink-0 px-4 sm:px-5 py-2.5 text-sm font-medium bg-white text-black rounded-full hover:bg-white/90 transition-colors whitespace-nowrap">
              Get Early Access
            </button>
          </div>

          <div
            className="flex items-center gap-4 sm:gap-6 pt-2"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {VIDEOS.map((video, i) => {
              const active = i === activeVideo;
              return (
                <button
                  key={video.url}
                  onClick={() => handleSwitch(i)}
                  className={`text-xs sm:text-sm pb-1 border-b transition-all duration-500 ${heroTextColor} ${
                    active
                      ? "opacity-100 border-current"
                      : "opacity-50 border-transparent hover:opacity-80"
                  }`}
                >
                  {video.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom stats */}
        <div
          className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 pb-6 sm:pb-8 text-white/70 text-xs sm:text-sm"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          <span>60+ Deep Sessions</span>
          <span className="hidden sm:inline text-white/30">|</span>
          <span>12,000+ Creators</span>
          <span className="hidden sm:inline text-white/30">|</span>
          <span>4.8 User Satisfaction</span>
          <span className="hidden sm:inline text-white/30">|</span>
          <span>Intentional-First Design</span>
        </div>
      </div>
    </section>
  );
}
