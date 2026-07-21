"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dices, Gamepad2, ArrowUpRight } from "lucide-react";
import { useState } from "react";

type PanelId = "esports" | "casino";

type Panel = {
  id: PanelId;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  Icon: typeof Gamepad2;
  gradient: string;
  glow: string;
  accentText: string;
};

const panels: Panel[] = [
  {
    id: "esports",
    eyebrow: "A decade at the top",
    title: "Esports Legacy",
    description:
      "Championship rosters, sold-out arenas, and a fanbase built on relentless competition.",
    cta: "Explore the legacy",
    Icon: Gamepad2,
    gradient: "from-cyan-500/30 via-indigo-600/20 to-slate-950",
    glow: "bg-cyan-400/20",
    accentText: "text-cyan-300",
  },
  {
    id: "casino",
    eyebrow: "The next frontier",
    title: "Casino Innovations",
    description:
      "Reimagining play with provably fair tables, live dealers, and immersive digital floors.",
    cta: "Discover what's new",
    Icon: Dices,
    gradient: "from-amber-500/30 via-rose-600/20 to-slate-950",
    glow: "bg-amber-400/20",
    accentText: "text-amber-300",
  },
];

export default function Hero() {
  const [active, setActive] = useState<PanelId | null>(null);

  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="mb-8 flex flex-col items-start gap-3 sm:mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
          Two worlds. One brand.
        </span>
        <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          Choose your side of the story.
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Tap a panel to dive into where we&apos;ve been — and where we&apos;re headed next.
        </p>
      </div>

      {/* Split screen: stacks vertically on mobile, side-by-side on desktop */}
      <div className="flex min-h-[34rem] flex-col gap-3 sm:min-h-[28rem] sm:flex-row">
        {panels.map((panel) => {
          const isActive = active === panel.id;
          const isDimmed = active !== null && !isActive;

          return (
            <motion.button
              key={panel.id}
              type="button"
              onClick={() => setActive(isActive ? null : panel.id)}
              onHoverStart={() => setActive(panel.id)}
              onHoverEnd={() => setActive(null)}
              animate={{ flexGrow: isActive ? 2.4 : isDimmed ? 0.7 : 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className="group relative flex-1 overflow-hidden rounded-3xl border border-white/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={{ flexBasis: 0 }}
            >
              {/* Gradient wash */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${panel.gradient} transition-opacity duration-500 ${
                  isDimmed ? "opacity-40" : "opacity-100"
                }`}
              />
              {/* Soft glow blob */}
              <motion.div
                aria-hidden
                animate={{ scale: isActive ? 1.15 : 1, opacity: isActive ? 0.9 : 0.6 }}
                transition={{ duration: 0.6 }}
                className={`pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl ${panel.glow}`}
              />

              <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center rounded-2xl bg-white/10 p-3 backdrop-blur-sm ${panel.accentText}`}
                  >
                    <panel.Icon className="h-6 w-6" />
                  </span>
                  <motion.span
                    animate={{ rotate: isActive ? 45 : 0, opacity: isActive ? 1 : 0.5 }}
                    className="text-slate-200"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </motion.span>
                </div>

                <div className="mt-8">
                  <p className={`text-xs font-medium uppercase tracking-widest ${panel.accentText}`}>
                    {panel.eyebrow}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
                    {panel.title}
                  </h2>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
                          {panel.description}
                        </p>
                        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-100">
                          {panel.cta}
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile-friendly explicit toggle */}
      <div className="mt-6 flex items-center justify-center gap-2 sm:hidden">
        {panels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            onClick={() => setActive(active === panel.id ? null : panel.id)}
            className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
              active === panel.id
                ? "border-white/30 bg-white/15 text-slate-50"
                : "border-white/10 bg-white/5 text-slate-400"
            }`}
          >
            {panel.title}
          </button>
        ))}
      </div>
    </section>
  );
}
