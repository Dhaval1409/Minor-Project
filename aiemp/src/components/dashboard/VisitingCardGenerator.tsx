'use client';

import { useState, useRef, useMemo, useEffect, useCallback, type FC, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Phone, Mail, Globe, Download, RotateCw, FileDown, Check, Palette, Save, Star, Sparkles } from "lucide-react";

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
  recommended?: boolean;
  Front: FC<FaceProps>;
  Back: FC<FaceProps>;
  draw: (ctx: CanvasRenderingContext2D, data: CardData, w: number, h: number) => void;
}

interface FieldConfig {
  key: keyof CardData;
  label: string;
  placeholder: string;
}

interface CustomColors {
  bg: string;
  text: string;
}

/* ---------------------------------------------------------
   COLOR HELPERS
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

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n) || h.length !== 6) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Picks black or white text that reads clearly against a given background. */
function readableTextFor(hex: string): string {
  return relativeLuminance(hex) > 0.42 ? "#14110C" : "#FFFFFF";
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s, l };
}

/* Named preset swatches — used for both the background and text/accent pickers */
const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: "Green", hex: "#16A34A" },
  { name: "Forest Green", hex: "#14532D" },
  { name: "Emerald", hex: "#0F9D6E" },
  { name: "Olive", hex: "#556B2F" },
  { name: "Teal", hex: "#0F766E" },
  { name: "Ocean Blue", hex: "#0369A1" },
  { name: "Royal Blue", hex: "#1D4ED8" },
  { name: "Navy", hex: "#122A4E" },
  { name: "Slate", hex: "#334155" },
  { name: "Charcoal", hex: "#1F2937" },
  { name: "Black", hex: "#0A0A0A" },
  { name: "Burgundy", hex: "#5C1023" },
  { name: "Maroon", hex: "#7F1D1D" },
  { name: "Crimson", hex: "#B91C1C" },
  { name: "Rose", hex: "#9F1239" },
  { name: "Plum", hex: "#581C5C" },
  { name: "Amber", hex: "#D98E2B" },
  { name: "Gold", hex: "#C9A24B" },
  { name: "Brown", hex: "#5C3A21" },
  { name: "Ivory", hex: "#FFFFF0" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Stone Grey", hex: "#78716C" },
];

const DEFAULT_CUSTOM: CustomColors = { bg: "#14532D", text: "#F5F1E6" };

