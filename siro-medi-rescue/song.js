// THE SONG — renders every sound from the score into out/music.wav.
//   node song.js   (STEMS=1 also writes out/stem-*.wav, LUFS=-14 masters to a loudness target)
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { T, BEAT, DURATION, m, ev, clock } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const drums = bus(), bass = bus(), pad = bus(), keys = bus(), brass = bus(), fx = bus(), siren = bus();
const verb = bus(), dly = bus();
const inBreath = (t) => t >= ev.breath - 1e-6 && t < ev.pop - 1e-6;

// ---------- drums ----------
const K = I.kick(), SN = I.snare(), CL = I.clap(), HC = [I.hat(false, 11), I.hat(false, 12)], HO = I.hat(true, 14);
const SH = [I.shaker(1, 15), I.shaker(0.6, 16)];
const kicks = [];
const kick = (t, g = 0.9) => { drums.addMono(K, t, g); kicks.push(t); };
clock.eachStep(4, 24, 16, (t, b, s) => {
  if (inBreath(t)) return;
  if (b >= 4 && b < 8) { // patrol groove
    if (s % 8 === 0) kick(t);
    if (s % 8 === 4) { drums.addMono(CL, t, 0.5); verb.addMono(CL, t, 0.25); }
    if (s % 2 === 0) drums.addMono(s % 4 === 2 ? HC[0] : SH[0], t, 0.16, s % 4 === 2 ? -0.3 : 0.35);
  } else if (b === 8) { // SOS: half time
    if (s === 0) kick(t);
    if (s === 8) drums.addMono(SN, t, 0.4);
    if (s % 4 === 2) drums.addMono(HC[1], t, 0.12);
  } else if ((b >= 9 && b < 14) || (b >= 20 && b < 24)) { // race + party: four on the floor
    if (s % 4 === 0) kick(t, 0.95);
    if (s % 8 === 4) { drums.addMono(CL, t, 0.6); drums.addMono(SN, t, 0.2); verb.addMono(CL, t, 0.25); }
    drums.addMono(HC[s % 2], t, s % 2 ? 0.2 : 0.11, -0.3);
    if (s % 4 === 2) drums.addMono(HO, t, 0.1, 0.3);
  } else if (b >= 14 && b < 16) { // arrival: light
    if (s === 0) kick(t, 0.7);
    if (s % 2 === 0) drums.addMono(SH[s % 4 === 0 ? 0 : 1], t, 0.14, 0.3);
  }
});
const CR = I.crash(18);
for (const t of [ev.siren, ev.medi, ev.pop, T(22)]) drums.addMono(CR, t, 0.38, t === ev.medi ? 0.3 : -0.2);
// snare roll into the held breath (ends an 8th before it)
for (let i = 0; i < 11; i++) drums.addMono(SN, T(19, 0) + i * BEAT / 4, 0.15 + i * 0.03, 0.05);

// ---------- bass ----------
clock.eachStep(2, 24, 8, (t, b, s) => {
  if (inBreath(t)) return;
  if (b >= 16 && b < 20) return; // the struggle has only drums of effort
  const c = sc.chordAt(t);
  if (!c) return;
  const R = c.bass + 12;
  if ((b >= 9 && b < 14) || b >= 20) bass.addMono(I.bass(s % 2 ? R + 12 : R, BEAT / 2 * 0.8, { sub: 0.8 }), t, 0.55);
  else if (s === 0 || s === 3 || s === 4 || s === 6) bass.addMono(I.bass(s === 4 ? R + 7 : R, BEAT / 2 * (s % 4 === 0 ? 1.4 : 0.7)), t, 0.5);
});
bass.addMono(I.bass(m('F2'), 2.5, { bright: 0.3, sub: 1 }), ev.end, 0.45);

// ---------- pads ----------
for (const c of sc.chords) {
  let t1 = c.t1;
  if (c.t0 < ev.breath && c.t1 > ev.breath) t1 = ev.breath;
  const bright = (c.t0 >= T(9) && c.t0 < T(14)) || (c.t0 >= ev.pop && c.t0 < ev.sunset);
  const opts = bright ? { cutoff: 2600, attack: 0.05 } : { cutoff: 1100, attack: 0.5, release: 1.4 };
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, opts); pad.addStereo(L, R, c.t0, 0.085); }
}

