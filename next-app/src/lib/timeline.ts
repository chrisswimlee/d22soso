export type TimelineCategory = "esports" | "poker" | "patents";

export type TimelineMilestone = {
  id: string;
  year: string;
  sortYear: number;
  category: TimelineCategory;
  title: string;
  summary: string;
  detail: string;
  link?: { href: string; label: string };
};

export const TIMELINE: TimelineMilestone[] = [
  {
    id: "cnc-1996",
    year: "1996",
    sortYear: 1996,
    category: "esports",
    title: "Case's Ladder #1 — Command & Conquer",
    summary: "Dominated Tiberian Dawn ladder as SoSOWAC with Team Synergy.",
    detail:
      "Reached #1 on Case's Ladder in both 1v1 and teams for Command & Conquer: Tiberian Dawn — early proof of competitive instinct before StarCraft defined a generation.",
  },
  {
    id: "wc2-1997",
    year: "1997",
    sortYear: 1997,
    category: "esports",
    title: "Warcraft II Ladder Peak",
    summary: "Case's / Kali.net Team Ladder #1 with Clan C4L.",
    detail:
      "As SoSOWAC with Clan C4L, topped Warcraft II team ladder rankings on Case's and Kali.net — building the multi-theater strategist identity.",
  },
  {
    id: "sc-ladder-1998",
    year: "1998",
    sortYear: 1998.4,
    category: "esports",
    title: "StarCraft Case's Ladder #1",
    summary: "Hit #1 in 1v1 and teams shortly after StarCraft's release.",
    detail:
      "When StarCraft launched in April 1998, Chiang climbed to Case's Ladder #1 in both 1v1 and teams with C4L — then won an early tournament at Neutral Ground Mountain View.",
  },
  {
    id: "pimpest-1998",
    year: "1998–99",
    sortYear: 1998.8,
    category: "esports",
    title: "Pimpest Plays & GX StarCraft",
    summary: "Created Pimpest Plays and authored GX StarCraft battle reports.",
    detail:
      "Alongside Thresh and Calbear on Gamers.com, Chiang helped invent the highlight-reel culture of esports through Pimpest Plays and ladder battle reports — a template still echoed in modern esports media.",
  },
  {
    id: "bw-champ-1999",
    year: "1999",
    sortYear: 1999.4,
    category: "esports",
    title: "1999 Brood War World Champion",
    summary: "First official Blizzard Brood War Season 1 Ladder Tournament champion — Random.",
    detail:
      "On April 28, 1999, Wayne \"D22-soso\" Chiang won Blizzard's first official StarCraft: Brood War Season 1 Ladder Tournament World Championship ($2,500), playing Random. Renamed D22-soso by Dennis \"Thresh\" Fong.",
    link: {
      href: "https://liquipedia.net/starcraft/Soso",
      label: "Liquipedia — Soso",
    },
  },
  {
    id: "poker-career",
    year: "2000s–",
    sortYear: 2005,
    category: "poker",
    title: "High-Stakes Poker Professional",
    summary: "Decade-plus career in cash games and strategy edge work.",
    detail:
      "Built a long-form poker career spanning high-stakes cash, advantage-play study, and coaching — applying the same probabilistic discipline forged in competitive RTS.",
  },
  {
    id: "latb",
    year: "2010s–2021",
    sortYear: 2015,
    category: "poker",
    title: "Live at the Bike",
    summary: "Co-owner & lead producer; grew peak concurrents 2,500 → 8,800.",
    detail:
      "As co-owner and lead producer of Live at the Bike (Joker Gaming LLC), Chiang helped scale peak concurrent viewers from 2,500 to 8,800 and drove a ~40% revenue increase. Hosted PokerCraft Podcast with Hellmuth, Negreanu, Greenstein, and more. Buyout closed May 2021.",
  },
  {
    id: "2hh-patent-2021",
    year: "2021",
    sortYear: 2021,
    category: "patents",
    title: "2 Hand Hold'em — First US Patent",
    summary: "US Patent 11,117,045 granted for the dual-hand Hold'em format.",
    detail:
      "2 Hand Hold'em deals four hole cards split into two independent 2-card hands against one community board. Main-game house edge published at 4.06%. Assignee: 2 HH LLC.",
  },
  {
    id: "2hh-patents-later",
    year: "2023–24",
    sortYear: 2023.5,
    category: "patents",
    title: "Additional 2HH Patent Grants",
    summary: "US Patents 11,731,032 and 12,005,342 expand the IP portfolio.",
    detail:
      "Follow-on grants strengthened the 2 Hand Hold'em patent family. The game received WSGC approval submission #3192 and went live at Great American Casino Tukwila via Maverick Gaming.",
  },
  {
    id: "wsop-2025",
    year: "2025",
    sortYear: 2025,
    category: "poker",
    title: "WSOP Talent Manager",
    summary: "Media Team Talent Manager and Vlogger Program lead.",
    detail:
      "Active as World Series of Poker Talent Manager (Media Team) from April 2025, including the Vlogger Program — bridging pioneer esports storytelling with modern poker media. Interviewed SlayerS_BoxeR at the 2025 WSOP.",
  },
  {
    id: "book-2026",
    year: "2026",
    sortYear: 2026,
    category: "poker",
    title: "Betting on Yourself",
    summary: "Co-authored with Joe Matton (Kendall Hunt) — WEB framework.",
    detail:
      "Published Betting on Yourself with Joe Matton via Kendall Hunt, translating competitive decision frameworks from esports and poker into a personal operating system for high-stakes choices.",
  },
];

export const CATEGORY_LABEL: Record<TimelineCategory | "all", string> = {
  all: "All",
  esports: "Esports",
  poker: "Poker",
  patents: "Patents",
};
