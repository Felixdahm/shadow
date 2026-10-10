// Keyframe-Posen und Interpolation.
// Eine Pose besteht aus Gelenkwinkeln (Radiant) plus hueftFaktor (wie hoch die Hüfte steht).
// v = vordere Gliedmaßen (in Blickrichtung), h = hintere.

const STAND = {
  rumpf: 0.08, kopf: 0.02,
  vSchulter: 0.55, vEllbogen: 1.9,
  hSchulter: 0.35, hEllbogen: 1.6,
  vHuefte: 0.28, vKnie: 0.25,
  hHuefte: -0.22, hKnie: 0.3,
  hueftFaktor: 0.97,
};

// Abkürzung: neue Pose = Standpose mit Änderungen
function p(aenderungen) {
  return { ...STAND, ...aenderungen };
}

const ATMEN = p({ hueftFaktor: 0.945, vSchulter: 0.63, hSchulter: 0.43, rumpf: 0.11 });

const SCHRITT_A = p({ vHuefte: 0.55, vKnie: 0.3, hHuefte: -0.45, hKnie: 0.6, vSchulter: 0.25, hSchulter: 0.6, hueftFaktor: 0.94 });
const SCHRITT_B = p({ vHuefte: -0.45, vKnie: 0.6, hHuefte: 0.55, hKnie: 0.3, vSchulter: 0.6, hSchulter: 0.25, hueftFaktor: 0.94 });

const SPRUNG = p({ vHuefte: 0.95, vKnie: 1.4, hHuefte: 0.35, hKnie: 1.1, vSchulter: 0.8, hSchulter: 0.5, rumpf: 0.15, hueftFaktor: 1 });

const DUCK = p({ hueftFaktor: 0.5, rumpf: 0.5, kopf: -0.25, vHuefte: 1.05, vKnie: 2.1, hHuefte: 0.6, hKnie: 1.7 });

const BLOCK = p({ vSchulter: 1.05, vEllbogen: 2.1, hSchulter: 0.85, hEllbogen: 2.25, hueftFaktor: 0.92, rumpf: 0.14, kopf: -0.1 });

// Schlag: ausholen → zustoßen → halten → zurück
const SCHLAG_AUSHOLEN = p({ vSchulter: 0.05, vEllbogen: 2.5, rumpf: -0.06, hueftFaktor: 0.95 });
const SCHLAG_TREFFEN = p({ vSchulter: 1.55, vEllbogen: 0.06, rumpf: 0.3, kopf: -0.1, hSchulter: 0.75, hEllbogen: 2.1, hueftFaktor: 0.93, vHuefte: 0.45, hHuefte: -0.35 });
const SCHLAG_HALTEN = p({ vSchulter: 1.35, vEllbogen: 0.4, rumpf: 0.22 });

// Tritt: Knie heben → Bein strecken → halten → zurück
const TRITT_HEBEN = p({ vHuefte: 1.25, vKnie: 1.9, rumpf: -0.12, hueftFaktor: 0.93, hHuefte: -0.12, hKnie: 0.2, vSchulter: 0.7, hSchulter: 0.2 });
const TRITT_TREFFEN = p({ vHuefte: 1.5, vKnie: 0.05, rumpf: -0.38, kopf: 0.15, hueftFaktor: 0.9, hHuefte: -0.2, hKnie: 0.25, vSchulter: 0.9, vEllbogen: 1.2, hSchulter: -0.3, hEllbogen: 1.0 });
const TRITT_HALTEN = p({ vHuefte: 1.3, vKnie: 0.5, rumpf: -0.25, hueftFaktor: 0.92 });

const TREFFER_POSE = p({ rumpf: -0.42, kopf: -0.35, vSchulter: 0.95, vEllbogen: 0.7, hSchulter: 0.5, hEllbogen: 0.4, vHuefte: 0.5, vKnie: 0.3, hHuefte: -0.4, hKnie: 0.5, hueftFaktor: 0.9 });

const KO_KNIEN = p({ hueftFaktor: 0.35, rumpf: -0.5, kopf: -0.5, vHuefte: 1.3, vKnie: 2.2, hHuefte: 0.8, hKnie: 2.0, vSchulter: 0.3, hSchulter: 0.2 });
const KO_LIEGEN = {
  rumpf: -1.5, kopf: -0.4,
  vSchulter: 0.6, vEllbogen: 0.3,
  hSchulter: 1.2, hEllbogen: 0.2,
  vHuefte: 1.5, vKnie: 0.15,
  hHuefte: 1.3, hKnie: 0.3,
  hueftFaktor: 0.14,
};

// Die Namen entsprechen den Kämpfer-Zuständen in fighter.js.
export const ANIMATIONEN = {
  stehen:   { dauer: 2.4,  loop: true,  frames: [{ t: 0, pose: STAND }, { t: 1.2, pose: ATMEN }, { t: 2.4, pose: STAND }] },
  laufen:   { dauer: 0.56, loop: true,  frames: [{ t: 0, pose: SCHRITT_A }, { t: 0.28, pose: SCHRITT_B }, { t: 0.56, pose: SCHRITT_A }] },
  springen: { dauer: 0.3,  loop: false, frames: [{ t: 0, pose: STAND }, { t: 0.15, pose: SPRUNG }] },
  ducken:   { dauer: 0.12, loop: false, frames: [{ t: 0, pose: STAND }, { t: 0.12, pose: DUCK }] },
  block:    { dauer: 0.1,  loop: false, frames: [{ t: 0, pose: STAND }, { t: 0.1, pose: BLOCK }] },
  schlag:   { dauer: 0.38, loop: false, frames: [{ t: 0, pose: STAND }, { t: 0.08, pose: SCHLAG_AUSHOLEN }, { t: 0.14, pose: SCHLAG_TREFFEN }, { t: 0.24, pose: SCHLAG_HALTEN }, { t: 0.38, pose: STAND }] },
  tritt:    { dauer: 0.52, loop: false, frames: [{ t: 0, pose: STAND }, { t: 0.12, pose: TRITT_HEBEN }, { t: 0.2, pose: TRITT_TREFFEN }, { t: 0.32, pose: TRITT_HALTEN }, { t: 0.52, pose: STAND }] },
  treffer:  { dauer: 0.3,  loop: false, frames: [{ t: 0, pose: STAND }, { t: 0.06, pose: TREFFER_POSE }, { t: 0.3, pose: STAND }] },
  ko:       { dauer: 0.7,  loop: false, frames: [{ t: 0, pose: TREFFER_POSE }, { t: 0.35, pose: KO_KNIEN }, { t: 0.7, pose: KO_LIEGEN }] },
};

// Weiches Ein-/Ausblenden zwischen zwei Keyframes (Smoothstep statt linear)
function glatt(t) {
  return t * t * (3 - 2 * t);
}

function mische(a, b, t) {
  const ergebnis = {};
  for (const key in a) {
    ergebnis[key] = a[key] + (b[key] - a[key]) * t;
  }
  return ergebnis;
}

export function poseZumZeitpunkt(name, zeit) {
  const anim = ANIMATIONEN[name];
  const frames = anim.frames;
  let t = anim.loop ? zeit % anim.dauer : zeit;

  if (t >= frames[frames.length - 1].t) return frames[frames.length - 1].pose;
  if (t <= frames[0].t) return frames[0].pose;

  let i = 0;
  while (t > frames[i + 1].t) i++;
  const u = (t - frames[i].t) / (frames[i + 1].t - frames[i].t);
  return mische(frames[i].pose, frames[i + 1].pose, glatt(u));
}
