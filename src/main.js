import { CONFIG } from './config.js';
import { istGedrueckt, verbraucheFrisch, tickEnde } from './input.js';
import { Kaempfer } from './fighter.js';
import { CHARAKTERE, GEGNER_PFAD, STORY } from './characters.js';
import { kiEingabe, leereEingabe } from './ai.js';
import { wendePhysikAn, trenneKaempfer } from './physics.js';
import { verarbeiteKampf } from './combat.js';
import { zeichneStage, zeichneVordergrund } from './stage.js';
import { zeichneUI, zeichneMenue, zeichneStory, zeichneGegnerWahl } from './ui.js';
import { spawnTrefferFunken, updatePartikel, zeichnePartikel, leerePartikel } from './particles.js';
import { spieleTreffer, spieleBlock, spieleKo, spieleGong } from './sound.js';

const canvas = document.getElementById('spiel');
const ctx = canvas.getContext('2d');

const START_X_SPIELER = 320;
const START_X_GEGNER = 640;

// Oberster Spielzustand: Menü → (Story-Text) → Kampf → zurück
let modus = 'menue'; // 'menue' | 'gegnerWahl' | 'story' | 'kampf'
let menueIndex = 0;  // gewählter Menüeintrag
let wahlIndex = 0;   // gewählter Gegner im freien Kampf
let menueZeit = 0;   // für Atem-Animationen im Menü
let gegnerIndex = 0; // Position auf dem Schattenpfad
let storyModus = true;
let spiel = null;

const kamera = { x: 0, shake: 0 };

function neuerKampf() {
  const gegnerDaten = CHARAKTERE[GEGNER_PFAD[gegnerIndex]];
  const naechsterName = GEGNER_PFAD[gegnerIndex + 1] ? CHARAKTERE[GEGNER_PFAD[gegnerIndex + 1]].name : null;
  spiel = {
    spieler: new Kaempfer(CHARAKTERE.juro, START_X_SPIELER, 1),
    gegner: new Kaempfer(gegnerDaten, START_X_GEGNER, -1),
    runde: 1,
    phase: 'intro', // intro → kampf → rundenEnde → (intro | matchEnde) → (weiter | pfadEnde)
    phasenZeit: 0,
    hitstop: 0,
    rundenSieger: null,
    matchSieger: null,
    spielerHatGewonnen: false,
    kampfNummer: gegnerIndex + 1,
    kampfAnzahl: GEGNER_PFAD.length,
    naechsterGegner: naechsterName,
    arena: gegnerDaten.arena ?? 'aschenpass',
    storyModus,
  };
  kamera.x = 0;
  kamera.shake = 0;
  leerePartikel();
  modus = 'kampf';
}

function zumMenue() {
  modus = 'menue';
  spiel = null;
}

function naechsteRunde() {
  spiel.runde++;
  spiel.spieler.neueRunde(START_X_SPIELER, 1);
  spiel.gegner.neueRunde(START_X_GEGNER, -1);
  spiel.phase = 'intro';
  spiel.phasenZeit = 0;
  leerePartikel();
}

function spielerEingabe() {
  return {
    links: istGedrueckt('ArrowLeft'),
    rechts: istGedrueckt('ArrowRight'),
    ducken: istGedrueckt('ArrowDown'),
    block: istGedrueckt('KeyD'),
    springen: verbraucheFrisch('ArrowUp'),
    schlag: verbraucheFrisch('KeyA'),
    tritt: verbraucheFrisch('KeyS'),
  };
}

// ---------- Menü- und Story-Logik ----------

function updateMenue() {
  if (verbraucheFrisch('ArrowUp')) menueIndex = (menueIndex + 1) % 2;
  if (verbraucheFrisch('ArrowDown')) menueIndex = (menueIndex + 1) % 2;
  if (verbraucheFrisch('Enter')) {
    if (menueIndex === 0) {
      storyModus = true;
      gegnerIndex = 0;
      modus = 'story';
    } else {
      modus = 'gegnerWahl';
    }
  }
}

