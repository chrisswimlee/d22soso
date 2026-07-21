import type { Card, Rank } from "./deck";

export type HandCategory =
  | "Straight Flush"
  | "Four of a Kind"
  | "Full House"
  | "Flush"
  | "Straight"
  | "Three of a Kind"
  | "Two Pair"
  | "One Pair"
  | "High Card";

export type HandScore = {
  category: HandCategory;
  /** Lexicographic score: higher wins. categoryRank then kickers. */
  score: number[];
  label: string;
};

const CATEGORY_RANK: Record<HandCategory, number> = {
  "Straight Flush": 8,
  "Four of a Kind": 7,
  "Full House": 6,
  Flush: 5,
  Straight: 4,
  "Three of a Kind": 3,
  "Two Pair": 2,
  "One Pair": 1,
  "High Card": 0,
};

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [first, ...rest] = items;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function straightHigh(ranks: number[]): number | null {
  const uniq = [...new Set(ranks)].sort((a, b) => b - a);
  // Wheel: A-2-3-4-5
  if (
    uniq.includes(14) &&
    uniq.includes(5) &&
    uniq.includes(4) &&
    uniq.includes(3) &&
    uniq.includes(2)
  ) {
    return 5;
  }
  for (let i = 0; i <= uniq.length - 5; i++) {
    let ok = true;
    for (let j = 1; j < 5; j++) {
      if (uniq[i + j] !== uniq[i] - j) {
        ok = false;
        break;
      }
    }
    if (ok) return uniq[i];
  }
  return null;
}

function evaluateFive(cards: Card[]): HandScore {
  const ranks = cards.map((c) => c.rank as number).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);
  const sHigh = straightHigh(ranks);

  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const byCount = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  if (isFlush && sHigh !== null) {
    return {
      category: "Straight Flush",
      score: [CATEGORY_RANK["Straight Flush"], sHigh],
      label: sHigh === 14 ? "Royal Flush" : `Straight Flush, ${rankName(sHigh)} high`,
    };
  }

  if (byCount[0][1] === 4) {
    const quad = byCount[0][0];
    const kicker = byCount[1][0];
    return {
      category: "Four of a Kind",
      score: [CATEGORY_RANK["Four of a Kind"], quad, kicker],
      label: `Four of a Kind, ${rankName(quad)}s`,
    };
  }

  if (byCount[0][1] === 3 && byCount[1][1] === 2) {
    return {
      category: "Full House",
      score: [CATEGORY_RANK["Full House"], byCount[0][0], byCount[1][0]],
      label: `Full House, ${rankName(byCount[0][0])}s full of ${rankName(byCount[1][0])}s`,
    };
  }

  if (isFlush) {
    return {
      category: "Flush",
      score: [CATEGORY_RANK.Flush, ...ranks],
      label: `Flush, ${rankName(ranks[0])} high`,
    };
  }

  if (sHigh !== null) {
    return {
      category: "Straight",
      score: [CATEGORY_RANK.Straight, sHigh],
      label: `Straight, ${rankName(sHigh)} high`,
    };
  }

  if (byCount[0][1] === 3) {
    const trip = byCount[0][0];
    const kickers = byCount.slice(1).map((x) => x[0]);
    return {
      category: "Three of a Kind",
      score: [CATEGORY_RANK["Three of a Kind"], trip, ...kickers],
      label: `Three of a Kind, ${rankName(trip)}s`,
    };
  }

  if (byCount[0][1] === 2 && byCount[1][1] === 2) {
    const hi = Math.max(byCount[0][0], byCount[1][0]);
    const lo = Math.min(byCount[0][0], byCount[1][0]);
    const kicker = byCount[2][0];
    return {
      category: "Two Pair",
      score: [CATEGORY_RANK["Two Pair"], hi, lo, kicker],
      label: `Two Pair, ${rankName(hi)}s and ${rankName(lo)}s`,
    };
  }

  if (byCount[0][1] === 2) {
    const pair = byCount[0][0];
    const kickers = byCount.slice(1).map((x) => x[0]);
    return {
      category: "One Pair",
      score: [CATEGORY_RANK["One Pair"], pair, ...kickers],
      label: `One Pair, ${rankName(pair)}s`,
    };
  }

  return {
    category: "High Card",
    score: [CATEGORY_RANK["High Card"], ...ranks],
    label: `High Card, ${rankName(ranks[0])}`,
  };
}

function rankName(r: number): string {
  const map: Record<number, string> = {
    14: "Ace",
    13: "King",
    12: "Queen",
    11: "Jack",
    10: "Ten",
    9: "Nine",
    8: "Eight",
    7: "Seven",
    6: "Six",
    5: "Five",
    4: "Four",
    3: "Three",
    2: "Two",
  };
  return map[r] ?? String(r);
}

function compareScores(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/** Best 5-card hand from up to 7 cards (2 hole + 5 board). */
export function evaluateBestHand(cards: Card[]): HandScore {
  if (cards.length < 5) {
    return { category: "High Card", score: [0], label: "Incomplete" };
  }
  if (cards.length === 5) return evaluateFive(cards);

  let best: HandScore | null = null;
  for (const five of combinations(cards, 5)) {
    const scored = evaluateFive(five);
    if (!best || compareScores(scored.score, best.score) > 0) {
      best = scored;
    }
  }
  return best!;
}

export type HandComparison = "A" | "B" | "tie";

export function compareHands(a: HandScore, b: HandScore): HandComparison {
  const cmp = compareScores(a.score, b.score);
  if (cmp > 0) return "A";
  if (cmp < 0) return "B";
  return "tie";
}

export function strengthHint(category: HandCategory): string {
  const tips: Record<HandCategory, string> = {
    "Straight Flush": "Elite made hand — nearly unbeatable.",
    "Four of a Kind": "Monster strength; rarely beaten.",
    "Full House": "Very strong; beats flushes and straights.",
    Flush: "Strong; watch for boats and higher flushes.",
    Straight: "Solid mid-strength made hand.",
    "Three of a Kind": "Good value; can improve to a boat.",
    "Two Pair": "Playable; vulnerable to overcards and trips.",
    "One Pair": "Marginal; position and board texture matter.",
    "High Card": "Weak showdown value without improvement.",
  };
  return tips[category];
}

export type { Rank };
