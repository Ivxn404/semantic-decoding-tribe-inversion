// Toy frozen encoder + Adam inversion (runs in the browser; tested here in node).
// x: T x D (stimulus representation) -> h = tanh(W1 x_t + b) (T x Hd) -> z = W2 h (T x V) -> y = HRF * z over time (T x V)
function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

function makeEncoder(opt = {}) {
  const T = opt.T || 12, D = opt.D || 32, Hd = opt.H || 48, V = opt.V || 240, seed = opt.seed || 1;
  const r = mulberry(seed);
  // W1 = U diag(s) Q with decaying spectrum (ill-conditioned)
  const orth = (n) => { // random orthogonal n x n via Gram-Schmidt
    const M = []; for (let i = 0; i < n; i++) { let v = Array.from({ length: n }, () => gauss(r));
      for (const u of M) { const p = v.reduce((s, x, k) => s + x * u[k], 0); v = v.map((x, k) => x - p * u[k]); }
      const nr = Math.hypot(...v); M.push(v.map(x => x / nr)); } return M; };
  const U = orth(Hd), Q = orth(D);
  const W1 = new Float64Array(Hd * D);
  for (let i = 0; i < Hd; i++) for (let j = 0; j < D; j++) { let s = 0;
    for (let k = 0; k < D; k++) s += U[i][k] * Math.pow(10, -1.6 * k / (D - 1)) * Q[k][j]; W1[i * D + j] = s * 2.2; }
  const b1 = Float64Array.from({ length: Hd }, () => 0.3 * gauss(r));
  const W2 = Float64Array.from({ length: V * Hd }, () => gauss(r) / Math.sqrt(Hd));
  const hrf = [0.15, 0.5, 0.3, 0.05]; // causal smoothing over time
  return { T, D, Hd, V, W1, b1, W2, hrf, rng: r };
}

function forward(E, x) { // returns {h, z, y}
  const { T, D, Hd, V, W1, b1, W2, hrf } = E;
  const h = new Float64Array(T * Hd), z = new Float64Array(T * V), y = new Float64Array(T * V);
  for (let t = 0; t < T; t++) for (let i = 0; i < Hd; i++) { let s = b1[i];
    for (let j = 0; j < D; j++) s += W1[i * D + j] * x[t * D + j]; h[t * Hd + i] = Math.tanh(s); }
  for (let t = 0; t < T; t++) for (let v = 0; v < V; v++) { let s = 0;
    for (let i = 0; i < Hd; i++) s += W2[v * Hd + i] * h[t * Hd + i]; z[t * V + v] = s; }
  for (let t = 0; t < T; t++) for (let k = 0; k < hrf.length; k++) { const tt = t - k; if (tt < 0) continue;
    for (let v = 0; v < V; v++) y[t * V + v] += hrf[k] * z[tt * V + v]; }
  return { h, z, y };
}

// loss = mean over observed (mask) of (y - target)^2 + lam*|x|^2/N ; returns loss and grad wrt x
function lossGrad(E, x, target, mask, lam) {
  const { T, D, Hd, V, W1, W2, hrf } = E; const { h, y } = forward(E, x);
  let nObs = 0; for (let v = 0; v < V; v++) nObs += mask[v]; const N = T * nObs;
  const gy = new Float64Array(T * V); let L = 0;
  for (let t = 0; t < T; t++) for (let v = 0; v < V; v++) if (mask[v]) { const e = y[t * V + v] - target[t * V + v]; L += e * e; gy[t * V + v] = 2 * e / N; }
  L /= N;
  const gz = new Float64Array(T * V);
  for (let t = 0; t < T; t++) for (let k = 0; k < hrf.length; k++) { const tt = t - k; if (tt < 0) continue;
    for (let v = 0; v < V; v++) gz[tt * V + v] += hrf[k] * gy[t * V + v]; }
  const gx = new Float64Array(T * D);
  for (let t = 0; t < T; t++) { const ga = new Float64Array(Hd);
    for (let i = 0; i < Hd; i++) { let s = 0; for (let v = 0; v < V; v++) s += W2[v * Hd + i] * gz[t * V + v]; const hh = h[t * Hd + i]; ga[i] = s * (1 - hh * hh); }
    for (let j = 0; j < D; j++) { let s = 0; for (let i = 0; i < Hd; i++) s += W1[i * D + j] * ga[i]; gx[t * D + j] = s; } }
  if (lam > 0) { let r = 0; for (let k = 0; k < x.length; k++) { r += x[k] * x[k]; gx[k] += 2 * lam * x[k] / x.length; } L += lam * r / x.length; }
  return { L, gx, y };
}

function makeTruth(E, seed = 5, rank = 4) {
  const r = mulberry(seed), { T, D } = E; const basis = [];
  for (let k = 0; k < rank; k++) basis.push(Float64Array.from({ length: D }, () => gauss(r)));
  const ph = Array.from({ length: rank }, () => r() * 6.28);
  const x = new Float64Array(T * D);
  for (let t = 0; t < T; t++) for (let k = 0; k < rank; k++) { const c = Math.cos(2 * Math.PI * 2 * t / T + ph[k]) * 0.35;
    for (let j = 0; j < D; j++) x[t * D + j] += c * basis[k][j] / Math.sqrt(D) * 1.5; }
  return x;
}

function meanCos(E, a, b) { const { T, D } = E; let s = 0;
  for (let t = 0; t < T; t++) { let ab = 0, aa = 0, bb = 0; for (let j = 0; j < D; j++) { const u = a[t * D + j], v = b[t * D + j]; ab += u * v; aa += u * u; bb += v * v; }
    s += ab / Math.sqrt(aa * bb + 1e-30); } return s / T; }
function flatCos(a, b) { let ab = 0, aa = 0, bb = 0; for (let k = 0; k < a.length; k++) { ab += a[k] * b[k]; aa += a[k] * a[k]; bb += b[k] * b[k]; } return ab / Math.sqrt(aa * bb + 1e-30); }

function makeAdam(n, lr) { return { m: new Float64Array(n), v: new Float64Array(n), t: 0, lr }; }
function adamStep(A, x, g, lr) { A.t++; const b1 = 0.9, b2 = 0.999;
  for (let k = 0; k < x.length; k++) { A.m[k] = b1 * A.m[k] + (1 - b1) * g[k]; A.v[k] = b2 * A.v[k] + (1 - b2) * g[k] * g[k];
    const mh = A.m[k] / (1 - Math.pow(b1, A.t)), vh = A.v[k] / (1 - Math.pow(b2, A.t)); x[k] -= lr * mh / (Math.sqrt(vh) + 1e-8); } }

if (typeof module !== "undefined") module.exports = { makeEncoder, forward, lossGrad, makeTruth, meanCos, flatCos, makeAdam, adamStep, mulberry, gauss };
