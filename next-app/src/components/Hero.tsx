"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Spade } from "lucide-react";

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const fade = (delay: number) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: "easeOut" as const },
        };

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] w-full items-end overflow-hidden sm:items-center"
    >
      <div className="absolute inset-0" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/champ-trophy.webp"
          alt=""
          className="h-full w-full object-cover object-[center_18%] opacity-70 sm:opacity-[0.78]"
        />
        {/* Bottom vignette only — keep the trophy readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-20">
        <motion.p
          {...fade(0)}
          className="font-[family-name:var(--font-display)] text-5xl tracking-tight text-gold sm:text-7xl md:text-8xl"
        >
          D22-soso
        </motion.p>

        <motion.p
          {...fade(0.1)}
          className="mt-2 text-sm font-medium tracking-[0.22em] text-slate-300 uppercase sm:text-base"
        >
          Wayne Chiang
        </motion.p>

        <motion.h1
          {...fade(0.2)}
          className="mt-8 max-w-3xl text-2xl leading-snug font-semibold tracking-tight text-slate-50 sm:text-4xl sm:leading-tight"
        >
          Pioneer of Esports. High-Stakes Poker Player. Casino Game Inventor.
        </motion.h1>

        <motion.p
          {...fade(0.32)}
          className="mt-4 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg"
        >
          From the first official StarCraft: Brood War World Championship in 1999 to patented
          casino floors — one strategist across every theater.
        </motion.p>

        <motion.div {...fade(0.44)} className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#twohh"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-gold/50 bg-gold/20 px-5 py-3 text-sm font-semibold text-gold-soft transition hover:bg-gold/30 focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none"
          >
            <Spade className="h-4 w-4" />
            Play 2 Hand Hold&apos;em
          </a>
          <a
            href="#timeline"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 bg-black/30 px-5 py-3 text-sm font-semibold text-slate-100 backdrop-blur-sm transition hover:border-gold/40 hover:text-gold-soft focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
          >
            Career Story
            <ArrowDown className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
