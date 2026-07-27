"use client";

import { motion } from "framer-motion";
import { Trophy, Swords, Mic, Crown, Medal, Star } from "lucide-react";
import YouTubeEmbed from "./YouTubeEmbed";

type TimelineEntry = {
  date: string;
  title: string;
  description: string;
  Icon: typeof Trophy;
  highlight?: boolean;
};

const timeline: TimelineEntry[] = [
  {
    date: "Apr 1998",
    title: "Case's Ladder #1 — 1v1 & Teams",
    description:
      "Hit #1 shortly after StarCraft's release, after SuperPeon mailed him the game — and held top-10 Battle.net ranks through seasons 1–4.",
    Icon: Swords,
  },
  {
    date: "Apr 1998",
    title: "First StarCraft Tournament Winner",
    description:
      "Won the inaugural 20-player StarCraft tournament at Neutral Ground, Mountain View vs Jay “Gadianton” Severson — $250.",
    Icon: Trophy,
    highlight: true,
  },
  {
    date: "Oct 1998",
    title: "StarCraft's First Caster",
    description:
      "Missed PGL Season 3 registration by one day; took the mic instead — StarCraft's first-ever tournament commentator.",
    Icon: Mic,
  },
  {
    date: "Jan 1999",
    title: "B.net vs. Kali — #2 Seed",
    description: "Seeded #2; fell 2–3 to rival Guillaume “Grrrr…” Patry.",
    Icon: Medal,
  },
  {
    date: "Apr 1999",
    title: "Brood War World Champion",
    description:
      "Playing Random, bested Nautosoft, Shin Ju Young, and Grrrr… (Lost Temple semi) then Crexis (Chris Low) on Showdown Game 5 (35:37) — Blizzard’s first official Brood War world title ($2,500).",
    Icon: Crown,
    highlight: true,
  },
  {
    date: "May 1999",
    title: "PGL Season 4 — 2nd Place",
    description: "Runner-up at the PGL Season 4 StarCraft World Championship ($7,000).",
    Icon: Medal,
  },
  {
    date: "Jun 1999",
    title: "USA vs. Canada — MVP",
    description: "Named MVP of the cross-border showcase with a 3–0 performance.",
    Icon: Star,
  },
  {
    date: "Jul 1999",
    title: "Sports Seoul Brood War — 5th–8th",
    description: "Placed 5th–8th ($850) as the scene’s center of gravity shifted toward South Korea.",
    Icon: Medal,
  },
  {
    date: "Aug 1999",
    title: "World Champions Invitational #3",
    description: "Placed 3rd at the StarCraft World Champions Invitational ($1,500).",
    Icon: Medal,
  },
  {
    date: "Sep 1999",
    title: "B.net World Championship Finals #3",
    description: "Closed out the year 3rd at the Battle.net World Championship Finals ($1,000).",
    Icon: Medal,
  },
];

const interviews = [
  {
    videoId: "CHd4-eZx2Do",
    title: "Zombie Grub — Comprehensive StarCraft Interview",
    caption:
      "Case’s Ladder, the first caster’s mic, the Random world title path, and life after Brood War.",
  },
  {
    videoId: "92bufUCAF6k",
    title: "Tasteless & Artosis — D22-soso Throwback",
    caption: "Brood War-era lore with the casters who carried the scene forward.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function EsportsSection() {
  return (
    <section id="esports" className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-10 flex flex-col items-start gap-3 sm:mb-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-300">
          <Trophy className="h-3.5 w-3.5" />
          Esports Legacy
        </span>
        <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-4xl">
          The 1990s: Pouring the concrete for modern esports.
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          From Case&apos;s Ladder to Blizzard&apos;s first World Championship — a run that defined
          competition, commentary, and content creation.
        </p>
      </div>

      {/* Timeline */}
      <ol className="relative ml-2 border-l border-white/10 sm:ml-4">
        {timeline.map((entry, i) => (
          <motion.li
            key={`${entry.date}-${entry.title}`}
            variants={cardVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, ease: "easeOut", delay: (i % 3) * 0.05 }}
            className="relative mb-8 pl-8 sm:pl-12"
          >
            {/* Node */}
            <span
              className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border sm:-left-[15px] ${
                entry.highlight
                  ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-300"
                  : "border-white/15 bg-slate-900 text-slate-400"
              }`}
            >
              <entry.Icon className="h-3.5 w-3.5" />
            </span>

            <div
              className={`rounded-2xl border p-5 transition-colors sm:p-6 ${
                entry.highlight
                  ? "border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-transparent"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-widest ${
                  entry.highlight ? "text-cyan-300" : "text-slate-500"
                }`}
              >
                {entry.date}
              </p>
              <h3 className="mt-1.5 text-lg font-semibold text-slate-50 sm:text-xl">{entry.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
                {entry.description}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>

      {/* Historical interviews */}
      <div className="mt-16 sm:mt-20">
        <h3 className="mb-6 text-2xl font-semibold tracking-tight text-slate-50">
          Historical interviews
        </h3>
        <div className="grid gap-6 sm:grid-cols-2">
          {interviews.map((interview, i) => (
            <YouTubeEmbed
              key={i}
              videoId={interview.videoId}
              title={interview.title}
              caption={interview.caption}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
