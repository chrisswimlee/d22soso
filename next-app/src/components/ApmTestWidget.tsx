"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Crosshair, RotateCcw, Share2, Timer } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  APM_BENCHMARKS,
  GRID_SIZE,
  ROUND_SECONDS,
  classifyApm,
  shareScoreUrl,
} from "@/lib/apmBenchmarks";

type Phase = "ready" | "running" | "done";

export default function ApmTestWidget() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("ready");
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [clicks, setClicks] = useState(0);
  const [reactionSum, setReactionSum] = useState(0);
  const [reactionCount, setReactionCount] = useState(0);

  const startTs = useRef(0);
  const targetSpawnTs = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const spawnTarget = useCallback((prev: number | null) => {
    let next = Math.floor(Math.random() * GRID_SIZE);
    if (GRID_SIZE > 1) {
      while (next === prev) next = Math.floor(Math.random() * GRID_SIZE);
    }
    targetSpawnTs.current = performance.now();
    setActiveCell(next);
  }, []);

  const finish = useCallback(() => {
    clearTimer();
    setPhase("done");
    setActiveCell(null);
    setTimeLeft(0);
  }, []);

  const start = () => {
    clearTimer();
    setPhase("running");
    setTimeLeft(ROUND_SECONDS);
    setClicks(0);
    setReactionSum(0);
    setReactionCount(0);
    startTs.current = performance.now();
    spawnTarget(null);

    intervalRef.current = setInterval(() => {
      const elapsed = (performance.now() - startTs.current) / 1000;
      const left = Math.max(0, ROUND_SECONDS - elapsed);
      setTimeLeft(left);
      if (left <= 0) finish();
    }, 50);
  };

  useEffect(() => () => clearTimer(), []);

  const onHit = (index: number) => {
    if (phase !== "running" || index !== activeCell) return;
    const reaction = performance.now() - targetSpawnTs.current;
    setClicks((c) => c + 1);
    setReactionSum((s) => s + reaction);
    setReactionCount((n) => n + 1);
    spawnTarget(index);
  };

  const elapsedSec = Math.max(ROUND_SECONDS - timeLeft, 0.001);
  const apm =
    phase === "done"
      ? (clicks / ROUND_SECONDS) * 60
      : phase === "running"
        ? (clicks / elapsedSec) * 60
        : 0;
  const avgReaction = reactionCount > 0 ? reactionSum / reactionCount : null;
  const band = classifyApm(apm);

  return (
    <section id="apm" className="section-anchor relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-10 max-w-2xl">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-slate-50 sm:text-5xl">
          APM Test
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-400 sm:text-lg">
          10 seconds. Hit every target. Measure yourself against 1999 pro pace — and D22-soso peak.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald/25">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald/20 bg-slate-950/90 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4 font-mono text-sm">
            <span className="inline-flex items-center gap-1.5 text-emerald-glow">
              <Timer className="h-4 w-4" />
              {timeLeft.toFixed(1)}s
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              Hits <span className="text-gold-soft">{clicks}</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              APM <span className="text-emerald-glow">{Math.round(apm)}</span>
            </span>
          </div>

          {phase !== "running" ? (
            <button
              type="button"
              onClick={start}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gold/40 bg-gold/15 px-4 py-2 text-sm font-semibold text-gold-soft transition hover:bg-gold/25 focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
            >
              {phase === "done" ? (
                <>
                  <RotateCcw className="h-4 w-4" /> Play Again
                </>
              ) : (
                <>
                  <Crosshair className="h-4 w-4" /> Start 10s Test
                </>
              )}
            </button>
          ) : (
            <span className="font-mono text-xs tracking-widest text-emerald-glow uppercase">
              Live
            </span>
          )}
        </div>

        <div className="apm-grid-bg grid grid-cols-4 gap-2 p-3 sm:gap-3 sm:p-6">
          {Array.from({ length: GRID_SIZE }).map((_, i) => {
            const active = activeCell === i;
            return (
              <button
                key={i}
                type="button"
                disabled={phase !== "running"}
                onClick={() => onHit(i)}
                className={`relative flex min-h-14 min-w-0 items-center justify-center rounded-lg border transition sm:min-h-16 focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none ${
                  active
                    ? "border-gold bg-gold/20"
                    : "border-emerald/15 bg-black/30 hover:border-emerald/30"
                } disabled:cursor-default`}
                aria-label={active ? "Hit target" : "Empty cell"}
              >
                {active && (
                  <motion.span
                    layoutId={reduceMotion ? undefined : "apm-target"}
                    className="h-8 w-8 rounded-full bg-gold sm:h-10 sm:w-10"
                    initial={reduceMotion ? false : { scale: 0.55, opacity: 0.6 }}
                    animate={{
                      scale: reduceMotion ? 1 : [1, 1.08, 1],
                      opacity: 1,
                    }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { scale: { repeat: Infinity, duration: 0.9 }, opacity: { duration: 0.15 } }
                    }
                  />
                )}
              </button>
            );
          })}
        </div>

        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-emerald/20 bg-slate-950 px-4 py-6 sm:px-6"
          >
            <h3 className="text-lg font-semibold text-slate-50">Results</h3>
            <p className="mt-1 text-sm text-slate-400">
              You landed in <span className="font-semibold text-gold-soft">{band.label}</span>
              {" — "}
              {band.description}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="APM" value={String(Math.round(apm))} />
              <Stat
                label="Avg reaction"
                value={avgReaction != null ? `${Math.round(avgReaction)} ms` : "—"}
              />
              <Stat label="Hits" value={String(clicks)} />
            </dl>

            <ul className="mt-5 space-y-2">
              {APM_BENCHMARKS.map((b) => {
                const beat = apm >= b.apm;
                return (
                  <li
                    key={b.id}
                    className={`flex items-center justify-between border-b border-white/5 py-2.5 text-sm ${
                      beat ? "text-emerald-glow" : "text-slate-500"
                    }`}
                  >
                    <span>
                      {b.label}: {b.apm}
                      {b.id === "d22-peak" ? "+" : ""} APM
                    </span>
                    <span className="font-mono text-xs">{beat ? "CLEARED" : "NEXT"}</span>
                  </li>
                );
              })}
            </ul>

            <a
              href={shareScoreUrl(apm, avgReaction)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold-soft transition hover:bg-gold/20 focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
            >
              <Share2 className="h-4 w-4" />
              Share Score on X / Twitter
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-semibold text-slate-100">{value}</dd>
    </div>
  );
}
