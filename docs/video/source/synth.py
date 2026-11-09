"""Soundtrack for the Scam Detector brag: 100 BPM, D major, 24.6 s.
Music and effects share one beat grid (beat k at 0.6*k s from frame 0) and one key.
Usage: python3 -I synth.py out.wav
"""
import sys
import wave
import numpy as np

SR = 48000
BPM = 100
BEAT = 60 / BPM            # 0.6 s
DUR = 41 * BEAT            # 24.6 s, video length
TOTAL = DUR + 0.0
N = int(TOTAL * SR)
rng = np.random.default_rng(7)

def B(k):
    return k * BEAT

def hz(note):
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    name, octv = note[:-1], int(note[-1])
    midi = 12 * (octv + 1) + names[name]
    return 440.0 * 2 ** ((midi - 69) / 12)

def spectral_filter(x, lo=None, hi=None, order=2):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    return np.fft.irfft(X * g, len(x))

class Bus:
    def __init__(self):
        self.L = np.zeros(N + SR * 3)
        self.R = np.zeros(N + SR * 3)

    def add(self, t, sig, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i >= len(self.L):
            return
        sig = sig[: len(self.L) - i]
        l = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
        r = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
        self.L[i:i + len(sig)] += sig * gain * l
        self.R[i:i + len(sig)] += sig * gain * r

def env_adsr(n, a, d, s, r_len, sus_len):
    a_n, d_n, s_n, r_n = int(a * SR), int(d * SR), int(sus_len * SR), int(r_len * SR)
    e = np.concatenate([
        np.linspace(0, 1, max(a_n, 1)),
        np.linspace(1, s, max(d_n, 1)),
        np.full(max(s_n, 0), s),
        np.linspace(s, 0, max(r_n, 1)),
    ])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))

# ---------------------------------------------------------------- instruments
def pad(freqs, length, bright=1.0):
    n = int((length + 1.2) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):           # cents-ish chorus
            ff = f * 2 ** (det / 12 / 4)
            ph = rng.uniform(0, 2 * np.pi)
            out += (np.sin(2 * np.pi * ff * t + ph)
                    + 0.35 * bright * np.sin(2 * np.pi * 2 * ff * t + ph)
                    + 0.12 * bright * np.sin(2 * np.pi * 3 * ff * t + ph))
    out /= len(freqs) * 3
    lfo = 1 + 0.06 * np.sin(2 * np.pi * 0.25 * t)
    return out * lfo * env_adsr(n, 0.5, 0.4, 0.85, 1.2, length - 0.9)

def piano(f, length=1.6, vel=1.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    partials = [(1, 1.0, 2.2), (2.002, 0.45, 3.5), (3.006, 0.18, 5.0), (4.01, 0.08, 7.0)]
    out = np.zeros(n)
    for m, a, dec in partials:
        out += a * np.sin(2 * np.pi * f * m * t) * np.exp(-dec * t)
    att = np.minimum(1, t / 0.006)
    # felt: soften attack with a short low-passed noise thump
    return out * att * vel * 0.5

def bell(f, length=2.4, vel=1.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for m, a, dec in [(1, 1.0, 1.6), (2.0, 0.5, 2.4), (2.76, 0.28, 3.4), (5.4, 0.1, 6.0)]:
        out += a * np.sin(2 * np.pi * f * m * t) * np.exp(-dec * t)
    return out * np.minimum(1, t / 0.003) * vel * 0.4

def bass(f, length, vel=1.0):
    n = int((length + 0.15) * SR)
    t = np.arange(n) / SR
    out = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return out * env_adsr(n, 0.01, 0.25, 0.6, 0.15, length - 0.26) * vel * 0.55

def kick(vel=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 46 + 70 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7.5) * vel * 0.8

def shaker(vel=1.0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n) * np.exp(-t * 55)
    return spectral_filter(np.pad(x, (0, 2048)), lo=3500, hi=9000)[:n] * vel * 0.25

def thump(vel=1.0):
    """Soft low impact pitched to D (banner arrival)."""
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = hz('D2') * (1 + 0.6 * np.exp(-t * 18))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    noise = spectral_filter(rng.standard_normal(n) * np.exp(-t * 22), hi=600)
    return (s + 0.35 * noise) * vel * 0.9

def swell(length=0.55, vel=1.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n) * (t / length) ** 2
    return spectral_filter(x, lo=400, hi=2500) * vel * 0.12

def click(vel=1.0):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * hz('A6') * t) * 0.5 + rng.standard_normal(n) * 0.3) * np.exp(-t * 180)
    return spectral_filter(np.pad(x, (0, 1024)), hi=5000)[:n] * vel * 0.5

