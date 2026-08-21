'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import {
  Star,
  MapPin,
  Heart,
  Share2,
  BadgeCheck,
  ArrowLeft,
  Phone,
  Mail,
  Clock,
  Sparkles,
  Scissors,
  Dumbbell,
  Flower2,
  UtensilsCrossed,
  Coffee,
  Stethoscope,
  Palette,
  CheckCircle2,
  Send,
  Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Point this at your Aria backend. Set NEXT_PUBLIC_API_URL in       */
/*  .env.local (frontend) e.g. http://localhost:5000                  */
/* ------------------------------------------------------------------ */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

/* ------------------------------------------------------------------ */
/*  Shape returned by GET /business/:id — mirrors businessModel.ts    */
/* ------------------------------------------------------------------ */

type ServiceItem = {
  id: string;
  name: string;
  price: number;
  duration?: string;
  active: boolean;
};

type Business = {
  _id: string;
  name: string;
  ownerName?: string;
  businessType: string;
  city?: string;
  hours: { opens: string; closes: string };
  servicesProvided: string[];
  services: ServiceItem[];
  phone?: string;
  galleryImages: string[];
  description?: string;
  contactEmail?: string;
  image?: string;
  logo?: string;
  telegramBotLink?: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  verified: boolean;
};

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

const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  Salon: Sparkles, Barber: Scissors, Gym: Dumbbell, Spa: Flower2,
  Restaurant: UtensilsCrossed, Cafe: Coffee, Clinic: Stethoscope, Studio: Palette,
};

