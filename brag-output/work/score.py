"""Warm chamber-electronic score for The Living Archive (20.0s, 48 kHz stereo).

Structure & harmonic arc in D (120 BPM, 1 bar = 2.00s, 16th = 0.125s):
  0.00–2.48s   Hook (Trophy portrait)        Hushed D5 felt piano + cello swell + loading-bar harmonic lock
  2.48–5.25s   Reveal (Monument pullback)    Dm9 bloom + warm cinematic heartbeat & 3+3+2 arpeggio pulse
  5.25–7.05s   Overview ("One career...")    Bbmaj9 — motif I (F4 -> E4 -> D4 -> A3)
  7.05–10.20s  Arena ("April 28, 1999...")   Gm9 -> Fmaj7/A — motif II (A4 -> G4 -> F4 -> E4 -> D4)
  10.20–13.25s Foundry ("Two hands...")      C6/9 -> A7sus4 — motif III (E4 -> G4 -> A4 -> B4 -> A4)
  13.25–16.40s Wide island overview          Gmaj9 -> Asus4add9 — uplifting wide-shot suspension
  16.40–20.00s End card ("The Living...")    D(add9) — major resolution (F#4 -> E4 -> D4 -> A4) & hall tail
"""
import wave
import numpy as np
from scipy import signal

SR = 48000
DUR = 20.0
N = int(SR * DUR)
t = np.arange(N, dtype=np.float64) / SR
rng = np.random.default_rng(19990428)

NOTE_MAP = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
    "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11,
}


def hz(name):
    pitch = name[:-1]
    octave = int(name[-1])
    midi = (octave + 1) * 12 + NOTE_MAP[pitch]
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def pan_stereo(mono, pan):
    angle = (np.clip(pan, -1.0, 1.0) + 1.0) * (np.pi / 4.0)
    return np.column_stack([mono * np.cos(angle), mono * np.sin(angle)])


def add_slice(buf, start_idx, seg):
    if start_idx >= N or len(seg) == 0:
        return
    if start_idx < 0:
        seg = seg[-start_idx:]
        start_idx = 0
    end_idx = min(N, start_idx + len(seg))
    buf[start_idx:end_idx] += seg[: end_idx - start_idx]


def raised_cos_env(length, atk_s, hold_s, rel_s):
    idx = np.arange(length, dtype=np.float64) / SR
    env = np.ones(length, dtype=np.float64)
    if atk_s > 0:
        m = idx < atk_s
        env[m] = 0.5 - 0.5 * np.cos(np.pi * idx[m] / atk_s)
    end_hold = atk_s + hold_s
    if rel_s > 0:
        m = idx >= end_hold
        u = np.clip((idx[m] - end_hold) / rel_s, 0.0, 1.0)
        env[m] = 0.5 + 0.5 * np.cos(np.pi * u)
    return env


def add_felt_piano(buf, when, note_name, dur=2.8, vel=0.72, pan=0.0):
    """Warm felt piano with natural mid/upper-mid clarity, string inharmonicity, and stereo unison."""
    f0 = hz(note_name)
    start = int(round(when * SR))
    length = min(int(round((dur + 1.0) * SR)), N - start)
    if length <= 0:
        return
    lt = np.arange(length, dtype=np.float64) / SR

    atk = 0.006
    atk_env = np.where(lt < atk, 0.5 - 0.5 * np.cos(np.pi * np.minimum(lt, atk) / atk), 1.0)
    rel_start = max(0.15, dur - 0.15)
    damper = np.where(lt > rel_start, np.exp(-np.maximum(0.0, lt - rel_start) * 4.2), 1.0)

    B = 0.00018 * np.clip(260.0 / f0, 0.4, 2.2)
    cutoff = (1550.0 + 2200.0 * vel) * ((f0 / 261.6) ** 0.45)
    base_decay = 0.72 + 0.42 * ((f0 / 130.8) ** 0.35)

    left = np.zeros(length, dtype=np.float64)
    right = np.zeros(length, dtype=np.float64)

    unison = [(-1.4, 0.66, 0.34), (0.0, 0.52, 0.52), (+1.5, 0.34, 0.66)]
    max_k = min(14, int(12000.0 / f0))
    for k in range(1, max_k + 1):
        fk = f0 * k * np.sqrt(1.0 + B * (k ** 2))
        # Hammer brightness bloom on initial 120ms gives realistic piano articulation
        rolloff_sustain = np.exp(-((fk / cutoff) ** 1.55)) / (k ** 0.92)
        rolloff_attack = np.exp(-((fk / (cutoff * 1.65)) ** 1.55)) / (k ** 0.78)
        if rolloff_attack < 1e-4:
            continue
        decay_k = base_decay * (1.0 + 0.24 * ((k - 1) ** 1.25))
        tone_env = (
            rolloff_sustain * np.exp(-lt * decay_k)
            + (rolloff_attack - rolloff_sustain) * np.exp(-lt * (decay_k + 7.5))
        )
        env_k = tone_env * atk_env * damper
        for cents, wl, wr in unison:
            det = 2.0 ** (cents / 1200.0)
            ph = rng.uniform(0, 2 * np.pi)
            sig = np.sin(2.0 * np.pi * (fk * det) * lt + ph) * env_k
            left += sig * wl
            right += sig * wr

    # Soft felt hammer transient (140–450 Hz)
    h_len = min(length, int(0.045 * SR))
    hammer_noise = rng.standard_normal(h_len)
    sos_h = signal.butter(2, [130.0 / (SR / 2), 480.0 / (SR / 2)], btype="bandpass", output="sos")
    ht = np.arange(h_len, dtype=np.float64) / SR
    hammer = signal.sosfilt(sos_h, hammer_noise) * np.exp(-ht * 70.0) * (0.04 * vel)
    left[:h_len] += hammer
    right[:h_len] += hammer

    gain = 0.095 * vel * ((261.6 / np.clip(f0, 110.0, 880.0)) ** 0.16)
    angle = (np.clip(pan, -1.0, 1.0) + 1.0) * (np.pi / 4.0)
    l_pan, r_pan = np.cos(angle) * 1.18, np.sin(angle) * 1.18
    seg = np.column_stack([left * gain * l_pan, right * gain * r_pan])
    add_slice(buf, start, seg)


