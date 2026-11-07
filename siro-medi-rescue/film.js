// THE FILM — Siro & Medi Rescue Squad. Every frame is a pure function of t, timed from score.js.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Shots = globalThis.Shots, V = globalThis.V;
  const { T, BEAT, ev, clock } = S;
  const { clamp, lerp, ease, pulse } = U;
  const W = G.W, H = G.H;
  const INK = '#2A2340';
  const KO = "'WenQuanYi Zen Hei', 'Noto Sans CJK KR', sans-serif";

  const hop = (t, amp) => amp * Math.abs(Math.sin(Math.PI * clock.phase(t)));
  const beatIdx = (t) => Math.floor((t - clock.OFFSET) / BEAT + 1e-6);
  const since = (t, t0) => t - t0;
  const win = (t, a, b) => t >= a && t < b;
  const tw = (t, t0, d, a, b, e = ease.inOutCubic) => lerp(a, b, e(clamp((t - t0) / d)));

  // ---------------- scenery ----------------
  function sky(ctx, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(-200, -200, W + 400, H + 400);
  }
  function cloud(ctx, x, y, s, seed) {
    const pts = [];
    for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; const r = 1 + 0.18 * Math.sin(a * 5 + seed); pts.push([x + Math.cos(a) * 120 * s * r, y + Math.sin(a) * 50 * s * r]); }
    G.shape(ctx, pts, { fill: '#FFFFFF', stroke: 'rgba(42,35,64,0.35)', lw: 3, seed });
  }
  const CANDY = ['#FF9EC7', '#FFD27A', '#9EE2FF', '#C9A8FF', '#A8F0C6', '#FFB38A'];
  function building(ctx, x, gy, w, h, i) {
    const c = CANDY[i % CANDY.length];
    G.rrect(ctx, x, gy - h, w, h, 26, { fill: c, stroke: INK, lw: 4, seed: 300 + i });
    const roof = i % 3;
    if (roof === 0) G.ellipse(ctx, x + w / 2, gy - h, w * 0.42, w * 0.3, { fill: CANDY[(i + 2) % 6], stroke: INK, lw: 4, seed: 400 + i });
    else if (roof === 1) G.poly(ctx, [[x - 10, gy - h + 10], [x + w / 2, gy - h - w * 0.45], [x + w + 10, gy - h + 10]], { fill: CANDY[(i + 3) % 6], stroke: INK, lw: 4, seed: 400 + i });
    else { G.rrect(ctx, x + w * 0.35, gy - h - 40, w * 0.3, 44, 10, { fill: CANDY[(i + 4) % 6], stroke: INK, lw: 4, seed: 400 + i }); G.ellipse(ctx, x + w / 2, gy - h - 52, 16, 16, { fill: '#FF6F91', stroke: INK, lw: 3, seed: 410 + i }); }
    const cols = Math.max(1, Math.floor(w / 70)), rows = Math.max(1, Math.floor((h - 60) / 80));
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const wx = x + (w - cols * 70) / 2 + k * 70 + 14, wy = gy - h + 40 + r * 80;
      G.rrect(ctx, wx, wy, 42, 46, 14, { fill: U.hash(i, r, k) > 0.7 ? '#FFF3B0' : '#FFFFFF', stroke: INK, lw: 3, seed: 500 + i * 13 + r * 5 + k });
    }
  }
  // a repeating row of buildings scrolled by `off` px
  function town(ctx, gy, off, scale, seed) {
    const span = 2600, n = 9;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const w = (150 + U.hash(seed, i) * 120) * scale, h = (220 + U.hash(seed, i, 1) * 260) * scale;
      let x = (i * (span / n) - off) % span; if (x < -300) x += span;
      building(ctx, x - 300, gy, w, h, i + seed);
    }
    ctx.restore();
  }
  function tree(ctx, x, gy, s, wave, t, seed) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    G.rrect(ctx, -14, -150, 28, 150, 10, { fill: '#B07A4E', stroke: INK, lw: 4, seed });
    if (wave > 0) { const a = -0.6 - wave * (0.6 + 0.5 * Math.sin(t * 14)); G.limb(ctx, [[0, -110], [Math.cos(a) * 70, -110 + Math.sin(a) * 70]], { color: '#B07A4E', lw: 14, outline: INK }); }
    G.ellipse(ctx, 0, -210, 92, 86, { fill: '#5ED08A', stroke: INK, lw: 4, seed: seed + 1 });
    G.ellipse(ctx, -30, -235, 22, 16, { fill: '#8BE8AE', stroke: null, seed: seed + 2 });
    // face
    ctx.save(); ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round';
    if (wave > 0) { for (const ex of [-22, 22]) { ctx.beginPath(); ctx.arc(ex, -205, 11, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } }
    else for (const ex of [-22, 22]) { ctx.beginPath(); ctx.arc(ex, -210, 7, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, -195, 18, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
    ctx.restore(); ctx.restore();
  }
  const RAINBOW = ['#FF6F6F', '#FFB15C', '#FFE066', '#7EE08A', '#6EC6F0', '#B08CFF'];
  function rainbowRoad(ctx, y0, off) {
    const h = (H - y0) / RAINBOW.length;
    RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-200, y0 + i * h, W + 400, h + 1); });
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-200, y0); ctx.lineTo(W + 200, y0); ctx.stroke(); ctx.restore();
    // white dashes
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const yy = y0 + h * 2.6;
    for (let x = -((off % 220) + 220); x < W + 220; x += 220) ctx.fillRect(x, yy, 110, 12);
    ctx.restore();
  }
  function grassPark(ctx, gy) {
    G.poly(ctx, [[-60, gy - 30], [500, gy - 70], [1100, gy - 40], [1600, gy - 90], [1990, gy - 50], [1990, H + 60], [-60, H + 60]], { fill: '#7BD88F', stroke: INK, lw: 4, seed: 61 });
    G.poly(ctx, [[-60, gy], [1990, gy], [1990, H + 60], [-60, H + 60]], { fill: '#9BE59F', stroke: INK, lw: 4, seed: 62, hatch: { color: 'rgba(40,120,60,0.12)', gap: 10 } });
  }
  function fountain(ctx, x, gy, t) {
    G.ellipse(ctx, x, gy - 20, 150, 34, { fill: '#C9E9FF', stroke: INK, lw: 4, seed: 71 });
    G.rrect(ctx, x - 22, gy - 150, 44, 130, 12, { fill: '#FFC7E0', stroke: INK, lw: 4, seed: 72 });
    G.ellipse(ctx, x, gy - 155, 70, 20, { fill: '#C9E9FF', stroke: INK, lw: 4, seed: 73 });
    for (let i = 0; i < 9; i++) { // soap bubbles rising
      const ph = ((t * 0.35 + i / 9) % 1), bx = x + Math.sin(i * 2.3 + t) * 60, by = gy - 170 - ph * 420, r = 10 + (i % 3) * 7;
      ctx.save(); ctx.globalAlpha = 1 - ph; ctx.strokeStyle = CANDY[i % 6]; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(bx - r * 0.35, by - r * 0.35, r * 0.25, 0, 7); ctx.fill(); ctx.restore();
    }
  }
  function parkBg(ctx, t) {
    sky(ctx, '#9FDBFF', '#E8F7FF');
    cloud(ctx, 300 + t * 6, 170, 0.9, 1); cloud(ctx, 1400 + t * 4, 120, 1.1, 2);
    town(ctx, 760, 400, 0.65, 3);
    grassPark(ctx, 800);
    fountain(ctx, 1620, 800, t);
    tree(ctx, 180, 810, 0.8, 0, t, 81);
  }
  // the mud puddle: back half before Dozzy, front lip after
  const MUD = { x: 960, y: 905, rx: 330, ry: 62 };
  function mudBack(ctx, k = 1) { if (k <= 0) return; G.ellipse(ctx, MUD.x, MUD.y, MUD.rx * k, MUD.ry * k, { fill: '#8B5A3C', stroke: INK, lw: 4, seed: 91 }); }
  function mudFront(ctx, t, k = 1) {
    if (k <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, MUD.y - 8, W, 200); ctx.clip();
    G.ellipse(ctx, MUD.x, MUD.y, MUD.rx * k, MUD.ry * k, { fill: '#7A4B30', stroke: INK, lw: 4, seed: 92 });
    ctx.restore();
    for (let i = 0; i < 4; i++) { // plops
      const ph = ((t * 0.8 + i * 0.27) % 1), bx = MUD.x - 220 * k + i * 140 * k, by = MUD.y + 18;
      ctx.save(); ctx.globalAlpha = 1 - ph; ctx.strokeStyle = '#5E3A24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by, 6 + ph * 14, Math.PI, 0); ctx.stroke(); ctx.restore();
    }
  }
  function station(ctx, cx, gy, warm) {
    const x0 = cx - 420, top = gy - 560;
    G.rrect(ctx, x0, top, 840, 560, 40, { fill: warm ? '#F6D9C4' : '#E8F1FF', stroke: INK, lw: 5, seed: 101 });
    for (let i = 0; i < 7; i++) G.rrect(ctx, x0 + 10 + i * 118, top - 60, 110, 70, 18, { fill: i % 2 ? '#FF6F6F' : '#6EC6F0', stroke: INK, lw: 4, seed: 102 + i });
    G.star(ctx, cx, top + 50, 40, { fill: '#FFD54A', seed: 110 });
    G.text(ctx, 'POLICE', cx, top + 140, { size: 56, fam: 'Bungee', color: '#2F5DB8', align: 'center', boil: 0.3 });
    G.rrect(ctx, cx - 280, gy - 390, 560, 390, 24, { fill: warm ? '#4A3550' : '#2E3550', stroke: INK, lw: 5, seed: 111 });
    for (const sx of [x0 + 40, x0 + 840 - 140]) G.rrect(ctx, sx, top + 200, 100, 110, 20, { fill: warm ? '#FFE29A' : '#FFFFFF', stroke: INK, lw: 4, seed: 112 + sx });
  }
  function shutter(ctx, cx, gy, k) { // k = 1 closed .. 0 open
    if (k <= 0) return;
    const h = 390 * k;
    G.rrect(ctx, cx - 280, gy - 390, 560, h, 16, { fill: '#B9C6DB', stroke: INK, lw: 4, seed: 120 });
    ctx.save(); ctx.strokeStyle = 'rgba(42,35,64,0.45)'; ctx.lineWidth = 3;
    for (let y = gy - 390 + 30; y < gy - 390 + h - 10; y += 34) { ctx.beginPath(); ctx.moveTo(cx - 270, y); ctx.lineTo(cx + 270, y); ctx.stroke(); }
    ctx.restore();
  }
  function zzz(ctx, x, y, t, a = 1) {
    for (let i = 0; i < 3; i++) {
      const ph = ((t * 0.6 + i / 3) % 1);
      G.text(ctx, 'z', x + ph * 60 + i * 10, y - ph * 120, { size: 36 + i * 12, fam: 'Bungee', color: '#6F7FD8', alpha: a * (1 - ph), align: 'center', boil: 0 });
    }
  }
  function pop(ctx, str, x, y, t, t0, { size = 90, color = '#FF4D63', rot = 0, fam = 'Bungee', dur = 1.6 } = {}) {
    const a = t - t0; if (a < 0 || a > dur) return;
    const k = ease.outBack(clamp(a / 0.25), 3) * (a > dur - 0.25 ? clamp((dur - a) / 0.25) : 1);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot + Math.sin(a * 9) * 0.03); ctx.scale(k, k);
    G.text(ctx, str, 0, 0, { size, fam, color, align: 'center', baseline: 'middle', stroke: '#FFFFFF', strokeW: 12, boil: 0.4 });
    ctx.restore();
  }
  function speedLines(ctx, t, a = 1) {
    ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${0.7 * a})`; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const y = 120 + U.hash(i, 9) * 640, len = 120 + U.hash(i, 4) * 200;
      const x = W - (((t * 2400) + U.hash(i, 2) * W * 2) % (W + 600));
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
    ctx.restore();
  }
  function koPill(ctx, str, x, y, size, color, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.font = `bold ${size}px ${KO}`;
    const w = ctx.measureText(str).width + size * 1.2;
    G.rrect(ctx, x - w / 2, y - size * 0.8, w, size * 1.6, size * 0.8, { fill: '#FFFFFF', stroke: INK, lw: 4, seed: 190 });
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y + size * 0.05);
    ctx.restore();
  }
  const sirenPhase = (t, off = 0) => (beatIdx(t) + off) % 2;

  // ---------------- shots ----------------
  // 1. Dozzy stuck in the mud
  function shotMud(ctx, t) {
    parkBg(ctx, t);
    mudBack(ctx);
    const sink = 26 + Math.sin(t * 2.2) * 6;
    V.draw(ctx, { kind: 'dozzy', x: MUD.x, y: MUD.y + sink, s: 1.25, eyes: 'sad', mouth: 'sad', tears: 1, t, look: 0.4, lookY: -0.3, rot: Math.sin(t * 1.7) * 0.03, mud: 0.8, shadow: false });
    mudFront(ctx, t);
    pop(ctx, 'HELP!', 1290, 380, t, ev.help, { rot: 0.12, dur: 2.6 });
    // red-blue light sweeps across: help is on its way
    const a = since(t, ev.flash);
    if (a >= 0 && a < 1.1) {
      const k = Math.sin(Math.PI * a / 1.1);
      V.glow(ctx, lerp(-200, W + 200, a / 1.1), 420, 700, 'rgba(255,60,80,A)', 0.55 * k);
      V.glow(ctx, lerp(-600, W - 200, a / 1.1), 520, 700, 'rgba(70,140,255,A)', 0.55 * k);
    }
  }
  // 2. the station: the shutter rolls up, Siro wakes and winks
  function shotStation(ctx, t) {
    sky(ctx, '#8FD3FF', '#E6F6FF');
    cloud(ctx, 260, 180, 0.8, 4); cloud(ctx, 1650, 150, 1, 5);
    G.poly(ctx, [[-60, 860], [1990, 860], [1990, H + 60], [-60, H + 60]], { fill: '#C9CDD9', stroke: INK, lw: 4, seed: 130 });
    station(ctx, 960, 860, false);
    const awake = t >= ev.wake;
    const wink = win(t, ev.wink, ev.wink + 0.7);
    const rev = t > ev.wink + 0.7 ? Math.abs(U.noise1(t * 30, 3)) * 4 : 0;
    V.draw(ctx, { kind: 'siro', x: 960, y: 858 - rev, s: 1.12, eyes: !awake ? 'closed' : wink ? 'wink' : 'happy', mouth: wink ? 'grin' : 'smile', t, blush: wink ? 1 : 0.4, rot: rev * 0.004 });
    if (!awake) zzz(ctx, 1060, 520, t, clamp(1 - (t - ev.wake + 0.3) / 0.3));
    shutter(ctx, 960, 860, 1 - ease.inOutCubic(clamp((t - ev.shutter) / 1.0)));
    if (wink) for (let i = 0; i < 4; i++) { const a = (t - ev.wink) / 0.7; G.star(ctx, 1010 + Math.cos(i * 1.6) * 90 * a, 640 + Math.sin(i * 1.6) * 70 * a, 26 * Math.sin(Math.PI * a), { fill: '#FFE066', seed: i }); }
    // title
    const k = ease.outBack(clamp((t - ev.wink) / 0.4), 2.4);
    if (k > 0) {
      ctx.save(); ctx.translate(960, 100); ctx.scale(k, k);
      G.text(ctx, 'SIRO & MEDI', 0, 0, { size: 112, fam: 'Bungee', color: '#2F5DB8', align: 'center', baseline: 'middle', stroke: '#FFFFFF', strokeW: 16, boil: 0.3 });
      ctx.restore();
      const k2 = clamp((t - ev.wink - 0.3) / 0.4);
      if (k2 > 0) koPill(ctx, '시로와 메디 구조대', 960, 188, 50, '#E2475C', k2);
    }
  }
  // 3. the happy patrol through Bubble Town
  const SPEED = 420;
  const treeAt = (te) => 1010 + SPEED * (te - ev.groove);
  function shotDrive(ctx, t) {
    const off = SPEED * (t - ev.groove);
    sky(ctx, '#9FDBFF', '#F2FBFF');
    cloud(ctx, 400 - off * 0.05, 160, 0.9, 6); cloud(ctx, 1500 - off * 0.05, 120, 1.2, 7);
    town(ctx, 700, off * 0.3, 0.7, 11);
    town(ctx, 820, off * 0.6, 1, 21);
    rainbowRoad(ctx, 820, off);
    for (const te of ev.trees) {
      const x = treeAt(te) - off;
      if (x > -200 && x < W + 200) tree(ctx, x + 120, 836, 0.9, clamp(1 - Math.abs(t - te) / 0.9), t, 140 + Math.round(te));
    }
    const nearTree = ev.trees.some((te) => Math.abs(t - te) < 0.8);
    V.draw(ctx, { kind: 'siro', x: 760, y: 1010, s: 1.3, hop: hop(t, 26), wheel: off / 40, eyes: 'happy', mouth: nearTree ? 'grin' : 'smile', t, blush: 0.5, rot: Math.sin(Math.PI * clock.beatPos(t)) * 0.025 });
  }
  // 4. SOS on the dashboard hologram
  function shotSOS(ctx, t) {
    sky(ctx, '#6EC6F0', '#BFE8FF');
    town(ctx, 640, 900 + (t - ev.sos) * 200, 0.7, 31);
    G.poly(ctx, [[-60, 700], [400, 640], [960, 620], [1520, 640], [1990, 700], [1990, H + 60], [-60, H + 60]], { fill: '#3F4A7A', stroke: INK, lw: 5, seed: 150 });
    G.ellipse(ctx, 1500, 1000, 260, 260, { fill: null, stroke: '#2A2F55', lw: 40, seed: 151 });
    const a = t - ev.sos, k = ease.outBack(clamp(a / 0.3), 3);
    V.glow(ctx, 960, 470, 520, 'rgba(255,110,170,A)', 0.6 * k);
    ctx.save(); ctx.translate(960, 470); ctx.scale(k, k); ctx.globalAlpha = 0.92;
    G.heart(ctx, 0, 0, 13, { fill: '#FF8FC0', seed: 152 });
    // Dozzy's little face on the screen
    G.rrect(ctx, -90, -110, 180, 150, 40, { fill: '#FF9F43', stroke: INK, lw: 4, seed: 153 });
    ctx.fillStyle = '#FFFFFF'; for (const ex of [-40, 40]) { ctx.beginPath(); ctx.ellipse(ex, -50, 24, 30, 0, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); }
    ctx.fillStyle = INK; for (const ex of [-36, 44]) { ctx.beginPath(); ctx.arc(ex, -44, 13, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#7FD3FF'; for (const ex of [-52, 52]) { ctx.beginPath(); ctx.ellipse(ex, -5 + ((t * 40) % 20), 7, 11, 0, 0, 7); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 30, 20, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    // scanlines
    ctx.globalAlpha = 0.15; ctx.fillStyle = '#FFFFFF'; for (let y = -220; y < 220; y += 14) ctx.fillRect(-230, y + ((t * 60) % 14), 460, 4);
    ctx.restore();
    if (beatIdx(t) % 2 === 0 || a < 0.5) pop(ctx, 'SOS', 960, 820, t, ev.sos, { size: 110, color: '#FF4D63', dur: 2 });
  }
  // 5. the heart siren switches on
  function shotSiren(ctx, t) {
    const ph = sirenPhase(t);
    sky(ctx, ph ? '#2B3F8F' : '#7A2B4F', '#1C2046');
    G.rays(ctx, 975, 440, { n: 24, r0: 160, r1: 1500, color: ph ? 'rgba(110,170,255,0.5)' : 'rgba(255,110,130,0.5)', lw: 26, spin: (t - ev.siren) * 0.6 });
    V.draw(ctx, { kind: 'siro', x: 990, y: 1060, s: 2.4, siren: ph, eyes: 'focus', mouth: 'grin', t, shadow: false });
    pop(ctx, 'WEE-WOO!', 960, 140, t, ev.siren + 0.15, { size: 96, color: '#FFE066', dur: 1.2 });
  }
  // 6. the race: the bus and the taxi pull aside
  const RACE = 900;
  function shotRace(ctx, t) {
    const off = RACE * (t - T(10));
    sky(ctx, '#9FDBFF', '#F2FBFF');
    town(ctx, 700, off * 0.3, 0.7, 41);
    town(ctx, 800, off * 0.6, 1, 51);
    rainbowRoad(ctx, 800, off);
    const lane = (t0) => clamp((t - t0) / 0.55);
    const bx = 1500 - (RACE - 400) * (t - T(10)), bl = ease.inOutCubic(lane(ev.bus));
    const tx = 2300 - (RACE - 400) * (t - T(10)), tl = ease.inOutCubic(lane(ev.taxi));
    const bus = { kind: 'bus', x: bx, y: lerp(1000, 860, bl), s: lerp(0.85, 0.7, bl), wheel: off / 60, eyes: bl > 0.5 ? 'happy' : 'wide', mouth: bl > 0.5 ? 'grin' : 'o', t, blinkSeed: 1 };
    const taxi = { kind: 'taxi', x: tx, y: lerp(1000, 860, tl), s: lerp(0.95, 0.75, tl), wheel: off / 50, eyes: tl > 0.5 ? 'happy' : 'wide', mouth: tl > 0.5 ? 'grin' : 'o', t, blinkSeed: 2 };
    const siro = { kind: 'siro', x: 700, y: 1000, s: 1, hop: hop(t, 14), wheel: off / 40, siren: sirenPhase(t), eyes: t > ev.thanks && t < ev.thanks + 0.8 ? 'wink' : 'focus', mouth: 'grin', t, rot: -0.03 };
    for (const v of [bus, taxi]) if (v.y < 930) V.draw(ctx, v);
    V.draw(ctx, siro);
    for (const v of [bus, taxi]) if (v.y >= 930) V.draw(ctx, v);
    speedLines(ctx, t, 0.8);
    pop(ctx, 'THANK YOU!', 760, 560, t, ev.thanks, { size: 64, color: '#2F5DB8', rot: -0.06, dur: 1.2 });
  }
  // 7. Medi joins
  function shotMedi(ctx, t) {
    const off = 700 * (t - ev.medi);
    sky(ctx, '#9FDBFF', '#F2FBFF');
    town(ctx, 700, off * 0.3 + 500, 0.7, 61);
    town(ctx, 800, off * 0.6 + 300, 1, 71);
    rainbowRoad(ctx, 800, off);
    const mx = lerp(-300, 640, ease.outBack(clamp((t - ev.medi + 0.12) / 0.5), 1.4));
    const both = t > ev.medi + 0.5;
    V.draw(ctx, { kind: 'medi', x: mx, y: 990, s: 0.95, hop: both ? hop(t + BEAT / 2, 18) : 0, wheel: off / 38, siren: sirenPhase(t, 1), eyes: 'happy', mouth: 'grin', t, blush: 0.6 });
    V.draw(ctx, { kind: 'siro', x: 1250, y: 990, s: 1, hop: hop(t, 18), wheel: off / 40, siren: sirenPhase(t), eyes: both ? 'happy' : 'wide', mouth: both ? 'grin' : 'o', look: -1, t, blush: 0.5 });
    speedLines(ctx, t, 0.5);
    pop(ctx, 'MEDI!', 640, 520, t, ev.medi + 0.1, { size: 90, color: '#FF8A73', rot: -0.08, dur: 1.4 });
    const fl = 0.7 * Math.exp(-Math.max(0, t - ev.medi) * 10);
    if (fl > 0.01) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(-200, -200, W + 400, H + 400); }
  }
  // positions shared by the park shots
  const DOZ = { x: MUD.x, y: MUD.y + 26, s: 1.25 };
  function dozzy(ctx, t, o) { V.draw(ctx, Object.assign({ kind: 'dozzy', x: DOZ.x, y: DOZ.y, s: DOZ.s, t, shadow: false, mud: 0.8 }, o)); }
  // 8. arrival: Medi's doors open, a bandage
  function shotArrive(ctx, t) {
    parkBg(ctx, t);
    const st = clamp((t - T(14)) / (ev.stop - T(14)));
    const sx = lerp(-250, 330, ease.outCubic(st)), mx = lerp(-700, 1500, ease.outCubic(clamp((t - T(14)) / (ev.stop - T(14) + 0.3))));
    const medi = { kind: 'medi', x: mx, y: 820, s: 0.9, wheel: mx / 38, doors: ease.outBack(clamp((t - ev.doors) / 0.4), 2), siren: t < ev.doors ? sirenPhase(t, 1) : null, eyes: t > ev.bandage ? 'happy' : 'normal', look: -1, mouth: 'smile', t, blinkSeed: 3 };
    V.draw(ctx, medi);
    mudBack(ctx);
    const healed = t > ev.bandage + 0.3;
    dozzy(ctx, t, { eyes: healed ? 'happy' : 'sad', mouth: healed ? 'smile' : 'sad', tears: healed ? clamp(1 - (t - ev.bandage - 0.3) / 0.6) : 1, bandage: t > ev.bandage, y: DOZ.y + Math.sin(t * 2.2) * 6, look: t < ev.doors ? -0.8 : 0.8 });
    mudFront(ctx, t);
    // the soft robot arm
    const reach = clamp((t - ev.doors - 0.25) / (ev.bandage - ev.doors - 0.25)) * (1 - clamp((t - ev.bandage - 0.6) / 0.4));
    if (reach > 0) {
      const a0 = V.toScreen(medi, [-165, -150]);
      const tip = [lerp(a0[0], DOZ.x + 115 * DOZ.s * 0.8, reach), lerp(a0[1], DOZ.y - 200 * DOZ.s, reach)];
      G.limb(ctx, [a0, [(a0[0] + tip[0]) / 2, Math.min(a0[1], tip[1]) - 60 * reach], tip], { color: '#FFFFFF', lw: 20, outline: INK });
      G.ellipse(ctx, tip[0], tip[1], 20, 20, { fill: '#FF8A73', stroke: INK, lw: 4, seed: 160 });
    }
    V.draw(ctx, { kind: 'siro', x: sx, y: 1000, s: 1, wheel: sx / 40, siren: st < 1 ? sirenPhase(t) : null, eyes: 'normal', look: 1, mouth: t > ev.bandage ? 'grin' : 'smile', t });
    if (t > ev.bandage) for (let i = 0; i < 3; i++) { const a = clamp((t - ev.bandage - i * 0.15) / 1.2); G.heart(ctx, DOZ.x + 120 + i * 50, DOZ.y - 360 - a * 120, 1.6 * Math.sin(Math.PI * a), { fill: '#FF8FC0', seed: 170 + i }); }
  }
  // 9. Tuggo: heave-ho, the rope slips
  const TUG = { y: 1000, s: 1.05 };
  function tuggoX(t) {
    let x = lerp(2300, 1560, ease.outCubic(clamp((t - ev.tuggo) / (ev.hitch - ev.tuggo))));
    for (const h of ev.heaves) x += 46 * Math.max(0, Math.sin(Math.PI * clamp((t - h) / (BEAT * 0.9))));
    x += 320 * ease.outCubic(clamp((t - ev.slip) / 0.35)) - 120 * ease.inOutQuad(clamp((t - ev.slip - 0.5) / 0.6));
    return x;
  }
  function shotTuggo(ctx, t) {
    parkBg(ctx, t);
    const slipped = t >= ev.slip;
    V.draw(ctx, { kind: 'medi', x: 520, y: 820, s: 0.8, eyes: slipped ? 'wide' : 'normal', mouth: slipped ? 'o' : 'smile', look: 1, t, blinkSeed: 4 });
    mudBack(ctx);
    let tilt = 0; for (const h of ev.heaves) tilt += 0.06 * Math.max(0, Math.sin(Math.PI * clamp((t - h) / (BEAT * 0.9))));
    if (slipped) tilt -= 0.08 * Math.exp(-(t - ev.slip) * 4) * Math.cos((t - ev.slip) * 18);
    dozzy(ctx, t, { eyes: slipped ? 'wide' : 'focus', mouth: slipped ? 'o' : 'flat', bandage: true, rot: tilt, look: 1 });
    mudFront(ctx, t);
    const tug = { kind: 'tuggo', x: tuggoX(t), y: TUG.y, s: TUG.s, wheel: tuggoX(t) / 40, eyes: slipped ? 'wide' : t > ev.hitch ? 'focus' : 'happy', mouth: slipped ? 'o' : t > ev.hitch ? 'flat' : 'grin', look: -1, sweat: t > ev.heaves[0] && !slipped, t };
    V.draw(ctx, tug);
    // the rope
    const hook = V.toScreen(tug, V.hookLocal);
    const att = [DOZ.x + 110 * DOZ.s, DOZ.y - 120 * DOZ.s];
    if (t > ev.hitch - 0.25) {
      const k = clamp((t - ev.hitch + 0.25) / 0.25);
      ctx.save(); ctx.strokeStyle = '#C98A4B'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hook[0], hook[1]);
      if (!slipped) {
        const tight = ev.heaves.some((h) => t >= h && t < h + BEAT * 0.9);
        const end = [lerp(hook[0], att[0], k), lerp(hook[1], att[1], k)];
        const sag = tight ? 0 : 50;
        ctx.quadraticCurveTo((hook[0] + end[0]) / 2, (hook[1] + end[1]) / 2 + sag, end[0], end[1]);
      } else { // the loose end whips back
        const a = clamp((t - ev.slip) / 0.4);
        const end = [lerp(att[0], hook[0] - 60, a), lerp(att[1], hook[1] + 140, a)];
        ctx.quadraticCurveTo((hook[0] + end[0]) / 2 + 40 * Math.sin(a * 9), (hook[1] + end[1]) / 2 + 80, end[0], end[1]);
      }
      ctx.stroke(); ctx.restore();
    }
    V.draw(ctx, { kind: 'siro', x: 300, y: 1000, s: 1, eyes: slipped ? 'wide' : 'normal', mouth: slipped ? 'o' : 'smile', look: 1, t, hop: slipped ? 30 * Math.exp(-(t - ev.slip) * 6) * Math.abs(Math.sin((t - ev.slip) * 12)) : 0 });
    ev.heaves.forEach((h, i) => pop(ctx, 'HEAVE-HO!', 1450, 420 - i * 30, t, h, { size: 60 + i * 12, color: '#9B6BDA', rot: 0.05 - i * 0.04, dur: BEAT * 0.95 }));
    pop(ctx, 'OH NO!', 960, 330, t, ev.slip + 0.05, { size: 100, color: '#FF4D63', dur: 1.5 });
  }
  // 10. everyone pushes together
  function shotPush(ctx, t) {
    parkBg(ctx, t);
    let shove = 0, lean = 0;
    ev.pushes.forEach((p) => { const k = Math.max(0, Math.sin(Math.PI * clamp((t - p) / (BEAT * 0.9)))); shove += k; lean = Math.max(lean, k); });
    const held = t >= ev.breath;
    if (held) lean = 1;
    const tremble = held ? U.noise1(t * 50, 5) * 3 : 0;
    const dzx = ev.pushes.filter((p) => t >= p).length * 8;
    const rush = (x0, x1, d = 0.8) => lerp(x0, x1, ease.outCubic(clamp((t - ev.rush) / d)));
    // the bus cheers from the back
    V.draw(ctx, { kind: 'bus', x: rush(-500, 560, 1), y: 820, s: 0.6, eyes: 'focus', mouth: 'grin', t, hop: held ? 0 : hop(t, 10), blinkSeed: 5 });
    mudBack(ctx);
    dozzy(ctx, t, { x: DOZ.x + 60 + dzx + lean * 6, eyes: held ? 'focus' : 'wide', mouth: 'flat', bandage: true, rot: lean * 0.04, look: -0.6 });
    mudFront(ctx, t);
    const L = lean * 22 + tremble;
    const effort = { eyes: 'focus', mouth: 'flat', t, sy: 1 - lean * 0.06, sx: 1 + lean * 0.05 };
    // a chain: taxi pushes Medi pushes Siro pushes Dozzy (Siro's nose meets Dozzy's back)
    const siroX = DOZ.x + 60 + dzx - 162 - 150 + L;
    V.draw(ctx, Object.assign({ kind: 'taxi', x: rush(-700, siroX - 150 - 168 - 152 + L * 0.3, 0.9), y: 1000, s: 1, blinkSeed: 6 }, effort));
    V.draw(ctx, Object.assign({ kind: 'medi', x: rush(-400, siroX - 150 - 168 + L * 0.5, 0.7), y: 1000, s: 1.05, blinkSeed: 7 }, effort));
    V.draw(ctx, Object.assign({ kind: 'siro', x: siroX, y: 1000, s: 1 }, effort));
    // Tuggo pulls again from the right
    const tug = { kind: 'tuggo', x: 1640 + lean * 20, y: TUG.y, s: TUG.s, eyes: 'focus', mouth: 'flat', sweat: true, t };
    V.draw(ctx, tug);
    const hook = V.toScreen(tug, V.hookLocal), att = [DOZ.x + 60 + dzx + 110 * DOZ.s, DOZ.y - 120 * DOZ.s];
    ctx.save(); ctx.strokeStyle = '#C98A4B'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(hook[0], hook[1]); ctx.lineTo(att[0], att[1]); ctx.stroke(); ctx.restore();
    const words = ['ONE!', 'TWO!', 'THREE!', 'PUSH!'];
    ev.pushes.forEach((p, i) => pop(ctx, words[i], 960, 300, t, p, { size: 80 + i * 14, color: ['#6EC6F0', '#FF8A73', '#9B6BDA', '#FF4D63'][i], rot: (i % 2 ? 0.06 : -0.06), dur: i === 3 ? (ev.pop - p) : BEAT * 0.95 }));
    if (held) { ctx.fillStyle = 'rgba(20,15,40,0.3)'; ctx.fillRect(-200, -200, W + 400, H + 400); }
  }
  // 11. POP! mud turns into bubbles, the dance and the bubble wash
  function bubbles(ctx, t) {
    const a = t - ev.pop;
    for (let i = 0; i < 70; i++) {
      const delay = U.hash(i, 1) * 1.2, life = 2.2 + U.hash(i, 2) * 1.6;
      const ph = ((a - delay) % life + life) % life / life;
      if (a < delay) continue;
      const first = a - delay < life;
      const x0 = MUD.x + (U.hash(i, 3) - 0.5) * 2 * MUD.rx * (first ? 1 : 2.6);
      const x = x0 + Math.sin(ph * 6 + i) * 40, y = (first ? MUD.y : H + 40) - ph * (first ? 900 : 1200);
      const r = 14 + U.hash(i, 4) * 30;
      ctx.save(); ctx.globalAlpha = 0.85 * (1 - ph * 0.6); ctx.strokeStyle = CANDY[i % 6]; ctx.lineWidth = 5; ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, 7); ctx.fill(); ctx.restore();
    }
  }
  function shotParty(ctx, t) {
    const a = t - ev.pop;
    parkBg(ctx, t);
    G.rays(ctx, 960, 760, { n: 28, r0: 120, r1: 1600, color: 'rgba(255,224,102,0.35)', lw: 40, spin: a * 0.25 });
    mudBack(ctx, 1 - ease.inQuad(clamp(a / 0.5)));
    const washed = t > ev.wash + 1;
    const sparkle = clamp((t - ev.wash) / 1);
    const bar = Math.floor(clock.beatAt ? clock.beatAt(t) / 4 : beatIdx(t) / 4);
    const cast = [
      { kind: 'taxi', x: 230, s: 0.78 }, { kind: 'medi', x: 590, s: 0.8 }, { kind: 'dozzy', x: 960, s: 0.95 },
      { kind: 'siro', x: 1330, s: 0.82 }, { kind: 'tuggo', x: 1690, s: 0.78 },
    ];
    V.draw(ctx, { kind: 'bus', x: 1150, y: 800, s: 0.55, eyes: 'happy', mouth: 'grin', t, hop: hop(t + BEAT / 2, 14), sparkle });
    cast.forEach((c, i) => {
      const jump = c.kind === 'dozzy' && a < 0.9 ? 4 * 380 * (a / 0.9) * (1 - a / 0.9) : 0;
      const dance = a > 0.9 ? hop(t + (i % 2) * BEAT / 2, 40) : 0;
      const facing = a > 0.9 ? ((beatIdx(t) >> 2) + i) % 2 ? -1 : 1 : 1;
      V.draw(ctx, { kind: c.kind, x: c.x, y: 1000, s: c.s, facing, hop: jump + dance, eyes: 'happy', mouth: 'grin', blush: 0.8, t, bandage: true, mud: c.kind === 'dozzy' && !washed ? 0.8 * (1 - sparkle) : 0, sparkle, rot: a > 0.9 ? Math.sin(Math.PI * clock.beatPos(t)) * 0.06 : 0, siren: c.kind === 'siro' || c.kind === 'medi' ? sirenPhase(t, i) : null, arm: c.kind === 'dozzy' ? 0.5 + 0.5 * Math.sin(t * 8) : 0 });
    });
    bubbles(ctx, t);
    if (a < 3) G.confetti(ctx, t, ev.pop, { n: 140, seed: 7, spawn: 2.2 });
    pop(ctx, 'POP!', 960, 300, t, ev.pop, { size: 170, color: '#FF6F91', dur: 1.4 });
    pop(ctx, 'BUBBLE WASH!', 960, 220, t, ev.wash, { size: 84, color: '#6EC6F0', dur: 2 });
    const fl = 0.85 * Math.exp(-Math.max(0, a) * 9);
    if (fl > 0.01) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(-200, -200, W + 400, H + 400); }
  }
  // 12. sunset: Siro drives home, yawns and falls asleep
  function shotNight(ctx, t) {
    const a = t - ev.sunset;
    sky(ctx, '#FF9E7A', '#7C5BA6');
    G.ellipse(ctx, 1600, 700, 130, 130, { fill: '#FFD27A', stroke: null, seed: 180 });
    cloud(ctx, 400, 200, 0.8, 8);
    G.poly(ctx, [[-60, 860], [1990, 860], [1990, H + 60], [-60, H + 60]], { fill: '#B79BB8', stroke: INK, lw: 4, seed: 181 });
    station(ctx, 960, 860, true);
    const x = lerp(-250, 960, ease.outCubic(clamp(a / 3.2)));
    const asleep = t > ev.sleep;
    V.draw(ctx, { kind: 'siro', x, y: 858, s: 1.12, wheel: x / 45, eyes: asleep ? 'closed' : t > ev.yawn - 0.2 ? 'closed' : 'happy', mouth: win(t, ev.yawn, ev.yawn + 1) ? 'o' : 'smile', t, blush: 0.7, sy: 1 + (win(t, ev.yawn, ev.yawn + 1) ? 0.05 * Math.sin(Math.PI * (t - ev.yawn)) : 0) });
    shutter(ctx, 960, 860, 0.35 * ease.inOutCubic(clamp((t - ev.sleep - 0.5) / 1.2)));
    if (asleep) zzz(ctx, 1090, 600, t, clamp((t - ev.sleep) / 0.5));
    const e = clamp((t - ev.sleep - 0.8) / 0.6);
    if (e > 0) {
      G.text(ctx, 'Good night!', 960, 100, { size: 110, fam: 'Caveat', color: '#FFFFFF', align: 'center', baseline: 'middle', alpha: e, stroke: '#7C5BA6', strokeW: 10 });
      koPill(ctx, '잘 자, 시로!', 960, 190, 48, '#7C5BA6', e);
    }
  }

  const film = Shots.film([
    { at: 0, draw: shotMud, cam: Shots.push(1, 1.08) },
    { at: S.S.station[0], draw: shotStation, in: 'cut' },
    { at: S.S.drive[0], draw: shotDrive, in: { type: 'push', dir: 'left', dur: 0.3 } },
    { at: S.S.sos[0], draw: shotSOS, in: 'cut', cam: Shots.push(1, 1.06) },
    { at: S.S.siren[0], draw: shotSiren, in: 'flash', cam: Shots.shake(16, ev.siren) },
    { at: S.S.race[0], draw: shotRace, in: { type: 'whip', dur: 0.25 } },
    { at: S.S.medi[0], draw: shotMedi, in: 'cut', cam: Shots.shake(10, ev.medi) },
    { at: S.S.arrive[0], draw: shotArrive, in: { type: 'push', dir: 'left', dur: 0.3 } },
    { at: S.S.tuggo[0], draw: shotTuggo, in: 'cut', cam: (s) => Shots.shake(14, ev.slip)(s) },
    { at: S.S.push[0], draw: shotPush, in: 'cut', cam: Shots.push(1, 1.07) },
    { at: S.S.party[0], draw: shotParty, in: 'cut', cam: Shots.shake(18, ev.pop) },
    { at: S.S.night[0], draw: shotNight, in: { type: 'iris', color: '#7C5BA6', at: [960, 600], dur: 0.8 } },
  ]);

  globalThis.CAST = {};
  Studio.film({
    draw(ctx, t) { film(ctx, t); },
    post: { paper: 0.25, vignette: 0.2, grain: 0.03 },
    fadeOut: 0.8,
  });
})();