function updateGegnerWahl() {
  if (verbraucheFrisch('ArrowLeft')) wahlIndex = (wahlIndex + GEGNER_PFAD.length - 1) % GEGNER_PFAD.length;
  if (verbraucheFrisch('ArrowRight')) wahlIndex = (wahlIndex + 1) % GEGNER_PFAD.length;
  if (verbraucheFrisch('Enter')) {
    storyModus = false;
    gegnerIndex = wahlIndex;
    neuerKampf();
  }
  if (verbraucheFrisch('Escape')) zumMenue();
}

function updateStory() {
  if (verbraucheFrisch('Enter')) neuerKampf();
  if (verbraucheFrisch('Escape')) zumMenue();
}

// ---------- Kampf-Logik ----------

function updateKampf(dt) {
  if (verbraucheFrisch('Escape')) {
    zumMenue();
    return;
  }
  if (verbraucheFrisch('KeyR')) {
    if (spiel.phase === 'pfadEnde') { gegnerIndex = 0; zumMenue(); } else neuerKampf();
    return;
  }
  if (spiel.phase === 'pfadEnde' && verbraucheFrisch('Enter')) {
    gegnerIndex = 0;
    zumMenue();
    return;
  }

  spiel.phasenZeit += dt;

  // Kamera folgt sanft der Mitte zwischen beiden Kämpfern
  const G = CONFIG.gefuehl;
  const mitte = (spiel.spieler.x + spiel.gegner.x) / 2;
  let zielX = (mitte - CONFIG.canvas.breite / 2) * G.kameraFolgen;
  zielX = Math.max(-G.kameraMaxX, Math.min(G.kameraMaxX, zielX));
  kamera.x += (zielX - kamera.x) * Math.min(1, 3 * dt);
  kamera.shake *= Math.exp(-7 * dt);

  // Hitstop: die Welt friert für einen Wimpernschlag ein, das macht Treffer wuchtig
  if (spiel.hitstop > 0) {
    spiel.hitstop -= dt;
    return;
  }

  const { spieler, gegner } = spiel;
  const kampfAktiv = spiel.phase === 'kampf';

  spieler.update(dt, kampfAktiv ? spielerEingabe() : leereEingabe(), gegner);
  gegner.update(dt, kampfAktiv ? kiEingabe(gegner, spieler, dt) : leereEingabe(), spieler);

  wendePhysikAn(spieler, dt);
  wendePhysikAn(gegner, dt);
  trenneKaempfer(spieler, gegner);
  updatePartikel(dt);

  if (spiel.phase === 'intro') {
    if (spiel.phasenZeit >= CONFIG.runden.introDauer) {
      spiel.phase = 'kampf';
      spiel.phasenZeit = 0;
      spieleGong();
    }
  } else if (kampfAktiv) {
    const ereignisse = verarbeiteKampf(spieler, gegner);
    for (const e of ereignisse) {
      spawnTrefferFunken(e.x, e.y, e.richtung, e.blockt, e.ko);
      spiel.hitstop = e.ko ? G.hitstopKo : e.blockt ? G.hitstopBlock : G.hitstopTreffer;
      kamera.shake = Math.max(kamera.shake, e.ko ? G.shakeKo : e.blockt ? G.shakeBlock : G.shakeTreffer);
      if (e.ko) spieleKo();
      else if (e.blockt) spieleBlock();
      else spieleTreffer();
    }

    if (!spieler.lebt() || !gegner.lebt()) {
      const sieger = spieler.lebt() ? spieler : gegner;
      sieger.rundenSiege++;
      spiel.rundenSieger = sieger.name;
      spiel.phase = 'rundenEnde';
      spiel.phasenZeit = 0;
    }
  } else if (spiel.phase === 'rundenEnde') {
    if (spiel.phasenZeit >= CONFIG.runden.rundenEndeDauer) {
      const noetig = CONFIG.runden.gewinneNoetig;
      const matchSieger =
        spieler.rundenSiege >= noetig ? spieler :
        gegner.rundenSiege >= noetig ? gegner : null;
      if (matchSieger) {
        spiel.matchSieger = matchSieger.name;
        spiel.spielerHatGewonnen = matchSieger === spieler;
        spiel.phase = 'matchEnde';
        spiel.phasenZeit = 0;
        spieleGong();
      } else {
        naechsteRunde();
      }
    }
  } else if (spiel.phase === 'matchEnde') {
    // Story-Modus: Nach dem Sieg geht es mit dem nächsten Story-Text weiter
    if (spiel.storyModus && spiel.spielerHatGewonnen && spiel.phasenZeit >= 3) {
      if (gegnerIndex < GEGNER_PFAD.length - 1) {
        gegnerIndex++;
        modus = 'story';
      } else {
        spiel.phase = 'pfadEnde';
        spiel.phasenZeit = 0;
      }
    }
    // Freier Kampf oder Niederlage: R für Revanche, Esc für das Menü
  }
}