def add_warm_bell(buf, when, note_name, dur=3.0, gain=0.048, pan=0.0):
    """Warm vibraphone / celesta harmonic layer with shimmering upper overtones."""
    f0 = hz(note_name)
    start = int(round(when * SR))
    length = min(int(round(dur * SR)), N - start)
    if length <= 0:
        return
    lt = np.arange(length, dtype=np.float64) / SR
    atk = 0.009
    a_env = np.where(lt < atk, 0.5 - 0.5 * np.cos(np.pi * np.minimum(lt, atk) / atk), 1.0)
    trem = 0.86 + 0.14 * np.sin(2.0 * np.pi * 5.0 * lt)
    body = (
        np.sin(2.0 * np.pi * f0 * lt) * np.exp(-lt * 1.35)
        + 0.42 * np.sin(2.0 * np.pi * (f0 * 2.0) * lt + 0.4) * np.exp(-lt * 2.4)
        + 0.20 * np.sin(2.0 * np.pi * (f0 * 3.0) * lt + 1.1) * np.exp(-lt * 4.5)
        + 0.11 * np.sin(2.0 * np.pi * (f0 * 4.0) * lt + 2.0) * np.exp(-lt * 7.5)
    )
    mono = body * a_env * trem * gain
    add_slice(buf, start, pan_stereo(mono, pan))


def add_pad_chord(buf, t_start, t_end, notes, fade_in=0.55, fade_out=0.80, gain=0.055, brightness=1.0):
    """Warm 5-voice stereo unison analog strings/pad with rich mid & upper-harmonic shimmer."""
    start = int(round(t_start * SR))
    total_dur = (t_end - t_start) + fade_out
    length = min(int(round(total_dur * SR)), N - start)
    if length <= 0:
        return
    lt = np.arange(length, dtype=np.float64) / SR
    hold = max(0.05, (t_end - t_start) - fade_in)
    env = raised_cos_env(length, fade_in, hold, fade_out)

    swell = np.sin(np.pi * np.clip(lt / max(0.2, total_dur), 0.0, 1.0)) ** 0.8
    fc_curve = (950.0 + 1350.0 * swell) * brightness

    left = np.zeros(length, dtype=np.float64)
    right = np.zeros(length, dtype=np.float64)

    voices = [
        (-8.2, 0.86, 0.14, 0.23),
        (-3.1, 0.70, 0.30, 0.29),
        (0.0, 0.50, 0.50, 0.19),
        (+3.3, 0.30, 0.70, 0.26),
        (+8.5, 0.14, 0.86, 0.21),
    ]

    for idx_n, n_name in enumerate(notes):
        f0 = hz(n_name)
        # Keep low chord voices cleaner and upper chord voices brighter
        note_weight = 0.85 if f0 < 150.0 else 1.05
        for cents, wl, wr, drift_hz in voices:
            det = 2.0 ** (cents / 1200.0)
            drift_ph = rng.uniform(0, 2 * np.pi)
            drift = 0.0011 * np.sin(2.0 * np.pi * drift_hz * lt + drift_ph)
            base_phase = 2.0 * np.pi * (f0 * det) * (lt + drift / (2.0 * np.pi * drift_hz))
            v_sig = np.zeros(length, dtype=np.float64)
            for k in range(1, 10):
                fk = f0 * k
                if fk > 8500.0:
                    break
                odd_boost = 1.10 if (k % 2 == 1) else 0.85
                h_amp = (odd_boost / (k ** 1.05)) * np.exp(-((fk / fc_curve) ** 1.6))
                ph0 = rng.uniform(0, 2 * np.pi)
                v_sig += h_amp * np.sin(k * base_phase + ph0)
            left += v_sig * wl * note_weight
            right += v_sig * wr * note_weight

    scale = gain / max(1.0, len(notes) ** 0.62)
    seg = np.column_stack([left * env * scale, right * env * scale])
    add_slice(buf, start, seg)


