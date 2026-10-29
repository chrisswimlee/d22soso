/* D22: The Living Archive — exhibit content.
   Facts follow wayne-chiang-truth-document.md (public tiers only) and the live site copy. */
const ASSETS = "../assets/";
const img = (name) => `${ASSETS}img/${name}.webp`;
const kit = (name) => `${ASSETS}media-kit/${name}`;
const yt = (id) => ({ href: `https://www.youtube.com/watch?v=${id}`, thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg` });

export const EMAIL = "2handholdem@gmail.com";

/* Sector positions are angles (degrees) around the central monument. */
export const SECTORS = [
  {
    id: "arena",
    key: { hero: true, src: img("champ-trophy-640"), ratio: 0.667, alt: "Wayne Chiang with the 1999 world championship trophy", pos: "50% 18%" },
    name: "The Championship Arena",
    short: "Arena",
    era: "1996 – 1999",
    tagline: "1999 · World title · Archival exhibits",
    angle: 90,
    accent: "#8b5cf6",
    ground: "#2a2440",
    exhibit: {
      kicker: "Sector 01 · Real-time strategy",
      title: "The first Brood War world champion",
      lede:
        "On April 28, 1999, playing Random, D22-soso won Battle.net Season 1, Blizzard’s first official Brood War world championship. It capped three years at the top of the online ladders, from Command & Conquer to StarCraft.",
      blocks: [
        {
          type: "gallery",
          items: [
            { hero: true, src: img("champ-trophy-1080"), alt: "Wayne Chiang holding the 1999 championship trophy", caption: "The Season 1 trophy.", pos: "50% 20%" },
            { src: img("champ-pgl-1080"), alt: "Wayne Chiang with his 1999 StarCraft trophies", caption: "The 1999 trophies.", pos: "50% 25%" },
            { src: img("sc-championship-900"), alt: "Archive page of the first official Brood War world championship bracket", caption: "Archive: the Season 1 bracket.", pos: "50% 0%" },
          ],
        },
        {
          type: "story",
          title: "The final",
          text: [
            "His path ran through Nautosoft, Shin Ju Young, and Guillaume “Grrrr…” Patry. The final against Crexis (Chris Low) went the distance on Showdown.",
            "After losing a Terran cliff war, he rebuilt with infantry, Ghosts, and Siege Tanks and closed out Game 5 at 35:37 for the $2,500 title.",
          ],
        },
        {
          type: "media",
          title: "Archival interviews",
          items: [
            { ...yt("CHd4-eZx2Do"), title: "Zombie Grub interview", source: "The Case’s Ladder years, then the first official world title" },
            { ...yt("92bufUCAF6k"), title: "Tasteless & Artosis throwback", source: "With the casters who carried the scene forward" },
          ],
        },
        {
          type: "timeline",
          title: "Competition record",
          items: [
            ["1996", "Command & Conquer · Case’s Ladder #1, 1v1 & Teams · Team Synergy"],
            ["1997", "Warcraft II · Kali Top 3 1v1 · Team Ladder #1 with Clan C4L"],
            ["Apr 1998", "StarCraft · Case’s Ladder #1, 1v1 & Teams"],
            ["Apr 1998", "First StarCraft tournament win · Neutral Ground Mountain View"],
            ["Oct 1998", "First StarCraft tournament caster · PGL Season 3"],
            ["Feb 1999", "Battle.net vs Kali · #2 seed"],
            ["Apr 1999", "Brood War Season 1 World Champion · Random · $2,500", true],
            ["May 1999", "PGL Season 4 · 2nd · $7,000"],
            ["Jun 1999", "USA vs Canada Showcase · MVP, 3–0"],
            ["Jul 1999", "Sports Seoul #5 · World Champions Invitational 3rd"],
            ["Sep 1999", "Battle.net World Championship Finals · 3rd"],
          ],
        },
        {
          type: "links",
          title: "Primary sources",
          items: [
            { label: "Blizzard Season 1 finals report", href: "https://classic.battle.net/scc/br/bws1final5.shtml" },
            { label: "Liquipedia: Soso", href: "https://liquipedia.net/starcraft/Soso" },
            { label: "Full gaming archive", href: "../gaming.html" },
          ],
        },
      ],
    },
  },
  {
    id: "garden",
    key: { src: img("weissman-360"), ratio: 1.78, alt: "Wayne Chiang with Brian Weissman", pos: "50% 25%" },
    name: "The Strategy Garden",
    short: "Garden",
    era: "1995 – today",
    tagline: "Magic · Cube Draft · Ladders",
    angle: 30,
    accent: "#e879f9",
    ground: "#26331f",
    exhibit: {
      kicker: "Sector 02 · Tabletop strategy",
      title: "Where the Cube began",
      lede:
        "Before real-time strategy, there was Magic. Brian Weissman introduced him to competitive play at a Round Table Pizza in Palo Alto. His custom draft pool, “The Cube,” grew into Cube Draft, later a Magic Online staple.",
      blocks: [
        { type: "gallery", items: [{ src: img("weissman-900"), alt: "Wayne Chiang with Brian Weissman", caption: "With Brian Weissman, who brought him into competitive Magic." }] },
        {
          type: "quote",
          text: "Public credit for the majority of the Cube Draft idea comes from Brian Weissman and Tom Martell.",
          cite: "Cube Draft origins",
        },
        {
          type: "facts",
          items: [
            ["Pro Tour", "New York ’01 · Boston ’02 · qualified for three"],
            ["Qualifiers", "Consistent PTQ Top 8s"],
            ["Format", "Cube Draft · open format, no patent claim"],
          ],
        },
        {
          type: "timeline",
          title: "Still climbing",
          items: [
            ["2004", "Warcraft III · US West FFA #1 · Arranged Teams #2"],
            ["2015 →", "Hearthstone · Legend #35 Standard NA · #11 Wild NA"],
            ["2018", "Hearthstone Wild Open Americas · Top 32"],
            ["Recent", "Clash Royale Challenger · League of Legends Diamond 5 · Once Upon a Galaxy #1"],
          ],
        },
        { type: "gallery", items: [{ src: img("hearthstone-35-720"), alt: "Hearthstone Legend rank 35 screenshot", caption: "Legend #35, Standard NA." }] },
        { type: "links", items: [{ label: "Cube Draft room", href: "../gaming.html#game-cube" }, { label: "Magic room", href: "../gaming.html#game-mtg" }] },
      ],
    },
  },
  {
    id: "broadcast",
    key: { hero: true, src: img("wsop-logo-600"), ratio: 1, alt: "World Series of Poker logo", fit: "contain" },
    name: "The Broadcast Station",
    short: "Broadcast",
    era: "2010s – today",
    tagline: "Live at the Bike · WSOP · Interviews",
    angle: -30,
    accent: "#22c55e",
    ground: "#1d2b2a",
    exhibit: {
      kicker: "Sector 03 · Poker & media",
      title: "From the felt to the control room",
      lede:
        "A decade-plus high-stakes poker professional who moved behind the camera. As co-owner and lead producer of Live at the Bike he grew peak viewers from 2,500 to 8,800. Today he is Talent Manager on the World Series of Poker Media Team.",
      blocks: [
        {
          type: "gallery",
          items: [
            { src: img("wsop-boxer-1200"), alt: "Wayne Chiang with SlayerS_BoxeR at the 2025 WSOP", caption: "WSOP 2025, with SlayerS_BoxeR.", pos: "50% 20%" },
            { src: img("elky-1080"), alt: "Wayne Chiang with poker pro ElkY", caption: "With ElkY.", pos: "50% 25%" },
          ],
        },
        {
          type: "monitors",
          title: "Tune in",
          items: [
            { title: "WSOP’s vlogger boom", source: "PokerOrg Q&A", href: "https://www.poker.org/latest-news/40k-view-bonuses-plus-hotels-wayne-chiang-on-wsops-vlogger-boom-aV7pB6K0laKG" },
            { title: "StarCraft champion, WSOP talent manager", source: "The Flow Show · Jeff Gross", href: "https://jeffgrosspodcast.podbean.com/e/wayne-chiang-starcraft-world-champion-wsop-talent-manager-betting-on-yourself/" },
            { title: "He made millions playing poker…", source: "Table 1 Podcast", href: "https://creators.spotify.com/pod/profile/table-1-podcast/episodes/He-Made-Millions-Playing-PokerThen-His-Side-Hustle-Did-Even-Better-e3gouut" },
            { title: "Former owner of Live at the Bike", source: "Chasing Poker Greatness", href: "https://chasingpokergreatness.com/wayne-chiang-former-owner-of-live-at-the-bike-starcraft-world-champion/" },
            { title: "Wayne Chiang Poker", source: "YouTube channel", href: "https://www.youtube.com/@WayneChiangPoker" },
          ],
        },
        {
          type: "facts",
          items: [
            ["WSOP", "Talent Manager, Media Team · Vlogger Program"],
            ["Live at the Bike", "Co-owner & lead producer · 2,500 → 8,800 peak viewers"],
            ["PokerCraft", "Podcast with Hellmuth, Negreanu, Greenstein"],
            ["Global Poker", "Bankroll Challenge · 1st"],
          ],
        },
        { type: "links", items: [{ label: "Poker room on the classic site", href: "../classic.html#poker" }] },
      ],
    },
  },
  {
    id: "foundry",
    key: { hero: true, src: img("twohh-logo-500"), ratio: 1.15, alt: "2 Hand Hold’em logo", fit: "contain" },
    name: "The Invention Foundry",
    short: "Foundry",
    era: "2015 – today",
    tagline: "Patented table games · Playable demo",
    angle: -90,
    accent: "#2dd4bf",
    ground: "#1a2b2f",
    exhibit: {
      kicker: "Sector 04 · Patented table games",
      title: "Two hands. One board.",
      lede:
        "2 Hand Hold’em™ gives the player four hole cards to split into two independent hands against a single dealer board. It’s certified by the Washington State Gambling Commission and dealt live in casinos.",
      blocks: [
        { type: "demo" },
        {
          type: "steps",
          title: "How to play 2 Hand Hold’em",
          items: [
            ["The Ante", "Two equal bets, one for each hand."],
            ["The Deal", "Four hole cards for you, three for the dealer, and a three-card flop."],
            ["Arrange", "Split your four cards into two separate two-card hands."],
            ["Check or Raise", "Check or raise 2× the ante on each hand independently."],
            ["Showdown", "Turn and river come out. Each hand plays the dealer on its own."],
          ],
        },
        {
          type: "facts",
          items: [
            ["2 Hand Hold’em™", "U.S. Patents 11,117,045 · 11,731,032 · 12,005,342"],
            ["Badugi Chase™", "U.S. Patents 11,810,421 · 12,131,608 · co-inventor Charles Chang"],
            ["Side bets", "Flounder 4 · Nessie 9 · 888 Flop Bonus · Community Bonus"],
            ["Live at", "Circa · Venetian · Commerce · Hustler · The Office · Desert Bluffs"],
          ],
        },
        {
          type: "story",
          title: "Badugi Chase™ · “The Baby Rainbow”",
          text: ["Three cards, then the Chase: pick one of three community cards to finish a four-card Badugi. Unmatched suits and ranks win, and the lowest top card takes it."],
        },
        { type: "gallery", items: [{ src: img("badugi-play-900"), alt: "Badugi Chase table layout", caption: "The Badugi Chase layout.", fit: "contain" }] },
        {
          type: "links",
          items: [
            { label: "Play online at play2hh.com", href: "https://play2hh.com" },
            { label: "Find a live table", href: "../classic.html#locate" },
            { label: "Patent 11,117,045", href: "https://patents.google.com/patent/US11117045" },
          ],
        },
      ],
    },
  },
  {
    id: "library",
    key: { src: img("betting-on-yourself-cover"), ratio: 0.667, alt: "Betting on Yourself book cover", fit: "contain" },
    name: "The Library",
    short: "Library",
    era: "December 2025",
    tagline: "Betting on Yourself · Kendall Hunt",
    angle: -150,
    accent: "#f5d48a",
    ground: "#2e2a22",
    exhibit: {
      kicker: "Sector 05 · Author",
      title: "Betting on Yourself",
      lede:
        "Winning in Business, Poker, and the Age of AI. Co-written with Fortune 500 executive and WSOP champion Joe Matton, published by Kendall Hunt in December 2025.",
      blocks: [
        { type: "book", cover: img("betting-on-yourself-cover") },
        {
          type: "facts",
          items: [
            ["Authors", "Joe Matton & Wayne Chiang"],
            ["Publisher", "Kendall Hunt · December 2025"],
            ["ISBN", "9798319708007"],
            ["Covers", "Business decisions · Poker · The age of AI"],
          ],
        },
        {
          type: "links",
          items: [
            { label: "Available on Amazon", href: "https://www.amazon.com/dp/9798319708007" },
            { label: "Kendall Hunt", href: "https://he.kendallhunt.com/product/betting-yourself-winning-business-poker-and-age-ai" },
          ],
        },
      ],
    },
  },
  {
    id: "command",
    key: { src: img("wsop-boxer-360"), ratio: 0.684, alt: "Wayne Chiang at the 2025 World Series of Poker", pos: "50% 20%" },
    name: "The Command Center",
    short: "Command",
    era: "Today",
    tagline: "Bio · Media kit · Licensing · Contact",
    angle: 150,
    accent: "#e8c44a",
    ground: "#2f2a1c",
    exhibit: {
      kicker: "Sector 06 · Media & licensing",
      title: "Wayne “D22-soso” Chiang",
      lede:
        "First official StarCraft: Brood War Season 1 World Champion (Random, 1999), Cube Draft pioneer, patented casino game inventor, Talent Manager for the World Series of Poker, and co-author of Betting on Yourself.",
      blocks: [
        { type: "contact" },
        { type: "gallery", items: [{ src: `${ASSETS}media-kit/headshot-closeup.jpg`, alt: "Close-up of the engraved 1999 world champion trophy", caption: "The Season 1 trophy, engraved D22-soso. From the media kit.", pos: "50% 45%" }] },
        {
          type: "downloads",
          title: "Press & media kit",
          items: [
            { label: "Full media kit (.zip)", href: kit("d22soso-media-kit.zip") },
            { label: "Short bio", href: kit("wayne-chiang-bio-short.txt") },
            { label: "Long bio", href: kit("wayne-chiang-bio-long.txt") },
            { label: "Fact sheet", href: kit("fact-sheet.txt") },
            { label: "Headshot · trophy", href: kit("headshot-trophy.jpg") },
            { label: "Headshot · PGL era", href: kit("headshot-pgl.jpg") },
            { label: "Headshot · close-up", href: kit("headshot-closeup.jpg") },
          ],
        },
        {
          type: "timeline",
          title: "At a glance",
          items: [
            ["1996–99", "#1 on the C&C, Warcraft II, and StarCraft ladders"],
            ["1999", "Brood War Season 1 World Champion", true],
            ["2001–02", "Magic Pro Tour · Cube Draft origins"],
            ["2007", "B.A. Economics, UC San Diego"],
            ["2015", "Invents 2 Hand Hold’em™"],
            ["2021", "Live at the Bike buyout"],
            ["2025", "WSOP Talent Manager · Betting on Yourself"],
          ],
        },
        {
          type: "links",
          title: "Elsewhere",
          items: [
            { label: "LinkedIn", href: "https://www.linkedin.com/in/d22sosowaynechiang" },
            { label: "X @D22_soso", href: "https://x.com/D22_soso" },
            { label: "Instagram", href: "https://www.instagram.com/D22_soso/" },
            { label: "YouTube", href: "https://www.youtube.com/@WayneChiangPoker" },
            { label: "Liquipedia", href: "https://liquipedia.net/starcraft/Soso" },
          ],
        },
      ],
    },
  },
];

/* Guided tour: chronological. */
export const TOUR = ["garden", "arena", "broadcast", "foundry", "library", "command"];

/* Fog of discovery: optional, smaller stories placed between sectors. */
export const ARTIFACTS = [
  { id: "name", angle: 112, r: 25, title: "How he became D22", text: "Dennis “Thresh” Fong renamed him D22-soso. His rival Gadianton became D23-Gadianton." },
  { id: "caster", angle: 68, r: 24, title: "One day late", text: "He missed PGL Season 3 registration by a single day in October 1998, so he called the matches instead and became StarCraft’s first play-by-play caster." },
  { id: "ng", angle: 128, r: 9, title: "$250 at Neutral Ground", text: "His first StarCraft tournament win came in April 1998 at Neutral Ground Mountain View, against Jay “Gadianton” Severson." },
  { id: "usa", angle: 52, r: 10, title: "USA vs Canada", text: "MVP of the June 1999 USA vs Canada showcase, sweeping his matches 3–0." },
  { id: "pizza", angle: 8, r: 25, title: "Round Table Pizza", text: "Competitive Magic started at a Round Table Pizza in Palo Alto, with Brian Weissman across the table." },
  { id: "count", angle: -58, r: 25, title: "Counted out", text: "A blackjack advantage player using Hi-Lo and Hi-Opt 1, he was banned from major Las Vegas and San Diego properties." },
  { id: "bankroll", angle: -12, r: 10, title: "Bankroll Challenge", text: "Won the streamed Global Poker Bankroll Challenge, finishing +$11,464." },
  { id: "pimp", angle: -118, r: 24, title: "Pimpest Plays", text: "At Gamers.com he ran GX StarCraft with Thresh and Calbear: battle reports after matches and Pimpest Plays, an early blueprint for esports highlight reels." },
  { id: "script", angle: -172, r: 23, title: "Screenwriter", text: "A feature screenplay of his was a finalist at the 2007 Screenwriting Expo." },
];