const fallbackImg = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;
const fallbackLogo = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C24A3B&color=fff&bold=true&size=128`;

/* ------------------------------------------------------------------ */
/*  Small building blocks                                             */
/* ------------------------------------------------------------------ */

function RatingBadge({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1.5 text-[14px]">
      <span className="flex items-center gap-1 font-semibold text-ink">
        <Star className="w-4 h-4 fill-amber text-amber" />
        {rating.toFixed(1)}
      </span>
      <span className="text-text-on-paper-dim">({reviewCount} reviews)</span>
    </div>
  );
}

export default function BusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  const [fav, setFav] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function fetchBusiness() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/business/${id}`);

        if (res.status === 404) {
          if (!cancelled) setNotFoundFlag(true);
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to load business (${res.status})`);
        }

        const data = await res.json();
        // Adjust this line if your controller wraps the doc, e.g. data.business
        const doc: Business = data.business ?? data.data ?? data;

        if (!cancelled) setBusiness(doc);
      } catch (err) {
        console.error('Failed to fetch business:', err);
        if (!cancelled) setNotFoundFlag(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBusiness();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (notFoundFlag) {
    notFound();
  }

  if (loading || !business) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald" />
      </div>
    );
  }

  const CatIcon = CATEGORY_ICONS[business.businessType] ?? Sparkles;

  // Gallery photos (uploaded via /upload-gallery) power the hero/cover
  // image and thumbnail strip — NOT the owner's personal profile photo.
  const galleryImages =
    business.galleryImages && business.galleryImages.length > 0
      ? business.galleryImages
      : [];

  const heroImage = galleryImages[0] || fallbackImg(business._id);

  // The small round logo next to the business name = the owner's actual
  // uploaded profile photo (business.image), not the unused `logo` field.
  const logoImage = business.image || fallbackLogo(business.name);

  const gallery =
    galleryImages.length > 0
      ? galleryImages
      : [heroImage, fallbackImg(`${business._id}-2`), fallbackImg(`${business._id}-3`)];

  const phone = business.phone || '';
  const email = business.contactEmail || '';

  const serviceNames =
    business.services?.length > 0
      ? business.services.filter((s) => s.active).map((s) => s.name)
      : business.servicesProvided ?? [];

  const hoursRows = [
    { day: 'Every day', time: `${business.hours?.opens ?? '—'} – ${business.hours?.closes ?? '—'}` },
  ];

  return (
    <div className="min-h-screen bg-paper">
      {/* ---------------- Top bar ---------------- */}
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-6">
        <Link
          href="/pocustomer"
          className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-text-on-paper-dim hover:text-ink transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to businesses
        </Link>
      </div>

      {/* ---------------- Gallery / hero ---------------- */}
      <section className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-4">
        <div className="relative rounded-3xl overflow-hidden bg-paper-dim aspect-[16/9] sm:aspect-[21/9]">
          <img
            src={gallery[activeImage]}
            alt={business.name}
            className="w-full h-full object-cover motion-safe:transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-transparent" />

          {business.featured && (
            <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-ink/90 backdrop-blur-sm text-text-on-ink text-[11px] font-semibold tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}

          <div className="absolute top-4 right-4 flex gap-2">
            <button
              type="button"
              aria-label={fav ? `Remove ${business.name} from saved` : `Save ${business.name}`}
              aria-pressed={fav}
              onClick={() => setFav((v) => !v)}
              className="w-10 h-10 rounded-full bg-paper/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 active:scale-95 motion-safe:transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
            >
              <Heart className={`w-4.5 h-4.5 ${fav ? 'fill-red text-red' : 'text-ink'}`} />
            </button>
            <button
              type="button"
              aria-label="Share business"
              className="w-10 h-10 rounded-full bg-paper/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 active:scale-95 motion-safe:transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
            >
              <Share2 className="w-4 h-4 text-ink" />
            </button>
          </div>

          {/* Name/logo overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-8 pb-5 flex items-center gap-3">
            <img
              src={logoImage}
              alt=""
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-white/80 shadow-md object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-[20px] sm:text-[28px] text-white leading-tight truncate drop-shadow-sm">
                  {business.name}
                </h1>
                {business.verified && (
                  <BadgeCheck className="w-5 h-5 text-emerald-300 shrink-0" aria-label="Verified business" />
                )}
              </div>
              <p className="text-white/85 text-[13px] sm:text-[14px]">
                {CATEGORY_LABELS[business.businessType] ?? business.businessType}
              </p>
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-2.5 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActiveImage(i)}
              className={`shrink-0 w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden border-2 motion-safe:transition-colors ${
                activeImage === i ? 'border-emerald' : 'border-transparent'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </section>

      {/* ---------------- Content grid ---------------- */}
      <section className="max-w-[1180px] mx-auto px-5 sm:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Main column */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5">
            <RatingBadge rating={business.rating} reviewCount={business.reviewCount} />
            {business.city && (
              <span className="flex items-center gap-1.5 text-[13.5px] text-text-on-paper-dim">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {business.city}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[13.5px] text-text-on-paper-dim">
              <CatIcon className="w-3.5 h-3.5 shrink-0" />
              {CATEGORY_LABELS[business.businessType] ?? business.businessType}
            </span>
          </div>

          {/* About */}
          <div className="bg-card border border-ink/10 rounded-3xl p-5 sm:p-7 mb-6">
            <h2 className="font-display font-bold text-[18px] sm:text-[20px] text-ink mb-3">About</h2>
            {business.description && (
              <p className="text-[14.5px] text-text-on-paper-dim leading-relaxed mb-4">
                {business.description}
              </p>
            )}
            {business.ownerName && (
              <p className="text-[13.5px] text-text-on-paper-dim">
                Owned &amp; run by <span className="font-semibold text-ink">{business.ownerName}</span>
              </p>
            )}
          </div>

          {/* Services */}
          {serviceNames.length > 0 && (
            <div className="bg-card border border-ink/10 rounded-3xl p-5 sm:p-7 mb-6">
              <h2 className="font-display font-bold text-[18px] sm:text-[20px] text-ink mb-4">Services</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serviceNames.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-paper-dim text-[14px] font-medium text-ink"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hours */}
          <div className="bg-card border border-ink/10 rounded-3xl p-5 sm:p-7">
            <h2 className="font-display font-bold text-[18px] sm:text-[20px] text-ink mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald" />
              Business Hours
            </h2>
            <div className="divide-y divide-ink/10">
              {hoursRows.map((h) => (
                <div key={h.day} className="flex items-center justify-between py-2.5 text-[14px]">
                  <span className="text-text-on-paper-dim">{h.day}</span>
                  <span className="font-semibold text-ink">{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-6 h-fit space-y-5">
          <div className="bg-ink rounded-3xl p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald/20 via-transparent to-amber/10 pointer-events-none" />
            <div className="relative">
              <p className="font-display font-bold text-[17px] text-text-on-ink mb-1.5">Book an Appointment</p>
              <p className="text-[13px] text-text-on-ink-dim leading-relaxed mb-5">
                Chat with {business.name}&apos;s AI assistant on Telegram to check availability and book instantly.
              </p>
              {business.telegramBotLink ? (
                <a
                  href={business.telegramBotLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-emerald text-white text-[14px] font-semibold hover:opacity-90 hover:scale-[1.02] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  <Send className="w-4 h-4" />
                  Book via Telegram
                </a>
              ) : (
                <p className="text-[12.5px] text-text-on-ink-dim/70 italic">
                  Telegram booking not set up yet
                </p>
              )}
            </div>
          </div>

          <div className="bg-card border border-ink/10 rounded-3xl p-6">
            <h3 className="font-display font-bold text-[15.5px] text-ink mb-4">Contact</h3>
            <div className="space-y-3.5 text-[14px]">
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-ink hover:text-emerald motion-safe:transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald">
                  <Phone className="w-4 h-4 text-emerald shrink-0" />
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-3 text-ink hover:text-emerald motion-safe:transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald">
                  <Mail className="w-4 h-4 text-emerald shrink-0" />
                  {email}
                </a>
              )}
              {business.city && (
                <div className="flex items-start gap-3 text-ink">
                  <MapPin className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                  {business.city}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}