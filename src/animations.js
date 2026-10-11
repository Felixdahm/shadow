// Keyframe-Posen und Interpolation.
// Eine Pose besteht aus Gelenkwinkeln (Radiant) plus hueftFaktor (wie hoch die Hüfte steht).
// v = vordere Gliedmaßen (in Blickrichtung), h = hintere.
//
// Jeder Keyframe kann eine Bewegungs-"Art" zum vorherigen Frame haben:
//   'weich'  — sanft beschleunigen und abbremsen (Standard)
//   'zack'   — explosiv losschnellen, sanft ankommen (für Schläge und Aufprall)
//   'linear' — gleichmäßig

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

// Laufzyklus in 4 Phasen: Bodenkontakt → Beine kreuzen (Hüfte hebt sich) → Kontakt → kreuzen.
// Das Auf und Ab der Hüfte gibt dem Gang Gewicht.
const LAUF_KONTAKT_A = p({ vHuefte: 0.55, vKnie: 0.25, hHuefte: -0.42, hKnie: 0.5, vSchulter: 0.2, hSchulter: 0.62, hueftFaktor: 0.92, rumpf: 0.12 });
const LAUF_MITTE_A   = p({ vHuefte: 0.08, vKnie: 0.95, hHuefte: -0.02, hKnie: 0.1, vSchulter: 0.42, hSchulter: 0.45, hueftFaktor: 0.975, rumpf: 0.09 });
const LAUF_KONTAKT_B = p({ vHuefte: -0.42, vKnie: 0.5, hHuefte: 0.55, hKnie: 0.25, vSchulter: 0.62, hSchulter: 0.2, hueftFaktor: 0.92, rumpf: 0.12 });
const LAUF_MITTE_B   = p({ vHuefte: -0.02, vKnie: 0.1, hHuefte: 0.08, hKnie: 0.95, vSchulter: 0.45, hSchulter: 0.42, hueftFaktor: 0.975, rumpf: 0.09 });

const DUCK = p({ hueftFaktor: 0.5, rumpf: 0.5, kopf: -0.25, vHuefte: 1.05, vKnie: 2.1, hHuefte: 0.6, hKnie: 1.7 });

const BLOCK = p({ vSchulter: 1.05, vEllbogen: 2.1, hSchulter: 0.85, hEllbogen: 2.25, hueftFaktor: 0.92, rumpf: 0.14, kopf: -0.1 });

// Schlag: tief ausholen → explosiv zustoßen → durchschwingen (Übersteuern) → zurückziehen
const SCHLAG_AUSHOLEN  = p({ vSchulter: -0.1, vEllbogen: 2.6, rumpf: -0.1, kopf: 0.08, hueftFaktor: 0.94, hHuefte: -0.3, hKnie: 0.45 });
const SCHLAG_TREFFEN   = p({ vSchulter: 1.55, vEllbogen: 0.06, rumpf: 0.3, kopf: -0.1, hSchulter: 0.75, hEllbogen: 2.1, hueftFaktor: 0.93, vHuefte: 0.45, hHuefte: -0.35 });
const SCHLAG_DURCHZUG  = p({ vSchulter: 1.72, vEllbogen: 0.18, rumpf: 0.36, kopf: -0.12, hSchulter: 0.8, hEllbogen: 2.0, hueftFaktor: 0.92, vHuefte: 0.5, hHuefte: -0.4 });
const SCHLAG_ZURUECK   = p({ vSchulter: 1.05, vEllbogen: 1.0, rumpf: 0.18, hueftFaktor: 0.95 });

// Schwert-Hieb: über den Kopf ausholen und nach vorn durchziehen
const HIEB_AUSHOLEN  = p({ vSchulter: 3.3, vEllbogen: -0.5, rumpf: -0.15, kopf: 0.1, hueftFaktor: 0.95, hHuefte: -0.35, hKnie: 0.45 });
const HIEB_TREFFEN   = p({ vSchulter: 1.3, vEllbogen: 0.1, rumpf: 0.4, kopf: -0.1, vHuefte: 0.55, hHuefte: -0.45, hueftFaktor: 0.9 });
const HIEB_DURCHZUG  = p({ vSchulter: 0.75, vEllbogen: 0.25, rumpf: 0.45, kopf: -0.12, hueftFaktor: 0.88 });

