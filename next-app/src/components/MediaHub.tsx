"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ExternalLink, Mic2, Radio, Search } from "lucide-react";
import { useMemo, useState } from "react";
import YouTubeEmbed from "./YouTubeEmbed";
import {
  MEDIA_ITEMS,
  MEDIA_TABS,
  SUGGESTED_KEYWORDS,
  type MediaTab,
} from "@/lib/media";

const TAB_ICONS = {
  podcasts: Mic2,
  live: Radio,
  articles: BookOpen,
} as const;

const SHORT_LABEL: Record<MediaTab, string> = {
  podcasts: "Podcasts",
  live: "Live / Cash",
  articles: "Archive",
};

export default function MediaHub() {
  const [tab, setTab] = useState<MediaTab>("podcasts");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEDIA_ITEMS.filter((item) => {
      if (item.tab !== tab) return false;
      if (!q) return true;
      const hay = [item.title, item.outlet, item.summary, ...item.tags]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [tab, query]);

  const featuredVideo = filtered.find((i) => i.youtubeId);

  return (
    <section id="media" className="section-anchor relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-10 max-w-2xl">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-slate-50 sm:text-5xl">
          Media
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-400 sm:text-lg">
          Podcasts, Live at the Bike highlights, and esports history — filter by topic.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Media categories"
        className="mb-5 flex flex-wrap gap-2"
      >
        {MEDIA_TABS.map((t) => {
          const Icon = TAB_ICONS[t.id];
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.id)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none sm:px-4 ${
                selected
                  ? "bg-gold/20 text-gold-soft ring-1 ring-gold/45"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="sm:hidden">{SHORT_LABEL[t.id]}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-8">
        <label htmlFor="media-search" className="sr-only">
          Filter media by keyword
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="media-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by keyword: Poker, Brood War, Game Design"
            className="min-h-12 w-full border-b border-white/15 bg-transparent py-3 pr-4 pl-10 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-gold/50"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => setQuery(kw)}
              className="min-h-9 px-2 text-xs text-slate-500 transition hover:text-gold focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:outline-none"
            >
              {kw}
            </button>
          ))}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="min-h-9 px-2 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {featuredVideo?.youtubeId && (
        <div className="mb-10">
          <YouTubeEmbed
            videoId={featuredVideo.youtubeId}
            title={featuredVideo.title}
            caption={featuredVideo.outlet}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.ul
          key={`${tab}-${query}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="divide-y divide-white/10"
        >
          {filtered.length === 0 && (
            <li className="py-10 text-center text-sm text-slate-500">
              No media matches that keyword in this tab.
            </li>
          )}
          {filtered.map((item) => {
            const external = !item.href.startsWith("#");
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="group flex items-start justify-between gap-4 py-5 transition hover:bg-white/[0.02] focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:outline-none"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] tracking-wide text-gold/80 uppercase">
                      {item.outlet}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-50 transition group-hover:text-gold-soft sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
                      {item.summary}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-[11px] text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {external && (
                    <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-gold" />
                  )}
                </a>
              </li>
            );
          })}
        </motion.ul>
      </AnimatePresence>
    </section>
  );
}
