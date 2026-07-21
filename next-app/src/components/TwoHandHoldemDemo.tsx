"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChartLine, Mail, RotateCcw, Spade, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  dealTwoHandHoldem,
  RANK_LABEL,
  SUIT_SYMBOL,
  type Card,
} from "@/lib/poker/deck";
import {
  compareHands,
  evaluateBestHand,
  strengthHint,
  type HandScore,
} from "@/lib/poker/evaluate";

type DealState = {
  handA: [Card, Card];
  handB: [Card, Card];
  flop: [Card, Card, Card];
  turn: Card;
  river: Card;
};

type Phase = "idle" | "dealt" | "flop" | "turn" | "river";

function cardLabel(card: Card) {
  return `${RANK_LABEL[card.rank]}${SUIT_SYMBOL[card.suit]}`;
}

function PlayingCard({
  card,
  delay = 0,
  large = false,
}: {
  card: Card;
  delay?: number;
  large?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const red = card.suit === "h" || card.suit === "d";
  return (
    <motion.div
      role="img"
      aria-label={cardLabel(card)}
      initial={reduceMotion ? false : { opacity: 0, y: -28, rotateY: 88 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.38, delay: reduceMotion ? 0 : delay, ease: "easeOut" }}
      className={`flex flex-col items-center justify-between rounded-xl border bg-slate-50 px-2 py-2 shadow-lg ${
        large
          ? "h-24 w-[4.25rem] sm:h-28 sm:w-20"
          : "h-20 w-14 sm:h-24 sm:w-[4.25rem]"
      } ${red ? "border-rose-300 text-rose-600" : "border-slate-300 text-slate-900"}`}
    >
      <span className="self-start font-mono text-sm font-bold leading-none sm:text-base">
        {RANK_LABEL[card.rank]}
      </span>
      <span className="text-xl leading-none sm:text-2xl">{SUIT_SYMBOL[card.suit]}</span>
      <span className="self-end rotate-180 font-mono text-sm font-bold leading-none sm:text-base">
        {RANK_LABEL[card.rank]}
      </span>
    </motion.div>
  );
}

function CardBack({ delay = 0, large = false }: { delay?: number; large?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, delay }}
      className={`rounded-xl border border-gold/35 bg-gradient-to-br from-emerald to-felt-deep shadow-lg ${
        large ? "h-24 w-[4.25rem] sm:h-28 sm:w-20" : "h-20 w-14 sm:h-24 sm:w-[4.25rem]"
      }`}
      aria-hidden
    >
      <div className="m-1.5 flex h-[calc(100%-0.75rem)] items-center justify-center rounded-lg border border-gold/25">
        <Spade className="h-5 w-5 text-gold/80" />
      </div>
    </motion.div>
  );
}

function HandResult({
  label,
  score,
  highlight,
}: {
  label: string;
  score: HandScore | null;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-3 py-2 transition ${
        highlight
          ? "border border-gold/60 bg-gold/15 shadow-[0_0_28px_rgba(212,175,55,0.25)]"
          : "border border-white/10 bg-black/25"
      }`}
    >
      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${highlight ? "text-gold-soft" : "text-slate-200"}`}>
        {score?.label ?? "—"}
      </p>
    </div>
  );
}

