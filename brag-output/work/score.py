"""One bed for the Living Archive film. D minor, lifting to D major on the title."""
import numpy as np
import wave

SR = 44100
DUR = 20.0
n = int(SR * DUR)
t = np.arange(n) / SR

def env(points):
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)

def sine(freq, detune=1.0):
    return np.sin(2 * np.pi * freq * detune * t)

def mallet(when, freq, decay=5.5, gain=0.12, bright=0.22):
    x = t - when
    alive = x >= 0
    e = np.where(alive, np.exp(-np.maximum(x, 0) * decay), 0.0)
    body = np.sin(2 * np.pi * freq * x) * e
    spark = np.sin(2 * np.pi * freq * 2.51 * x) * np.where(alive, np.exp(-np.maximum(x, 0) * 28), 0.0)
    return gain * (body + bright * spark)

D1, D2, A2 = 36.708, 73.416, 110.0
D3, F3, FS3, A3 = 146.832, 174.614, 184.997, 220.0
D4, F4, FS4, A4, D5 = 293.665, 349.228, 369.994, 440.0, 587.330

drone_e = env([(0, 0), (0.35, 1), (16.6, 1), (18.2, 0.85), (20, 0.55)])
drone = drone_e * (
    0.13 * sine(D2) + 0.04 * sine(D2, 1.004) + 0.03 * sine(D2 * 2) + 0.09 * sine(D1)
)
fifth_e = env([(0, 0), (2.55, 0), (4.1, 1), (17.4, 1), (20, 0.7)])
fifth = fifth_e * 0.09 * (sine(A2) + 0.4 * sine(A2, 1.003))

maj = env([(0, 0), (17.15, 0), (18.15, 1), (20, 1)])
pad_e = env([(0, 0), (2.7, 0), (4.6, 1), (16.8, 1), (18.4, 1.05), (20, 0.62)])
lfo = 0.86 + 0.14 * np.sin(2 * np.pi * 0.07 * t)
pad = pad_e * lfo * (
    0.055 * sine(D3) + 0.04 * sine(D3, 1.0035)
    + 0.05 * (1 - maj) * sine(F3) + 0.055 * maj * sine(FS3)
    + 0.045 * sine(A3) + 0.02 * maj * sine(D4)
)

hits = (
    mallet(0.26, D3, decay=2.4, gain=0.16, bright=0.18)
    + mallet(0.26, A3, decay=2.6, gain=0.07, bright=0.1)
    + mallet(5.45, D4, decay=6.0, gain=0.11)
    + mallet(8.30, F4, decay=6.0, gain=0.10)
    + mallet(11.40, A4, decay=6.0, gain=0.09)
    + mallet(14.50, D5, decay=5.2, gain=0.08)
    + mallet(17.55, D4, decay=3.2, gain=0.11, bright=0.15)
    + mallet(17.55, FS4, decay=3.4, gain=0.07, bright=0.12)
    + mallet(17.55, A4, decay=3.6, gain=0.06, bright=0.1)
)

# Whoosh as the plate lifts, plus a soft sub thump in the same key.
rng = np.random.default_rng(22)
noise = rng.standard_normal(n)
whoosh = np.zeros(n)
z_lo = z_hi = 0.0
t0, dur = 2.42, 0.95
i0, i1 = int(t0 * SR), int((t0 + dur) * SR)
for i in range(i0, i1):
    u = (i / SR - t0) / dur
    e = np.sin(np.pi * u) ** 1.3
    fc = 160 + 1800 * (u ** 1.15) * (1 - 0.35 * u)
    a_lo = np.exp(-2 * np.pi * fc * 1.5 / SR)
    a_hi = np.exp(-2 * np.pi * fc * 0.4 / SR)
    z_lo = (1 - a_lo) * noise[i] + a_lo * z_lo
    z_hi = (1 - a_hi) * noise[i] + a_hi * z_hi
    whoosh[i] = (z_lo - z_hi) * e
whoosh *= 0.055
thump = mallet(2.55, D1, decay=2.2, gain=0.2, bright=0.0)

air = np.zeros(n)
z = 0.0
a = np.exp(-2 * np.pi * 1800 / SR)
for i in range(1, n):
    z = (1 - a) * noise[i] + a * z
    air[i] = (noise[i] - z) * 0.008
air *= env([(0, 0), (2.6, 0), (3.4, 1), (19.4, 1), (20, 0)])

mono = drone + fifth + pad + hits + whoosh + thump + air
# Gentle width on the pad only.
delay = int(0.013 * SR)
pad_r = np.roll(pad, delay)
pad_r[:delay] = 0
left = mono + pad * 0.18
right = mono - pad * 0.06 + pad_r * 0.22
stereo = np.stack([left, right], axis=1)

fade_in = np.clip(t / 0.12, 0, 1)
fade_out = np.clip((DUR - t) / 0.45, 0, 1)
stereo *= (fade_in * fade_out)[:, None]
stereo = np.tanh(stereo * 1.05) / np.tanh(1.05)
peak = float(np.max(np.abs(stereo)))
if peak > 0.89:
    stereo *= 0.89 / peak
rms = float(np.sqrt(np.mean(stereo ** 2)))
print(f"peak {peak:.3f} rms {rms:.3f}")

pcm = np.clip(stereo, -1, 1)
pcm_i = (pcm * 32767).astype(np.int16)
path = "/Users/chrisswimlee/d22soso/brag-output/work/music.wav"
with wave.open(path, "w") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm_i.tobytes())
print(path)