// ---------- keys ----------
for (const n of sc.musicbox) { const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.2); verb.addMono(mb, n.t, 0.2); dly.addMono(mb, n.t, 0.08); }
for (const n of sc.marimbaHook) { const x = I.marimba(n.midi, { thock: 0 }); keys.addMono(x, n.t, 0.45, 0.15); verb.addMono(x, n.t, 0.15); }
// plucky off-beat chords under the patrol
clock.eachStep(4, 8, 8, (t, b, s) => {
  if (s % 2 !== 1) return;
  const c = sc.chordAt(t);
  for (const n of c.notes) keys.addMono(I.pluck(n + 12, { decay: 0.12 }), t, 0.07, -0.2);
});

// ---------- brass ----------
for (const n of sc.brassHook) {
  const a = I.brassNote(n.midi, n.dur * 0.9), b = I.brassNote(n.midi - 12, n.dur * 0.9, { bright: 0.8, seed: 99 });
  brass.addStereo(a.L, a.R, n.t, 0.26); brass.addStereo(b.L, b.R, n.t, 0.13);
  verb.addStereo(a.L, a.R, n.t, 0.1); dly.addStereo(a.L, a.R, n.t, 0.04);
}
const stab = (midi, t, len = 0.18, g = 0.32) => { const a = I.brassNote(midi, len, { stab: 1 }); brass.addStereo(a.L, a.R, t, g); };
// the siren switching on: a big stab
for (const n of ['C4', 'E4', 'G4', 'C5']) stab(m(n), ev.siren, 0.5, 0.18);
// honks: the bus (low), the taxi (high), Siro's thank-you (two beeps)
stab(m('F3'), ev.bus + BEAT, 0.3, 0.35); stab(m('A3'), ev.bus + BEAT, 0.3, 0.25);
stab(m('C5'), ev.taxi + BEAT, 0.14, 0.3); stab(m('C5'), ev.taxi + BEAT * 1.5, 0.14, 0.3);
stab(m('G4'), ev.thanks, 0.12, 0.32); stab(m('C5'), ev.thanks + BEAT / 2, 0.2, 0.32);
// Tuggo's deep honk when the rope is hitched
stab(m('D3'), ev.hitch, 0.35, 0.38); stab(m('F3'), ev.hitch, 0.35, 0.26);

// ---------- sirens: Siro's "wee-woo" (bars 9-14), Medi's higher one joins at bar 12 ----------
clock.eachStep(9, 14, 4, (t, b, s) => {
  siren.addMono(I.pulse(s % 2 ? m('B4') : m('E5'), BEAT * 0.95, { duty: 0.3, decay: 0, vib: 0.2 }), t, 0.05, -0.25);
  if (b >= 12) siren.addMono(I.pulse(s % 2 ? m('A5') : m('E5') + 5, BEAT * 0.95, { duty: 0.25, decay: 0, vib: 0.2 }), t + BEAT / 2, 0.035, 0.3);
});

