import { CONFIG } from './config.js';
import { istGedrueckt, verbraucheFrisch, tickEnde } from './input.js';
import { Kaempfer } from './fighter.js';
import { kiEingabe, leereEingabe } from './ai.js';
import { wendePhysikAn, trenneKaempfer } from './physics.js';
import { verarbeiteKampf } from './combat.js';
import { zeichneStage } from './stage.js';
import { zeichneUI } from './ui.js';

const canvas = document.getElementById('spiel');
const ctx = canvas.getContext('2d');

let spiel;

function neustart() {
  spiel = {
    spieler: new Kaempfer('Juro', 320, 1),
    gegner: new Kaempfer('Scharr', 640, -1),
    zeit: 0,
    vorbei: false,
    sieger: null,
  };
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
  spiel.zeit += dt;

  if (verbraucheFrisch('KeyR')) {
    neustart();
    return;
  }

  const { spieler, gegner } = spiel;

  // Nach dem K.O. nimmt niemand mehr Eingaben an
  spieler.update(dt, spiel.vorbei ? leereEingabe() : spielerEingabe(), gegner);
  gegner.update(dt, spiel.vorbei ? leereEingabe() : kiEingabe(gegner, spieler, dt), spieler);

  wendePhysikAn(spieler, dt);
  wendePhysikAn(gegner, dt);
  trenneKaempfer(spieler, gegner);

  if (!spiel.vorbei) {
    verarbeiteKampf(spieler, gegner);
    if (!spieler.lebt() || !gegner.lebt()) {
      spiel.vorbei = true;
      spiel.sieger = spieler.lebt() ? spieler.name : gegner.name;
    }
  }

  tickEnde();
}

function render() {
  zeichneStage(ctx);
  spiel.gegner.zeichne(ctx);
  spiel.spieler.zeichne(ctx);
  zeichneUI(ctx, spiel);
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

neustart();
requestAnimationFrame(schleife);
