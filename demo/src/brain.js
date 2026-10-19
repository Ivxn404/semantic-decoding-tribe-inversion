// Minimal WebGL renderer for the fsaverage5 inflated cortex (20 484 vertices), no libraries.
const Brain = (() => {
  const b64 = (s, T) => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new T(u.buffer); };
  let M = null;
  function mesh() {
    if (M) return M;
    const D = window.DATA.mesh, NV = D.nv;
    const p16 = b64(D.pos, Int16Array), faces = b64(D.faces, Uint16Array);
    const pos = new Float32Array(NV * 3); for (let i = 0; i < NV * 3; i++) pos[i] = p16[i] / 32000;
    const u8 = k => b64(D[k], Uint8Array);
    // centre each hemisphere on its own so views can be laid out freely
    const hemi = [[0, 10242], [10242, NV]], ctr = [];
    for (const [a, b] of hemi) { const c = [0, 0, 0]; for (let i = a; i < b; i++) for (let k = 0; k < 3; k++) c[k] += pos[i * 3 + k]; ctr.push(c.map(v => v / (b - a))); }
    const nb = Array.from({ length: NV }, () => new Set());
    for (let f = 0; f < faces.length; f += 3) { const a = faces[f], b = faces[f + 1], c = faces[f + 2]; nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
    M = { NV, pos, faces, ctr, hemi, sulc: u8("sulc"), roi: u8("roi"), roiNames: D.roi_names,
      share: { text: u8("share_text"), audio: u8("share_audio"), video: u8("share_video") }, sens: u8("sens_total"),
      nbr: nb.map(s => Int32Array.from(s)) };
    return M;
  }
  // view layouts: list of {hemi, map(x,y,z)->[X,Y,Z], dx, dy}
  const VIEWS = {
    lateralL: p => [-p[1], p[2], -p[0]], lateralR: p => [p[1], p[2], p[0]],
    medialL: p => [p[1], p[2], p[0]], medialR: p => [-p[1], p[2], -p[0]],
  };
  const LAYOUTS = {
    lateral: [["lateralL", 0, -1.06, 0], ["lateralR", 1, 1.06, 0]],
    lat2: [["lateralL", 0, 0, 0.74], ["lateralR", 1, 0, -0.74]],
  };
  const SPAN = { four: [2.15, 1.47], lateral: [2.15, 0.73], lat2: [1.08, 1.47], orbit: [1.3, 1.05] };
  function buildGeometry(layout, rot) {
    const m = mesh(), out = new Float32Array(m.NV * 3);
    if (layout === "orbit") {
      const [cy, sy, cx, sx] = [Math.cos(rot.yaw), Math.sin(rot.yaw), Math.cos(rot.pitch), Math.sin(rot.pitch)];
      for (let i = 0; i < m.NV; i++) { let x = m.pos[i * 3], y = m.pos[i * 3 + 1], z = m.pos[i * 3 + 2];
        // anatomical: x L-R, y P-A, z I-S -> screen: X = x, Y = z, Z = -y (view from front), then yaw/pitch
        let X = x, Y = z, Z = y; const X1 = X * cy + Z * sy, Z1 = -X * sy + Z * cy; const Y1 = Y * cx - Z1 * sx, Z2 = Y * sx + Z1 * cx;
        out[i * 3] = X1; out[i * 3 + 1] = Y1; out[i * 3 + 2] = Z2; }
      return out;
    }
    for (const [vname, h, dx, dy] of LAYOUTS[layout]) {
      const [a, b] = m.hemi[h], c = m.ctr[h], f = VIEWS[vname];
      for (let i = a; i < b; i++) { const p = [m.pos[i * 3] - c[0], m.pos[i * 3 + 1] - c[1], m.pos[i * 3 + 2] - c[2]]; const q = f(p);
        out[i * 3] = q[0] + dx; out[i * 3 + 1] = q[1] + dy; out[i * 3 + 2] = q[2]; }
    }
    return out;
  }
  // a layout like "four" uses each vertex once per hemisphere view; four views need two copies of each hemisphere,
  // so we draw the mesh twice: pass A = lateral views, pass B = medial views.
  function normals(P, faces, NV) {
    const N = new Float32Array(NV * 3);
    for (let f = 0; f < faces.length; f += 3) { const a = faces[f] * 3, b = faces[f + 1] * 3, c = faces[f + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const k of [a, b, c]) { N[k] += nx; N[k + 1] += ny; N[k + 2] += nz; } }
    for (let i = 0; i < NV; i++) { const l = Math.hypot(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]) || 1; N[i * 3] /= l; N[i * 3 + 1] /= l; N[i * 3 + 2] /= l; }
    return N;
  }
  const VS = `attribute vec3 p; attribute vec3 n; attribute vec3 c; uniform vec4 box; uniform float aspect; varying vec3 vc; varying float lit;
    void main(){ vec3 q=p; float s=box.z; gl_Position=vec4((q.x*s/aspect)+box.x, q.y*s+box.y, -q.z*0.4, 1.0);
      vec3 L=normalize(vec3(-0.35,0.45,0.82)); float d=abs(dot(normalize(n),L)); lit=0.42+0.62*d; vc=c; }`;
  const FS = `precision mediump float; varying vec3 vc; varying float lit; void main(){ gl_FragColor=vec4(vc*lit,1.0); }`;

  function create(canvas) {
    const gl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false, alpha: true, preserveDrawingBuffer: true });
    if (!gl) { canvas.replaceWith(Object.assign(document.createElement("p"), { className: "fallback", textContent: "This browser has WebGL turned off, so the 3-D cortex cannot be drawn here." })); return null; }
    const m = mesh();
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
    const loc = { p: gl.getAttribLocation(prog, "p"), n: gl.getAttribLocation(prog, "n"), c: gl.getAttribLocation(prog, "c"), box: gl.getUniformLocation(prog, "box"), aspect: gl.getUniformLocation(prog, "aspect") };
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.faces, gl.STATIC_DRAW);
    const geo = {}; // layout key -> {pb, nb}
    function geometry(key, rot) {
      if (key !== "orbit" && geo[key]) return geo[key];
      const P = buildGeometry(key, rot), N = normals(P, m.faces, m.NV);
      const g = geo[key] || { pb: gl.createBuffer(), nb: gl.createBuffer() };
      gl.bindBuffer(gl.ARRAY_BUFFER, g.pb); gl.bufferData(gl.ARRAY_BUFFER, P, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.nb); gl.bufferData(gl.ARRAY_BUFFER, N, gl.DYNAMIC_DRAW);
      geo[key] = g; return g;
    }
    const cbufs = [];
    const api = {
      panels: [], rot: { yaw: 1.25, pitch: 0.22 },
      // panels: [{colors: Float32Array(NV*3), x, y, w, h (fractions), layout: "four"|"lateral"|"orbit"}]
      setPanels(ps) { api.panels = ps; ps.forEach((p, i) => { if (!cbufs[i]) cbufs[i] = gl.createBuffer(); p._dirty = true; }); api.draw(); },
      update(i, colors) { api.panels[i].colors = colors; api.panels[i]._dirty = true; api.draw(); },
      draw() {
        const dpr = Math.min(2, window.devicePixelRatio || 1), W = canvas.clientWidth, H = canvas.clientHeight;
        if (!W || !H) return;
        if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
        gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.enable(gl.DEPTH_TEST); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        api.panels.forEach((p, i) => {
          const passes = p.layout === "four" ? ["fourA", "fourB"] : [p.layout];
          gl.bindBuffer(gl.ARRAY_BUFFER, cbufs[i]); if (p._dirty) { gl.bufferData(gl.ARRAY_BUFFER, p.colors, gl.DYNAMIC_DRAW); p._dirty = false; }
          gl.enableVertexAttribArray(loc.c); gl.vertexAttribPointer(loc.c, 3, gl.FLOAT, false, 0, 0);
          const pw = p.w * W, ph = p.h * H;
          // map panel into clip space with uniform scaling
          const cx = (p.x + p.w / 2) * 2 - 1, cy = 1 - (p.y + p.h / 2) * 2;
          const [spanX, spanY] = SPAN[p.layout];
          const s = Math.min(pw / (spanX * 2), ph / (spanY * 2)) / (H / 2) * 0.97;
          gl.uniform4f(loc.box, cx, cy, s, 0); gl.uniform1f(loc.aspect, W / H);
          for (const key of passes) {
            const g = geometry(key, api.rot);
            gl.bindBuffer(gl.ARRAY_BUFFER, g.pb); gl.enableVertexAttribArray(loc.p); gl.vertexAttribPointer(loc.p, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, g.nb); gl.enableVertexAttribArray(loc.n); gl.vertexAttribPointer(loc.n, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.drawElements(gl.TRIANGLES, m.faces.length, gl.UNSIGNED_SHORT, 0);
          }
        });
      },
    };
    new ResizeObserver(() => api.draw()).observe(canvas);
    return api;
  }
  // "four" is drawn as two passes; build those layouts
  LAYOUTS.fourA = [["lateralL", 0, -1.06, 0.74], ["lateralR", 1, 1.06, 0.74]];
  LAYOUTS.fourB = [["medialL", 0, -1.06, -0.74], ["medialR", 1, 1.06, -0.74]];

  // ---------- colour helpers
  function base(darkTheme) { const m = mesh(), c = new Float32Array(m.NV * 3);
    for (let i = 0; i < m.NV; i++) { const s = m.sulc[i] / 255; const g = darkTheme ? 0.36 + 0.22 * (1 - s) : 0.62 + 0.25 * (1 - s); c[i * 3] = g; c[i * 3 + 1] = g; c[i * 3 + 2] = g * 1.02; }
    return c; }
  function hot(t) { t = Math.max(0, Math.min(1, t)); return [Math.min(1, 0.55 + t * 1.2), Math.max(0, Math.min(1, (t - 0.25) * 1.6)), Math.max(0, (t - 0.8) * 3)]; }
  function cold(t) { t = Math.max(0, Math.min(1, t)); return [Math.max(0, (t - 0.8) * 3) * 0.6, Math.max(0, Math.min(1, (t - 0.25) * 1.5)) * 0.85, Math.min(1, 0.6 + t * 1.0)]; }
  // signed overlay over sulcal grey: values normalised to [-1,1], threshold thr
  function overlay(vals, scale, thr, dark) {
    const c = base(dark), n = vals.length;
    for (let i = 0; i < n; i++) { const v = vals[i] / scale; if (Math.abs(v) < thr) continue;
      const t = (Math.abs(v) - thr) / (1 - thr); const col = v > 0 ? hot(t) : cold(t); const a = Math.min(1, 0.55 + t);
      for (let k = 0; k < 3; k++) c[i * 3 + k] = c[i * 3 + k] * (1 - a) + col[k] * a; }
    return c;
  }
  function seq(vals, lo, hi, dark, cmap) { // sequential colormap, values below lo are left grey
    const c = base(dark);
    for (let i = 0; i < vals.length; i++) { if (vals[i] < lo) continue; const t = (vals[i] - lo) / (hi - lo); const col = cmap(t); const a = 0.9;
      for (let k = 0; k < 3; k++) c[i * 3 + k] = c[i * 3 + k] * (1 - a) + col[k] * a; }
    return c;
  }
  function viridis(t) { t = Math.max(0, Math.min(1, t)); const s = [[0.267, 0.005, 0.329], [0.229, 0.322, 0.546], [0.128, 0.567, 0.551], [0.369, 0.789, 0.383], [0.993, 0.906, 0.144]];
    const x = t * 4, i = Math.min(3, Math.floor(x)), f = x - i; return [0, 1, 2].map(k => s[i][k] * (1 - f) + s[i + 1][k] * f); }
  function smooth(vals, iters) { const m = mesh(); let a = Float32Array.from(vals), b = new Float32Array(a.length);
    for (let it = 0; it < iters; it++) { for (let i = 0; i < m.NV; i++) { const nb = m.nbr[i]; let s = a[i]; for (let k = 0; k < nb.length; k++) s += a[nb[k]]; b[i] = s / (nb.length + 1); } [a, b] = [b, a]; }
    return a; }
  return { mesh, create, base, overlay, seq, hot, viridis, smooth, b64 };
})();