def add_cello_bass(buf, t_start, t_end, note_name, fade_in=0.14, fade_out=0.30, gain=0.052):
    """Warm cello + analog bass with strong 2nd/3rd/4th harmonics (80-350 Hz) and controlled sub."""
    f0 = hz(note_name)
    start = int(round(t_start * SR))
    total_dur = (t_end - t_start) + fade_out
    length = min(int(round(total_dur * SR)), N - start)
    if length <= 0:
        return
    lt = np.arange(length, dtype=np.float64) / SR
    hold = max(0.02, (t_end - t_start) - fade_in)
    env = raised_cos_env(length, fade_in, hold, fade_out)

    bloom = 1.0 + 0.55 * np.exp(-lt * 3.0)
    # Balance fundamental (sub) with rich 2nd, 3rd, 4th, 5th harmonics so bass translates on all speakers
    h1 = 0.62 * np.sin(2.0 * np.pi * f0 * lt)
    h2 = 0.78 * bloom * (
        0.55 * np.sin(2.0 * np.pi * (f0 * 2.0) * lt + 0.3)
        + 0.45 * np.sin(2.0 * np.pi * (f0 * 2.003) * lt + 1.4)
    )
    h3 = 0.42 * bloom * np.sin(2.0 * np.pi * (f0 * 3.0) * lt + 0.8)
    h4 = 0.22 * bloom * np.sin(2.0 * np.pi * (f0 * 4.0) * lt + 1.7)
    h5 = 0.11 * np.exp(-lt * 2.2) * np.sin(2.0 * np.pi * (f0 * 5.0) * lt + 2.3)

    sig = np.tanh((h1 + h2 + h3 + h4 + h5) * 1.1) * env * gain
    side = 0.06 * env * gain * np.sin(2.0 * np.pi * (f0 * 2.004) * lt + 0.9)
    seg = np.column_stack([sig + side, sig - side])
    add_slice(buf, start, seg)


def add_pluck(buf, when, note_name, vel=0.55, pan=0.0):
    """Crisp, warm analog/marimba pluck with clear 500 Hz - 2.8 kHz articulation."""
    f0 = hz(note_name)
    start = int(round(when * SR))
    length = min(int(round(0.48 * SR)), N - start)
    if length <= 0:
        return
    lt = np.arange(length, dtype=np.float64) / SR
    atk = 0.004
    a_env = np.where(lt < atk, 0.5 - 0.5 * np.cos(np.pi * np.minimum(lt, atk) / atk), 1.0)
    sig = (
        0.85 * np.sin(2.0 * np.pi * f0 * lt) * np.exp(-lt * 6.8)
        + 0.75 * np.sin(2.0 * np.pi * (f0 * 2.0) * lt + 0.2) * np.exp(-lt * 11.5)
        + 0.48 * np.sin(2.0 * np.pi * (f0 * 3.0) * lt + 0.7) * np.exp(-lt * 18.0)
        + 0.28 * np.sin(2.0 * np.pi * (f0 * 4.0) * lt + 1.3) * np.exp(-lt * 26.0)
        + 0.14 * np.sin(2.0 * np.pi * (f0 * 5.0) * lt + 1.9) * np.exp(-lt * 36.0)
    )
    mono = sig * a_env * (0.055 * vel)
    add_slice(buf, start, pan_stereo(mono, pan))


def add_heartbeat_tom(buf, when, f_start=118.0, f_end=58.0, dur=0.38, gain=0.052):
    """Soft, warm low-tom heartbeat pulse (cinematic, never boomy)."""
    start = int(round(when * SR))
    length = min(int(round(dur * SR)), N - start)
    if length <= 0:
        return
    lt = np.arange(length, dtype=np.float64) / SR
    atk = 0.008
    a_env = np.where(lt < atk, 0.5 - 0.5 * np.cos(np.pi * np.minimum(lt, atk) / atk), 1.0)
    freq_inst = f_end + (f_start - f_end) * np.exp(-lt * 18.0)
    phase = 2.0 * np.pi * np.cumsum(freq_inst) / SR
    body = (
        0.75 * np.sin(phase) * np.exp(-lt * 8.5)
        + 0.35 * np.sin(phase * 1.5) * np.exp(-lt * 15.0)
    )
    mono = body * a_env * gain
    add_slice(buf, start, np.column_stack([mono, mono]))


