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
    date: "1998",
    title: "Case's Ladder #1 — Team",
    description: "Topped the StarCraft team ladder, carrying momentum from C&C and WarCraft II reigns.",
    Icon: Swords,
  },
  {
    date: "1998",
    title: "First StarCraft Tournament Winner",
    description:
      "Won the inaugural StarCraft tournament at Neutral Ground, Mountain View — the first title in the game's history.",
    Icon: Trophy,
    highlight: true,
  },
  {
    date: "Oct 1998",
    title: "StarCraft's First Caster",
    description: "Took the mic for PGL Season 3, becoming StarCraft's first-ever tournament commentator.",
    Icon: Mic,
  },
  {
    date: "Feb 1999",
    title: "B.net vs. Kali — #2 Seed",
    description: "Seeded #2 heading into the showdown against rival Guillaume Patry.",
    Icon: Medal,
  },
  {
    date: "Apr 1999",
    title: "Brood War World Champion",
    description:
      "Playing Random, took Blizzard's first official World Championship — beating Patry in a 38-minute Lost Temple semi, then Crexis for $2,500.",
    Icon: Crown,
    highlight: true,
  },
  {
    date: "May 1999",
    title: "PGL Season 4 — 2nd Place",
    description: "Runner-up at the PGL Season 4 StarCraft World Championship.",
    Icon: Medal,
  },
  {
    date: "Jun 1999",
    title: "USA vs. Canada — MVP",
    description: "Named MVP of the cross-border showcase.",
    Icon: Star,
  },
  {
    date: "Jul 1999",
    title: "Sports Seoul Brood War #5",
    description: "Ranked #5 as the scene's center of gravity shifted toward South Korea.",
    Icon: Medal,
  },
  {
    date: "Jul 1999",
    title: "World Champions Invitational #3",
    description: "Placed 3rd at the StarCraft World Champions Invitational.",
    Icon: Medal,
  },
  {
    date: "Sep 1999",
    title: "B.net World Championships #3",
    description: "Closed out the year 3rd at the Battle.net World Championships.",
    Icon: Medal,
  },
];

const interviews = [
  {
    videoId: "dQw4w9WgXcQ",
    title: "D22-soso on the Dawn of Esports",
    caption: "Reflecting on Case's Ladder, the first StarCraft tournament, and life on the microphone.",
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "Meeting SlayerS_BoxeR at the 2025 WSOP",
    caption: "The man who built the throne meets the man who sat on it.",
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
