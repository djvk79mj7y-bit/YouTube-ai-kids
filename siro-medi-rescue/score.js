// THE SCORE — Siro & Medi Rescue Squad. The single source of truth for music AND picture.
// 120 BPM, 1 bar = 2 s. Every hit the picture shows is an event here, and song.js plays the same events.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock, placeBar, makeChords } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('16:9');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const WIDE = W / H > 1.2;
  const clock = makeClock({ bpm: 120, offset: 0.5 });
  const { T, BEAT } = clock;
  const DURATION = T(26) + 2; // ~54.5 s

  // ---------- sections (shots) ----------
  const S = {
    mud: [0, T(2)], // Dozzy stuck in the mud, crying for help
    station: [T(2), T(4)], // the shutter rolls up, Siro wakes and winks
    drive: [T(4), T(8)], // happy patrol through Bubble Town
    sos: [T(8), T(9)], // the heart SOS on the dashboard
    siren: [T(9), T(10)], // the heart siren switches on
    race: [T(10), T(12)], // the bus and the taxi pull aside
    medi: [T(12), T(14)], // Medi joins at the crossing
    arrive: [T(14), T(16)], // arrival, Medi's doors open, a bandage
    tuggo: [T(16), T(18)], // Tuggo pulls, heave-ho, the rope slips
    push: [T(18), T(20)], // everyone pushes together
    party: [T(20), T(24)], // POP! mud turns to bubbles, dance + bubble wash
    night: [T(24), DURATION], // sunset, Siro yawns and sleeps
  };

  // ---------- harmony (F major) ----------
  const { chords, chordAt } = makeChords(clock, {
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F2' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    Bb: { notes: ['Bb3', 'D4', 'F4'], bass: 'Bb1' },
    Fmaj9: { notes: ['A3', 'C4', 'E4', 'G4'], bass: 'F1' },
  }, [
    [0, 0, 4, 'Dm'], [1, 0, 4, 'Bb'],
    [2, 0, 4, 'F'], [3, 0, 4, 'C'],
    [4, 0, 4, 'F'], [5, 0, 4, 'C'], [6, 0, 4, 'Bb'], [7, 0, 4, 'C'],
    [8, 0, 4, 'Dm'], [9, 0, 4, 'C'],
    [10, 0, 4, 'F'], [11, 0, 4, 'C'], [12, 0, 4, 'Bb'], [13, 0, 4, 'C'],
    [14, 0, 4, 'F'], [15, 0, 4, 'C'],
    [16, 0, 4, 'Dm'], [17, 0, 4, 'Bb'], [18, 0, 4, 'Dm'], [19, 0, 3, 'C'],
    [20, 0, 4, 'F'], [21, 0, 4, 'C'], [22, 0, 4, 'Bb'], [23, 0, 4, 'C'],
    [24, 0, 4, 'F'], [25, 0, 2, 'Bb'], [25, 2, 2, 'F'], [26, 0, 4, 'Fmaj9'],
  ]);

  // ---------- the "Siro & Medi" hook (8th grid: [note, start8th, dur8ths]) ----------
  const HOOK = {
    1: [['C5', 0, 2], ['A4', 2, 2], ['C5', 4, 2], ['F5', 6, 2]],
    2: [['E5', 0, 1], ['D5', 1, 1], ['C5', 2, 2], ['A4', 4, 2], ['G4', 6, 2]],
    3: [['D5', 0, 2], ['Bb4', 2, 2], ['D5', 4, 2], ['F5', 6, 2]],
    4: [['E5', 0, 2], ['G5', 2, 2], ['E5', 4, 2], ['C5', 6, 2]],
    sad1: [['D5', 0, 3], ['A4', 3, 1], ['F4', 4, 4]],
    sad2: [['D5', 0, 2], ['C5', 2, 2], ['Bb4', 4, 4]],
    lull1: [['C5', 0, 3], ['A4', 3, 1], ['F4', 4, 4]],
    lull2: [['D5', 0, 3], ['C5', 3, 1], ['A4', 4, 4]],
  };
  const hookAt = (bar0, tr = 0) => [1, 2, 3, 4].flatMap((k, i) => placeBar(clock, HOOK[k], bar0 + i, tr));

  // ---------- events ----------
  const ev = {
    help: T(0, 2), // "help!" pops up
    flash: T(1, 2), // red-blue light sweeps over Dozzy (help is coming)
    shutter: T(2), // shutter starts rolling up
    wake: T(2, 2.5), // Siro opens his eyes
    wink: T(3), // the wink + title
    groove: T(4),
    trees: [T(5, 0), T(6, 2), T(7, 0)], // toy trees wave as Siro passes
    sos: T(8), // heart SOS pops on the dashboard
    siren: T(9), // the heart siren switches on
    bus: T(10, 0), // the bus pulls aside
    taxi: T(11, 0), // the taxi pulls aside
    thanks: T(11, 3), // Siro honks thank you
    medi: T(12), // Medi joins
    stop: T(14, 2), // they stop at the park
    doors: T(15), // Medi's doors open like wings
    bandage: T(15, 2),
    tuggo: T(16), // Tuggo backs in, beep beep
    hitch: T(16, 3), // the hook catches the rope
    heaves: [T(17, 0), T(17, 1), T(17, 2)],
    slip: T(17, 3), // the rope slips
    rush: T(18), // the town cars rush in
    pushes: [T(18, 2), T(19, 0), T(19, 1), T(19, 2)],
    breath: T(19, 3), // silence, everyone strains
    pop: T(20), // POP! the mud turns into bubbles
    wash: T(22), // bubble car-wash
    sunset: T(24),
    yawn: T(25),
    sleep: T(25, 2),
    end: T(26),
  };

  // melodies
  const musicbox = [
    ...placeBar(clock, HOOK.sad1, 0, 12), ...placeBar(clock, HOOK.sad2, 1, 12),
    ...placeBar(clock, HOOK[1], 2, 12), ...placeBar(clock, HOOK[2], 3, 12),
    ...placeBar(clock, HOOK.lull1, 24, 12), ...placeBar(clock, HOOK.lull2, 25, 12),
    { t: T(26), dur: 3, midi: m('F6') },
  ];
  const marimbaHook = [...hookAt(4), ...hookAt(20, 12)];
  const brassHook = [...hookAt(10), ...hookAt(20)];

  // ---------- named moments (render.js @name, verify) ----------
  const markers = {
    wink: { t: ev.wink, sync: 'a' },
    sos: { t: ev.sos, sync: 'av' },
    siren: { t: ev.siren, sync: 'av' },
    medi: { t: ev.medi, sync: 'v' },
    slip: ev.slip,
    breath: ev.breath,
    pop: { t: ev.pop, sync: 'av' },
    sunset: ev.sunset,
    end: ev.end,
  };

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, S, m, chords, chordAt, HOOK, ev, markers, musicbox, marimbaHook, brassHook };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
