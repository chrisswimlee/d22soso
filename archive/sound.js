/* D22: The Living Archive — sound.
   Off until the visitor turns it on. Every cue is synthesised with Web Audio (no files to download):
   short square-wave blips and a soft click, in the spirit of an old RTS command card. */
const KEY = "d22-sound";
let ctx = null, master = null;
let on = false;
try { on = localStorage.getItem(KEY) === "on"; } catch {}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// One note: a waveform with a fast attack and a short decay, optionally sliding in pitch.
function note(freq, at, dur, { type = "square", to = null, gain = 0.5 } = {}) {
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// A mechanical click: a burst of filtered noise.
function click(at = 0, gain = 0.35) {
  const t0 = ctx.currentTime + at, len = Math.floor(ctx.sampleRate * 0.03);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buf; f.type = "bandpass"; f.frequency.value = 2400; f.Q.value = 1.2; g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

const CUES = {
  tick: () => click(0, 0.25),
  select: () => { click(); note(660, 0.01, 0.07, { gain: 0.25 }); },
  open: () => { click(); note(440, 0.01, 0.08, { gain: 0.25 }); note(660, 0.07, 0.08, { gain: 0.25 }); note(880, 0.14, 0.12, { gain: 0.22 }); },
  close: () => { click(0, 0.2); note(520, 0.01, 0.12, { to: 260, gain: 0.2 }); },
  find: () => [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.07, 0.14, { type: "triangle", gain: 0.35 })),
  on: () => { note(392, 0, 0.07, { gain: 0.25 }); note(784, 0.07, 0.1, { gain: 0.25 }); },
};

export function play(name) {
  if (!on || !CUES[name] || !audio()) return;
  try { CUES[name](); } catch {}
}
export const soundOn = () => on;
export function setSound(value) {
  on = value;
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch {}
  if (on) play("on");
  else if (ctx && ctx.state === "running") ctx.suspend();
}