// Stab-Hieb: weit hinten ausholen und flach nach vorn fegen
const STAB_AUSHOLEN  = p({ vSchulter: -1.3, vEllbogen: 0.3, rumpf: -0.2, kopf: 0.1, hueftFaktor: 0.92 });
const STAB_TREFFEN   = p({ vSchulter: 1.55, vEllbogen: 0.05, rumpf: 0.3, kopf: -0.1, vHuefte: 0.5, hHuefte: -0.4, hueftFaktor: 0.9 });
const STAB_DURCHZUG  = p({ vSchulter: 2.1, vEllbogen: 0.15, rumpf: 0.2, hueftFaktor: 0.92 });

// Uppercut (↓+Schlag): aus der Hocke nach oben reißen — schleudert den Gegner hoch
const AUFWAERTS_LADEN   = p({ hueftFaktor: 0.6, rumpf: 0.35, vSchulter: -0.3, vEllbogen: 2.3, vHuefte: 0.9, vKnie: 1.6, hHuefte: 0.4, hKnie: 1.2 });
const AUFWAERTS_TREFFEN = p({ hueftFaktor: 1, rumpf: -0.2, kopf: -0.15, vSchulter: 2.6, vEllbogen: 0.3, vHuefte: 0.4, hHuefte: -0.35 });

// Sturmstoß (vorwärts+Schlag): Schulter voran nach vorn rammen
const STURM_LADEN   = p({ rumpf: -0.12, vSchulter: -0.4, vEllbogen: 1.6, hueftFaktor: 0.9 });
const STURM_TREFFEN = p({ rumpf: 0.45, kopf: -0.1, vSchulter: 1.2, vEllbogen: 0.6, vHuefte: 0.7, hHuefte: -0.6, hueftFaktor: 0.85 });

// Fegetritt (↓+Tritt): tief bleiben und das Bein flach durchziehen
const FEGE_LADEN   = p({ hueftFaktor: 0.55, rumpf: 0.4, vHuefte: 1.0, vKnie: 1.9, hHuefte: 0.5, hKnie: 1.5 });
const FEGE_TREFFEN = p({ hueftFaktor: 0.5, rumpf: 0.5, kopf: -0.2, vHuefte: 1.3, vKnie: 0.1, hHuefte: 0.6, hKnie: 1.6, vSchulter: 0.9, hSchulter: -0.3 });

// Drehschlag: Körper wickelt sich vom Gegner WEG ein und peitscht dann mit
// vollem Schwung herum — die große Rotation macht ihn kinoreif lesbar
const DREH_EINWICKELN = p({ rumpf: -0.45, kopf: 0.5, vSchulter: -1.4, vEllbogen: 1.2, hSchulter: -0.6, hEllbogen: 1.8, vHuefte: 0.15, hHuefte: -0.5, hKnie: 0.6, hueftFaktor: 0.88 });
const DREH_TREFFEN    = p({ rumpf: 0.5, kopf: -0.2, vSchulter: 1.75, vEllbogen: 0.05, hSchulter: 0.3, hEllbogen: 1.6, vHuefte: 0.7, hHuefte: -0.75, hKnie: 0.2, hueftFaktor: 0.85 });
const DREH_DURCHZUG   = p({ rumpf: 0.55, kopf: -0.22, vSchulter: 2.0, vEllbogen: 0.15, vHuefte: 0.75, hHuefte: -0.8, hueftFaktor: 0.84 });

