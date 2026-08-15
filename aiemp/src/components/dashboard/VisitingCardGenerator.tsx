'use client';

import { useState, useRef, useMemo, type FC, type ChangeEvent } from "react";
import { Phone, Mail, Globe, Download, RotateCw, FileDown, Check } from "lucide-react";

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */

interface CardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
}

interface FaceProps {
  data: CardData;
}

interface Theme {
  id: string;
  name: string;
  swatch: string;
  Front: FC<FaceProps>;
  Back: FC<FaceProps>;
  draw: (ctx: CanvasRenderingContext2D, data: CardData, w: number, h: number) => void;
}

interface FieldConfig {
  key: keyof CardData;
  label: string;
  placeholder: string;
}

/* ---------------------------------------------------------
   THEME DEFINITIONS
   Each theme owns its own JSX face (front/back) AND its own
   canvas draw routine, so the exported PNG always matches
   what's on screen.
--------------------------------------------------------- */

const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

const THEMES: Theme[] = [
  {
    id: "ink-amber",
    name: "Ink & Amber",
    swatch: "linear-gradient(135deg,#0B0F19,#1C2333 60%,#B5792B)",
    Front: ({ data }) => (
      <div
        className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0B0F19 0%,#171d2e 100%)" }}
      >
        <div
          className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle,#D98E2B,transparent 70%)" }}
        />
        <div className="flex items-center justify-between relative z-10">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-[15px]"
            style={{ background: "#D98E2B", color: "#0B0F19" }}
          >
            {initials(data.name) || "??"}
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase" style={{ color: "#D98E2B" }}>
            {data.company || "Company"}
          </span>
        </div>
        <div className="relative z-10">
          <div className="font-display font-bold text-[26px] leading-tight text-white">{data.name || "Your Name"}</div>
          <div className="font-mono text-[11px] tracking-[0.1em] uppercase mt-1" style={{ color: "#D98E2B" }}>
            {data.title || "Your Title"}
          </div>
          <div className="h-px w-full my-3" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10.5px] text-white/70">
            {data.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> {data.phone}
              </span>
            )}
            {data.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> {data.email}
              </span>
            )}
            {data.website && (
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-3 w-3" /> {data.website}
              </span>
            )}
          </div>
        </div>
      </div>
    ),
    Back: ({ data }) => (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-3"
        style={{ background: "linear-gradient(135deg,#0B0F19 0%,#171d2e 100%)" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center font-display font-bold text-[24px]"
          style={{ background: "#D98E2B", color: "#0B0F19" }}
        >
          {initials(data.name) || "??"}
        </div>
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/50">
          {data.company || "Company"}
        </div>
      </div>
    ),
    draw(ctx, data, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#0B0F19");
      g.addColorStop(1, "#171d2e");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(w - 60, 40, 10, w - 60, 40, 220);
      glow.addColorStop(0, "rgba(217,142,43,0.25)");
      glow.addColorStop(1, "rgba(217,142,43,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const pad = 60;
      ctx.fillStyle = "#D98E2B";
      ctx.beginPath();
      ctx.arc(pad + 34, pad + 30, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0B0F19";
      ctx.font = "bold 30px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials(data.name) || "??", pad + 34, pad + 32);

      ctx.textAlign = "right";
      ctx.fillStyle = "#D98E2B";
      ctx.font = "600 20px monospace";
      ctx.fillText(truncate(ctx, (data.company || "Company").toUpperCase(), 420), w - pad, pad + 38);

      ctx.textAlign = "left";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 54px sans-serif";
      ctx.fillText(data.name || "Your Name", pad, h - 190);

      ctx.fillStyle = "#D98E2B";
      ctx.font = "600 22px monospace";
      ctx.fillText((data.title || "Your Title").toUpperCase(), pad, h - 150);

      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, h - 120);
      ctx.lineTo(w - pad, h - 120);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "20px monospace";
      const parts = [data.phone, data.email, data.website].filter(Boolean);
      ctx.fillText(truncate(ctx, parts.join("     "), w - pad * 2), pad, h - 80);
    },
  },

  {
    id: "paper-minimal",
    name: "Paper Minimal",
    swatch: "linear-gradient(135deg,#ffffff,#f3f1ea 60%,#D98E2B)",
    Front: ({ data }) => (
      <div className="relative w-full h-full flex flex-col justify-between p-8 bg-white border border-stone-200">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D98E2B" }} />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-400">
            {data.company || "Company"}
          </span>
        </div>
        <div>
          <div className="font-display font-bold text-[27px] leading-tight text-stone-900">{data.name || "Your Name"}</div>
          <div className="inline-block h-[3px] w-10 my-2 rounded-full" style={{ background: "#D98E2B" }} />
          <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-stone-500">{data.title || "Your Title"}</div>
        </div>
        <div className="flex flex-col gap-1 font-mono text-[10.5px] text-stone-500">
          {data.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" />{data.phone}</span>}
          {data.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" />{data.email}</span>}
          {data.website && <span className="inline-flex items-center gap-1.5"><Globe className="h-3 w-3" />{data.website}</span>}
        </div>
      </div>
    ),
    Back: ({ data }) => (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-white border border-stone-200">
        <div className="font-display font-bold text-[30px] text-stone-900">{initials(data.name) || "??"}</div>
        <div className="h-[2px] w-8 rounded-full" style={{ background: "#D98E2B" }} />
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-stone-400">{data.company || "Company"}</div>
      </div>
    ),
    draw(ctx, data, w, h) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#E7E3D9";
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, w - 3, h - 3);

      const pad = 60;
      ctx.fillStyle = "#D98E2B";
      ctx.beginPath();
      ctx.arc(pad + 4, pad + 6, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#A8A29E";
      ctx.font = "600 18px monospace";
      ctx.fillText(truncate(ctx, (data.company || "Company").toUpperCase(), 500), pad + 20, pad + 12);

      ctx.fillStyle = "#1C1917";
      ctx.font = "bold 56px sans-serif";
      ctx.fillText(data.name || "Your Name", pad, h - 210);

      ctx.fillStyle = "#D98E2B";
      ctx.fillRect(pad, h - 185, 70, 5);

      ctx.fillStyle = "#78716C";
      ctx.font = "600 22px monospace";
      ctx.fillText((data.title || "Your Title").toUpperCase(), pad, h - 145);

      ctx.fillStyle = "#78716C";
      ctx.font = "20px monospace";
      const parts = [data.phone, data.email, data.website].filter(Boolean);
      ctx.fillText(truncate(ctx, parts.join("     "), w - pad * 2), pad, h - 70);
    },
  },

  {
    id: "emerald-line",
    name: "Emerald Line",
    swatch: "linear-gradient(90deg,#10B981 0 22%,#ffffff 22%)",
    Front: ({ data }) => (
      <div className="relative w-full h-full flex bg-white border border-stone-200 overflow-hidden">
        <div className="w-[22%] h-full" style={{ background: "#0F9D6E" }} />
        <div className="flex-1 p-7 flex flex-col justify-between items-end text-right">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-400">
            {data.company || "Company"}
          </span>
          <div>
            <div className="font-display font-bold text-[24px] leading-tight text-stone-900">{data.name || "Your Name"}</div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] mt-1" style={{ color: "#0F9D6E" }}>
              {data.title || "Your Title"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 font-mono text-[10px] text-stone-500">
            {data.phone && <span className="inline-flex items-center gap-1.5">{data.phone}<Phone className="h-3 w-3" /></span>}
            {data.email && <span className="inline-flex items-center gap-1.5">{data.email}<Mail className="h-3 w-3" /></span>}
            {data.website && <span className="inline-flex items-center gap-1.5">{data.website}<Globe className="h-3 w-3" /></span>}
          </div>
        </div>
      </div>
    ),
    Back: ({ data }) => (
      <div className="w-full h-full flex bg-white border border-stone-200 overflow-hidden">
        <div className="w-[22%] h-full" style={{ background: "#0F9D6E" }} />
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="font-display font-bold text-[28px] text-stone-900">{initials(data.name) || "??"}</div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-stone-400">{data.company || "Company"}</div>
        </div>
      </div>
    ),
    draw(ctx, data, w, h) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#0F9D6E";
      const barW = w * 0.22;
      ctx.fillRect(0, 0, barW, h);

      const pad = 55;
      ctx.textAlign = "right";
      ctx.fillStyle = "#A8A29E";
      ctx.font = "600 18px monospace";
      ctx.fillText(truncate(ctx, (data.company || "Company").toUpperCase(), w - barW - pad * 2), w - pad, pad + 12);

      ctx.fillStyle = "#1C1917";
      ctx.font = "bold 48px sans-serif";
      ctx.fillText(data.name || "Your Name", w - pad, h - 190);

      ctx.fillStyle = "#0F9D6E";
      ctx.font = "600 20px monospace";
      ctx.fillText((data.title || "Your Title").toUpperCase(), w - pad, h - 150);

      ctx.fillStyle = "#78716C";
      ctx.font = "18px monospace";
      const parts = [data.phone, data.email, data.website].filter(Boolean);
      ctx.fillText(truncate(ctx, parts.join("     "), w - barW - pad * 2), w - pad, h - 80);
      ctx.textAlign = "left";
    },
  },

  {
    id: "gold-foil",
    name: "Gold Foil",
    swatch: "radial-gradient(circle,#3a2f14,#0a0a0a 70%)",
    Front: ({ data }) => (
      <div
        className="relative w-full h-full flex flex-col items-center justify-center text-center p-8 overflow-hidden"
        style={{ background: "radial-gradient(circle at 50% 30%,#241d0d 0%,#0A0A0A 70%)" }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-[16px] mb-3"
          style={{ border: "1.5px solid #C9A24B", color: "#C9A24B" }}
        >
          {initials(data.name) || "??"}
        </div>
        <div className="font-display font-bold text-[24px] tracking-wide" style={{ color: "#EFE0B8" }}>
          {data.name || "Your Name"}
        </div>
        <div className="h-px w-14 my-2" style={{ background: "#C9A24B" }} />
        <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: "#C9A24B" }}>
          {data.title || "Your Title"}{data.company ? ` · ${data.company}` : ""}
        </div>
        <div className="flex gap-4 mt-4 font-mono text-[9.5px]" style={{ color: "#EFE0B8AA" }}>
          {data.phone && <span>{data.phone}</span>}
          {data.email && <span>{data.email}</span>}
          {data.website && <span>{data.website}</span>}
        </div>
      </div>
    ),
    Back: ({ data }) => (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-2"
        style={{ background: "radial-gradient(circle at 50% 30%,#241d0d 0%,#0A0A0A 70%)" }}
      >
        <div className="font-display font-bold text-[30px]" style={{ color: "#C9A24B" }}>
          {initials(data.name) || "??"}
        </div>
        <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase" style={{ color: "#EFE0B888" }}>
          {data.company || "Company"}
        </div>
      </div>
    ),
    draw(ctx, data, w, h) {
      const g = ctx.createRadialGradient(w / 2, h * 0.35, 20, w / 2, h * 0.35, w * 0.6);
      g.addColorStop(0, "#241d0d");
      g.addColorStop(1, "#0A0A0A");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = "center";
      ctx.strokeStyle = "#C9A24B";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.28, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#C9A24B";
      ctx.font = "bold 30px sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(initials(data.name) || "??", w / 2, h * 0.28 + 2);
      ctx.textBaseline = "alphabetic";

      ctx.fillStyle = "#EFE0B8";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText(data.name || "Your Name", w / 2, h * 0.52);

      ctx.strokeStyle = "#C9A24B";
      ctx.beginPath();
      ctx.moveTo(w / 2 - 35, h * 0.58);
      ctx.lineTo(w / 2 + 35, h * 0.58);
      ctx.stroke();

      ctx.fillStyle = "#C9A24B";
      ctx.font = "600 18px monospace";
      const sub = [data.title, data.company].filter(Boolean).join("  ·  ").toUpperCase();
      ctx.fillText(truncate(ctx, sub, w - 100), w / 2, h * 0.66);

      ctx.fillStyle = "rgba(239,224,184,0.7)";
      ctx.font = "16px monospace";
      const parts = [data.phone, data.email, data.website].filter(Boolean);
      ctx.fillText(truncate(ctx, parts.join("     "), w - 100), w / 2, h * 0.82);
      ctx.textAlign = "left";
    },
  },

  {
    id: "sunset-split",
    name: "Sunset Split",
    swatch: "linear-gradient(115deg,#0B0F19 45%,#D98E2B 45%)",
    Front: ({ data }) => (
      <div className="relative w-full h-full overflow-hidden">
        <div className="absolute inset-0" style={{ background: "#D98E2B" }} />
        <div
          className="absolute inset-0"
          style={{
            background: "#0B0F19",
            clipPath: "polygon(0 0, 62% 0, 42% 100%, 0 100%)",
          }}
        />
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-7">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/80">
            {data.company || "Company"}
          </div>
          <div>
            <div className="font-display font-bold text-[25px] leading-tight text-white">{data.name || "Your Name"}</div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/70 mt-1">
              {data.title || "Your Title"}
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 right-7 z-10 flex flex-col items-end gap-1 font-mono text-[10px]" style={{ color: "#0B0F19" }}>
          {data.phone && <span>{data.phone}</span>}
          {data.email && <span>{data.email}</span>}
          {data.website && <span>{data.website}</span>}
        </div>
      </div>
    ),
    Back: ({ data }) => (
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0" style={{ background: "#D98E2B" }} />
        <div
          className="absolute inset-0"
          style={{ background: "#0B0F19", clipPath: "polygon(0 0, 62% 0, 42% 100%, 0 100%)" }}
        />
        <div className="relative z-10 font-display font-bold text-[30px] text-white">{initials(data.name) || "??"}</div>
      </div>
    ),
    draw(ctx, data, w, h) {
      ctx.fillStyle = "#D98E2B";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#0B0F19";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.62, 0);
      ctx.lineTo(w * 0.42, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      const pad = 55;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "600 18px monospace";
      ctx.fillText(truncate(ctx, (data.company || "Company").toUpperCase(), 420), pad, pad + 12);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 46px sans-serif";
      ctx.fillText(data.name || "Your Name", pad, h * 0.5);

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "600 20px monospace";
      ctx.fillText((data.title || "Your Title").toUpperCase(), pad, h * 0.5 + 40);

      ctx.textAlign = "right";
      ctx.fillStyle = "#0B0F19";
      ctx.font = "18px monospace";
      const parts = [data.phone, data.email, data.website].filter(Boolean);
      parts.forEach((p, i) => ctx.fillText(p, w - pad, h - 60 - i * 26));
      ctx.textAlign = "left";
    },
  },

  {
    id: "mono-grid",
    name: "Mono Grid",
    swatch:
      "repeating-linear-gradient(0deg,#fff,#fff 7px,#eee 7px,#eee 8px), repeating-linear-gradient(90deg,#fff,#fff 7px,#eee 7px,#eee 8px)",
    Front: ({ data }) => (
      <div
        className="relative w-full h-full flex flex-col justify-between p-7 bg-white border border-stone-900"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      >
        <div className="flex justify-between items-start font-mono">
          <span className="text-[9.5px] tracking-[0.15em] uppercase text-stone-500">
            {data.company || "Company"}
          </span>
          <span className="text-[9.5px] text-stone-400">No. 001</span>
        </div>
        <div>
          <div className="font-display font-bold text-[24px] text-stone-900">{data.name || "Your Name"}</div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-stone-600 mt-1">
            {data.title || "Your Title"}
          </div>
        </div>
        <div className="flex justify-between items-end font-mono text-[9.5px] text-stone-500 border-t border-dashed border-stone-300 pt-2">
          <span>{data.phone}</span>
          <span>{data.email}</span>
          <span>{data.website}</span>
        </div>
      </div>
    ),
    Back: ({ data }) => (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-2 bg-white border border-stone-900"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      >
        <div className="font-display font-bold text-[28px] text-stone-900">{initials(data.name) || "??"}</div>
        <div className="font-mono text-[9.5px] tracking-[0.25em] uppercase text-stone-400">{data.company || "Company"}</div>
      </div>
    ),
    draw(ctx, data, w, h) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "#1C1917";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, w - 4, h - 4);

      const pad = 55;
      ctx.fillStyle = "#78716C";
      ctx.font = "600 17px monospace";
      ctx.fillText(truncate(ctx, (data.company || "Company").toUpperCase(), 500), pad, pad + 8);
      ctx.textAlign = "right";
      ctx.fillText("No. 001", w - pad, pad + 8);
      ctx.textAlign = "left";

      ctx.fillStyle = "#1C1917";
      ctx.font = "bold 46px sans-serif";
      ctx.fillText(data.name || "Your Name", pad, h * 0.52);

      ctx.fillStyle = "#57534E";
      ctx.font = "600 20px monospace";
      ctx.fillText((data.title || "Your Title").toUpperCase(), pad, h * 0.52 + 38);

      ctx.strokeStyle = "#D6D3D1";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(pad, h - 90);
      ctx.lineTo(w - pad, h - 90);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#78716C";
      ctx.font = "16px monospace";
      const parts = [data.phone, data.email, data.website].filter(Boolean);
      ctx.fillText(truncate(ctx, parts.join("     "), w - pad * 2), pad, h - 55);
    },
  },
];

