import { CONFIG } from './config.js';
import { istGedrueckt, verbraucheFrisch, tickEnde } from './input.js';
import { Kaempfer } from './fighter.js';
import { CHARAKTERE, GEGNER_PFAD } from './characters.js';
import { kiEingabe, leereEingabe } from './ai.js';
import { wendePhysikAn, trenneKaempfer } from './physics.js';
import { verarbeiteKampf } from './combat.js';
import { zeichneStage, zeichneVordergrund } from './stage.js';
import { zeichneUI } from './ui.js';
import { spawnTrefferFunken, updatePartikel, zeichnePartikel, leerePartikel } from './particles.js';
import { spieleTreffer, spieleBlock, spieleKo, spieleGong } from './sound.js';

const canvas = document.getElementById('spiel');
const ctx = canvas.getContext('2d');

const START_X_SPIELER = 320;
const START_X_GEGNER = 640;

let gegnerIndex = 0; // Position auf dem Schattenpfad (bleibt über Kämpfe erhalten)
let spiel;
const kamera = { x: 0, shake: 0 };

function neuerKampf() {
  const gegnerDaten = CHARAKTERE[GEGNER_PFAD[gegnerIndex]];
  const naechsterName = GEGNER_PFAD[gegnerIndex + 1] ? CHARAKTERE[GEGNER_PFAD[gegnerIndex + 1]].name : null;
  spiel = {
    spieler: new Kaempfer(CHARAKTERE.juro, START_X_SPIELER, 1),
    gegner: new Kaempfer(gegnerDaten, START_X_GEGNER, -1),
    runde: 1,
    phase: 'intro', // intro → kampf → rundenEnde → (intro | matchEnde) → (neuer Kampf | pfadEnde)
    phasenZeit: 0,
    hitstop: 0,
    rundenSieger: null,
    matchSieger: null,
    spielerHatGewonnen: false,
    kampfNummer: gegnerIndex + 1,
    kampfAnzahl: GEGNER_PFAD.length,
    naechsterGegner: naechsterName,
    arena: gegnerDaten.arena ?? 'aschenpass',
  };
  kamera.x = 0;
  kamera.shake = 0;
  leerePartikel();
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

function update(dt) {
  if (verbraucheFrisch('KeyR')) {
    // Nach dem Pfad-Ende beginnt der ganze Pfad von vorn, sonst nur der aktuelle Kampf
    if (spiel.phase === 'pfadEnde') gegnerIndex = 0;
    neuerKampf();
    tickEnde();
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
    tickEnde();
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
    // Gewonnen → nach kurzer Pause automatisch zum nächsten Gegner auf dem Pfad
    if (spiel.spielerHatGewonnen && spiel.phasenZeit >= 3) {
      if (gegnerIndex < GEGNER_PFAD.length - 1) {
        gegnerIndex++;
        neuerKampf();
      } else {
        spiel.phase = 'pfadEnde';
        spiel.phasenZeit = 0;
      }
    }
    // Verloren → warten auf R (Revanche)
  }

  tickEnde();
}

function render() {
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

neuerKampf();
requestAnimationFrame(schleife);