def add_pitched_swell(buf, center_t, width_s=1.05, notes=("D3", "A3", "E4"), gain=0.032, pan_start=-0.35, pan_end=0.35):
    """Musical, pitched resonant filter swell for camera transitions (zero static noise)."""
    t0 = max(0.0, center_t - width_s * 0.52)
    start = int(round(t0 * SR))
    length = min(int(round(width_s * SR)), N - start)
    if length <= 32:
        return
    lt = np.arange(length, dtype=np.float64) / SR
    u = np.linspace(0.0, 1.0, length)
    env = np.sin(np.pi * u) ** 1.5
    fc = 260.0 + 1650.0 * (np.sin(np.pi * u) ** 1.3)

    sig = np.zeros(length, dtype=np.float64)
    for n_name in notes:
        f0 = hz(n_name)
        for k in range(1, 8):
            fk = f0 * k
            if fk > 6000.0:
                break
            h_amp = (1.0 / (k ** 0.95)) * np.exp(-((fk / fc) ** 1.7))
            ph = rng.uniform(0, 2 * np.pi)
            sig += h_amp * np.sin(2.0 * np.pi * fk * lt + ph)

    # Subtle warm breath layer (band-passed 220-900 Hz, 18 dB below the pitched harmonics)
    raw = rng.standard_normal(length)
    sos = signal.butter(2, [220.0 / (SR / 2), 900.0 / (SR / 2)], btype="bandpass", output="sos")
    breath = signal.sosfilt(sos, raw) * 0.14

    mono = (sig / max(1, len(notes)) + breath) * env * gain
    pan_curve = pan_start + (pan_end - pan_start) * u
    angle = (np.clip(pan_curve, -1.0, 1.0) + 1.0) * (np.pi / 4.0)
    seg = np.column_stack([mono * np.cos(angle), mono * np.sin(angle)])
    add_slice(buf, start, seg)


def stereo_delay(buf, delay_l_s=0.25, delay_r_s=0.375, fb=0.30, wet=0.28):
    sos_bp = signal.butter(2, [180.0 / (SR / 2), 2600.0 / (SR / 2)], btype="bandpass", output="sos")
    src = signal.sosfilt(sos_bp, buf, axis=0)
    out = np.zeros_like(buf)
    dl = int(round(delay_l_s * SR))
    dr = int(round(delay_r_s * SR))
    for tap in range(1, 5):
        g = wet * (fb ** (tap - 1))
        sl = tap * dl
        sr_d = tap * dr
        if sl < N:
            out[sl:, 0] += src[: N - sl, 1 if tap % 2 == 1 else 0] * g
        if sr_d < N:
            out[sr_d:, 1] += src[: N - sr_d, 0 if tap % 2 == 1 else 1] * g
    return out


def stereo_reverb(buf, rt60=2.6, wet=0.34):
    sos_bp = signal.butter(2, [160.0 / (SR / 2), 4500.0 / (SR / 2)], btype="bandpass", output="sos")
    inp = signal.sosfilt(sos_bp, buf, axis=0)

    comb_ms_l = [29.7, 33.1, 37.3, 41.9, 46.1, 50.3]
    comb_ms_r = [30.7, 34.7, 38.9, 43.3, 47.9, 52.1]

    def run_combs(x, delays_ms):
        acc = np.zeros_like(x)
        for ms in delays_ms:
            d = int(round(ms * 0.001 * SR))
            g = 10.0 ** (-3.0 * (ms * 0.001) / rt60)
            b = np.zeros(d + 1, dtype=np.float64)
            b[0] = 1.0
            a = np.zeros(d + 1, dtype=np.float64)
            a[0] = 1.0
            a[d] = -g * 0.72
            a[d - 1] = -g * 0.28
            acc += signal.lfilter(b, a, x)
        return acc / len(delays_ms)

    def allpass(x, ms, g=0.62):
        d = int(round(ms * 0.001 * SR))
        b = np.zeros(d + 1, dtype=np.float64)
        b[0] = -g
        b[d] = 1.0
        a = np.zeros(d + 1, dtype=np.float64)
        a[0] = 1.0
        a[d] = -g
        return signal.lfilter(b, a, x)

    mix_in_l = 0.72 * inp[:, 0] + 0.28 * inp[:, 1]
    mix_in_r = 0.28 * inp[:, 0] + 0.72 * inp[:, 1]

    rev_l = run_combs(mix_in_l, comb_ms_l)
    rev_r = run_combs(mix_in_r, comb_ms_r)

    for ap_l, ap_r in [(6.7, 7.3), (2.3, 2.7)]:
        rev_l = allpass(rev_l, ap_l, 0.6)
        rev_r = allpass(rev_r, ap_r, 0.6)

    sos_LP = signal.butter(2, 3800.0 / (SR / 2), btype="lowpass", output="sos")
    wet_sig = signal.sosfilt(sos_LP, np.column_stack([rev_l, rev_r]), axis=0)
    return wet_sig * wet


