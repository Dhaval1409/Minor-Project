'use client';

import { useMemo, useState } from 'react';
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
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Same shape/dummy data as /pocustomer — swap for a shared API call */
/*  (e.g. GET /api/businesses/:slug) later. Kept self-contained here  */
/*  so nothing in the existing pocustomer/page.tsx needs to change.   */
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
  logo: string;
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

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;
const logo = (name: string, bg: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=128`;

const BUSINESSES: Business[] = [
  {
    id: '1', name: 'Luxe Hair Studio', slug: 'luxe-hair-studio', category: 'Salon',
    location: 'Ahmedabad, Gujarat', owner: 'Priya Mehta',
    description: 'Premium hair care and styling studio blending modern technique with a relaxed, boutique feel.',
    rating: 4.9, reviewCount: 328,
    services: ['Haircut', 'Hair Coloring', 'Hair Spa', 'Styling'],
    image: img('luxe-hair'), logo: logo('Luxe Hair Studio', 'C24A3B'),
    featured: true, verified: true,
  },
  {
    id: '2', name: 'Glow & Grace Salon', slug: 'glow-and-grace-salon', category: 'Salon',
    location: 'Vadodara, Gujarat', owner: 'Anita Shah',
    description: 'A calm, light-filled salon focused on skin and hair wellness for the everyday routine.',
    rating: 4.7, reviewCount: 176,
    services: ['Facial', 'Haircut', 'Bridal Makeup'],
    image: img('glow-grace'), logo: logo('Glow Grace', 'D98E2B'),
    featured: false, verified: true,
  },
  {
    id: '3', name: 'Urban Barber', slug: 'urban-barber', category: 'Barber',
    location: 'Gandhinagar, Gujarat', owner: 'Rakesh Patel',
    description: 'Classic barbershop energy with sharp modern fades and a proper hot-towel finish.',
    rating: 4.8, reviewCount: 214,
    services: ['Haircut', 'Beard Styling', 'Hair Treatment'],
    image: img('urban-barber'), logo: logo('Urban Barber', '1F8A70'),
    featured: true, verified: true,
  },
  {
    id: '4', name: "The Gentlemen's Cut", slug: 'the-gentlemens-cut', category: 'Barber',
    location: 'Rajkot, Gujarat', owner: 'Sanjay Rao',
    description: 'Appointment-only grooming lounge for precision cuts and traditional shaves.',
    rating: 4.6, reviewCount: 132,
    services: ['Haircut', 'Shave', 'Beard Trim'],
    image: img('gentlemens-cut'), logo: logo('Gentlemens Cut', '12172B'),
    featured: false, verified: false,
  },
  {
    id: '5', name: 'PowerFit Arena', slug: 'powerfit-arena', category: 'Gym',
    location: 'Surat, Gujarat', owner: 'Vikram Desai',
    description: 'Full-scale strength and conditioning facility with certified trainers on the floor daily.',
    rating: 4.9, reviewCount: 512,
    services: ['Gym Membership', 'Personal Training', 'CrossFit', 'Fitness Classes'],
    image: img('powerfit-arena'), logo: logo('PowerFit Arena', 'C24A3B'),
    featured: true, verified: true,
  },
  {
    id: '6', name: 'Iron Pulse Fitness', slug: 'iron-pulse-fitness', category: 'Gym',
    location: 'Ahmedabad, Gujarat', owner: 'Karan Joshi',
    description: 'Boutique strength studio with small-group coaching and a serious lifting culture.',
    rating: 4.7, reviewCount: 289,
    services: ['Strength Training', 'Nutrition Coaching', 'Group Classes'],
    image: img('iron-pulse'), logo: logo('Iron Pulse', 'D98E2B'),
    featured: false, verified: true,
  },
  {
    id: '7', name: 'Serenity Day Spa', slug: 'serenity-day-spa', category: 'Spa',
    location: 'Ahmedabad, Gujarat', owner: 'Meera Kapoor',
    description: 'A quiet retreat for massage, skin therapy, and slow, deliberate self-care.',
    rating: 4.8, reviewCount: 241,
    services: ['Full Body Massage', 'Aromatherapy', 'Skin Therapy'],
    image: img('serenity-spa'), logo: logo('Serenity Spa', '1F8A70'),
    featured: false, verified: true,
  },
  {
    id: '8', name: 'Bliss Wellness Spa', slug: 'bliss-wellness-spa', category: 'Spa',
    location: 'Vadodara, Gujarat', owner: 'Nisha Trivedi',
    description: 'Holistic wellness spa offering therapeutic treatments in a warm, private setting.',
    rating: 4.6, reviewCount: 157,
    services: ['Deep Tissue Massage', 'Body Scrub', 'Reflexology'],
    image: img('bliss-wellness'), logo: logo('Bliss Wellness', 'C24A3B'),
    featured: false, verified: false,
  },
  {
    id: '9', name: 'Spice Route Kitchen', slug: 'spice-route-kitchen', category: 'Restaurant',
    location: 'Surat, Gujarat', owner: 'Rohan Bhatt',
    description: 'Contemporary Indian dining built around regional spice blends and open-flame cooking.',
    rating: 4.7, reviewCount: 402,
    services: ['Dine-in', 'Catering', 'Private Events'],
    image: img('spice-route'), logo: logo('Spice Route', 'D98E2B'),
    featured: true, verified: true,
  },
  {
    id: '10', name: 'Copper Leaf Dining', slug: 'copper-leaf-dining', category: 'Restaurant',
    location: 'Gandhinagar, Gujarat', owner: 'Aman Verma',
    description: 'Farm-to-table plates in a warm, plant-lined dining room built for long evenings.',
    rating: 4.5, reviewCount: 198,
    services: ['Dine-in', 'Takeaway', 'Chef Specials'],
    image: img('copper-leaf'), logo: logo('Copper Leaf', '1F8A70'),
    featured: false, verified: true,
  },
  {
    id: '11', name: 'Bean & Brew Café', slug: 'bean-and-brew-cafe', category: 'Cafe',
    location: 'Ahmedabad, Gujarat', owner: 'Divya Nair',
    description: 'Neighbourhood café built around single-origin coffee and slow mornings.',
    rating: 4.8, reviewCount: 265,
    services: ['Coffee', 'All-Day Breakfast', 'Workspace Seating'],
    image: img('bean-brew'), logo: logo('Bean Brew', 'C24A3B'),
    featured: false, verified: true,
  },
  {
    id: '12', name: 'The Daily Grind Café', slug: 'the-daily-grind-cafe', category: 'Cafe',
    location: 'Rajkot, Gujarat', owner: 'Yash Solanki',
    description: 'Compact specialty café known for its cold brew and quiet corner tables.',
    rating: 4.4, reviewCount: 121,
    services: ['Coffee', 'Pastries', 'Takeaway'],
    image: img('daily-grind'), logo: logo('Daily Grind', 'D98E2B'),
    featured: false, verified: false,
  },
  {
    id: '13', name: 'SmileCare Dental Clinic', slug: 'smilecare-dental-clinic', category: 'Clinic',
    location: 'Vadodara, Gujarat', owner: 'Dr. Kavita Iyer',
    description: 'Modern dental practice offering preventive and cosmetic care for the whole family.',
    rating: 4.9, reviewCount: 347,
    services: ['General Checkup', 'Teeth Whitening', 'Orthodontics'],
    image: img('smilecare'), logo: logo('SmileCare', '1F8A70'),
    featured: true, verified: true,
  },
  {
    id: '14', name: 'Vitality Skin Clinic', slug: 'vitality-skin-clinic', category: 'Clinic',
    location: 'Surat, Gujarat', owner: 'Dr. Arjun Mehta',
    description: 'Dermatology clinic pairing clinical treatments with long-term skin health plans.',
    rating: 4.7, reviewCount: 188,
    services: ['Skin Consultation', 'Acne Treatment', 'Laser Therapy'],
    image: img('vitality-skin'), logo: logo('Vitality Skin', 'C24A3B'),
    featured: false, verified: true,
  },
  {
    id: '15', name: 'Frame & Focus Photography', slug: 'frame-and-focus-photography', category: 'Studio',
    location: 'Ahmedabad, Gujarat', owner: 'Neha Kulkarni',
    description: 'Full-service photo and video studio for portraits, brands, and events.',
    rating: 4.8, reviewCount: 143,
    services: ['Portrait Shoot', 'Event Photography', 'Video Production'],
    image: img('frame-focus'), logo: logo('Frame Focus', 'D98E2B'),
    featured: false, verified: true,
  },
  {
    id: '16', name: 'Rhythm Dance Studio', slug: 'rhythm-dance-studio', category: 'Studio',
    location: 'Gandhinagar, Gujarat', owner: 'Simran Chawla',
    description: 'High-energy dance studio running classes across styles for every skill level.',
    rating: 4.6, reviewCount: 209,
    services: ['Group Classes', 'Private Lessons', 'Kids Batches'],
    image: img('rhythm-dance'), logo: logo('Rhythm Dance', '1F8A70'),
    featured: false, verified: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Derived / mock detail content — replace with real fields once     */
/*  the backend returns them (hours, phone, gallery, etc).            */
/* ------------------------------------------------------------------ */

const HOURS = [
  { day: 'Monday – Friday', time: '10:00 AM – 8:00 PM' },
  { day: 'Saturday', time: '10:00 AM – 9:00 PM' },
  { day: 'Sunday', time: '11:00 AM – 6:00 PM' },
];

function phoneFor(business: Business) {
  const digits = business.id.padStart(4, '9');
  return `+91 98${digits}${digits}10`;
}

function emailFor(business: Business) {
  return `hello@${business.slug.replace(/-/g, '')}.com`;
}

function galleryFor(business: Business) {
  return [business.image, img(`${business.slug}-2`), img(`${business.slug}-3`), img(`${business.slug}-4`)];
}

/* ------------------------------------------------------------------ */
/*  Small building blocks (mirrors styling used on /pocustomer)       */
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
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const business = useMemo(() => BUSINESSES.find((b) => b.slug === slug), [slug]);

  const [fav, setFav] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  if (!business) {
    notFound();
  }

  const CatIcon = CATEGORY_ICONS[business.category] ?? Sparkles;
  const gallery = galleryFor(business);
  const phone = phoneFor(business);
  const email = emailFor(business);

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
              src={business.logo}
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
              <p className="text-white/85 text-[13px] sm:text-[14px]">{CATEGORY_LABELS[business.category] ?? business.category}</p>
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
            <span className="flex items-center gap-1.5 text-[13.5px] text-text-on-paper-dim">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {business.location}
            </span>
            <span className="flex items-center gap-1.5 text-[13.5px] text-text-on-paper-dim">
              <CatIcon className="w-3.5 h-3.5 shrink-0" />
              {CATEGORY_LABELS[business.category] ?? business.category}
            </span>
          </div>

          {/* About */}
          <div className="bg-card border border-ink/10 rounded-3xl p-5 sm:p-7 mb-6">
            <h2 className="font-display font-bold text-[18px] sm:text-[20px] text-ink mb-3">About</h2>
            <p className="text-[14.5px] text-text-on-paper-dim leading-relaxed mb-4">
              {business.description}
            </p>
            <p className="text-[13.5px] text-text-on-paper-dim">
              Owned &amp; run by <span className="font-semibold text-ink">{business.owner}</span>
            </p>
          </div>

          {/* Services */}
          <div className="bg-card border border-ink/10 rounded-3xl p-5 sm:p-7 mb-6">
            <h2 className="font-display font-bold text-[18px] sm:text-[20px] text-ink mb-4">Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {business.services.map((s) => (
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

          {/* Hours */}
          <div className="bg-card border border-ink/10 rounded-3xl p-5 sm:p-7">
            <h2 className="font-display font-bold text-[18px] sm:text-[20px] text-ink mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald" />
              Business Hours
            </h2>
            <div className="divide-y divide-ink/10">
              {HOURS.map((h) => (
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
              <a
                href="#"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-emerald text-white text-[14px] font-semibold hover:opacity-90 hover:scale-[1.02] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <Send className="w-4 h-4" />
                Book via Telegram
              </a>
            </div>
          </div>

          <div className="bg-card border border-ink/10 rounded-3xl p-6">
            <h3 className="font-display font-bold text-[15.5px] text-ink mb-4">Contact</h3>
            <div className="space-y-3.5 text-[14px]">
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-ink hover:text-emerald motion-safe:transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald">
                <Phone className="w-4 h-4 text-emerald shrink-0" />
                {phone}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-3 text-ink hover:text-emerald motion-safe:transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald">
                <Mail className="w-4 h-4 text-emerald shrink-0" />
                {email}
              </a>
              <div className="flex items-start gap-3 text-ink">
                <MapPin className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                {business.location}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}