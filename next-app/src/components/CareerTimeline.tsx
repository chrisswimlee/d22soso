"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Gamepad2, Lightbulb, Spade, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CATEGORY_LABEL,
  TIMELINE,
  type TimelineCategory,
  type TimelineMilestone,
} from "@/lib/timeline";

type Filter = "all" | TimelineCategory;

const FILTERS: Filter[] = ["all", "esports", "poker", "patents"];

const CATEGORY_ICON = {
  esports: Gamepad2,
  poker: Spade,
  patents: Lightbulb,
} as const;

export default function CareerTimeline() {
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<TimelineMilestone | null>(null);

  const items = useMemo(() => {
    const list =
      filter === "all" ? TIMELINE : TIMELINE.filter((m) => m.category === filter);
    return [...list].sort((a, b) => a.sortYear - b.sortYear);
  }, [filter]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <section id="timeline" className="section-anchor relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-10 max-w-2xl">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-slate-50 sm:text-5xl">
          Esports to Poker
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-400 sm:text-lg">
          Milestones across competitive gaming, poker & media, and patented casino inventions.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Timeline filters"
        className="mb-12 flex flex-wrap gap-2"
      >
        {FILTERS.map((key) => {
          const selected = filter === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(key)}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none ${
                selected
                  ? "bg-gold/20 text-gold-soft ring-1 ring-gold/45"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {CATEGORY_LABEL[key]}
            </button>
          );
        })}
      </div>

      <ol className="relative space-y-0 border-l border-gold/30 pl-6 sm:pl-10">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            const Icon = CATEGORY_ICON[item.category];
            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
                className="relative pb-12 last:pb-0"
              >
                <span className="absolute top-1.5 -left-[1.9rem] flex h-6 w-6 items-center justify-center sm:-left-[2.6rem]">
                  <span className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_12px_rgba(212,175,55,0.55)]" />
                </span>

                <button
                  type="button"
                  onClick={() => setActive(item)}
                  className="group w-full text-left focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-xs text-gold">{item.year}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                      <Icon className="h-3 w-3 text-emerald-glow" />
                      {CATEGORY_LABEL[item.category]}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-50 transition group-hover:text-gold-soft sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                    {item.summary}
                  </p>
                  <p className="mt-3 text-xs font-medium tracking-wide text-gold/80 uppercase">
                    Details
                  </p>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:items-center"
            onClick={() => setActive(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="timeline-modal-title"
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/30 bg-slate-950 p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-gold">{active.year}</p>
                  <h3
                    id="timeline-modal-title"
                    className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight text-slate-50"
                  >
                    {active.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                {active.detail}
              </p>
              {active.link && (
                <a
                  href={active.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gold-soft hover:underline focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
                >
                  {active.link.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