# --- Buses ---
piano_bus = np.zeros((N, 2), dtype=np.float64)
pad_bus = np.zeros((N, 2), dtype=np.float64)
bass_bus = np.zeros((N, 2), dtype=np.float64)
pluck_bus = np.zeros((N, 2), dtype=np.float64)
fx_bus = np.zeros((N, 2), dtype=np.float64)

# =========================================================================
# 1. CHORD PAD & CELLO BASS PROGRESSION
# =========================================================================
# 0.00–2.48s: Hook — Hushed D5 open fifth under the 1999 trophy portrait
add_pad_chord(pad_bus, 0.08, 2.50, ["D3", "A3", "D4", "E4"], fade_in=0.45, fade_out=0.60, gain=0.036, brightness=0.80)
add_cello_bass(bass_bus, 0.12, 2.45, "D2", fade_in=0.30, fade_out=0.38, gain=0.045)

# 2.48–5.25s: Reveal — Dm9 blooms as the dark plate lifts and the island pulls back
add_pad_chord(pad_bus, 2.42, 5.28, ["D3", "F3", "A3", "C4", "E4", "A4"], fade_in=0.55, fade_out=0.70, gain=0.056, brightness=1.05)
add_cello_bass(bass_bus, 2.48, 5.22, "D2", fade_in=0.12, fade_out=0.32, gain=0.058)

# 5.25–7.10s: Overview ("One career. One island.") — Bbmaj9 opens the horizon
add_pad_chord(pad_bus, 5.18, 7.12, ["Bb2", "D3", "F3", "A3", "C4", "F4"], fade_in=0.50, fade_out=0.65, gain=0.058, brightness=1.10)
add_cello_bass(bass_bus, 5.22, 7.08, "Bb1", fade_in=0.16, fade_out=0.30, gain=0.055)

# 7.05–10.20s: Sector 01 Arena ("April 28, 1999. Playing Random.") — Gm9 -> Fmaj7/A
add_pad_chord(pad_bus, 7.02, 8.28, ["G2", "Bb2", "D3", "F3", "A3", "D4"], fade_in=0.42, fade_out=0.60, gain=0.055, brightness=1.02)
add_cello_bass(bass_bus, 7.05, 8.22, "G1", fade_in=0.15, fade_out=0.26, gain=0.054)

add_pad_chord(pad_bus, 8.15, 10.24, ["A2", "C3", "F3", "A3", "C4", "E4", "A4"], fade_in=0.45, fade_out=0.65, gain=0.060, brightness=1.15)
add_cello_bass(bass_bus, 8.20, 10.18, "A1", fade_in=0.15, fade_out=0.28, gain=0.055)

# 10.20–13.25s: Sector 04 Foundry ("Two hands. One board.") — C6/9 -> A7sus4
add_pad_chord(pad_bus, 10.15, 11.38, ["C3", "E3", "G3", "A3", "D4", "G4"], fade_in=0.42, fade_out=0.55, gain=0.056, brightness=1.08)
add_cello_bass(bass_bus, 10.20, 11.32, "C2", fade_in=0.15, fade_out=0.26, gain=0.054)

add_pad_chord(pad_bus, 11.25, 13.30, ["A2", "D3", "E3", "G3", "C4", "E4", "A4"], fade_in=0.45, fade_out=0.65, gain=0.058, brightness=1.12)
add_cello_bass(bass_bus, 11.30, 13.22, "A1", fade_in=0.15, fade_out=0.28, gain=0.055)

# 13.25–16.42s: Wide Island Hold — Gmaj9 -> Asus4add9 (uplifting suspension preparing D major)
add_pad_chord(pad_bus, 13.20, 14.85, ["G2", "B2", "D3", "F#3", "A3", "D4", "F#4"], fade_in=0.50, fade_out=0.65, gain=0.060, brightness=1.16)
add_cello_bass(bass_bus, 13.25, 14.78, "G1", fade_in=0.16, fade_out=0.28, gain=0.056)

add_pad_chord(pad_bus, 14.72, 16.50, ["A2", "E3", "A3", "B3", "D4", "E4", "A4"], fade_in=0.50, fade_out=0.70, gain=0.064, brightness=1.22)
add_cello_bass(bass_bus, 14.78, 16.40, "A1", fade_in=0.16, fade_out=0.30, gain=0.058)

# 16.40–20.00s: End Title ("The Living Archive / d22soso.com") — Luminous D(add9) resolution
add_pad_chord(pad_bus, 16.35, 19.35, ["D3", "F#3", "A3", "D4", "E4", "F#4", "A4"], fade_in=0.50, fade_out=1.35, gain=0.068, brightness=1.28)
add_cello_bass(bass_bus, 16.42, 19.20, "D2", fade_in=0.15, fade_out=1.20, gain=0.060)