function update(dt) {
  menueZeit += dt;
  if (modus === 'menue') updateMenue();
  else if (modus === 'gegnerWahl') updateGegnerWahl();
  else if (modus === 'story') updateStory();
  else updateKampf(dt);
  tickEnde();
}

// ---------- Zeichnen ----------

function renderKampf() {
  // Kamerawackeln: kleiner Zufalls-Versatz, der schnell abklingt
  const jitterX = (Math.random() * 2 - 1) * kamera.shake;
  const jitterY = (Math.random() * 2 - 1) * kamera.shake * 0.6;

  ctx.save();
  ctx.translate(jitterX, jitterY);

  zeichneStage(ctx, kamera.x, spiel.arena); // Hintergrund-Ebenen mit Parallax

  ctx.save();
  ctx.translate(-kamera.x, 0); // Welt-Ebene: Kämpfer und Partikel
  spiel.gegner.zeichne(ctx);
  spiel.spieler.zeichne(ctx);
  zeichnePartikel(ctx);
  ctx.restore();

  zeichneVordergrund(ctx, kamera.x, spiel.arena); // Felsen vor den Kämpfern

  ctx.restore();

  zeichneUI(ctx, spiel); // UI wackelt nicht mit
}

function renderMenue() {
  // Passende Arena als lebendiger Hintergrund, Kamera driftet langsam
  const arena =
    modus === 'gegnerWahl' ? CHARAKTERE[GEGNER_PFAD[wahlIndex]].arena :
    modus === 'story' ? CHARAKTERE[GEGNER_PFAD[gegnerIndex]].arena :
    'aschenpass';
  const drift = Math.sin(menueZeit * 0.25) * 60;

  zeichneStage(ctx, drift, arena);
  zeichneVordergrund(ctx, drift, arena);

  if (modus === 'menue') zeichneMenue(ctx, menueIndex, menueZeit);
  else if (modus === 'story') zeichneStory(ctx, STORY[GEGNER_PFAD[gegnerIndex]]);
  else zeichneGegnerWahl(ctx, CHARAKTERE[GEGNER_PFAD[wahlIndex]], menueZeit);
}

function render() {
  if (modus === 'kampf') renderKampf();
  else renderMenue();
}

// Fester Zeitschritt: Die Simulation läuft immer mit 120 Schritten pro Sekunde,
// egal ob der Bildschirm 60 Hz oder 120 Hz hat. Übrige Zeit wird angespart.
const SCHRITT = 1 / 120;
let letzteZeit = performance.now();
let angespart = 0;

function schleife(jetzt) {
  angespart += Math.min((jetzt - letzteZeit) / 1000, 0.1);
  letzteZeit = jetzt;

  while (angespart >= SCHRITT) {
    update(SCHRITT);
    angespart -= SCHRITT;
  }

  render();
  requestAnimationFrame(schleife);
}

requestAnimationFrame(schleife);