// Zweiter Schlag der Kombo: die HINTERE Faust stößt vor (Haken) —
// so wechseln die Arme sichtbar ab, statt denselben Schlag zu wiederholen.
const SCHLAG2_AUSHOLEN = p({ hSchulter: -0.15, hEllbogen: 2.6, vSchulter: 0.7, vEllbogen: 2.0, rumpf: -0.08, hueftFaktor: 0.94 });
const SCHLAG2_TREFFEN  = p({ hSchulter: 1.6, hEllbogen: 0.05, vSchulter: 0.5, vEllbogen: 2.1, rumpf: 0.32, kopf: -0.1, hueftFaktor: 0.93, vHuefte: 0.5, hHuefte: -0.3 });
const SCHLAG2_DURCHZUG = p({ hSchulter: 1.75, hEllbogen: 0.18, vSchulter: 0.55, vEllbogen: 2.0, rumpf: 0.38, kopf: -0.12, hueftFaktor: 0.92 });
const SCHLAG2_ZURUECK  = p({ hSchulter: 0.9, hEllbogen: 1.2, rumpf: 0.16 });

// Tritt: Knie anheben → explosiv strecken → durchschwingen → Knie wieder anwinkeln
const TRITT_HEBEN     = p({ vHuefte: 1.25, vKnie: 1.9, rumpf: -0.12, hueftFaktor: 0.93, hHuefte: -0.12, hKnie: 0.2, vSchulter: 0.7, hSchulter: 0.2 });
const TRITT_TREFFEN   = p({ vHuefte: 1.5, vKnie: 0.05, rumpf: -0.38, kopf: 0.15, hueftFaktor: 0.9, hHuefte: -0.2, hKnie: 0.25, vSchulter: 0.9, vEllbogen: 1.2, hSchulter: -0.3, hEllbogen: 1.0 });
const TRITT_DURCHZUG  = p({ vHuefte: 1.58, vKnie: 0.2, rumpf: -0.44, kopf: 0.18, hueftFaktor: 0.89, hHuefte: -0.22, hKnie: 0.28, vSchulter: 0.95, vEllbogen: 1.1, hSchulter: -0.35, hEllbogen: 0.95 });
const TRITT_ZURUECK   = p({ vHuefte: 1.05, vKnie: 1.55, rumpf: -0.18, hueftFaktor: 0.93, hHuefte: -0.1, hKnie: 0.2, vSchulter: 0.65, hSchulter: 0.1 });

// Spezialangriff "Schattenstoß": tief sammeln → mit einem Dash explosiv durchstoßen
const SPEZIAL_SAMMELN  = p({ vSchulter: -0.35, vEllbogen: 2.7, hSchulter: -0.25, hEllbogen: 2.4, rumpf: -0.18, kopf: 0.1, hueftFaktor: 0.82, vHuefte: 0.7, vKnie: 1.0, hHuefte: -0.45, hKnie: 0.7 });
const SPEZIAL_STOSS    = p({ vSchulter: 1.65, vEllbogen: 0.02, hSchulter: -0.5, hEllbogen: 0.6, rumpf: 0.5, kopf: -0.15, hueftFaktor: 0.78, vHuefte: 1.0, vKnie: 0.5, hHuefte: -0.9, hKnie: 0.1 });
const SPEZIAL_DURCHZUG = p({ vSchulter: 1.8, vEllbogen: 0.15, hSchulter: -0.55, hEllbogen: 0.6, rumpf: 0.55, kopf: -0.15, hueftFaktor: 0.76, vHuefte: 1.05, vKnie: 0.55, hHuefte: -0.95, hKnie: 0.12 });

// Enge Kugel für Rolle und Salto — die eigentliche Drehung macht fighter.js
// über eine Canvas-Rotation um den Körpermittelpunkt.
const BALL = p({
  rumpf: 0.9, kopf: 0.5,
  vSchulter: 1.3, vEllbogen: 2.4, hSchulter: 1.1, hEllbogen: 2.3,
  vHuefte: 1.5, vKnie: 2.4, hHuefte: 1.2, hKnie: 2.2,
  hueftFaktor: 0.55,
});

// Flugkick: Bein nach vorn gestreckt, Körper leicht zurückgelehnt
const LUFT_TRITT = p({
  vHuefte: 1.35, vKnie: 0.1, hHuefte: -0.5, hKnie: 1.3,
  rumpf: -0.3, kopf: 0.1,
  vSchulter: 0.8, vEllbogen: 1.3, hSchulter: -0.2, hEllbogen: 0.8,
  hueftFaktor: 1,
});