# =========================================================================
# 2. FELT PIANO & VIBRAPHONE MELODIC PHRASING
# =========================================================================
# Hook (0.00–2.48s): Intimate opening fifth + delicate completion bell at 1.15s
add_felt_piano(piano_bus, 0.15, "D3", dur=2.2, vel=0.64, pan=-0.14)
add_felt_piano(piano_bus, 0.19, "A3", dur=2.2, vel=0.68, pan=0.06)
add_felt_piano(piano_bus, 0.24, "E4", dur=2.1, vel=0.66, pan=0.16)
add_felt_piano(piano_bus, 0.72, "F4", dur=1.6, vel=0.58, pan=-0.10)
add_felt_piano(piano_bus, 1.15, "A4", dur=1.6, vel=0.66, pan=0.12)
add_warm_bell(piano_bus, 1.15, "A4", dur=1.9, gain=0.032, pan=-0.10)
add_felt_piano(piano_bus, 1.78, "G4", dur=0.9, vel=0.52, pan=-0.06)

# Reveal (2.48–5.25s): Warm Dm9 arrival as the island opens out of the monument
add_felt_piano(piano_bus, 2.50, "D3", dur=2.6, vel=0.78, pan=-0.18)
add_felt_piano(piano_bus, 2.53, "A3", dur=2.6, vel=0.74, pan=0.02)
add_felt_piano(piano_bus, 2.57, "F4", dur=2.5, vel=0.80, pan=0.16)
add_warm_bell(piano_bus, 2.57, "F4", dur=2.5, gain=0.038, pan=-0.12)
add_felt_piano(piano_bus, 3.25, "E4", dur=1.4, vel=0.64, pan=-0.10)
add_felt_piano(piano_bus, 3.75, "D4", dur=1.4, vel=0.62, pan=0.12)
add_felt_piano(piano_bus, 4.50, "A4", dur=1.2, vel=0.68, pan=0.16)

# Overview Card (5.25–7.05s: "One career. One island.") — Motif I over Bbmaj9
add_felt_piano(piano_bus, 5.36, "Bb2", dur=2.0, vel=0.72, pan=-0.18)
add_felt_piano(piano_bus, 5.39, "F3", dur=2.0, vel=0.70, pan=-0.04)
add_felt_piano(piano_bus, 5.42, "F4", dur=1.8, vel=0.82, pan=0.14)
add_warm_bell(piano_bus, 5.42, "F4", dur=2.3, gain=0.038, pan=-0.12)
add_felt_piano(piano_bus, 5.95, "E4", dur=1.3, vel=0.68, pan=-0.08)
add_felt_piano(piano_bus, 6.42, "D4", dur=1.2, vel=0.72, pan=0.12)

# Arena Swoop & Card (7.05–10.20s: "April 28, 1999. Playing Random.") — Motif II over Gm9 -> Fmaj7/A
add_felt_piano(piano_bus, 7.10, "G2", dur=1.4, vel=0.68, pan=-0.16)
add_felt_piano(piano_bus, 7.14, "D4", dur=1.4, vel=0.70, pan=0.08)
add_felt_piano(piano_bus, 7.65, "F4", dur=1.1, vel=0.66, pan=0.16)

add_felt_piano(piano_bus, 8.24, "A2", dur=2.1, vel=0.74, pan=-0.16)
add_felt_piano(piano_bus, 8.27, "F3", dur=2.1, vel=0.70, pan=-0.02)
add_felt_piano(piano_bus, 8.30, "A4", dur=2.1, vel=0.86, pan=0.16)
add_warm_bell(piano_bus, 8.30, "A4", dur=2.5, gain=0.044, pan=-0.14)
add_felt_piano(piano_bus, 8.92, "G4", dur=1.3, vel=0.70, pan=-0.10)
add_felt_piano(piano_bus, 9.40, "F4", dur=1.2, vel=0.72, pan=0.10)
add_felt_piano(piano_bus, 9.82, "E4", dur=1.0, vel=0.64, pan=-0.06)

# Foundry Swing & Card (10.20–13.25s: "Two hands. One board.") — Motif III over C6/9 -> A7sus4
add_felt_piano(piano_bus, 10.24, "C3", dur=1.3, vel=0.68, pan=-0.14)
add_felt_piano(piano_bus, 10.28, "E4", dur=1.3, vel=0.72, pan=0.12)
add_felt_piano(piano_bus, 10.78, "G4", dur=1.1, vel=0.68, pan=-0.10)

add_felt_piano(piano_bus, 11.34, "A2", dur=2.0, vel=0.74, pan=-0.16)
add_felt_piano(piano_bus, 11.37, "D4", dur=2.0, vel=0.70, pan=-0.02)
add_felt_piano(piano_bus, 11.40, "E4", dur=2.0, vel=0.82, pan=0.15)
add_warm_bell(piano_bus, 11.40, "E4", dur=2.4, gain=0.040, pan=-0.12)
add_felt_piano(piano_bus, 12.00, "G4", dur=1.3, vel=0.72, pan=-0.08)
add_felt_piano(piano_bus, 12.50, "A4", dur=1.3, vel=0.76, pan=0.14)
add_warm_bell(piano_bus, 12.50, "A4", dur=1.8, gain=0.030, pan=-0.10)

