export type ApmBand = {
  id: string;
  label: string;
  apm: number;
  description: string;
};

export const APM_BENCHMARKS: ApmBand[] = [
  {
    id: "casual",
    label: "Casual Clicker",
    apm: 60,
    description: "Warming up — solid for everyday browsing pace.",
  },
  {
    id: "pro-1999",
    label: "1999 Pro Benchmark",
    apm: 220,
    description: "Classic Brood War competitive baseline.",
  },
  {
    id: "d22-peak",
    label: "D22-soso Peak",
    apm: 280,
    description: "Peak-era Random champion intensity (280+ APM).",
  },
];

export function classifyApm(apm: number): ApmBand {
  if (apm >= 280) return APM_BENCHMARKS[2];
  if (apm >= 220) return APM_BENCHMARKS[1];
  if (apm >= 60) return APM_BENCHMARKS[0];
  return {
    id: "warmup",
    label: "Still Loading",
    apm: 0,
    description: "Keep clicking — the probe hasn't even left the nexus.",
  };
}

export function shareScoreUrl(apm: number, avgReactionMs: number | null): string {
  const reaction =
    avgReactionMs != null ? ` Avg reaction: ${Math.round(avgReactionMs)}ms.` : "";
  const text = `I scored ${Math.round(apm)} APM on the D22-soso StarCraft speed test.${reaction} Can you beat the 1999 pro benchmark (220) or D22-soso peak (280+)? https://d22soso.com/#apm`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export const ROUND_SECONDS = 10;
export const GRID_SIZE = 16;
