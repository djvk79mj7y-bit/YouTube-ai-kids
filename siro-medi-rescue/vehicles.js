// VEHICLES — the cast of Bubble Town, drawn from G.* primitives.
// V.draw(ctx, o): o = { kind: 'siro'|'medi'|'dozzy'|'tuggo'|'bus'|'taxi', x, y (ground), s, facing (1 = right),
//   rot, hop (px up), sx, sy (squash), wheel (radians), eyes: 'normal'|'happy'|'closed'|'wink'|'wide'|'sad'|'focus',
//   look, lookY, mouth: 'smile'|'grin'|'open'|'sad'|'o'|'flat', blush, siren (null | phase 0/1), tears (0..1),
//   doors (0..1), bandage, mud (0..1), sparkle (0..1), t }
(function () {
  const U = globalThis.U, G = globalThis.G;
  const { clamp } = U;
  const INK = '#2A2340';
  const V = {};
  V.COL = {
    siro: '#6EC6F0', siroStripe: '#FFD54A', medi: '#8FE3C8', coral: '#FF8A73', dozzy: '#FF9F43',
    tuggo: '#9B6BDA', tuggoDark: '#7D52BF', bus: '#FFC93C', taxi: '#FFE15A', glass: '#EAF8FF', tire: '#3A3A4A',
  };

  const shp = (ctx, pts, fill, o = {}) => G.shape(ctx, pts, Object.assign({ fill, stroke: INK, lw: 4.5, amp: 1.1 }, o));
  const rr = (ctx, x, y, w, h, r, fill, o) => shp(ctx, G.rrPts(x, y, w, h, r), fill, o);
  const el = (ctx, x, y, rx, ry, fill, o) => shp(ctx, G.ellPts(x, y, rx, ry), fill, o);

  function wheel(ctx, x, y, r, rot, seed) {
    el(ctx, x, y, r, r, V.COL.tire, { seed });
    el(ctx, x, y, r * 0.5, r * 0.5, '#D9DCE6', { seed: seed + 1, lw: 3 });
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = rot + (i * Math.PI * 2) / 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45); ctx.stroke();
    }
    ctx.restore();
  }

  function eye(ctx, x, y, rx, ry, o, which) {
    let st = o.eyes || 'normal';
    if (st === 'wink') st = which === 1 ? 'closed' : 'happy';
    // blinks, deterministic per character
    const seedT = (o.t || 0) + (o.blinkSeed || 0);
    if ((st === 'normal' || st === 'sad') && (seedT % 3.3) < 0.12) st = 'closed';
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    if (st === 'closed' || st === 'happy') {
      ctx.beginPath();
      if (st === 'happy') ctx.arc(x, y + ry * 0.25, rx * 0.8, Math.PI * 1.1, Math.PI * 1.9);
      else ctx.arc(x, y - ry * 0.1, rx * 0.8, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke(); ctx.restore(); return;
    }
    const big = st === 'wide' ? 1.15 : 1;
    el(ctx, x, y, rx * big, ry * big, '#FFFFFF', { lw: 4, seed: 7 + which });
    const lx = clamp(o.look || 0, -1, 1) * rx * 0.35, ly = clamp(o.lookY || 0, -1, 1) * ry * 0.3;
    const pr = (st === 'wide' ? 0.42 : 0.55) * rx;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x + lx + rx * 0.08, y + ly + ry * 0.1, pr, pr * 1.15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x + lx - pr * 0.15, y + ly - pr * 0.35, pr * 0.35, 0, Math.PI * 2); ctx.fill();
    if (st === 'sad' || st === 'focus') { // brows
      ctx.lineWidth = 5; ctx.beginPath();
      const d = st === 'sad' ? -1 : 1, sx = which === 0 ? -1 : 1;
      ctx.moveTo(x - rx * 0.8, y - ry * 1.25 + d * sx * ry * 0.25); ctx.lineTo(x + rx * 0.8, y - ry * 1.25 - d * sx * ry * 0.25); ctx.stroke();
    }
    ctx.restore();
  }

  function face(ctx, o, e0, e1, rx, ry, m, mw) {
    eye(ctx, e0[0], e0[1], rx, ry, o, 0);
    eye(ctx, e1[0], e1[1], rx, ry, o, 1);
    if (o.blush) {
      ctx.save(); ctx.globalAlpha = 0.45 * o.blush; ctx.fillStyle = '#FF7FA0';
      ctx.beginPath(); ctx.ellipse(e1[0] + rx * 1.1, e1[1] + ry * 1.0, rx * 0.5, ry * 0.25, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (o.tears > 0) {
      ctx.save(); ctx.fillStyle = '#7FD3FF'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      for (const [ex, ey] of [e0, e1]) for (let k = 0; k < 2; k++) {
        const ph = (((o.t || 0) * 1.4 + k * 0.5 + ex * 0.01) % 1);
        const dx = ex + (k ? rx * 0.6 : -rx * 0.4), dy = ey + ry + ph * ry * 3.2;
        ctx.globalAlpha = o.tears * (1 - ph);
        ctx.beginPath(); ctx.moveTo(dx, dy - 10); ctx.quadraticCurveTo(dx + 7, dy + 2, dx, dy + 7); ctx.quadraticCurveTo(dx - 7, dy + 2, dx, dy - 10); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
    // mouth
    const k = o.mouth || 'smile';
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const [mx, my] = m;
    if (k === 'smile' || k === 'grin') {
      ctx.beginPath(); ctx.arc(mx, my - mw * 0.5, mw * 0.6, Math.PI * 0.2, Math.PI * 0.8);
      if (k === 'grin') { ctx.closePath(); ctx.fillStyle = '#B33A4A'; ctx.fill(); }
      ctx.stroke();
    } else if (k === 'sad') {
      ctx.beginPath(); ctx.arc(mx, my + mw * 0.45, mw * 0.5, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    } else if (k === 'open' || k === 'o') {
      const w = k === 'o' ? mw * 0.28 : mw * 0.45, h = k === 'o' ? mw * 0.32 : mw * 0.4;
      ctx.fillStyle = '#B33A4A'; ctx.beginPath(); ctx.ellipse(mx, my, w, h, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else { ctx.beginPath(); ctx.moveTo(mx - mw * 0.35, my); ctx.lineTo(mx + mw * 0.35, my); ctx.stroke(); }
    ctx.restore();
  }

  function glow(ctx, x, y, r, color, a) {
    if (a <= 0.01) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace('A)', `${a})`)); g.addColorStop(1, color.replace('A)', '0)'));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  V.glow = glow;

  function mudSpots(ctx, o, pts) {
    if (!(o.mud > 0)) return;
    ctx.save(); ctx.globalAlpha = o.mud; ctx.fillStyle = '#8B5A3C';
    pts.forEach(([x, y, r], i) => { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, i, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  }

  function sparkles(ctx, o, w, h) {
    if (!(o.sparkle > 0)) return;
    for (let i = 0; i < 5; i++) {
      const ph = (((o.t || 0) * 0.9 + i * 0.37) % 1);
      const x = (U.hash(i, 3) - 0.5) * w, y = -h * (0.2 + U.hash(i, 5) * 0.8);
      const r = 16 * Math.sin(Math.PI * ph) * o.sparkle;
      if (r > 1) G.star(ctx, x, y, r, { fill: '#FFF6C8', seed: i, rot: ph });
    }
  }

  const BODY = {
    siro(ctx, o) {
      const C = V.COL;
      rr(ctx, -95, -238, 175, 100, 46, C.siro, { seed: 11 });
      rr(ctx, -78, -224, 146, 74, 32, C.glass, { seed: 12, lw: 3.5 });
      rr(ctx, -152, -152, 304, 114, 46, C.siro, { seed: 13 });
      rr(ctx, -150, -98, 300, 26, 12, C.siroStripe, { stroke: null });
      G.star(ctx, 40, -118, 20, { fill: '#FFD54A', seed: 14 });
      el(ctx, 138, -122, 11, 14, '#FFF3A6', { seed: 15, lw: 3 });
      // the heart siren
      const on = o.siren != null;
      const hx = -8, hy = -258;
      if (on) { glow(ctx, hx, hy, 170, o.siren ? 'rgba(70,140,255,A)' : 'rgba(255,60,80,A)', 0.9); }
      ctx.save();
      ctx.beginPath(); ctx.rect(hx - 40, hy - 40, 40, 80); ctx.clip();
      G.heart(ctx, hx, hy, 2.1, { fill: on && o.siren === 0 ? '#FF4D63' : on ? '#C9354A' : '#E46A7A', seed: 16 });
      ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.rect(hx, hy - 40, 40, 80); ctx.clip();
      G.heart(ctx, hx, hy, 2.1, { fill: on && o.siren === 1 ? '#4D8BFF' : on ? '#2F5DB8' : '#6F92D8', seed: 17 });
      ctx.restore();
      face(ctx, o, [-22, -188], [28, -188], 19, 24, [138, -66], 34);
      mudSpots(ctx, o, [[-60, -70, 16], [70, -60, 12], [-110, -120, 10]]);
      wheel(ctx, -88, -40, 40, -(o.wheel || 0), 18); wheel(ctx, 88, -40, 40, -(o.wheel || 0), 19);
      sparkles(ctx, o, 300, 280);
    },
    medi(ctx, o) {
      const C = V.COL;
      // rear doors open like wings (hinged at the back edge)
      const d = clamp(o.doors || 0);
      if (d > 0) {
        for (const [y0, h, k] of [[-262, 108, 0], [-150, 105, 1]]) {
          const w = 105 * d;
          rr(ctx, -160 - w, y0 - d * (k ? -18 : 18), w, h, 18, '#7ED6BA', { seed: 21 + k });
          rr(ctx, -160 - w, y0 + h * 0.45 - d * (k ? -18 : 18), w, 16, 6, C.coral, { stroke: null });
        }
        rr(ctx, -158, -262, 20, 220, 8, '#3F6E66', { stroke: null });
      }
      rr(ctx, -162, -272, 220, 232, 36, C.medi, { seed: 23 });
      rr(ctx, 30, -188, 132, 150, 42, C.medi, { seed: 24 });
      rr(ctx, 50, -175, 96, 62, 26, C.glass, { seed: 25, lw: 3.5 });
      rr(ctx, -160, -108, 320, 24, 10, C.coral, { stroke: null });
      // bandage cross on the side
      for (const a of [0.6, -0.6]) {
        ctx.save(); ctx.translate(-55, -190); ctx.rotate(a);
        rr(ctx, -60, -16, 120, 32, 15, '#FFE2C2', { seed: 26, lw: 3.5 });
        ctx.fillStyle = 'rgba(200,140,110,0.6)';
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-8 + i * 8, 0, 2.6, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      // roof light
      const on = o.siren != null;
      if (on) glow(ctx, -50, -288, 150, o.siren ? 'rgba(255,90,120,A)' : 'rgba(255,200,90,A)', 0.85);
      rr(ctx, -80, -300, 60, 28, 12, on ? (o.siren ? '#FF5C7A' : '#FFC94D') : '#F7A6A6', { seed: 27 });
      face(ctx, o, [75, -146], [118, -146], 16, 21, [148, -66], 30);
      el(ctx, 156, -118, 8, 12, '#FFF3A6', { seed: 28, lw: 3 });
      mudSpots(ctx, o, [[-90, -70, 14], [80, -60, 12]]);
      wheel(ctx, -98, -40, 38, -(o.wheel || 0), 29); wheel(ctx, 96, -40, 38, -(o.wheel || 0), 30);
      sparkles(ctx, o, 320, 300);
    },
    dozzy(ctx, o) {
      const C = V.COL;
      // shovel arm (behind the cab)
      const e = o.arm || 0; // 0 rest, 1 raised (waving)
      const sh = [40, -175], el2 = [150 + e * 10, -235 - e * 50], tip = [205 + e * 25, -128 - e * 140];
      G.limb(ctx, [sh, el2, tip], { color: C.dozzy, lw: 30, outline: INK });
      shp(ctx, [[tip[0] - 30, tip[1] - 12], [tip[0] + 34, tip[1] - 6], [tip[0] + 22, tip[1] + 40], [tip[0] - 20, tip[1] + 32]], '#D9DCE6', { seed: 31 });
      if (o.bandage) {
        ctx.save(); ctx.translate((sh[0] + el2[0]) / 2 + 30, (sh[1] + el2[1]) / 2 - 10); ctx.rotate(-0.5);
        rr(ctx, -16, -26, 32, 52, 12, '#FFE2C2', { seed: 32, lw: 3.5 });
        ctx.fillStyle = 'rgba(200,140,110,0.7)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -8 + i * 8, 2.5, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      rr(ctx, -132, -72, 264, 72, 36, C.tire, { seed: 33 });
      for (let i = 0; i < 4; i++) wheel(ctx, -90 + i * 60, -36, 20, -(o.wheel || 0), 34 + i);
      rr(ctx, -112, -134, 205, 68, 22, C.dozzy, { seed: 38 });
      rr(ctx, -92, -250, 134, 124, 32, C.dozzy, { seed: 39 });
      rr(ctx, -78, -236, 106, 82, 26, C.glass, { seed: 40, lw: 3.5 });
      face(ctx, o, [-48, -196], [-2, -196], 21, 27, [-25, -142], 30);
      mudSpots(ctx, o, [[-70, -100, 18], [40, -95, 14], [-20, -112, 10], [70, -160, 9]]);
      sparkles(ctx, o, 280, 260);
    },
    tuggo(ctx, o) {
      const C = V.COL;
      // boom with a curly hook tail at the back
      G.limb(ctx, [[-30, -110], [-150, -205]], { color: '#C7A8F2', lw: 18, outline: INK });
      const hk = V.hookLocal;
      ctx.save(); ctx.strokeStyle = '#8A8FA3'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i <= 30; i++) { const a = (i / 30) * Math.PI * 3.2; const r = 6 + i * 0.9; const x = -150 + Math.sin(a) * r, y = -205 + i * 1.6 + (1 - Math.cos(a)) * r * 0.7; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = '#8A8FA3'; ctx.beginPath(); ctx.arc(hk[0], hk[1], 8, 0, 7); ctx.fill(); ctx.restore();
      rr(ctx, -162, -112, 190, 72, 18, C.tuggoDark, { seed: 41 });
      rr(ctx, 8, -218, 148, 180, 42, C.tuggo, { seed: 42 });
      rr(ctx, 28, -204, 108, 70, 28, C.glass, { seed: 43, lw: 3.5 });
      rr(ctx, -55, -232, 46, 22, 10, '#FFC94D', { seed: 44 });
      face(ctx, o, [60, -170], [104, -170], 17, 22, [146, -72], 32);
      if (o.sweat) { ctx.save(); ctx.fillStyle = '#7FD3FF'; ctx.beginPath(); ctx.ellipse(150, -215, 8, 12, 0.3, 0, 7); ctx.fill(); ctx.restore(); }
      wheel(ctx, -112, -40, 40, -(o.wheel || 0), 45); wheel(ctx, 100, -40, 40, -(o.wheel || 0), 46);
      sparkles(ctx, o, 320, 260);
    },
    bus(ctx, o) {
      const C = V.COL;
      rr(ctx, -235, -250, 470, 212, 44, C.bus, { seed: 51 });
      for (let i = 0; i < 4; i++) rr(ctx, -210 + i * 92, -225, 72, 66, 18, C.glass, { seed: 52 + i, lw: 3.5 });
      rr(ctx, 160, -225, 58, 100, 20, C.glass, { seed: 57, lw: 3.5 });
      rr(ctx, -233, -128, 466, 22, 10, '#FF7A59', { stroke: null });
      face(ctx, o, [176, -190], [205, -190], 12, 17, [222, -66], 30);
      wheel(ctx, -150, -40, 40, -(o.wheel || 0), 58); wheel(ctx, 150, -40, 40, -(o.wheel || 0), 59);
    },
    taxi(ctx, o) {
      const C = V.COL;
      rr(ctx, -85, -232, 165, 96, 44, C.taxi, { seed: 61 });
      rr(ctx, -70, -219, 136, 70, 30, C.glass, { seed: 62, lw: 3.5 });
      rr(ctx, -38, -262, 70, 30, 10, '#FFFFFF', { seed: 63 });
      G.text(ctx, 'TAXI', -3, -240, { size: 22, fam: 'Bungee', color: INK, align: 'center', baseline: 'middle', boil: 0 });
      rr(ctx, -150, -150, 300, 112, 44, C.taxi, { seed: 64 });
      ctx.save(); ctx.fillStyle = INK; for (let i = 0; i < 12; i++) if (i % 2 === 0) ctx.fillRect(-140 + i * 24, -110, 24, 14); for (let i = 0; i < 12; i++) if (i % 2) ctx.fillRect(-140 + i * 24, -96, 24, 14); ctx.restore();
      face(ctx, o, [-15, -184], [32, -184], 17, 22, [136, -64], 30);
      wheel(ctx, -86, -40, 40, -(o.wheel || 0), 65); wheel(ctx, 86, -40, 40, -(o.wheel || 0), 66);
    },
  };
  V.hookLocal = [-150 + Math.sin(Math.PI * 3.2) * 33, -205 + 48 + (1 - Math.cos(Math.PI * 3.2)) * 33 * 0.7];

  V.width = { siro: 300, medi: 320, dozzy: 290, tuggo: 320, bus: 470, taxi: 300 };

  V.draw = (ctx, o) => {
    const s = o.s || 1, f = o.facing || 1;
    // ground shadow (does not hop)
    if (o.shadow !== false) {
      const k = 1 / (1 + (o.hop || 0) / 160);
      ctx.save(); ctx.fillStyle = 'rgba(30,20,60,0.18)';
      ctx.beginPath(); ctx.ellipse(o.x, o.y + 2, (V.width[o.kind] || 300) * 0.55 * s * k, 16 * s * k, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.save();
    ctx.translate(o.x, o.y - (o.hop || 0));
    ctx.rotate((o.rot || 0) * f);
    ctx.scale(f * s * (o.sx || 1), s * (o.sy || 1));
    BODY[o.kind](ctx, o);
    ctx.restore();
  };
  // a local point (in the vehicle's own units) to screen space, ignoring rot/squash
  V.toScreen = (o, p) => [o.x + p[0] * (o.s || 1) * (o.facing || 1), o.y - (o.hop || 0) + p[1] * (o.s || 1)];

  globalThis.V = V;
})();
