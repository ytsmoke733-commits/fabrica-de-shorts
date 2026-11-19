"""Caso-real soundtrack: narration + soft procedural sound effects + a quiet music bed, all made here with numpy.
No samples, no AI audio, no downloads.

  python3 tools/mix.py [project=.]          → data/mix.wav (48 kHz stereo)

Reads data/cues.json (node tools/capture.mjs cues), data/narration.wav if it exists (voice.py or words.py --audio),
and script.json "music": "bed" (the procedural score, default) · "none" · "audio/your-track.mp3" (your own royalty-free
track, any format ffmpeg reads). The music ducks under the voice.

Sound rules (STYLE.md): every effect is soft and rounded, nothing above ~5 kHz, no hats / glitches; the only sharp sounds
are the computer-screen ones (teclado clicks and the short 1 kHz bip).
Cue types: whoosh slide pop plop gulp boing bubbles sizzle sparkle thud slam tock zip alarm  (+ gain, dur)
Caso-real: teclado (cliques de teclado, dur) e bip (bip curto de 1.000 Hz) para as telas de computador.
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.io import wavfile

P = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
SR = 48000
rng = np.random.default_rng(11)
cj = json.loads((P / 'data/cues.json').read_text())
script = json.loads((P / 'script.json').read_text())
DUR = float(cj['duration'])
N = int(DUR * SR) + SR // 10


def lp(x, f, o=2): b, a = signal.butter(o, min(f, SR / 2 - 100) / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, f0, f1, o=2): b, a = signal.butter(o, [f0 / (SR / 2), f1 / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def db(x): return 10 ** (x / 20)
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=None):
    """attack a seconds then exponential release over the rest"""
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    rest = n - na; e[na:] = np.exp(-np.linspace(0, r or 5, rest)) if rest > 0 else 1; return e
def sweep(f0, f1, d, shape='exp'):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d) if shape == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def noise(d): return rng.standard_normal(int(d * SR))


# ---------- the effects ----------
def whoosh(d=0.38, **_):
    n = noise(d); lo, hi = lp(n, 500), lp(n, 2200)
    k = np.sin(np.pi * np.linspace(0, 1, len(n))); x = (lo * (1 - k) + hi * k) * k ** 1.5
    return x / (np.abs(x).max() + 1e-9) * 0.5
def slide(d=1.0, **_):
    n = lp(noise(d), 700); e = np.sin(np.pi * np.linspace(0, 1, len(n))) ** 2
    return n / (np.abs(n).max() + 1e-9) * e * 0.35 + sweep(260, 120, d) * e * 0.08
def pop(**_): x = sweep(560, 240, 0.11) * env(int(0.11 * SR), 0.002, 6); return lp(x, 3000) * 0.7
def plop(**_): x = sweep(700, 180, 0.14) * env(int(0.14 * SR), 0.002, 5); return lp(x, 2500) * 0.6
def gulp(**_):
    a = sweep(320, 140, 0.16) * env(int(0.16 * SR), 0.01, 4); b = sweep(240, 90, 0.2) * env(int(0.2 * SR), 0.01, 4)
    x = np.concatenate([a, np.zeros(int(0.04 * SR)), b]); return lp(x, 1800) * 0.8
def boing(**_):
    d = 0.42; t = tt(d); f = 200 * (1 + 0.6 * t / d) * (1 + 0.08 * np.sin(2 * np.pi * 18 * t))
    return lp(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.004, 4), 2000) * 0.55
def bubbles(d=2.0, **_):
    x = np.zeros(int(d * SR))
    for _ in range(int(d * 7)):
        st = rng.integers(0, max(1, len(x) - int(0.08 * SR))); f = rng.uniform(380, 900); b = sweep(f, f * 1.6, 0.06) * env(int(0.06 * SR), 0.003, 5)
        x[st:st + len(b)] += b * rng.uniform(0.2, 0.5)
    return lp(x, 2500) * 0.5
def sizzle(d=1.0, **_):
    n = bp(noise(d), 1800, 4500); crack = (rng.random(len(n)) < 0.002).astype(float); crack = lp(crack, 300) * 40
    e = np.minimum(1, np.linspace(0, 6, len(n))) * np.linspace(1, 0.2, len(n)); return n * (0.4 + crack) * e * 0.12
def sparkle(d=1.2, **_):
    notes = [784, 880, 1047, 1175, 1319, 1568]; x = np.zeros(int(d * SR) + SR // 2)
    for k, f in enumerate(notes):
        st = int(k * d / len(notes) * SR); n = int(0.4 * SR); t = tt(0.4)
        x[st:st + n] += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env(n, 0.004, 6) * 0.22
    return lp(x, 4500)
def thud(**_):
    d = 0.35; t = tt(d); x = np.sin(2 * np.pi * (70 + 40 * np.exp(-t * 30)) * t) * env(len(t), 0.002, 7)
    return x * 0.9 + lp(noise(d), 220) * env(len(t), 0.001, 12) * 0.3
def slam(**_):
    d = 0.5; t = tt(d); x = np.sin(2 * np.pi * (60 + 60 * np.exp(-t * 25)) * t) * env(len(t), 0.002, 6)
    return np.tanh(1.6 * (x + lp(noise(d), 1200) * env(len(t), 0.001, 10) * 0.6)) * 0.9
def tock(**_): d = 0.09; t = tt(d); return (np.sin(2 * np.pi * 420 * t) + 0.3 * np.sin(2 * np.pi * 840 * t)) * env(len(t), 0.001, 9) * 0.35
def zip_(**_):
    d = 0.32; n = bp(noise(d), 400, 3000); k = np.linspace(0, 1, len(n))
    return (n / (np.abs(n).max() + 1e-9) * 0.35 + sweep(300, 1100, d) * 0.12) * np.sin(np.pi * k) ** 1.2
def alarm(d=2.0, **_):
    x = np.zeros(int(d * SR)); one = np.sin(2 * np.pi * 150 * tt(0.22)) * env(int(0.22 * SR), 0.02, 5)
    for st in np.arange(0, d - 0.25, 0.5): i = int(st * SR); x[i:i + len(one)] += one
    return lp(x, 900) * 0.55

def inhale(d=1.0, **_):
    n = bp(noise(d), 300, 2600); k = np.linspace(0, 1, len(n)); e = np.sin(np.pi * np.minimum(1, k * 1.15)) ** 1.5 * (0.6 + 0.4 * k)
    return n / (np.abs(n).max() + 1e-9) * e * 0.5
def heartbeat(**_):
    one = lambda d, f: np.sin(2 * np.pi * f * tt(d)) * env(int(d * SR), 0.004, 7)
    x = np.concatenate([one(0.16, 58), np.zeros(int(0.09 * SR)), one(0.2, 52) * 0.75]); return lp(x, 300) * 1.0

def slowmo(d=1.4, **_):
    t = tt(d); k = t / d; f = 180 * (0.3 ** k)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - k) ** 1.5 + lp(noise(d), 260) * 1.2 * np.minimum(1, k * 6) * (1 - k) ** 2
    rev = lp(noise(0.35), 1500) * np.linspace(0, 1, int(0.35 * SR)) ** 2
    x = np.concatenate([rev * 0.5, x]); return x / (np.abs(x).max() + 1e-9)
def crinkle(d=0.9, **_):
    """paper/foil wrapper: dense soft crackles"""
    x = np.zeros(int(d * SR))
    for _ in range(int(d * 90)):
        st = rng.integers(0, max(1, len(x) - int(0.02 * SR))); n = int(rng.uniform(0.004, 0.018) * SR)
        b = bp(rng.standard_normal(n), rng.uniform(1200, 2200), 4800) * env(n, 0.0005, 6); m = min(n, len(x) - st); x[st:st + m] += b[:m] * rng.uniform(0.2, 1.0)
    return x * np.minimum(1, np.linspace(0, 1, len(x)) * 8) * np.minimum(1, np.linspace(1, 0, len(x)) * 6)
def chew(**_):
    """one soft wet squish of a chew"""
    d = 0.16; t = tt(d); n = lp(noise(d), 900) * env(len(t), 0.02, 5)
    return n + np.sin(2 * np.pi * (140 + 60 * np.exp(-t * 30)) * t) * env(len(t), 0.005, 8) * 0.4
def buzz(d=0.35, **_):
    t = tt(d); x = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.5 + np.sin(2 * np.pi * 150 * t)
    g = (np.sin(2 * np.pi * 14 * t) > -0.2).astype(float); return lp(x * g, 1200) * 0.5
def splash(**_):
    d = 0.6; t = tt(d); n = bp(noise(d), 300, 3500) * env(len(t), 0.004, 6)
    drops = np.zeros(len(t))
    for _ in range(9):
        st = rng.integers(int(0.05 * SR), int(0.45 * SR)); f = rng.uniform(500, 1100); b = sweep(f, f * 1.8, 0.05) * env(int(0.05 * SR), 0.002, 5); drops[st:st + len(b)] += b * 0.3
    return n + drops + sweep(220, 90, d) * env(len(t), 0.003, 7) * 0.5
def squish(**_):
    d = 0.3; t = tt(d); x = lp(noise(d), 600) * np.sin(np.pi * t / d) ** 2 + np.sin(2 * np.pi * (90 + 40 * np.sin(np.pi * t / d)) * t) * np.sin(np.pi * t / d) * 0.5
    return x
def stretch(**_):
    d = 0.7; t = tt(d); f = 160 * (1 + 0.8 * t / d); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.3 * np.sin(2 * np.pi * 22 * t))
    return lp(x, 1500) * np.sin(np.pi * t / d) * 0.6
def chomp(**_):
    d = 0.12; t = tt(d); return lp(noise(d), 1400) * env(len(t), 0.001, 9) + np.sin(2 * np.pi * 300 * t) * env(len(t), 0.001, 12) * 0.5
def tick(**_):
    d = 0.06; t = tt(d); return (np.sin(2 * np.pi * 1200 * t) * 0.6 + lp(noise(d), 3000) * 0.4) * env(len(t), 0.0005, 12)
def scan(**_):
    d = 0.7; t = tt(d); x = sweep(300, 1600, d) * 0.4 + bp(noise(d), 800, 3000) * 0.3; return x * np.sin(np.pi * t / d) ** 1.5
def shatter(**_):
    d = 0.6; x = np.zeros(int(d * SR))
    for _ in range(26):
        st = rng.integers(0, int(0.35 * SR)); f = rng.uniform(1200, 3600); n = int(0.12 * SR)
        x[st:st + n] += np.sin(2 * np.pi * f * tt(0.12)) * env(n, 0.001, 9) * rng.uniform(0.2, 0.6)
    return x + bp(noise(d), 1500, 4500) * env(len(x), 0.001, 8) * 0.6
def ding(**_):
    d = 0.9; t = tt(d); return (np.sin(2 * np.pi * 1046 * t) + 0.4 * np.sin(2 * np.pi * 1568 * t) + 0.2 * np.sin(2 * np.pi * 2093 * t)) * env(len(t), 0.002, 5) * 0.5
def spit(**_):
    d = 0.32; t = tt(d); n = bp(noise(d), 500, 3500) * env(len(t), 0.003, 6)
    p = np.zeros(len(t)); pp = sweep(400, 160, 0.08) * env(int(0.08 * SR), 0.001, 5); p[:len(pp)] = pp
    return n * 0.8 + p

# ---------- caso-real: telas de computador ----------
def teclado(d=1.0, **_):
    """cliques curtos de teclado em ritmo irregular (9 a 14 por segundo), filtrados"""
    x = np.zeros(int(d * SR)); st = rng.uniform(0, 0.04)
    while st < d - 0.03:
        i = int(st * SR); n = int(rng.uniform(0.012, 0.022) * SR)
        clique = bp(rng.standard_normal(n), 1400, 4200) * env(n, 0.0005, 9)            # o estalo da tecla
        clique += np.sin(2 * np.pi * rng.uniform(180, 260) * np.arange(n) / SR) * env(n, 0.001, 7) * 0.5   # o fundo da tecla
        m = min(n, len(x) - i); x[i:i + m] += clique[:m] * rng.uniform(0.5, 1.0)
        st += rng.uniform(1 / 14, 1 / 9)
    return lp(x, 4500)
def bip(**_):
    """bip curto de 1.000 Hz, 0,12 s"""
    d = 0.12; t = tt(d); e = np.minimum(1, t / 0.005) * np.minimum(1, (d - t) / 0.02)
    return np.sin(2 * np.pi * 1000 * t) * e * 0.6

FX = dict(teclado=teclado, bip=bip, slowmo=slowmo, crinkle=crinkle, chew=chew, buzz=buzz, splash=splash, squish=squish, stretch=stretch, chomp=chomp, tick=tick, scan=scan, shatter=shatter, ding=ding, spit=spit, inhale=inhale, heartbeat=heartbeat, whoosh=whoosh, slide=slide, pop=pop, plop=plop, gulp=gulp, boing=boing, bubbles=bubbles, sizzle=sizzle,
          sparkle=sparkle, thud=thud, slam=slam, tock=tock, zip=zip_, alarm=alarm)
LEVEL = dict(teclado=-20, bip=-21, slowmo=-12, crinkle=-19, chew=-18, buzz=-19, splash=-12, squish=-15, stretch=-15, chomp=-15, tick=-19, scan=-17, shatter=-14, ding=-19, spit=-12, inhale=-15, heartbeat=-8, whoosh=-17, slide=-19, pop=-14, plop=-15, gulp=-11, boing=-15, bubbles=-21, sizzle=-18, sparkle=-17,
             thud=-11, slam=-9, tock=-18, zip=-14, alarm=-17)


# ---------- the music bed: soft pad + plucked arpeggio, 100 BPM, I–vi–IV–V ----------
def music_bed():
    bpm = 100; beat = 60 / bpm; bar = beat * 4
    chords = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
    x = np.zeros(N)
    nb = int(np.ceil(DUR / bar)) + 1
    for b in range(nb):
        ch = chords[b % 4]; st = int(b * bar * SR); n = int(bar * SR)
        if st >= N: break
        t = tt(bar); e = np.minimum(1, t / 0.4) * np.minimum(1, (bar - t) / 0.4)
        pad = sum(np.sin(2 * np.pi * f / 2 * t) + 0.25 * np.sin(2 * np.pi * f * t) for f in ch) * e * 0.10
        x[st:st + n] += pad[:max(0, min(n, N - st))]
        for k in range(8):                                                       # eighth-note pluck arpeggio
            f = ch[[0, 1, 2, 1, 2, 0, 1, 2][k]] * (2 if k % 4 == 2 else 1); ps = st + int(k * beat / 2 * SR); pn = int(0.5 * SR)
            if ps + pn >= N: continue
            pt = tt(0.5); pl = (np.sin(2 * np.pi * f * pt) + 0.35 * np.sin(4 * np.pi * f * pt)) * env(pn, 0.003, 7) * 0.12
            x[ps:ps + pn] += pl
    x = lp(x, 3200)
    fade = np.ones(N); fo = int(1.2 * SR); fade[-fo:] = np.linspace(1, 0, fo)
    return x / (np.abs(x).max() + 1e-9) * fade

def music_tension():
    """low drone + slow minor pulse, for mysterious / tense explainers (script.json "music": "tension")"""
    t = np.arange(N) / SR; x = np.zeros(N)
    for f, g in [(55, 0.5), (82.4, 0.3), (110, 0.2), (130.8, 0.12)]: x += np.sin(2 * np.pi * f * t + np.sin(t * 0.3) * 0.5) * g
    x *= 0.55 + 0.45 * np.sin(2 * np.pi * t / 8) ** 2
    beat = 60 / 84; ping = lambda f: (np.sin(2 * np.pi * f * tt(1.2)) + 0.3 * np.sin(4 * np.pi * f * tt(1.2))) * env(int(1.2 * SR), 0.01, 5)
    seq = [220.0, 261.6, 196.0, 174.6]
    for k in range(int(DUR / (beat * 2))):
        i = int(k * beat * 2 * SR); pg = ping(seq[(k // 2) % 4]) * 0.35
        if i + len(pg) < N: x[i:i + len(pg)] += pg
    x = lp(x, 2200); fade = np.ones(N); fo = int(1.5 * SR); fade[-fo:] = np.linspace(1, 0, fo); fi = int(0.8 * SR); fade[:fi] *= np.linspace(0, 1, fi)
    return x / (np.abs(x).max() + 1e-9) * fade

def load_audio(f):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(f), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(out, dtype=np.float32).reshape(-1, 2).astype(np.float64); return a


mix = np.zeros((N, 2))
# voice
vf = P / 'data/narration.wav'
voice = None
if vf.exists():
    v = load_audio(vf)[:N]; voice = np.zeros((N, 2)); voice[:len(v)] = v
    rms = np.sqrt(np.mean(voice ** 2) + 1e-12); voice *= db(-19) / rms
    mix += voice
# music
mus = script.get('music', 'bed')
if mus and mus != 'none':
    m = music_bed() if mus == 'bed' else music_tension() if mus == 'tension' else None
    tw = [c for c in cj['cues'] if c['type'] == 'tension']
    if m is not None and mus == 'bed' and tw:
        mt = music_tension(); w = np.zeros(N)
        for c in tw:
            a, b = int(c['t'] * SR), int((c['t'] + c.get('dur', 2)) * SR); w[a:b] = 1
        w = signal.lfilter([1 - 0.99995], [1, -0.99995], w); w = np.clip(w / (w.max() + 1e-9), 0, 1)
        m = m * (1 - w) + mt * w * 1.1
    if m is None:
        a = load_audio(P / mus)[:N]; m = np.zeros(N); m[:len(a)] = a.mean(1); m /= np.abs(m).max() + 1e-9
    m = np.stack([m, m], 1) * db(-24 if voice is not None else -20)
    if voice is not None:                                                        # duck under the voice
        lev = np.abs(voice.mean(1)); lev = signal.lfilter([1 - 0.9995], [1, -0.9995], lev); lev /= lev.max() + 1e-9
        m *= (1 - 0.55 * np.clip(lev * 3, 0, 1))[:, None]
    mix += m
# effects
for c in cj['cues']:
    if c['type'] == 'tension': continue
    fn = FX.get(c['type'])
    if not fn: print('unknown cue type, skipped:', c['type']); continue
    x = fn(**({'d': c['dur']} if c.get('dur') else {}))
    x = lp(x, 5000) * db(LEVEL[c['type']]) * c.get('gain', 1.0) / (np.abs(x).max() + 1e-9) * 0.9
    i = int(c['t'] * SR); n = min(len(x), N - i)
    if n > 0 and i >= 0: pan = c.get('pan', 0.0); mix[i:i + n, 0] += x[:n] * (1 - max(0, pan)); mix[i:i + n, 1] += x[:n] * (1 + min(0, pan))
# master: gentle soft-clip, peak -1 dBFS
mix = np.tanh(mix * 1.2) / 1.2
mix *= db(-1) / (np.abs(mix).max() + 1e-9)
wavfile.write(P / 'data/mix.wav', SR, (mix * 32767).astype(np.int16))
print(f"data/mix.wav: {DUR:.2f} s · voice: {'yes' if voice is not None else 'NO (captions-only)'} · music: {mus} · {len(cj['cues'])} cues")