/* ---------------------------------------------------------
   THEME DEFINITIONS
   Each theme owns its own JSX face (front/back) AND its own
   canvas draw routine, so the exported PNG always matches
   what's on screen.
--------------------------------------------------------- */

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

  {
    id: "burgundy-velvet",
    name: "Burgundy Velvet",
    swatch: "radial-gradient(circle,#5C1023,#1A0409 70%)",
    Front: ({ data }) => (
      <div
        className="relative w-full h-full flex flex-col items-center justify-center text-center p-8 overflow-hidden"
        style={{ background: "radial-gradient(circle at 50% 30%,#4A0E1D 0%,#1A0409 70%)" }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-[16px] mb-3"
          style={{ border: "1.5px solid #C9A24B", color: "#C9A24B" }}
        >
          {initials(data.name) || "??"}
        </div>
        <div className="font-display font-bold text-[24px] tracking-wide" style={{ color: "#F1E1D6" }}>
          {data.name || "Your Name"}
        </div>
        <div className="h-px w-14 my-2" style={{ background: "#C9A24B" }} />
        <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: "#C9A24B" }}>
          {data.title || "Your Title"}{data.company ? ` · ${data.company}` : ""}
        </div>
        <div className="flex gap-4 mt-4 font-mono text-[9.5px]" style={{ color: "#F1E1D6AA" }}>
          {data.phone && <span>{data.phone}</span>}
          {data.email && <span>{data.email}</span>}
          {data.website && <span>{data.website}</span>}
        </div>
      </div>
    ),
    Back: ({ data }) => (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-2"
        style={{ background: "radial-gradient(circle at 50% 30%,#4A0E1D 0%,#1A0409 70%)" }}
      >
        <div className="font-display font-bold text-[30px]" style={{ color: "#C9A24B" }}>
          {initials(data.name) || "??"}
        </div>
        <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase" style={{ color: "#F1E1D688" }}>
          {data.company || "Company"}
        </div>
      </div>
    ),
    draw(ctx, data, w, h) {
      const g = ctx.createRadialGradient(w / 2, h * 0.35, 20, w / 2, h * 0.35, w * 0.6);
      g.addColorStop(0, "#4A0E1D");
      g.addColorStop(1, "#1A0409");
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

      ctx.fillStyle = "#F1E1D6";
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

      ctx.fillStyle = "rgba(241,225,214,0.7)";
      ctx.font = "16px monospace";
      const parts = [data.phone, data.email, data.website].filter(Boolean);
      ctx.fillText(truncate(ctx, parts.join("     "), w - 100), w / 2, h * 0.82);
      ctx.textAlign = "left";
    },
  },

  {
    id: "forest-canopy",
    name: "Forest Canopy",
    swatch: "linear-gradient(115deg,#F3EFE2 45%,#153A28 45%)",
    Front: ({ data }) => (
      <div className="relative w-full h-full overflow-hidden">
        <div className="absolute inset-0" style={{ background: "#F3EFE2" }} />
        <div
          className="absolute inset-0"
          style={{
            background: "#153A28",
            clipPath: "polygon(0 0, 62% 0, 42% 100%, 0 100%)",
          }}
        />
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-7">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/80">
            {data.company || "Company"}
          </div>
          <div>
            <div className="font-display font-bold text-[25px] leading-tight text-white">{data.name || "Your Name"}</div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] mt-1" style={{ color: "#C9A24B" }}>
              {data.title || "Your Title"}
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 right-7 z-10 flex flex-col items-end gap-1 font-mono text-[10px]" style={{ color: "#153A28" }}>
          {data.phone && <span>{data.phone}</span>}
          {data.email && <span>{data.email}</span>}
          {data.website && <span>{data.website}</span>}
        </div>
      </div>
    ),
    Back: ({ data }) => (
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0" style={{ background: "#F3EFE2" }} />
        <div
          className="absolute inset-0"
          style={{ background: "#153A28", clipPath: "polygon(0 0, 62% 0, 42% 100%, 0 100%)" }}
        />
        <div className="relative z-10 font-display font-bold text-[30px] text-white">{initials(data.name) || "??"}</div>
      </div>
    ),
    draw(ctx, data, w, h) {
      ctx.fillStyle = "#F3EFE2";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#153A28";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.62, 0);
      ctx.lineTo(w * 0.42, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      const pad = 55;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "600 18px monospace";
      ctx.fillText(truncate(ctx, (data.company || "Company").toUpperCase(), 420), pad, pad + 12);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 46px sans-serif";
      ctx.fillText(data.name || "Your Name", pad, h * 0.5);

      ctx.fillStyle = "#C9A24B";
      ctx.font = "600 20px monospace";
      ctx.fillText((data.title || "Your Title").toUpperCase(), pad, h * 0.5 + 40);

      ctx.textAlign = "right";
      ctx.fillStyle = "#153A28";
      ctx.font = "18px monospace";
      const parts = [data.phone, data.email, data.website].filter(Boolean);
      parts.forEach((p, i) => ctx.fillText(p, w - pad, h - 60 - i * 26));
      ctx.textAlign = "left";
    },
  },

  {
    id: "forest-gold",
    name: "Forest Gold",
    swatch: "linear-gradient(135deg,#0B2818,#123722 60%,#C9A24B)",
    recommended: true,
    Front: ({ data }) => {
      const shine: CSSProperties = {
        backgroundImage:
          "linear-gradient(100deg,#8A6422 0%,#F6E7B4 22%,#C9A24B 45%,#F9EFC8 55%,#9C7A30 78%,#EAD08A 100%)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      };
      return (
        <div
          className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden"
          style={{ background: "linear-gradient(135deg,#071C10 0%,#0F2A1B 100%)" }}
        >
          <div
            className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle,#F6E7B4,transparent 70%)" }}
          />
          <div className="flex items-center justify-between relative z-10">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-[15px]"
              style={{
                backgroundImage: "linear-gradient(135deg,#F6E7B4,#C9A24B 55%,#8A6422)",
                color: "#0B2818",
              }}
            >
              {initials(data.name) || "??"}
            </div>
            <span className="font-mono font-semibold text-[10px] tracking-[0.15em] uppercase" style={shine}>
              {data.company || "Company"}
            </span>
          </div>
          <div className="relative z-10">
            <div className="font-display font-bold text-[26px] leading-tight" style={shine}>
              {data.name || "Your Name"}
            </div>
            <div className="font-mono font-semibold text-[11px] tracking-[0.1em] uppercase mt-1" style={shine}>
              {data.title || "Your Title"}
            </div>
            <div
              className="h-px w-full my-3"
              style={{ background: "linear-gradient(90deg,transparent,#C9A24B 25%,#F6E7B4 50%,#C9A24B 75%,transparent)" }}
            />
            <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono font-medium text-[10.5px]">
              {data.phone && (
                <span className="inline-flex items-center gap-1.5" style={shine}>
                  <Phone className="h-3 w-3" style={{ color: "#C9A24B" }} /> {data.phone}
                </span>
              )}
              {data.email && (
                <span className="inline-flex items-center gap-1.5" style={shine}>
                  <Mail className="h-3 w-3" style={{ color: "#C9A24B" }} /> {data.email}
                </span>
              )}
              {data.website && (
                <span className="inline-flex items-center gap-1.5" style={shine}>
                  <Globe className="h-3 w-3" style={{ color: "#C9A24B" }} /> {data.website}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    },
    Back: ({ data }) => {
      const shine: CSSProperties = {
        backgroundImage: "linear-gradient(100deg,#8A6422 0%,#F6E7B4 30%,#C9A24B 55%,#F9EFC8 75%,#9C7A30 100%)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      };
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-3"
          style={{ background: "linear-gradient(135deg,#071C10 0%,#0F2A1B 100%)" }}
        >
          <div className="font-display font-bold text-[30px]" style={shine}>
            {initials(data.name) || "??"}
          </div>
          <div className="font-mono font-medium text-[10px] tracking-[0.25em] uppercase" style={shine}>
            {data.company || "Company"}
          </div>
        </div>
      );
    },
    draw(ctx, data, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#071C10");
      g.addColorStop(1, "#0F2A1B");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(w - 60, 40, 10, w - 60, 40, 220);
      glow.addColorStop(0, "rgba(246,231,180,0.18)");
      glow.addColorStop(1, "rgba(246,231,180,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const goldText = (x0: number, y0: number, x1: number, y1: number) => {
        const gr = ctx.createLinearGradient(x0, y0, x1, y1);
        gr.addColorStop(0, "#8A6422");
        gr.addColorStop(0.22, "#F6E7B4");
        gr.addColorStop(0.45, "#C9A24B");
        gr.addColorStop(0.6, "#F9EFC8");
        gr.addColorStop(0.8, "#9C7A30");
        gr.addColorStop(1, "#EAD08A");
        return gr;
      };

      const pad = 60;

      const circleGrad = ctx.createLinearGradient(pad, pad, pad + 68, pad + 60);
      circleGrad.addColorStop(0, "#F6E7B4");
      circleGrad.addColorStop(0.55, "#C9A24B");
      circleGrad.addColorStop(1, "#8A6422");
      ctx.fillStyle = circleGrad;
      ctx.beginPath();
      ctx.arc(pad + 34, pad + 30, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0B2818";
      ctx.font = "bold 30px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials(data.name) || "??", pad + 34, pad + 32);

      ctx.textAlign = "right";
      ctx.font = "600 20px monospace";
      ctx.fillStyle = goldText(w - 460, pad + 20, w - pad, pad + 20);
      ctx.fillText(truncate(ctx, (data.company || "Company").toUpperCase(), 420), w - pad, pad + 38);

      ctx.textAlign = "left";
      ctx.font = "bold 54px sans-serif";
      ctx.fillStyle = goldText(pad, h - 190, pad + 620, h - 190);
      ctx.fillText(data.name || "Your Name", pad, h - 190);

      ctx.font = "600 22px monospace";
      ctx.fillStyle = goldText(pad, h - 150, pad + 400, h - 150);
      ctx.fillText((data.title || "Your Title").toUpperCase(), pad, h - 150);

      const lineGrad = ctx.createLinearGradient(pad, h - 120, w - pad, h - 120);
      lineGrad.addColorStop(0, "rgba(201,162,75,0)");
      lineGrad.addColorStop(0.25, "rgba(201,162,75,0.6)");
      lineGrad.addColorStop(0.5, "rgba(246,231,180,0.85)");
      lineGrad.addColorStop(0.75, "rgba(201,162,75,0.6)");
      lineGrad.addColorStop(1, "rgba(201,162,75,0)");
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, h - 120);
      ctx.lineTo(w - pad, h - 120);
      ctx.stroke();

      ctx.font = "20px monospace";
      ctx.fillStyle = goldText(pad, h - 80, pad + 700, h - 80);
      const parts = [data.phone, data.email, data.website].filter(Boolean);
      ctx.fillText(truncate(ctx, parts.join("     "), w - pad * 2), pad, h - 80);
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

const CUSTOM_ID = "custom";
const STORAGE_KEY = "visiting-card:custom-colors";

/* ---------------------------------------------------------
   CUSTOM (COLOR-WHEEL DRIVEN) CARD FACES
--------------------------------------------------------- */

const CustomFront: FC<FaceProps & { colors: CustomColors }> = ({ data, colors }) => (
  <div
    className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden"
    style={{ background: colors.bg }}
  >
    <div
      className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-15"
      style={{ background: `radial-gradient(circle, ${colors.text}, transparent 70%)` }}
    />
    <div className="flex items-center justify-between relative z-10">
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-[15px]"
        style={{ background: colors.text, color: colors.bg }}
      >
        {initials(data.name) || "??"}
      </div>
      <span className="font-mono text-[10px] tracking-[0.15em] uppercase" style={{ color: colors.text }}>
        {data.company || "Company"}
      </span>
    </div>
    <div className="relative z-10">
      <div className="font-display font-bold text-[26px] leading-tight" style={{ color: colors.text }}>
        {data.name || "Your Name"}
      </div>
      <div className="font-mono text-[11px] tracking-[0.1em] uppercase mt-1" style={{ color: rgba(colors.text, 0.75) }}>
        {data.title || "Your Title"}
      </div>
      <div className="h-px w-full my-3" style={{ background: rgba(colors.text, 0.2) }} />
      <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10.5px]" style={{ color: rgba(colors.text, 0.7) }}>
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
);

const CustomBack: FC<FaceProps & { colors: CustomColors }> = ({ data, colors }) => (
  <div
    className="w-full h-full flex flex-col items-center justify-center gap-3"
    style={{ background: colors.bg }}
  >
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center font-display font-bold text-[24px]"
      style={{ background: colors.text, color: colors.bg }}
    >
      {initials(data.name) || "??"}
    </div>
    <div className="font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: rgba(colors.text, 0.6) }}>
      {data.company || "Company"}
    </div>
  </div>
);

function drawCustom(ctx: CanvasRenderingContext2D, data: CardData, w: number, h: number, colors: CustomColors) {
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, w, h);

  const pad = 60;
  ctx.fillStyle = colors.text;
  ctx.beginPath();
  ctx.arc(pad + 34, pad + 30, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.bg;
  ctx.font = "bold 30px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials(data.name) || "??", pad + 34, pad + 32);

  ctx.textAlign = "right";
  ctx.fillStyle = colors.text;
  ctx.font = "600 20px monospace";
  ctx.fillText(truncate(ctx, (data.company || "Company").toUpperCase(), 420), w - pad, pad + 38);

  ctx.textAlign = "left";
  ctx.fillStyle = colors.text;
  ctx.font = "bold 54px sans-serif";
  ctx.fillText(data.name || "Your Name", pad, h - 190);

  ctx.fillStyle = rgba(colors.text, 0.85);
  ctx.font = "600 22px monospace";
  ctx.fillText((data.title || "Your Title").toUpperCase(), pad, h - 150);

  ctx.strokeStyle = rgba(colors.text, 0.2);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, h - 120);
  ctx.lineTo(w - pad, h - 120);
  ctx.stroke();

  ctx.fillStyle = rgba(colors.text, 0.7);
  ctx.font = "20px monospace";
  const parts = [data.phone, data.email, data.website].filter(Boolean);
  ctx.fillText(truncate(ctx, parts.join("     "), w - pad * 2), pad, h - 80);
}

/* ---------------------------------------------------------
   COLOR WHEEL PICKER
   Hue/saturation ring (drag or click) + a lightness slider,
   plus a strip of named preset swatches for one-tap picks.
--------------------------------------------------------- */

const WHEEL_SIZE = 148;
const WHEEL_RADIUS = WHEEL_SIZE / 2;

const ColorWheel: FC<{ label: string; value: string; onChange: (hex: string) => void }> = ({ label, value, onChange }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const { h, s, l } = useMemo(() => hexToHsl(value), [value]);

  const setFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = wheelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), WHEEL_RADIUS);
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      angle = (angle + 360) % 360;
      const newS = dist / WHEEL_RADIUS;
      onChange(hslToHex(angle, newS, l));
    },
    [l, onChange]
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setFromPointer(e.clientX, e.clientY);
  };
  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    setFromPointer(e.clientX, e.clientY);
  };
  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer may already be released */
    }
  };

  const markerX = WHEEL_RADIUS + Math.cos((h * Math.PI) / 180) * s * WHEEL_RADIUS;
  const markerY = WHEEL_RADIUS + Math.sin((h * Math.PI) / 180) * s * WHEEL_RADIUS;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-stone-400">{label}</span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 pl-1 pr-2 py-0.5 font-mono text-[10px] text-stone-500"
        >
          <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ background: value }} />
          {value}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div
          ref={wheelRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative rounded-full cursor-crosshair shrink-0 touch-none select-none"
          style={{
            width: WHEEL_SIZE,
            height: WHEEL_SIZE,
            background:
              "radial-gradient(circle at center, #fff 0%, rgba(255,255,255,0) 62%), conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)] pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ left: markerX, top: markerY, background: value }}
          />
        </div>

        <div className="flex-1 flex flex-col gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[9.5px] uppercase tracking-wider text-stone-400">Lightness</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(l * 100)}
              onChange={(e) => onChange(hslToHex(h, s, Number(e.target.value) / 100))}
              className="w-full accent-amber-600"
            />
          </label>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="w-full h-8 rounded-[8px] border border-stone-200 cursor-pointer bg-transparent"
            aria-label={`${label} exact color`}
          />
        </div>
      </div>

      <div className="grid grid-cols-8 gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.name}
            title={c.name}
            onClick={() => onChange(c.hex)}
            className={`w-full aspect-square rounded-full border transition-transform hover:scale-110 ${
              value.toUpperCase() === c.hex.toUpperCase() ? "ring-2 ring-offset-1 ring-amber-500" : "border-black/10"
            }`}
            style={{ background: c.hex }}
          />
        ))}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */

