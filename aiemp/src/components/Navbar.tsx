'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NAV_LINKS = [
  { href: '/#responsibilities', label: 'What she does' },
  { href: '/#channels', label: 'Calls + WhatsApp' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/onboarding', label: 'Setup' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const goToDashboard = () => {
    setOpen(false);
    router.push('/dashboard');
  };

  return (
    <nav className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md border-b border-ink/10">
      <div className="max-w-[1180px] mx-auto px-6 sm:px-8 flex items-center justify-between h-[72px]">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 font-display font-bold text-[20px] tracking-tight"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald shadow-[0_0_0_4px_rgba(31,138,112,0.15)]" />
          Aria
        </Link>

        {/* Desktop links — unchanged from before */}
        <div className="hidden md:flex gap-9 text-[14.5px] font-medium text-text-on-paper-dim">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-ink transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* CTA — hidden on very small screens so it doesn't crowd the hamburger */}
          <button
            onClick={goToDashboard}
            className="hidden sm:inline-flex bg-ink text-text-on-ink px-5 py-2.5 rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity"
          >
            Hire Aria
          </button>

          {/* Hamburger — mobile only, animates into an X */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-ink/5 transition-colors"
          >
            <span
              className={`absolute w-5 h-[1.5px] bg-ink rounded-full transition-all duration-300 ${
                open ? 'rotate-45' : '-translate-y-[6px]'
              }`}
            />
            <span
              className={`absolute w-5 h-[1.5px] bg-ink rounded-full transition-all duration-300 ${
                open ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute w-5 h-[1.5px] bg-ink rounded-full transition-all duration-300 ${
                open ? '-rotate-45' : 'translate-y-[6px]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-ink/10 ${
          open ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0 border-t-0'
        }`}
      >
        <div className="flex flex-col px-6 py-4 gap-1 bg-paper">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-3 text-[15px] font-medium text-text-on-paper-dim hover:text-ink border-b border-ink/5 last:border-b-0"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={goToDashboard}
            className="mt-3 w-full bg-ink text-text-on-ink px-5 py-3 rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity"
          >
            Hire Aria
          </button>
        </div>
      </div>
    </nav>
  );
}