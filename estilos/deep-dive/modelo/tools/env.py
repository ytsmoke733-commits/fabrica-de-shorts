"""narration loudness envelope (100 Hz, 0..1) -> data/env.json, for lip sync"""
import json, sys
from pathlib import Path
import numpy as np
from scipy.io import wavfile
P = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
sr, x = wavfile.read(P / 'data/narration.wav'); x = x.astype(np.float64); x = x.mean(1) if x.ndim > 1 else x
hop = sr // 100; n = len(x) // hop
r = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
r = r / (np.percentile(r, 97) + 1e-9); r = np.clip(r, 0, 1) ** 0.7
(P / 'data/env.json').write_text(json.dumps({'hz': 100, 'v': [round(float(v), 3) for v in r]}))
print('data/env.json', n)