# ---------------------------------------------------------------- arrangement
music = Bus()
fx = Bus()

CHORDS = {
    'Bm': ['B2', 'D3', 'F#3', 'B3'], 'G': ['G2', 'B2', 'D3', 'G3'], 'D': ['D3', 'F#3', 'A3', 'D4'],
    'A': ['A2', 'C#3', 'E3', 'A3'], 'Em': ['E3', 'G3', 'B3', 'E4'],
}
ROOT = {'Bm': 'B1', 'G': 'G1', 'D': 'D2', 'A': 'A1', 'Em': 'E2'}
ARP = {'Bm': ['B4', 'D5', 'F#5', 'D5'], 'G': ['G4', 'B4', 'D5', 'B4'], 'D': ['A4', 'D5', 'F#5', 'D5'],
       'A': ['A4', 'C#5', 'E5', 'C#5'], 'Em': ['G4', 'B4', 'E5', 'B4']}

# (start beat, end beat, chord)
SECTIONS = [
    (0, 4, 'Bm'), (4, 8, 'G'),                       # hook: questioning
    (8, 12, 'D'), (12, 16, 'A'), (16, 20, 'Bm'),      # the warning protects you
    (20, 24, 'G'), (24, 28, 'D'),                     # chat
    (28, 32, 'Bm'), (32, 35, 'G'),                    # honesty: thin
    (35, 41, 'D'),                                    # resolve on the logo
]

for k0, k1, ch in SECTIONS:
    length = B(k1 - k0)
    quiet = 28 <= k0 < 35
    music.add(B(k0), pad([hz(n) for n in CHORDS[ch]], length, bright=0.6 if quiet else 1.0), gain=0.32 if quiet else 0.36, pan=0)
    # bass on beats 1 and 3 (from the first warning on), sustained root in the hook / honesty sections
    for k in range(k0, k1):
        if k < 8 or quiet:
            if k == k0:
                music.add(B(k), bass(hz(ROOT[ch]), length - 0.1, vel=0.6), gain=0.35)
        elif (k - k0) % 2 == 0:
            music.add(B(k), bass(hz(ROOT[ch]), BEAT * 1.8), gain=0.38)
    # felt-piano arpeggio in eighths through the middle; quarter notes in the hook; sparse in honesty
    arp = ARP[ch]
    for k in range(k0, k1):
        if k < 8:
            music.add(B(k), piano(hz(arp[k % 4]), 1.4, vel=0.55), gain=0.7, pan=-0.2 + 0.4 * (k % 2))
        elif quiet:
            continue
        else:
            for e in range(2):
                note = arp[(2 * (k - k0) + e) % 4]
                music.add(B(k) + e * BEAT / 2, piano(hz(note), 1.0, vel=0.5 if e else 0.6), gain=0.62, pan=-0.3 + 0.6 * e)

# drums: kick on 1 and 3, shaker on off-beats, from the banner to the end of the chat; light again on the logo
for k in range(8, 28):
    if k % 2 == 0:
        music.add(B(k), kick(), gain=0.26)
    music.add(B(k) + BEAT / 2, shaker(), gain=0.35, pan=0.3)
for k in range(35, 40):
    if k % 2 == 1:
        music.add(B(k), kick(0.8), gain=0.24)
    music.add(B(k) + BEAT / 2, shaker(0.8), gain=0.3, pan=0.3)