// ---------- fx: each tied to a score event ----------
// mud bubbles + whimper
for (let i = 0; i < 6; i++) fx.addMono(I.pop(0.5 + 0.1 * (i % 3)), 0.4 + i * 0.55, 0.1, (i % 2) - 0.5);
fx.addMono(I.whistle(0.5), ev.help, 0.12);
fx.addMono(I.noiseSweep(0.6, 600, 3000, { q: 2 }), ev.flash, 0.12);
// station
fx.addMono(I.noiseSweep(1.1, 300, 2500, { q: 1.5, pink: true }), ev.shutter, 0.28); // the shutter rolls up
fx.addMono(I.boing(), ev.wake, 0.25);
fx.addMono(I.bell(2093, 1.4, 1.5, 3.5), ev.wink, 0.28); // the wink sparkle
fx.addMono(I.ting(m('E6')), ev.wink + 0.12, 0.2);
// trees wave
for (const t of ev.trees) fx.addMono(I.woodTick(1.2), t, 0.25, 0.3);
// SOS
for (let i = 0; i < 4; i++) fx.addMono(I.ting(m('A5') + (i % 2) * 3), ev.sos + i * BEAT, 0.28);
fx.addMono(I.pop(1.2), ev.sos, 0.5);
// siren on
fx.addMono(I.thud(90, 0.1), ev.siren, 0.5);
fx.addMono(I.subBoom(1.2), ev.siren, 0.45);
// race whooshes
for (const t of [ev.bus, ev.taxi]) fx.addMono(I.noiseSweep(0.5, 400, 2500, { q: 1, pink: true }), t, 0.22);
// Medi joins
fx.addMono(I.noiseSweep(0.4, 3000, 500, { q: 1, pink: true }), ev.medi - 0.35, 0.25);
fx.addMono(I.thud(70, 0.09), ev.medi, 0.55);
// arrival: brakes squeak, doors, bandage
fx.addMono(I.whistle(0.3), ev.stop, 0.08);
fx.addMono(I.woodTick(0.8), ev.doors, 0.35); fx.addMono(I.noiseSweep(0.5, 800, 3000, { q: 2 }), ev.doors, 0.15);
fx.addMono(I.ting(m('C6')), ev.bandage, 0.3); fx.addMono(I.ting(m('G6')), ev.bandage + BEAT / 2, 0.22);
// Tuggo reverse beeps
for (let i = 0; i < 3; i++) fx.addMono(I.pulse(m('B5'), 0.18, { duty: 0.5, decay: 0 }), ev.tuggo + i * BEAT, 0.08);
// heave-ho: thuds + rising timpani
ev.heaves.forEach((t, i) => { fx.addMono(I.timpani(m('D2') + i * 2), t, 0.5); fx.addMono(I.thud(60, 0.12), t, 0.4); });
fx.addMono(I.bwomp(), ev.slip, 0.45); // the rope slips
fx.addMono(I.thwack(), ev.slip, 0.3);
// rush in, pushes
fx.addMono(I.noiseSweep(0.6, 300, 2500, { q: 1, pink: true }), ev.rush, 0.25);
ev.pushes.forEach((t, i) => { fx.addMono(I.tom(110 + i * 25, 0.25), t, 0.5); fx.addMono(I.thud(70, 0.1), t, 0.3); });
fx.addMono(I.noiseSweep(ev.breath - T(18, 2), 200, 7000, { q: 0.9, shape: (x) => x * x, pink: true }), T(18, 2), 0.3); // riser
// POP!
fx.addMono(I.pop(0.6), ev.pop, 0.9);
fx.addMono(I.subBoom(2.2), ev.pop, 0.6);
for (let i = 0; i < 14; i++) fx.addMono(I.pop(0.8 + (i % 5) * 0.15), ev.pop + 0.2 + i * 0.13, 0.18, ((i * 37) % 10) / 5 - 1);
// bubble wash sparkles
for (let i = 0; i < 8; i++) fx.addMono(I.ting(m('C6') + [0, 4, 7, 12][i % 4]), ev.wash + i * BEAT / 2, 0.12, (i % 2) - 0.5);
// yawn + snore
fx.addMono(I.noiseSweep(1.0, 900, 400, { q: 3 }), ev.yawn, 0.15);
for (let i = 0; i < 3; i++) fx.addMono(I.noiseSweep(0.8, 300, 200, { q: 4, pink: true }), ev.sleep + 0.5 + i * 1.0, 0.07);

// ---------- mix ----------
MIX.sidechain([pad, bass], kicks.filter((t) => (t >= T(9) && t < T(14)) || (t >= ev.pop && t < ev.sunset)));
const stems = {
  drums, bass, pad, keys, brass, fx, siren,
  verb: reverb(verb, { room: 0.84, damp: 0.3 }),
  dly: pingpong(dly, BEAT * 0.75, 0.38, 3500),
};
const GAIN = { drums: 0.4, bass: 0.7, pad: 2.4, keys: 0.9, brass: 1.8, fx: 0.8, siren: 3, verb: 1, dly: 1 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.breath, ev.pop); // the held breath is truly silent
MIX.fadeOut(mix, DURATION - 1.6, DURATION);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.8'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : null });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)}` : ''})`);