# Wide Island Hold (13.25–16.40s: Gmaj9 -> Asus4add9 uplifting arc)
add_felt_piano(piano_bus, 13.30, "G2", dur=1.8, vel=0.72, pan=-0.16)
add_felt_piano(piano_bus, 13.34, "D3", dur=1.8, vel=0.68, pan=-0.04)
add_felt_piano(piano_bus, 13.38, "F#4", dur=1.8, vel=0.80, pan=0.14)
add_warm_bell(piano_bus, 13.38, "F#4", dur=2.2, gain=0.036, pan=-0.10)
add_felt_piano(piano_bus, 14.05, "A4", dur=1.4, vel=0.74, pan=-0.08)

add_felt_piano(piano_bus, 14.80, "A2", dur=1.8, vel=0.76, pan=-0.16)
add_felt_piano(piano_bus, 14.84, "E3", dur=1.8, vel=0.72, pan=0.00)
add_felt_piano(piano_bus, 14.88, "A4", dur=1.7, vel=0.82, pan=0.16)
add_felt_piano(piano_bus, 15.42, "B4", dur=1.4, vel=0.76, pan=-0.12)
add_felt_piano(piano_bus, 15.92, "E4", dur=1.3, vel=0.72, pan=0.10)

# Final Title Resolution (16.45–20.00s: "The Living Archive / d22soso.com") — D(add9)
add_felt_piano(piano_bus, 16.45, "D3", dur=3.4, vel=0.84, pan=-0.20)
add_felt_piano(piano_bus, 16.50, "A3", dur=3.3, vel=0.78, pan=-0.08)
add_felt_piano(piano_bus, 16.56, "E4", dur=3.2, vel=0.78, pan=0.06)
add_felt_piano(piano_bus, 16.64, "F#4", dur=3.2, vel=0.88, pan=0.16)
add_warm_bell(piano_bus, 16.50, "D4", dur=3.2, gain=0.036, pan=-0.14)
add_warm_bell(piano_bus, 16.64, "F#4", dur=3.2, gain=0.044, pan=0.14)
add_felt_piano(piano_bus, 17.22, "E4", dur=2.6, vel=0.66, pan=-0.10)
add_felt_piano(piano_bus, 17.65, "D4", dur=2.4, vel=0.70, pan=0.08)
add_felt_piano(piano_bus, 18.08, "A4", dur=2.0, vel=0.74, pan=-0.06)
add_warm_bell(piano_bus, 18.08, "A4", dur=2.0, gain=0.034, pan=0.10)


# =========================================================================
# 3. ARPEGGIATED PLUCK & HEARTBEAT PULSE (2.50s to 16.45s)
# =========================================================================
# Subtle tresillo (3+3+2) low heartbeat pulse on bars from 2.50s to 16.45s
heartbeat_times = [
    2.50, 3.25, 4.00, 4.75,
    5.40, 6.15,
    7.10, 8.28, 9.05, 9.75,
    10.25, 11.38, 12.15, 12.85,
    13.32, 14.08, 14.82, 15.58,
    16.45,
]
for ht_t in heartbeat_times:
    g_hb = 0.056 if ht_t in (2.50, 8.28, 11.38, 16.45) else 0.038
    add_heartbeat_tom(bass_bus, ht_t, f_start=112.0, f_end=55.0, dur=0.36, gain=g_hb)

pluck_seq = [
    # 2.75–5.00s: Dm9
    (2.75, "A3", 0.52), (3.00, "D4", 0.62), (3.25, "E4", 0.54), (3.50, "F4", 0.66),
    (3.75, "E4", 0.50), (4.00, "D4", 0.58), (4.25, "A3", 0.48), (4.50, "C4", 0.56),
    (4.75, "D4", 0.52), (5.00, "E4", 0.56),
    # 5.25–7.00s: Bbmaj9
    (5.25, "F3", 0.52), (5.50, "Bb3", 0.62), (5.75, "C4", 0.54), (6.00, "D4", 0.64),
    (6.25, "C4", 0.50), (6.50, "A3", 0.58), (6.75, "F3", 0.48),
    # 7.25–8.00s: Gm9
    (7.25, "G3", 0.54), (7.50, "Bb3", 0.62), (7.75, "D4", 0.56), (8.00, "F4", 0.62),
    # 8.25–10.00s: Fmaj7/A
    (8.25, "A3", 0.58), (8.50, "C4", 0.64), (8.75, "E4", 0.56), (9.00, "F4", 0.64),
    (9.25, "E4", 0.52), (9.50, "C4", 0.58), (9.75, "A3", 0.50), (10.00, "C4", 0.54),
    # 10.25–11.25s: C6/9
    (10.25, "G3", 0.54), (10.50, "C4", 0.62), (10.75, "D4", 0.56), (11.00, "E4", 0.62),
    # 11.25–13.00s: A7sus4
    (11.25, "A3", 0.58), (11.50, "D4", 0.64), (11.75, "E4", 0.58), (12.00, "G4", 0.64),
    (12.25, "E4", 0.52), (12.50, "D4", 0.58), (12.75, "A3", 0.50), (13.00, "D4", 0.54),
    # 13.25–14.75s: Gmaj9
    (13.25, "G3", 0.58), (13.50, "B3", 0.64), (13.75, "D4", 0.58), (14.00, "F#4", 0.66),
    (14.25, "D4", 0.54), (14.50, "B3", 0.58),
    # 14.75–16.25s: Asus4add9
    (14.75, "A3", 0.60), (15.00, "B3", 0.64), (15.25, "D4", 0.64), (15.50, "E4", 0.68),
    (15.75, "D4", 0.58), (16.00, "A3", 0.54), (16.25, "E4", 0.52),
]
for idx_p, (pt, pnote, pvel) in enumerate(pluck_seq):
    pan_p = 0.28 * np.sin(idx_p * 1.15)
    add_pluck(pluck_bus, pt, pnote, vel=pvel, pan=pan_p)