// Luftschlag: kurzer Fausthieb im Flug, Beine angezogen
const LUFT_SCHLAG = p({
  vSchulter: 1.5, vEllbogen: 0.1, hSchulter: 0.4, hEllbogen: 1.6,
  rumpf: 0.15, vHuefte: 0.9, vKnie: 1.3, hHuefte: 0.3, hKnie: 1.1, hueftFaktor: 1,
});

// Sturztritt: Bein diagonal nach unten gerammt, Arme hochgerissen
const STURZ_TRITT = p({
  vHuefte: 0.6, vKnie: 0.02, hHuefte: 1.3, hKnie: 1.8,
  rumpf: 0.35, kopf: -0.1,
  vSchulter: 2.2, vEllbogen: 0.3, hSchulter: 1.0, hEllbogen: 1.2, hueftFaktor: 1,
});

// Wurf: nach vorn greifen, dann den Gegner über die Schulter schleudern
const WURF_GREIFEN = p({ vSchulter: 1.2, vEllbogen: 0.4, hSchulter: 1.0, hEllbogen: 0.5, rumpf: 0.35, hueftFaktor: 0.88, vHuefte: 0.5, hHuefte: -0.4 });
const WURF_SCHLEUDERN = p({ vSchulter: -0.4, vEllbogen: 0.3, hSchulter: -0.6, hEllbogen: 0.4, rumpf: -0.25, kopf: -0.2, hueftFaktor: 0.92, vHuefte: 0.3, hHuefte: -0.5 });

// Treffer-Reaktion mit leichtem Zurückfedern
const TREFFER_POSE = p({ rumpf: -0.42, kopf: -0.35, vSchulter: 0.95, vEllbogen: 0.7, hSchulter: 0.5, hEllbogen: 0.4, vHuefte: 0.5, vKnie: 0.3, hHuefte: -0.4, hKnie: 0.5, hueftFaktor: 0.9 });
const TREFFER_FEDERN = p({ rumpf: -0.15, kopf: -0.12, vSchulter: 0.8, vEllbogen: 1.2, hSchulter: 0.45, hEllbogen: 1.0, hueftFaktor: 0.93 });

const KO_KNIEN = p({ hueftFaktor: 0.35, rumpf: -0.5, kopf: -0.5, vHuefte: 1.3, vKnie: 2.2, hHuefte: 0.8, hKnie: 2.0, vSchulter: 0.3, hSchulter: 0.2 });
const KO_LIEGEN = {
  rumpf: -1.5, kopf: -0.4,
  vSchulter: 0.6, vEllbogen: 0.3,
  hSchulter: 1.2, hEllbogen: 0.2,
  vHuefte: 1.5, vKnie: 0.15,
  hHuefte: 1.3, hKnie: 0.3,
  hueftFaktor: 0.14,
};

// Sprungposen: beim Steigen zieht der Körper die Beine an,
// beim Fallen strecken sie sich dem Boden entgegen.
const SPRUNG_HOCH = p({
  vHuefte: 1.0, vKnie: 1.5, hHuefte: 0.4, hKnie: 1.2,
  vSchulter: 0.9, vEllbogen: 1.4, hSchulter: 0.55, hEllbogen: 1.2,
  rumpf: 0.18, hueftFaktor: 1,
});
const SPRUNG_RUNTER = p({
  vHuefte: 0.55, vKnie: 0.5, hHuefte: -0.15, hKnie: 0.55,
  vSchulter: 1.2, vEllbogen: 0.9, hSchulter: 0.9, hEllbogen: 0.7,
  rumpf: -0.05, hueftFaktor: 1,
});

