export type MediaTab = "podcasts" | "live" | "articles";

export type MediaItem = {
  id: string;
  tab: MediaTab;
  title: string;
  outlet: string;
  summary: string;
  href: string;
  tags: string[];
  youtubeId?: string;
};

export const MEDIA_TABS: { id: MediaTab; label: string }[] = [
  { id: "podcasts", label: "Podcasts & Interviews" },
  { id: "live", label: "Live at the Bike / Cash" },
  { id: "articles", label: "Articles & Esports History" },
];

export const MEDIA_ITEMS: MediaItem[] = [
  {
    id: "jeff-gross",
    tab: "podcasts",
    title: "StarCraft World Champion, WSOP Talent Manager, Betting on Yourself",
    outlet: "Jeff Gross Podcast",
    summary:
      "Career arc from Brood War championship to poker media leadership and the Betting on Yourself framework.",
    href: "https://jeffgrosspodcast.podbean.com/e/wayne-chiang-starcraft-world-champion-wsop-talent-manager-betting-on-yourself/",
    tags: ["Poker", "Brood War", "Game Design"],
  },
  {
    id: "table-1",
    tab: "podcasts",
    title: "He Made Millions Playing Poker — Then His Side Hustle Did Even Better",
    outlet: "Table 1 Podcast",
    summary: "Poker career, casino invention, and the economics of patented table games.",
    href: "https://creators.spotify.com/pod/profile/table-1-podcast/episodes/He-Made-Millions-Playing-PokerThen-His-Side-Hustle-Did-Even-Better-e3gouut",
    tags: ["Poker", "Game Design"],
  },
  {
    id: "sc-interview",
    tab: "podcasts",
    title: "Oral History — StarCraft Interview",
    outlet: "YouTube",
    summary: "Full interview covering the 1999 championship era and Random play identity.",
    href: "https://www.youtube.com/watch?v=CHd4-eZx2Do",
    tags: ["Brood War", "Esports"],
    youtubeId: "CHd4-eZx2Do",
  },
  {
    id: "cube-interview",
    tab: "podcasts",
    title: "Cube Draft Origins Interview",
    outlet: "YouTube",
    summary: "Discussion of Cube Draft contributions and strategy-game design thinking.",
    href: "https://www.youtube.com/watch?v=MNjLKeA-08A",
    tags: ["Game Design", "MTG"],
    youtubeId: "MNjLKeA-08A",
  },
  {
    id: "wayne-yt",
    tab: "live",
    title: "Wayne Chiang Poker — Channel Hub",
    outlet: "YouTube",
    summary: "Cash-game vlogs, Live at the Bike era content, and modern poker media.",
    href: "https://www.youtube.com/@WayneChiangPoker",
    tags: ["Poker", "Live at the Bike"],
  },
  {
    id: "latb-era",
    tab: "live",
    title: "Live at the Bike Broadcast Era",
    outlet: "LATB / Joker Gaming",
    summary:
      "Co-owner and lead producer years — peak concurrents scaled 2,500 → 8,800 with PokerCraft guests.",
    href: "https://www.youtube.com/@WayneChiangPoker",
    tags: ["Poker", "Live at the Bike"],
  },
  {
    id: "wsop-media",
    tab: "live",
    title: "WSOP Talent & Vlogger Program",
    outlet: "World Series of Poker",
    summary: "Talent Manager role bridging pioneer esports storytelling with poker media desks.",
    href: "https://www.youtube.com/@WayneChiangPoker",
    tags: ["Poker", "WSOP"],
  },
  {
    id: "liquipedia",
    tab: "articles",
    title: "Liquipedia — Soso",
    outlet: "Liquipedia StarCraft",
    summary: "Public tournament record for the 1999 Brood War championship campaign.",
    href: "https://liquipedia.net/starcraft/Soso",
    tags: ["Brood War", "Esports"],
  },
  {
    id: "pimpest",
    tab: "articles",
    title: "Pimpest Plays & Early Esports Media",
    outlet: "GX StarCraft / Gamers.com",
    summary:
      "How highlight culture and ladder battle reports helped invent modern esports storytelling.",
    href: "https://liquipedia.net/starcraft/Soso",
    tags: ["Brood War", "Esports", "Game Design"],
  },
  {
    id: "2hh-story",
    tab: "articles",
    title: "2 Hand Hold'em — Patented Casino Design",
    outlet: "2 HH LLC",
    summary:
      "Dual-hand Hold'em mechanic, USPTO grants, and live deployment via Maverick Gaming.",
    href: "#twohh",
    tags: ["Poker", "Game Design"],
  },
];

export const SUGGESTED_KEYWORDS = ["Poker", "Brood War", "Game Design"] as const;