# ---------------------------------------------------------------- effects, on the same grid and in key
fx.add(B(1), bell(hz('F#5'), 1.6, 0.7), gain=0.5, pan=-0.25)          # SMS arrives (k1)
fx.add(B(1) + BEAT / 2, bell(hz('B5'), 1.6, 0.6), gain=0.45, pan=-0.25)
fx.add(B(6), click(), gain=0.5, pan=-0.3)                              # tap on the link (k6)
fx.add(B(9) - 0.55, swell(0.55), gain=1.0)                             # banner slides down (k9)
fx.add(B(9), thump(), gain=0.45)
fx.add(B(9), bell(hz('A4'), 2.0, 0.5), gain=0.45)
fx.add(B(9) + BEAT / 2, bell(hz('D5'), 2.0, 0.5), gain=0.4)
fx.add(B(11), click(), gain=0.5, pan=0.3)                              # "Why?" (k11)
fx.add(B(12), piano(hz('F#5'), 1.2, 0.5), gain=0.45, pan=0.2)          # reason 1 (k12)
fx.add(B(14), piano(hz('A5'), 1.2, 0.5), gain=0.45, pan=0.2)           # reason 2 (k14)
fx.add(B(16), click(), gain=0.55, pan=0.3)                             # "Leave this site" (k16)
fx.add(B(16), bell(hz('D6'), 1.4, 0.4), gain=0.3, pan=0.3)
fx.add(B(19), bell(hz('B5'), 1.4, 0.5), gain=0.35, pan=-0.2)           # chat message (k19)
fx.add(B(21) - 0.55, swell(0.55), gain=0.9)                            # chat banner (k21)
fx.add(B(21), thump(0.8), gain=0.4)
fx.add(B(21), bell(hz('G4'), 2.0, 0.45), gain=0.4)
fx.add(B(21) + BEAT / 2, bell(hz('D5'), 2.0, 0.45), gain=0.35)
for k, note in ((29, 'D5'), (31, 'F#5'), (33, 'A5')):                 # honesty lines (k29, k31, k33)
    fx.add(B(k), piano(hz(note), 1.6, 0.55), gain=0.5)
fx.add(B(35), thump(0.6), gain=0.3)                                    # logo (k35): warm D major bell chord
for i, note in enumerate(('D5', 'F#5', 'A5', 'D6')):
    fx.add(B(35) + i * 0.02, bell(hz(note), 3.5, 0.55), gain=0.32, pan=-0.3 + 0.2 * i)

# ---------------------------------------------------------------- mix
def reverb(x, seconds=1.8, wet=0.22):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t * 3.2)
    ir = spectral_filter(ir, hi=4500)
    ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x * (1 - wet) + y * wet * 1.4

Lm, Rm = spectral_filter(music.L, lo=38, hi=7000), spectral_filter(music.R, lo=38, hi=7000)
Lf, Rf = spectral_filter(fx.L, hi=8000), spectral_filter(fx.R, hi=8000)
L = reverb(Lm * 0.9 + Lf * 0.75, wet=0.22)
R = reverb(Rm * 0.9 + Rf * 0.75, wet=0.22)

# master fade-out over the last 0.6 s (video fades to dark at the same time), cut at DUR
L, R = L[:N], R[:N]
fade = np.ones(N)
fn = int(0.6 * SR)
fade[-fn:] = np.linspace(1, 0, fn) ** 1.5
fi = int(0.02 * SR)
fade[:fi] = np.linspace(0, 1, fi)
L *= fade
R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = L / peak * 0.89, R / peak * 0.89
# gentle soft-clip as a limiter
L, R = np.tanh(L * 1.1) / np.tanh(1.1), np.tanh(R * 1.1) / np.tanh(1.1)

out = np.stack([L, R], axis=1)
pcm = (np.clip(out, -1, 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', sys.argv[1], f'{N / SR:.2f}s')
