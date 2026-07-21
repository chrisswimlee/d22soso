"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Dices, Radio, Spade, Club, Heart, Diamond, Gamepad2 } from "lucide-react";
import YouTubeEmbed from "./YouTubeEmbed";

const patents = [
  { number: "11,117,045", label: "US Patent" },
  { number: "11,731,032", label: "US Patent" },
];

const suits = [Spade, Heart, Diamond, Club];

export default function CasinoSection() {
  return (
    <section id="casino" className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-10 flex flex-col items-start gap-3 sm:mb-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-amber-300">
          <Dices className="h-3.5 w-3.5" />
          Casino Innovations
        </span>
        <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-4xl">
          Patented play, reimagined for the modern floor.
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Original casino IP built from a champion&apos;s understanding of odds, psychology, and pace.
        </p>
      </div>

      {/* Featured game: 2 Hand Hold'em */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-rose-600/5 to-transparent"
      >
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:gap-10 lg:p-10">
          {/* Copy + patents */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 flex items-center gap-1.5">
              {suits.map((Suit, i) => (
                <Suit
                  key={i}
                  className={`h-4 w-4 ${i % 2 === 0 ? "text-slate-300" : "text-rose-400"}`}
                />
              ))}
            </div>
            <h3 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              2 Hand Hold&apos;em
            </h3>
            <p className="mt-3 max-w-md text-base leading-relaxed text-slate-300">
              A twist on Texas Hold&apos;em that lets players work two hands at once — doubling the
              decisions, the drama, and the action per round.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {patents.map((patent) => (
                <div
                  key={patent.number}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2"
                >
                  <BadgeCheck className="h-4 w-4 text-amber-300" />
                  <span className="text-sm">
                    <span className="block text-[10px] font-medium uppercase tracking-widest text-amber-300/80">
                      {patent.label}
                    </span>
                    <span className="font-mono font-medium text-slate-100">{patent.number}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive game demo placeholder */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_center,_var(--color-emerald-900)_0%,_var(--color-slate-950)_75%)]">
            {/* Felt texture accent */}
            <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_12px)]" />

            {/* Two facedown hands */}
            <div className="absolute inset-x-0 top-8 flex items-center justify-center gap-8">
              {[0, 1].map((hand) => (
                <div key={hand} className="flex -space-x-4">
                  {[0, 1].map((card) => (
                    <motion.div
                      key={card}
                      initial={{ rotate: card === 0 ? -8 : 8, y: 6 }}
                      whileInView={{ rotate: card === 0 ? -8 : 8, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: hand * 0.1 + card * 0.05 }}
                      className="h-20 w-14 rounded-lg border border-white/20 bg-gradient-to-br from-rose-600 to-rose-800 shadow-lg sm:h-24 sm:w-16"
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur-sm">
                <Gamepad2 className="h-3.5 w-3.5" />
                Interactive demo coming soon
              </span>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full bg-amber-500/90 px-5 py-2.5 text-sm font-semibold text-slate-950 opacity-70"
              >
                Launch demo
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Live at the Bike */}
      <div id="live-at-the-bike" className="mt-16 sm:mt-20">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-rose-300">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            Live
          </span>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-50">Live at the Bike</h3>
        </div>
        <p className="mb-6 max-w-2xl text-base leading-relaxed text-slate-400">
          Featured play and commentary from the legendary streamed cash games at the Bicycle Casino.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <YouTubeEmbed
            videoId="dQw4w9WgXcQ"
            title="2 Hand Hold'em — Live at the Bike feature"
            caption="Patented gameplay hits the felt on the world's longest-running poker stream."
          />
          <YouTubeEmbed
            videoId="dQw4w9WgXcQ"
            title="Designer breakdown — strategy & odds"
            caption="How a StarCraft World Champion approaches game design and edge."
          />
        </div>
      </div>
    </section>
  );
}