export default function VisitingCardGenerator() {
  const [data, setData] = useState<CardData>(DEFAULT_DATA);
  const [themeId, setThemeId] = useState<string>(THEMES[0].id);
  const [customColors, setCustomColors] = useState<CustomColors>(DEFAULT_CUSTOM);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [storageLoaded, setStorageLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isCustom = themeId === CUSTOM_ID;
  const theme = useMemo<Theme | null>(() => THEMES.find((t) => t.id === themeId) ?? null, [themeId]);

  // Load any previously-saved custom palette on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // @ts-ignore - window.storage is injected by the artifact host
        const res = await window.storage?.get(STORAGE_KEY, false);
        if (!cancelled && res?.value) {
          const parsed = JSON.parse(res.value);
          if (parsed?.bg && parsed?.text) setCustomColors(parsed);
        }
      } catch {
        /* no saved palette yet — keep defaults */
      } finally {
        if (!cancelled) setStorageLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update =
    (key: keyof CardData) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setData((d) => ({ ...d, [key]: e.target.value }));

  const saveCustomPalette = async () => {
    try {
      // @ts-ignore
      const res = await window.storage?.set(STORAGE_KEY, JSON.stringify(customColors), false);
      setSaveState(res ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
    setTimeout(() => setSaveState("idle"), 1800);
  };

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
    if (isCustom) {
      drawCustom(ctx, data, w, h, customColors);
    } else if (theme) {
      theme.draw(ctx, data, w, h);
    }

    const link = document.createElement("a");
    link.download = `${(data.name || "visiting-card").replace(/\s+/g, "-").toLowerCase()}-${themeId}.png`;
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
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 3px; }
        input[type="color"]::-webkit-color-swatch { border-radius: 6px; border: none; }
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
            <p className="text-[13.5px] text-stone-500 mt-1">Fill in your details, pick a theme or mix your own colors, and export print-ready.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* LEFT: form + themes + colors */}
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
                      className={`group relative flex flex-col items-center gap-1.5 rounded-[10px] p-1.5 transition-all ${
                        active ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-white" : ""
                      }`}
                    >
                      {t.recommended && (
                        <span className="absolute -top-1.5 -right-1 z-10 inline-flex items-center gap-0.5 rounded-full bg-amber-500 text-white px-1.5 py-[1px] text-[8.5px] font-mono font-semibold shadow">
                          <Star className="h-2.5 w-2.5 fill-white" /> Best
                        </span>
                      )}
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

                {/* Custom colors tile */}
                <button
                  onClick={() => setThemeId(CUSTOM_ID)}
                  className={`group flex flex-col items-center gap-1.5 rounded-[10px] p-1.5 transition-all ${
                    isCustom ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-white" : ""
                  }`}
                >
                  <div
                    className="w-full aspect-[1.75] rounded-[8px] border border-stone-200 relative overflow-hidden flex items-center justify-center"
                    style={{
                      background:
                        "conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <Palette className="h-4 w-4 text-white drop-shadow" />
                    </div>
                    {isCustom && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Check className="h-4 w-4 text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[9.5px] text-stone-500 group-hover:text-stone-800 text-center leading-tight">
                    Custom colors
                  </span>
                </button>
              </div>
            </div>

            {/* Custom color-wheel panel — only shown once "Custom colors" is selected */}
            {isCustom && (
              <div className="bg-white border border-stone-200 rounded-[16px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="border-b border-dashed border-stone-200 bg-stone-50 px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-wider uppercase text-stone-500 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Pick your colors
                  </span>
                  <button
                    onClick={() => setCustomColors({ ...customColors, text: readableTextFor(customColors.bg) })}
                    className="font-mono text-[10px] text-stone-400 hover:text-stone-700 underline decoration-dotted underline-offset-2"
                  >
                    auto-contrast text
                  </button>
                </div>
                <div className="p-4 sm:p-5 space-y-6">
                  <ColorWheel
                    label="Card background"
                    value={customColors.bg}
                    onChange={(hex) => setCustomColors((c) => ({ ...c, bg: hex }))}
                  />
                  <div className="h-px bg-stone-100" />
                  <ColorWheel
                    label="Text color"
                    value={customColors.text}
                    onChange={(hex) => setCustomColors((c) => ({ ...c, text: hex }))}
                  />

                  <button
                    onClick={saveCustomPalette}
                    disabled={!storageLoaded}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-stone-900 text-white px-4 py-2.5 text-[13px] font-medium hover:bg-stone-800 active:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    {saveState === "saved" ? <Check className="h-4 w-4 text-emerald-400" /> : <Save className="h-4 w-4" />}
                    {saveState === "saved" ? "Palette saved" : saveState === "error" ? "Couldn't save — try again" : "Save this palette"}
                  </button>
                  <p className="font-mono text-[9.5px] text-stone-400 -mt-3.5">
                    Saved palettes are remembered next time you open this card studio.
                  </p>
                </div>
              </div>
            )}
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
                      {isCustom ? <CustomFront data={data} colors={customColors} /> : theme && <theme.Front data={data} />}
                    </div>
                  </div>
                  <div className="flip-face flip-back absolute inset-0 rounded-[16px] overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)]">
                    <div className="card-face-scaler">
                      {isCustom ? <CustomBack data={data} colors={customColors} /> : theme && <theme.Back data={data} />}
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