# =========================================================================
# 4. MUSICAL TRANSITION SWELLS (Pitched in key, synced to camera cuts)
# =========================================================================
# 0.12–1.15s: Subtle warm harmonic rise as the "ENTERING THE ARCHIVE" bar fills
add_pitched_swell(fx_bus, 0.72, width_s=1.10, notes=("D4", "A4", "E5"), gain=0.022, pan_start=-0.20, pan_end=0.20)

# 2.48s: Monument plate lift & island reveal
add_pitched_swell(fx_bus, 2.58, width_s=1.15, notes=("D3", "A3", "E4", "F4"), gain=0.042, pan_start=-0.30, pan_end=0.30)

# 7.05s: Camera swoop into Sector 01 (Arena)
add_pitched_swell(fx_bus, 7.12, width_s=0.85, notes=("G3", "D4", "A4"), gain=0.028, pan_start=-0.35, pan_end=0.30)

# 10.20s: Camera swing into Sector 04 (Foundry)
add_pitched_swell(fx_bus, 10.26, width_s=0.85, notes=("C3", "G3", "D4", "E4"), gain=0.028, pan_start=0.35, pan_end=-0.30)

# 13.25s: Camera pullback to Wide Island overview
add_pitched_swell(fx_bus, 13.32, width_s=0.95, notes=("G3", "B3", "D4", "F#4"), gain=0.030, pan_start=-0.25, pan_end=0.25)

# 16.45s: Final title card arrival ("The Living Archive")
add_pitched_swell(fx_bus, 16.48, width_s=1.10, notes=("D3", "A3", "E4", "F#4", "A4"), gain=0.036, pan_start=-0.25, pan_end=0.25)


# =========================================================================
# 5. SPATIAL MIXING & MASTERING
# =========================================================================
pluck_delayed = pluck_bus + stereo_delay(pluck_bus, delay_l_s=0.25, delay_r_s=0.375, fb=0.30, wet=0.28)

rev_send = 0.85 * piano_bus + 0.55 * pluck_delayed + 0.35 * pad_bus + 0.45 * fx_bus
hall = stereo_reverb(rev_send, rt60=2.55, wet=0.34)

mix = bass_bus + pad_bus + piano_bus + pluck_delayed + fx_bus + hall

# Clean high-pass at 34 Hz so sub-bass stays tight and never muddies the mix
sos_sub = signal.butter(2, 34.0 / (SR / 2), btype="highpass", output="sos")
mix = signal.sosfilt(sos_sub, mix, axis=0)

# Smooth master fade-in (80ms) and natural reverb tail fade-out over the last 0.85s
fade_in = np.clip(t / 0.08, 0.0, 1.0)
fade_out = np.where(t > (DUR - 0.85), 0.5 + 0.5 * np.cos(np.pi * np.clip((t - (DUR - 0.85)) / 0.85, 0.0, 1.0)), 1.0)
mix *= (fade_in * fade_out)[:, None]

# Target loudness (-15.2 dBFS RMS, soft ceiling at -1.5 dBFS)
rms_raw = float(np.sqrt(np.mean(mix ** 2)))
target_rms = 10.0 ** (-15.2 / 20.0)
mix *= target_rms / max(rms_raw, 1e-9)

limit = 0.84
mix = limit * np.tanh(mix / limit)

peak = float(np.max(np.abs(mix)))
rms = float(np.sqrt(np.mean(mix ** 2)))
print(f"peak {peak:.3f} ({20*np.log10(peak):.1f} dBFS) | rms {rms:.3f} ({20*np.log10(rms):.1f} dBFS)")

pcm_i = np.clip(np.round(mix * 32767.0), -32768, 32767).astype(np.int16)
path = "/Users/chrisswimlee/d22soso/brag-output/work/music.wav"
with wave.open(path, "w") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm_i.tobytes())
print(path)