// Die Namen entsprechen den Kämpfer-Zuständen in fighter.js.
// ('springen' wird nicht über Keyframes animiert, sondern über sprungPose(vy).)
export const ANIMATIONEN = {
  stehen: { dauer: 2.4, loop: true, frames: [
    { t: 0, pose: STAND }, { t: 1.2, pose: ATMEN }, { t: 2.4, pose: STAND },
  ] },
  laufen: { dauer: 0.6, loop: true, frames: [
    { t: 0, pose: LAUF_KONTAKT_A },
    { t: 0.15, pose: LAUF_MITTE_B },
    { t: 0.3, pose: LAUF_KONTAKT_B },
    { t: 0.45, pose: LAUF_MITTE_A },
    { t: 0.6, pose: LAUF_KONTAKT_A },
  ] },
  ducken: { dauer: 0.12, loop: false, frames: [
    { t: 0, pose: STAND }, { t: 0.12, pose: DUCK },
  ] },
  block: { dauer: 0.1, loop: false, frames: [
    { t: 0, pose: STAND }, { t: 0.1, pose: BLOCK },
  ] },
  schlag: { dauer: 0.38, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.08, pose: SCHLAG_AUSHOLEN, art: 'weich' },
    { t: 0.13, pose: SCHLAG_TREFFEN, art: 'zack' },
    { t: 0.2, pose: SCHLAG_DURCHZUG, art: 'weich' },
    { t: 0.28, pose: SCHLAG_ZURUECK, art: 'weich' },
    { t: 0.38, pose: STAND, art: 'weich' },
  ] },
  hieb_schwert: { dauer: 0.46, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.14, pose: HIEB_AUSHOLEN, art: 'weich' },
    { t: 0.2, pose: HIEB_TREFFEN, art: 'zack' },
    { t: 0.32, pose: HIEB_DURCHZUG, art: 'weich' },
    { t: 0.46, pose: STAND, art: 'weich' },
  ] },
  hieb_stab: { dauer: 0.5, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.15, pose: STAB_AUSHOLEN, art: 'weich' },
    { t: 0.22, pose: STAB_TREFFEN, art: 'zack' },
    { t: 0.34, pose: STAB_DURCHZUG, art: 'weich' },
    { t: 0.5, pose: STAND, art: 'weich' },
  ] },
  hieb_dolch: { dauer: 0.3, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.06, pose: SCHLAG_AUSHOLEN, art: 'weich' },
    { t: 0.1, pose: SCHLAG_TREFFEN, art: 'zack' },
    { t: 0.2, pose: SCHLAG_ZURUECK, art: 'weich' },
    { t: 0.3, pose: STAND, art: 'weich' },
  ] },
  aufwaerts: { dauer: 0.42, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.1, pose: AUFWAERTS_LADEN, art: 'weich' },
    { t: 0.16, pose: AUFWAERTS_TREFFEN, art: 'zack' },
    { t: 0.28, pose: AUFWAERTS_TREFFEN, art: 'weich' },
    { t: 0.42, pose: STAND, art: 'weich' },
  ] },
  sturm: { dauer: 0.44, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.12, pose: STURM_LADEN, art: 'weich' },
    { t: 0.18, pose: STURM_TREFFEN, art: 'zack' },
    { t: 0.3, pose: STURM_TREFFEN, art: 'weich' },
    { t: 0.44, pose: STAND, art: 'weich' },
  ] },
  fege: { dauer: 0.46, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.1, pose: FEGE_LADEN, art: 'weich' },
    { t: 0.17, pose: FEGE_TREFFEN, art: 'zack' },
    { t: 0.28, pose: FEGE_TREFFEN, art: 'weich' },
    { t: 0.46, pose: STAND, art: 'weich' },
  ] },
  dreh: { dauer: 0.7, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.24, pose: DREH_EINWICKELN, art: 'weich' },
    { t: 0.34, pose: DREH_TREFFEN, art: 'zack' },
    { t: 0.46, pose: DREH_DURCHZUG, art: 'weich' },
    { t: 0.58, pose: SCHLAG_ZURUECK, art: 'weich' },
    { t: 0.7, pose: STAND, art: 'weich' },
  ] },
  schlag2: { dauer: 0.38, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.08, pose: SCHLAG2_AUSHOLEN, art: 'weich' },
    { t: 0.13, pose: SCHLAG2_TREFFEN, art: 'zack' },
    { t: 0.2, pose: SCHLAG2_DURCHZUG, art: 'weich' },
    { t: 0.28, pose: SCHLAG2_ZURUECK, art: 'weich' },
    { t: 0.38, pose: STAND, art: 'weich' },
  ] },
  tritt: { dauer: 0.52, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.1, pose: TRITT_HEBEN, art: 'weich' },
    { t: 0.19, pose: TRITT_TREFFEN, art: 'zack' },
    { t: 0.27, pose: TRITT_DURCHZUG, art: 'weich' },
    { t: 0.38, pose: TRITT_ZURUECK, art: 'weich' },
    { t: 0.52, pose: STAND, art: 'weich' },
  ] },
  rolle: { dauer: 0.45, loop: false, frames: [
    { t: 0, pose: STAND }, { t: 0.08, pose: BALL, art: 'zack' }, { t: 0.37, pose: BALL }, { t: 0.45, pose: STAND, art: 'weich' },
  ] },
  salto: { dauer: 0.72, loop: false, frames: [
    { t: 0, pose: STAND }, { t: 0.1, pose: BALL, art: 'zack' }, { t: 0.55, pose: BALL }, { t: 0.72, pose: STAND, art: 'weich' },
  ] },
  luftTritt: { dauer: 0.5, loop: false, frames: [
    { t: 0, pose: BALL }, { t: 0.08, pose: LUFT_TRITT, art: 'zack' }, { t: 0.5, pose: LUFT_TRITT },
  ] },
  luftSchlag: { dauer: 0.35, loop: false, frames: [
    { t: 0, pose: BALL }, { t: 0.06, pose: LUFT_SCHLAG, art: 'zack' }, { t: 0.22, pose: LUFT_SCHLAG }, { t: 0.35, pose: BALL, art: 'weich' },
  ] },
  sturzTritt: { dauer: 0.9, loop: false, frames: [
    { t: 0, pose: BALL }, { t: 0.07, pose: STURZ_TRITT, art: 'zack' }, { t: 0.9, pose: STURZ_TRITT },
  ] },
  wurf: { dauer: 0.55, loop: false, frames: [
    { t: 0, pose: STAND }, { t: 0.18, pose: WURF_GREIFEN, art: 'weich' }, { t: 0.3, pose: WURF_SCHLEUDERN, art: 'zack' }, { t: 0.55, pose: STAND, art: 'weich' },
  ] },
  // Charakter-eigene Spezialangriffe (die Zeiten strecken sich automatisch
  // auf die Dauer aus CONFIG.spezialArten — siehe fighter.zeichne)
  spezial_stoss: { dauer: 0.6, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.14, pose: SPEZIAL_SAMMELN, art: 'weich' },
    { t: 0.28, pose: SPEZIAL_STOSS, art: 'zack' },
    { t: 0.42, pose: SPEZIAL_DURCHZUG, art: 'weich' },
    { t: 0.6, pose: STAND, art: 'weich' },
  ] },
  spezial_beben: { dauer: 0.85, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.3, pose: p({ vSchulter: 3.1, hSchulter: 2.9, vEllbogen: -0.3, hEllbogen: -0.3, rumpf: -0.2, hueftFaktor: 1 }), art: 'weich' },
    { t: 0.42, pose: p({ vSchulter: 0.4, hSchulter: 0.2, vEllbogen: 0.3, hEllbogen: 0.3, rumpf: 0.55, kopf: -0.2, hueftFaktor: 0.5, vHuefte: 1.0, vKnie: 1.8, hHuefte: 0.5, hKnie: 1.4 }), art: 'zack' },
    { t: 0.6, pose: p({ vSchulter: 0.4, hSchulter: 0.2, rumpf: 0.5, hueftFaktor: 0.55, vHuefte: 1.0, vKnie: 1.8 }), art: 'weich' },
    { t: 0.85, pose: STAND, art: 'weich' },
  ] },
  spezial_wirbel: { dauer: 0.8, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.22, pose: STAB_AUSHOLEN, art: 'weich' },
    { t: 0.34, pose: STAB_TREFFEN, art: 'zack' },
    { t: 0.48, pose: STAB_DURCHZUG, art: 'zack' },
    { t: 0.62, pose: p({ vSchulter: 2.6, vEllbogen: 0.1, rumpf: -0.1, hueftFaktor: 0.92 }), art: 'weich' },
    { t: 0.8, pose: STAND, art: 'weich' },
  ] },
  spezial_tanz: { dauer: 0.6, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.12, pose: SPEZIAL_SAMMELN, art: 'weich' },
    { t: 0.22, pose: p({ vSchulter: 1.5, vEllbogen: 0.05, hSchulter: -0.6, rumpf: 0.55, kopf: -0.15, hueftFaktor: 0.72, vHuefte: 1.1, hHuefte: -1.0, hKnie: 0.1 }), art: 'zack' },
    { t: 0.44, pose: p({ vSchulter: 1.6, vEllbogen: 0.1, hSchulter: -0.65, rumpf: 0.58, hueftFaktor: 0.7, vHuefte: 1.15, hHuefte: -1.05 }), art: 'weich' },
    { t: 0.6, pose: STAND, art: 'weich' },
  ] },
  spezial_sturz: { dauer: 1.0, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.4, pose: HIEB_AUSHOLEN, art: 'weich' },
    { t: 0.55, pose: HIEB_TREFFEN, art: 'zack' },
    { t: 0.7, pose: p({ vSchulter: 0.6, vEllbogen: 0.2, rumpf: 0.5, kopf: -0.15, hueftFaktor: 0.7, vHuefte: 0.8, vKnie: 1.0 }), art: 'weich' },
    { t: 1.0, pose: STAND, art: 'weich' },
  ] },
  // Schattenschritt des Endbosses: kurz sammeln, verschwinden, wieder auftauchen
  schatten: { dauer: 0.4, loop: false, frames: [
    { t: 0, pose: STAND }, { t: 0.15, pose: SPEZIAL_SAMMELN, art: 'weich' }, { t: 0.4, pose: STAND, art: 'weich' },
  ] },
  treffer: { dauer: 0.3, loop: false, frames: [
    { t: 0, pose: STAND },
    { t: 0.05, pose: TREFFER_POSE, art: 'zack' },
    { t: 0.16, pose: TREFFER_FEDERN, art: 'weich' },
    { t: 0.3, pose: STAND, art: 'weich' },
  ] },
  // Niederschlag: zu Boden gehen, kurz liegen bleiben, wieder hochkommen
  liegen: { dauer: 0.9, loop: false, frames: [
    { t: 0, pose: TREFFER_POSE },
    { t: 0.22, pose: KO_LIEGEN, art: 'zack' },
    { t: 0.58, pose: KO_LIEGEN },
    { t: 0.78, pose: KO_KNIEN, art: 'weich' },
    { t: 0.9, pose: STAND, art: 'weich' },
  ] },
  ko: { dauer: 0.75, loop: false, frames: [
    { t: 0, pose: TREFFER_POSE },
    { t: 0.3, pose: KO_KNIEN, art: 'weich' },
    { t: 0.55, pose: KO_LIEGEN, art: 'zack' },
    { t: 0.75, pose: KO_LIEGEN, art: 'weich' },
  ] },
};

// ---------- Interpolation ----------

// Sanft beschleunigen und abbremsen (Smoothstep)
export function weich(t) {
  return t * t * (3 - 2 * t);
}

// Explosiv losschnellen, sanft ankommen (Ease-Out, Kubik)
function zack(t) {
  const u = 1 - t;
  return 1 - u * u * u;
}

function kurve(t, art) {
  if (art === 'zack') return zack(t);
  if (art === 'linear') return t;
  return weich(t);
}

export function mischePosen(a, b, t) {
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
  return mischePosen(frames[i].pose, frames[i + 1].pose, kurve(u, frames[i + 1].art));
}

// Sprungpose abhängig von der vertikalen Geschwindigkeit:
// steigt der Kämpfer (vy negativ), sind die Beine angezogen; fällt er, strecken sie sich.
export function sprungPose(vy) {
  const t = Math.min(1, Math.max(0, (vy + 500) / 1000));
  return mischePosen(SPRUNG_HOCH, SPRUNG_RUNTER, weich(t));
}
