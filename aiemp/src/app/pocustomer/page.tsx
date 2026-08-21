'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  Heart,
  Star,
  MapPin,
  X,
  Sparkles,
  Scissors,
  Dumbbell,
  Flower2,
  UtensilsCrossed,
  Coffee,
  Stethoscope,
  Palette,
  ArrowRight,
  BadgeCheck,
  ShieldCheck,
  Users,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Dummy data — swap for API/DB later, shape is already API-ready    */
/* ------------------------------------------------------------------ */

type Business = {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string;
  owner: string;
  description: string;
  rating: number;
  reviewCount: number;
  services: string[];
  image: string;
  galleryImages: string[];
  logo: string;
  featured: boolean;
  verified: boolean;
  createdAt?: string;
};

const CATEGORIES = [
  { key: 'All', label: 'All', icon: Sparkles },
  { key: 'Salon', label: 'Salon', icon: Sparkles },
  { key: 'Barber', label: 'Barber', icon: Scissors },
  { key: 'Gym', label: 'Gym', icon: Dumbbell },
  { key: 'Spa', label: 'Spa', icon: Flower2 },
  { key: 'Restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { key: 'Cafe', label: 'Cafe', icon: Coffee },
  { key: 'Clinic', label: 'Clinic', icon: Stethoscope },
  { key: 'Studio', label: 'Studio', icon: Palette },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  Salon: 'Salon & Beauty',
  Barber: 'Barber Shop',
  Gym: 'Gym & Fitness',
  Spa: 'Spa & Wellness',
  Restaurant: 'Restaurant',
  Cafe: 'Café',
  Clinic: 'Clinic',
  Studio: 'Studio',
};

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;
const logo = (name: string, bg: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=128`;

function mapApiBusiness(raw: any): Business {
  const activeServiceNames = Array.isArray(raw.services)
    ? raw.services.filter((s: any) => s?.active !== false).map((s: any) => s.name).filter(Boolean)
    : [];
  const legacyServiceNames = Array.isArray(raw.servicesProvided) ? raw.servicesProvided : [];

  // The business's gallery photos (uploaded via /upload-gallery), used to
  // power the card's cover image — NOT the owner's personal profile photo.
  const galleryImages: string[] = Array.isArray(raw.galleryImages) ? raw.galleryImages : [];

  return {
    id: String(raw._id ?? raw.id ?? ''),
    name: raw.name || 'Unnamed Business',
    slug: raw.slug || '',
    category: raw.businessType || 'Studio',
    location: raw.city || 'Location not set yet',
    owner: raw.ownerName || '',
    description: raw.description || '',
    rating: typeof raw.rating === 'number' ? raw.rating : 0,
    reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 0,
    services: activeServiceNames.length ? activeServiceNames : legacyServiceNames,
    // Card cover = first gallery photo. Falls back to '' (→ "No photo yet"
    // placeholder) if the owner hasn't uploaded any gallery photos.
    image: galleryImages[0] || '',
    galleryImages,
    // Small round avatar = the owner's actual uploaded profile photo
    // (business.image). Falls back to initials only if none was uploaded.
    logo: raw.image || logo(raw.name || 'Business', 'C24A3B'),
    featured: !!raw.featured,
    verified: !!raw.verified,
    createdAt: raw.createdAt,
  };
}

const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  Salon: Sparkles, Barber: Scissors, Gym: Dumbbell, Spa: Flower2,
  Restaurant: UtensilsCrossed, Cafe: Coffee, Clinic: Stethoscope, Studio: Palette,
};

/* ------------------------------------------------------------------ */
/*  Scroll-reveal hook — small, dependency-free                       */
/* ------------------------------------------------------------------ */

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                             */
/* ------------------------------------------------------------------ */

function RatingBadge({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1.5 text-[13.5px]">
      <span className="flex items-center gap-1 font-semibold text-ink">
        <Star className="w-3.5 h-3.5 fill-amber text-amber" />
        {rating.toFixed(1)}
      </span>
      <span className="text-text-on-paper-dim">{reviewCount} reviews</span>
    </div>
  );
}

function BusinessCard({ business, index }: { business: Business; index: number }) {
  const [fav, setFav] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const CatIcon = CATEGORY_ICONS[business.category] ?? Sparkles;

  return (
    <div
      className="group card-enter bg-card rounded-3xl border border-ink/10 overflow-hidden shadow-sm
        motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out
        hover:shadow-xl hover:-translate-y-1.5 hover:border-emerald/30"
      style={{ animationDelay: `${Math.min(index, 7) * 70}ms` }}
    >
      {/* Cover */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-paper-dim">
        {business.image ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 shimmer" />}
            <img
              src={business.image}
              alt={business.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover motion-safe:transition-all motion-safe:duration-700 ease-out
                group-hover:scale-[1.08] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-text-on-paper-dim">
            <CatIcon className="w-7 h-7" />
            <span className="text-[11px] font-medium">No photo yet</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/5 to-transparent" />

        <div className="absolute top-3 left-3 flex gap-2">
          {business.featured && (
            <span className="px-2.5 py-1 rounded-full bg-ink/90 backdrop-blur-sm text-text-on-ink text-[11px] font-semibold tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={fav ? `Remove ${business.name} from saved` : `Save ${business.name}`}
          aria-pressed={fav}
          onClick={() => setFav((v) => !v)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-paper/90 backdrop-blur-sm flex items-center justify-center
            motion-safe:transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
        >
          <Heart className={`w-4 h-4 motion-safe:transition-colors ${fav ? 'fill-red text-red' : 'text-ink'}`} />
        </button>

        {/* Logo + name */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3.5 flex items-center gap-2.5">
          <img
            src={business.logo}
            alt=""
            className="w-11 h-11 rounded-xl border-2 border-white/80 shadow-md object-cover shrink-0"
          />
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-display font-bold text-[15.5px] text-white leading-tight truncate drop-shadow-sm">
              {business.name}
            </h3>
            {business.verified && (
              <BadgeCheck className="w-4 h-4 text-emerald-300 shrink-0" aria-label="Verified business" />
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center gap-1.5 text-[13.5px] text-text-on-paper-dim mb-1">
          <CatIcon className="w-3.5 h-3.5 shrink-0" />
          {CATEGORY_LABELS[business.category] ?? business.category}
        </div>
        <div className="flex items-center gap-1.5 text-[13.5px] text-text-on-paper-dim mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {business.location}
        </div>

        <div className="mb-3">
          <RatingBadge rating={business.rating} reviewCount={business.reviewCount} />
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {business.services.slice(0, 3).map((s) => (
            <span
              key={s}
              className="px-2.5 py-1 rounded-full bg-paper-dim text-text-on-paper-dim text-[12px] font-medium"
            >
              {s}
            </span>
          ))}
        </div>

        <Link
          href={`/pocustomer/${business.id}`}
          className="flex items-center justify-between text-[14px] font-semibold text-ink group/link rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
        >
          View Profile
          <ArrowRight className="w-4 h-4 motion-safe:transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-3xl border border-ink/10 overflow-hidden">
      <div className="aspect-[4/3] sm:aspect-[16/10] shimmer" />
      <div className="px-5 pt-4 pb-5">
        <div className="h-3 w-1/2 bg-ink/10 rounded mb-2" />
        <div className="h-3 w-1/3 bg-ink/10 rounded mb-4" />
        <div className="flex gap-1.5 mb-4">
          <div className="h-6 w-16 bg-ink/10 rounded-full" />
          <div className="h-6 w-16 bg-ink/10 rounded-full" />
        </div>
        <div className="h-4 w-24 bg-ink/10 rounded" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter drawer                                                     */
/* ------------------------------------------------------------------ */

type Filters = {
  categories: string[];
  location: string;
  minRating: number | null;
  services: string[];
};

const EMPTY_FILTERS: Filters = { categories: [], location: '', minRating: null, services: [] };

function FilterDrawer({
  open,
  onClose,
  filters,
  setFilters,
  allServices,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  allServices: string[];
}) {
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-ink/30 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`fixed z-[70] bg-paper border-ink/10 transition-transform duration-300 ease-out
          bottom-0 left-0 right-0 rounded-t-3xl border-t max-h-[85vh]
          sm:top-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-full sm:w-[380px] sm:rounded-none sm:border-t-0 sm:border-l
          ${open ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'}
          overflow-y-auto`}
      >
        <div className="sticky top-0 bg-paper flex items-center justify-between px-6 py-5 border-b border-ink/10 z-10">
          <h3 className="font-display font-bold text-lg text-ink">Filters</h3>
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-7">
          <div>
            <p className="text-[13px] font-semibold text-ink mb-3">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c.key !== 'All').map((c) => (
                <button
                  key={c.key}
                  onClick={() => setFilters({ ...filters, categories: toggle(filters.categories, c.key) })}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald ${
                    filters.categories.includes(c.key)
                      ? 'bg-ink text-text-on-ink border-ink'
                      : 'border-ink/15 text-text-on-paper-dim hover:border-ink/30'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-ink mb-3">Location</p>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-on-paper-dim" />
              <input
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="City or area"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-ink/15 bg-card text-[14px] outline-none focus:border-ink/40 focus-visible:ring-2 focus-visible:ring-emerald transition-colors"
              />
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-ink mb-3">Rating</p>
            <div className="flex flex-col gap-2">
              {[4.5, 4.0, 3.5].map((r) => (
                <label key={r} className="flex items-center gap-2.5 cursor-pointer text-[14px] text-text-on-paper-dim">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === r}
                    onChange={() => setFilters({ ...filters, minRating: filters.minRating === r ? null : r })}
                    className="accent-emerald w-4 h-4"
                  />
                  {r.toFixed(1)}+ <Star className="w-3.5 h-3.5 fill-amber text-amber" />
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-ink mb-3">Services</p>
            <div className="flex flex-wrap gap-2">
              {allServices.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilters({ ...filters, services: toggle(filters.services, s) })}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald ${
                    filters.services.includes(s)
                      ? 'bg-emerald-soft text-emerald border-emerald'
                      : 'border-ink/15 text-text-on-paper-dim hover:border-ink/30'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-paper border-t border-ink/10 px-6 py-4 flex gap-3 z-10">
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="flex-1 py-2.5 rounded-full border border-ink/15 text-[14px] font-semibold text-ink hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-ink text-text-on-ink text-[14px] font-semibold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

type SortKey = 'Recommended' | 'Highest Rated' | 'Most Popular' | 'Newest';

const HERO_VIDEO_URL = 'https://res.cloudinary.com/xbicmhte/video/upload/v1786634621/a9adb9cc97e373eb1e742f7fcf8bb12f_720w.mp4';
const MOBILE_HERO_VIDEO_URL = 'https://res.cloudinary.com/xbicmhte/video/upload/v1786637614/a6fa91a9bb1e7440cfde97943fcc7cfb_720w.mp4';

export default function PoCustomerPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortKey>('Recommended');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBusinesses() {
      try {
        const res = await fetch(`${API_BASE}/business`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load businesses');
        if (!cancelled) setBusinesses((json.data || []).map(mapApiBusiness));
      } catch {
        if (!cancelled) setLoadError('Could not load businesses right now. Please try again shortly.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBusinesses();
    return () => { cancelled = true; };
  }, [API_BASE]);

  const allServices = useMemo(
    () => Array.from(new Set(businesses.flatMap((b) => b.services))).sort(),
    [businesses]
  );

  const featured = useMemo(() => businesses.filter((b) => b.featured).slice(0, 4), [businesses]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    businesses.forEach((b) => { counts[b.category] = (counts[b.category] ?? 0) + 1; });
    return counts;
  }, [businesses]);

  const filtered = useMemo(() => {
    let list = businesses.filter((b) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.services.some((s) => s.toLowerCase().includes(q));

      const matchesPill = activeCategory === 'All' || b.category === activeCategory;
      const matchesDrawerCategory = filters.categories.length === 0 || filters.categories.includes(b.category);
      const matchesLocation = !filters.location || b.location.toLowerCase().includes(filters.location.toLowerCase());
      const matchesRating = !filters.minRating || b.rating >= filters.minRating;
      const matchesServices = filters.services.length === 0 || filters.services.some((s) => b.services.includes(s));

      return matchesSearch && matchesPill && matchesDrawerCategory && matchesLocation && matchesRating && matchesServices;
    });

    switch (sortBy) {
      case 'Highest Rated': list = [...list].sort((a, b) => b.rating - a.rating); break;
      case 'Most Popular': list = [...list].sort((a, b) => b.reviewCount - a.reviewCount); break;
      case 'Newest': list = [...list].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()); break;
      default: list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }, [businesses, search, activeCategory, filters, sortBy]);

  const activeFilterCount =
    filters.categories.length + filters.services.length + (filters.location ? 1 : 0) + (filters.minRating ? 1 : 0);

  const clearAll = () => { setSearch(''); setActiveCategory('All'); setFilters(EMPTY_FILTERS); };

  return (
    <div className="min-h-screen bg-paper">
      {/* ---------------- Hero (Full Screen with Bottom Search) ---------------- */}
      <section className="relative overflow-hidden bg-ink w-full h-screen min-h-[600px] max-h-[1200px] flex flex-col">
        {/* Background Visuals */}
        {/* Mobile Video */}
        <video
          className="block md:hidden absolute inset-0 w-full h-full object-cover object-center"
          src={MOBILE_HERO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Desktop Video */}
        <video
          className="hidden md:block absolute inset-0 w-full h-full object-cover object-center"
          src={HERO_VIDEO_URL}
          poster="/pocustomer-hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Scrims - Left Gradient for text readability + Bottom fade for smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-paper via-paper/80 to-transparent" />

        {/* Content Wrapper - Flex Column forcing search to the bottom */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between px-5 sm:px-8 md:px-16 lg:px-24 pt-10 pb-8 sm:pb-12">
          
          {/* TOP SECTION: Navigation & Text */}
          <div className="max-w-2xl mt-12 sm:mt-24 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-5">
              <Link
                href="/"
                aria-label="Back to home page"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-[13px] font-semibold transition-all hover:bg-white/20 hover:scale-[1.02] active:scale-95 shadow-lg shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm text-emerald-300 text-[12.5px] font-semibold border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Business Discovery
              </span>
            </div>

            <h1 className="font-display font-bold text-[34px] sm:text-[48px] lg:text-[56px] leading-[1.1] text-white drop-shadow-md">
              Discover Businesses Powered by Us
            </h1>
            <p className="text-[15px] sm:text-[17px] text-white/80 leading-relaxed mt-4 max-w-[520px]">
              Explore amazing local businesses, discover their services, and connect with
              businesses that use our platform to serve their customers better.
            </p>
          </div>

          {/* BOTTOM SECTION: Search Bar & Categories */}
          <div className="w-full max-w-4xl shrink-0">
            {/* Search Input & Filter Button */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search businesses, services, or locations..."
                  aria-label="Search businesses, services, or locations"
                  className="w-full pl-12 pr-4 py-4 rounded-full border-0 bg-white shadow-lg text-[15px] text-ink outline-none focus:ring-4 focus:ring-emerald/20 transition-all placeholder:text-ink/50 font-medium"
                />
              </div>
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg text-[15px] font-semibold text-white transition-all relative"
              >
                <SlidersHorizontal className="w-4.5 h-4.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = activeCategory === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setActiveCategory(c.key)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 shrink-0 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200 border ${
                      active
                        ? 'bg-white text-ink border-white shadow-md scale-105'
                        : 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 hover:border-white/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ---------------- Featured ---------------- */}
      <section className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-4 relative z-20">
        <Reveal className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display font-bold text-[22px] sm:text-[30px] text-ink mb-1.5">
              Featured Businesses
            </h2>
            <p className="text-[13.5px] sm:text-[14.5px] text-text-on-paper-dim">
              Discover some of the most popular businesses on our platform.
            </p>
          </div>
          {!loading && (
            <button
              onClick={() => { setActiveCategory('All'); document.getElementById('explore-all')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="hidden sm:flex items-center gap-1.5 text-[13.5px] font-semibold text-ink shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald group/see-all"
            >
              See all
              <ArrowRight className="w-4 h-4 transition-transform group-hover/see-all:translate-x-1" />
            </button>
          )}
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : featured.map((b, i) => <BusinessCard key={b.id} business={b} index={i} />)}
        </div>
      </section>

      {/* ---------------- Explore all / grid ---------------- */}
      <section id="explore-all" className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-14 sm:pt-16 pb-4">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display font-bold text-[22px] sm:text-[30px] text-ink mb-1.5">
              Explore All Businesses
            </h2>
            <p className="text-[13.5px] sm:text-[14.5px] text-text-on-paper-dim">Find businesses and services near you.</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              aria-label="Sort businesses"
              className="px-4 py-2.5 rounded-full border border-ink/12 bg-card text-[13.5px] font-medium text-ink outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald"
            >
              {(['Recommended', 'Highest Rated', 'Most Popular', 'Newest'] as SortKey[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={() => setDrawerOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full border border-ink/12 bg-card text-[13.5px] font-semibold text-ink hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
            </button>
          </div>
        </Reveal>

        {loadError ? (
          <div className="flex flex-col items-center justify-center text-center py-16 sm:py-20 px-4 border border-dashed border-ink/15 rounded-3xl">
            <p className="font-display font-bold text-[18px] text-ink mb-1">Couldn&apos;t load businesses</p>
            <p className="text-[14px] text-text-on-paper-dim">{loadError}</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 sm:py-20 px-4 border border-dashed border-ink/15 rounded-3xl">
            <div className="w-14 h-14 rounded-full bg-paper-dim flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-text-on-paper-dim" />
            </div>
            <p className="font-display font-bold text-[18px] text-ink mb-1">No businesses found</p>
            <p className="text-[14px] text-text-on-paper-dim mb-5">Try adjusting your search or filters.</p>
            <button
              onClick={clearAll}
              className="px-5 py-2.5 rounded-full bg-ink text-text-on-ink text-[14px] font-semibold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filtered.map((b, i) => <BusinessCard key={b.id} business={b} index={i} />)}
          </div>
        )}
      </section>

      {/* ---------------- Category showcase ---------------- */}
      <section className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-16 sm:pt-20 pb-4">
        <Reveal>
          <h2 className="font-display font-bold text-[22px] sm:text-[30px] text-ink mb-6 sm:mb-8">Explore by Category</h2>
        </Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {CATEGORIES.filter((c) => c.key !== 'All').map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.key} className={`transition-delay-[${i * 60}ms]`}>
                <button
                  onClick={() => { setActiveCategory(c.key); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full group flex flex-col items-center justify-center gap-3 py-6 sm:py-8 px-4 rounded-3xl border border-ink/10 bg-card motion-safe:transition-all duration-300 hover:border-emerald/40 hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-soft flex items-center justify-center motion-safe:transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <Icon className="w-5.5 h-5.5 text-emerald" />
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-[14.5px] text-ink">{CATEGORY_LABELS[c.key] ?? c.label}</p>
                    <p className="text-[12.5px] text-text-on-paper-dim">{categoryCounts[c.key] ?? 0} businesses</p>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------------- Trust section ---------------- */}
      <section className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-16 sm:pt-20 pb-4">
        <Reveal>
          <h2 className="font-display font-bold text-[22px] sm:text-[30px] text-ink mb-6 sm:mb-8">Built for Modern Businesses</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            { icon: BadgeCheck, title: 'Professional Profile', desc: 'Create a beautiful online presence for your business.' },
            { icon: Users, title: 'Reach More Customers', desc: 'Help new customers discover your business.' },
            { icon: ShieldCheck, title: 'Manage Your Services', desc: 'Showcase services, pricing, availability, and more.' },
            { icon: TrendingUp, title: 'Grow Your Business', desc: 'Use our platform to build stronger customer relationships.' },
          ].map((f) => (
            <Reveal key={f.title}>
              <div className="h-full p-6 rounded-3xl border border-ink/10 bg-card motion-safe:transition-all duration-300 hover:border-amber/40 hover:shadow-lg hover:-translate-y-1">
                <div className="w-10 h-10 rounded-xl bg-amber-soft flex items-center justify-center mb-4 motion-safe:transition-transform duration-300 group-hover:scale-110">
                  <f.icon className="w-5 h-5 text-amber" />
                </div>
                <p className="font-display font-bold text-[15px] text-ink mb-1.5">{f.title}</p>
                <p className="text-[13.5px] text-text-on-paper-dim leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="max-w-[1180px] mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <Reveal className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-ink px-6 py-14 sm:px-16 sm:py-20 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald/20 via-transparent to-amber/10 pointer-events-none motion-safe:animate-[pulseGlow_6s_ease-in-out_infinite]" />
          <div className="relative max-w-xl mx-auto">
            <h2 className="font-display font-bold text-[24px] sm:text-[36px] text-text-on-ink mb-4">
              Your Business Could Be Here
            </h2>
            <p className="text-[14px] sm:text-[16px] text-text-on-ink-dim leading-relaxed mb-8">
              Create your business profile, showcase your services, and give your customers
              a better way to discover and connect with you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/onboarding"
                className="px-6 py-3.5 rounded-full bg-emerald text-white text-[14.5px] font-semibold hover:opacity-90 hover:scale-[1.03] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Create Your Business
              </Link>
              <Link
                href="/#responsibilities"
                className="px-6 py-3.5 rounded-full border border-white/20 text-text-on-ink text-[14.5px] font-semibold hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Learn More
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        allServices={allServices}
      />

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .card-enter {
          animation: fadeInUp 0.55s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .card-enter { animation: none; }
        }
        .shimmer {
          background: linear-gradient(
            90deg,
            var(--color-paper-dim, #eee) 0%,
            rgba(255, 255, 255, 0.6) 50%,
            var(--color-paper-dim, #eee) 100%
          );
          background-size: 800px 100%;
          animation: shimmer 1.4s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}