const FIELDS: FieldConfig[] = [
  { key: "name", label: "Full name", placeholder: "Meera Iyer" },
  { key: "title", label: "Title / role", placeholder: "Founder & Dentist" },
  { key: "company", label: "Company", placeholder: "Meera Dental Clinic" },
  { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
  { key: "email", label: "Email", placeholder: "meera@meeradental.in" },
  { key: "website", label: "Website", placeholder: "meeradental.in" },
];

const DEFAULT_DATA: CardData = {
  name: "Meera Iyer",
  title: "Founder & Dentist",
  company: "Meera Dental Clinic",
  phone: "+91 98765 43210",
  email: "meera@meeradental.in",
  website: "meeradental.in",
};

export default function VisitingCardGenerator() {
  const [data, setData] = useState<CardData>(DEFAULT_DATA);
  const [themeId, setThemeId] = useState<string>(THEMES[0].id);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const theme = useMemo<Theme>(() => THEMES.find((t) => t.id === themeId) ?? THEMES[0], [themeId]);

  const update =
    (key: keyof CardData) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setData((d) => ({ ...d, [key]: e.target.value }));

  const downloadPNG = () => {
    const w = 1050;
    const h = 600;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    theme.draw(ctx, data, w, h);

    const link = document.createElement("a");
    link.download = `${(data.name || "visiting-card").replace(/\s+/g, "-").toLowerCase()}-${theme.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadVCard = () => {
    const [first, ...rest] = (data.name || "").trim().split(/\s+/);
    const last = rest.join(" ");
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${last};${first || ""};;;`,
      `FN:${data.name || ""}`,
      data.title ? `TITLE:${data.title}` : "",
      data.company ? `ORG:${data.company}` : "",
      data.phone ? `TEL;TYPE=CELL:${data.phone}` : "",
      data.email ? `EMAIL:${data.email}` : "",
      data.website ? `URL:${data.website}` : "",
      "END:VCARD",
    ].filter(Boolean);

    const blob = new Blob([lines.join("\n")], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${(data.name || "contact").replace(/\s+/g, "-").toLowerCase()}.vcf`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = async () => {
    const summary = [data.name, data.title, data.company, data.phone, data.email, data.website]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be unavailable in this environment */
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-stone-100 text-stone-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .flip-scene { perspective: 1800px; container-type: inline-size; }
        .flip-inner { transition: transform 0.7s cubic-bezier(.2,.8,.2,1); transform-style: preserve-3d; }
        .flip-inner.flipped { transform: rotateY(180deg); }
        .flip-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .flip-back { transform: rotateY(180deg); }
        /* Card faces are authored at a fixed 520px design width. On smaller
           (mobile) viewports the whole face scales down uniformly via the
           container's inline size, so every theme's type, padding and icons
           shrink together instead of wrapping or overflowing. */
        .card-face-scaler {
          position: absolute;
          top: 0;
          left: 0;
          width: 520px;
          aspect-ratio: 1.75;
          transform: scale(calc(100cqw / 520px));
          transform-origin: top left;
        }
        @supports not (width: 1cqw) {
          .card-face-scaler { position: static; width: 100%; height: 100%; transform: none; }
        }
      `}</style>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-10 font-body">
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-amber-700 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Card studio
            </div>
            <h1 className="font-display font-bold text-[26px] sm:text-[32px] tracking-tight">Visiting card generator</h1>
            <p className="text-[13.5px] text-stone-500 mt-1">Fill in your details, pick a theme, export print-ready.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* LEFT: form + themes */}
          <div className="space-y-5">
            <div className="bg-white border border-stone-200 rounded-[16px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="border-b border-dashed border-stone-200 bg-stone-50 px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-wider uppercase text-stone-500">Card details</span>
                <span className="font-mono text-[11px] text-stone-400">6 fields</span>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                {FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="block font-mono text-[10.5px] uppercase tracking-wider text-stone-400 mb-1.5">
                      {f.label}
                    </label>
                    <input
                      value={data[f.key]}
                      onChange={update(f.key)}
                      placeholder={f.placeholder}
                      className="w-full rounded-[10px] border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[16px] sm:text-[14px] text-stone-900 outline-none focus:border-amber-400 focus:bg-white transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-[16px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="border-b border-dashed border-stone-200 bg-stone-50 px-4 sm:px-5 py-3 sm:py-3.5">
                <span className="font-mono text-[11px] tracking-wider uppercase text-stone-500">Theme</span>
              </div>
              <div className="p-4 sm:p-5 grid grid-cols-3 gap-2.5 sm:gap-3">
                {THEMES.map((t) => {
                  const active = t.id === themeId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setThemeId(t.id)}
                      className={`group flex flex-col items-center gap-1.5 rounded-[10px] p-1.5 transition-all ${
                        active ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-white" : ""
                      }`}
                    >
                      <div
                        className="w-full aspect-[1.75] rounded-[8px] border border-stone-200 relative overflow-hidden"
                        style={{ background: t.swatch }}
                      >
                        {active && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <Check className="h-4 w-4 text-white drop-shadow" />
                          </div>
                        )}
                      </div>
                      <span className="font-mono text-[9.5px] text-stone-500 group-hover:text-stone-800 text-center leading-tight">
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: preview + export */}
          <div className="space-y-5">
            <div className="bg-white border border-stone-200 rounded-[16px] p-5 sm:p-8 md:p-12 flex flex-col items-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flip-scene w-full max-w-[520px]">
                <div
                  className={`flip-inner relative w-full aspect-[1.75] cursor-pointer ${flipped ? "flipped" : ""}`}
                  onClick={() => setFlipped((f) => !f)}
                >
                  <div className="flip-face absolute inset-0 rounded-[16px] overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)]">
                    <div className="card-face-scaler">
                      <theme.Front data={data} />
                    </div>
                  </div>
                  <div className="flip-face flip-back absolute inset-0 rounded-[16px] overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)]">
                    <div className="card-face-scaler">
                      <theme.Back data={data} />
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setFlipped((f) => !f)}
                className="mt-6 inline-flex items-center gap-1.5 font-mono text-[11.5px] uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Flip card
              </button>
            </div>

            <div className="bg-white border border-stone-200 rounded-[16px] p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="font-mono text-[11px] text-stone-400">
                Export as a 3.5×2in print-ready PNG, a vCard contact file, or copy the details as text.
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2.5">
                <button
                  onClick={copySummary}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] border border-stone-200 px-3.5 py-2.5 text-[13px] font-medium text-stone-700 hover:bg-stone-50 active:bg-stone-100 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                  {copied ? "Copied" : "Copy text"}
                </button>
                <button
                  onClick={downloadVCard}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] border border-stone-200 px-3.5 py-2.5 text-[13px] font-medium text-stone-700 hover:bg-stone-50 active:bg-stone-100 transition-colors"
                >
                  <FileDown className="h-4 w-4" />
                  vCard
                </button>
                <button
                  onClick={downloadPNG}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] bg-stone-900 text-white px-4 py-2.5 text-[13px] font-medium hover:bg-stone-800 active:bg-stone-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* hidden canvas used only to render the exported PNG */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}