export default function TwoHandHoldemDemo() {
  const [deal, setDeal] = useState<DealState | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [showOdds, setShowOdds] = useState(false);
  const [dealing, setDealing] = useState(false);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!showOdds) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowOdds(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showOdds]);

  const runDeal = useCallback(async () => {
    if (dealing) return;
    setDealing(true);
    setShowOdds(false);
    setDeal(null);
    setPhase("idle");

    const next = dealTwoHandHoldem();
    await wait(100);
    if (!mounted.current) return;
    setDeal(next);
    setPhase("dealt");
    await wait(420);
    if (!mounted.current) return;
    setPhase("flop");
    await wait(380);
    if (!mounted.current) return;
    setPhase("turn");
    await wait(320);
    if (!mounted.current) return;
    setPhase("river");
    setDealing(false);
  }, [dealing]);

  const boardVisible = useMemo(() => {
    if (!deal) return [] as Card[];
    if (phase === "idle" || phase === "dealt") return [];
    if (phase === "flop") return [...deal.flop];
    if (phase === "turn") return [...deal.flop, deal.turn];
    return [...deal.flop, deal.turn, deal.river];
  }, [deal, phase]);

  const evalA = useMemo(() => {
    if (!deal || phase !== "river") return null;
    return evaluateBestHand([...deal.handA, ...deal.flop, deal.turn, deal.river]);
  }, [deal, phase]);

  const evalB = useMemo(() => {
    if (!deal || phase !== "river") return null;
    return evaluateBestHand([...deal.handB, ...deal.flop, deal.turn, deal.river]);
  }, [deal, phase]);

  const winner = useMemo(() => {
    if (!evalA || !evalB) return null;
    return compareHands(evalA, evalB);
  }, [evalA, evalB]);

  const liveText = useMemo(() => {
    if (!deal) return "Table ready. Press Deal Hand.";
    if (phase !== "river" || !evalA || !evalB || !winner) {
      return `Dealt Hand A ${deal.handA.map(cardLabel).join(" ")}, Hand B ${deal.handB.map(cardLabel).join(" ")}.`;
    }
    if (winner === "tie") return `Split pot. Both hands: ${evalA.label}.`;
    return `Hand ${winner} wins with ${winner === "A" ? evalA.label : evalB.label}.`;
  }, [deal, phase, evalA, evalB, winner]);

  return (
    <section id="twohh" className="section-anchor relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-8 max-w-2xl sm:mb-10">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-slate-50 sm:text-5xl">
          2 Hand Hold&apos;em
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-400 sm:text-lg">
          Two independent 2-card hands. One shared board. Deal a hand — both ranks evaluate
          automatically.
        </p>
      </div>

      <p ref={liveRef} className="sr-only" aria-live="polite">
        {liveText}
      </p>

      <div className="felt-texture relative overflow-hidden rounded-2xl border border-gold/35 shadow-[0_0_60px_rgba(5,150,105,0.18)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

        <div className="relative space-y-8 p-4 sm:p-8 md:p-10">
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
            <div
              className={`rounded-2xl p-4 transition ${
                winner === "A" || winner === "tie"
                  ? "bg-gold/10 ring-1 ring-gold/50"
                  : "bg-black/20 ring-1 ring-white/10"
              }`}
            >
              <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-gold uppercase">
                Hand A
              </p>
              <div className="flex min-h-[6rem] gap-2.5 sm:min-h-28">
                {deal ? (
                  deal.handA.map((c, i) => (
                    <PlayingCard key={c.id} card={c} delay={i * 0.08} large />
                  ))
                ) : (
                  <>
                    <CardBack large />
                    <CardBack delay={0.05} large />
                  </>
                )}
              </div>
              {evalA && (
                <div className="mt-4">
                  <HandResult
                    label="Best five"
                    score={evalA}
                    highlight={winner === "A" || winner === "tie"}
                  />
                </div>
              )}
            </div>

            <div
              className={`rounded-2xl p-4 transition ${
                winner === "B" || winner === "tie"
                  ? "bg-gold/10 ring-1 ring-gold/50"
                  : "bg-black/20 ring-1 ring-white/10"
              }`}
            >
              <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-gold-soft uppercase">
                Hand B
              </p>
              <div className="flex min-h-[6rem] gap-2.5 sm:min-h-28">
                {deal ? (
                  deal.handB.map((c, i) => (
                    <PlayingCard key={c.id} card={c} delay={0.16 + i * 0.08} large />
                  ))
                ) : (
                  <>
                    <CardBack large />
                    <CardBack delay={0.05} large />
                  </>
                )}
              </div>
              {evalB && (
                <div className="mt-4">
                  <HandResult
                    label="Best five"
                    score={evalB}
                    highlight={winner === "B" || winner === "tie"}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-gold/25 sm:p-5">
            <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-gold uppercase">
              Community — Flop · Turn · River
            </p>
            <div className="flex flex-wrap gap-2.5">
              {Array.from({ length: 5 }).map((_, i) => {
                const card = boardVisible[i];
                if (card) return <PlayingCard key={card.id} card={card} delay={i * 0.06} large />;
                return <CardBack key={`back-${i}`} delay={i * 0.03} large />;
              })}
            </div>
            {winner && (
              <p className="mt-5 text-base font-medium text-slate-100">
                {winner === "tie" ? (
                  <>
                    Result: <span className="text-gold-soft">Split pot</span>
                  </>
                ) : (
                  <>
                    Result: <span className="text-gold-soft">Hand {winner} wins</span>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={runDeal}
              disabled={dealing}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gold/50 bg-gold/25 px-6 py-3 text-sm font-semibold text-gold-soft transition hover:bg-gold/35 focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none disabled:opacity-60"
            >
              <RotateCcw className={`h-4 w-4 ${dealing ? "animate-spin" : ""}`} />
              Deal Hand
            </button>

            <button
              type="button"
              onClick={() => setShowOdds((v) => !v)}
              disabled={phase !== "river"}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-gold/40 hover:text-gold-soft focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChartLine className="h-4 w-4" />
              {showOdds ? "Hide Odds / EV" : "Show Odds / EV"}
            </button>

            <a
              href="#contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald/50 bg-emerald/20 px-5 py-3 text-sm font-semibold text-emerald-glow transition hover:bg-emerald/30 focus-visible:ring-2 focus-visible:ring-emerald/50 focus-visible:outline-none"
            >
              <Mail className="h-4 w-4" />
              Request Casino Licensing Deck
            </a>
          </div>
        </div>

        <AnimatePresence>
          {showOdds && evalA && evalB && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-end bg-slate-950/75 p-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-8"
              onClick={() => setShowOdds(false)}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="odds-title"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-gold/35 bg-slate-950 p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 id="odds-title" className="text-lg font-semibold text-gold-soft">
                    Odds / EV Snapshot
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowOdds(false)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
                    aria-label="Close odds"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
                  <li>
                    <span className="font-medium text-slate-100">Published house edge:</span>{" "}
                    4.06% on the main game (operator-facing).
                  </li>
                  <li>
                    <span className="font-medium text-slate-100">This deal:</span>{" "}
                    {winner === "tie"
                      ? "Hands tie at showdown."
                      : `Hand ${winner} is ahead (${winner === "A" ? evalA.label : evalB.label}).`}
                  </li>
                  <li>
                    <span className="font-medium text-slate-100">Hand A:</span>{" "}
                    {strengthHint(evalA.category)}
                  </li>
                  <li>
                    <span className="font-medium text-slate-100">Hand B:</span>{" "}
                    {strengthHint(evalB.category)}
                  </li>
                  <li className="text-slate-500">
                    Educational overlay only — not a full Monte Carlo equity engine.
                  </li>
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-4 font-mono text-xs text-slate-500">
        US Patents 11,117,045 · 11,731,032 · 12,005,342 — assignee 2 HH LLC
      </p>
    </section>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
