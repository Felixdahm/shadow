import { CONFIG } from './config.js';
import { istGedrueckt, verbraucheFrisch, tickEnde, aktiviereTouch, istTouchAktiv, verbraucheTap } from './input.js';
import { Kaempfer } from './fighter.js';
import { CHARAKTERE, GEGNER_PFAD, STORY, WAFFEN_LADEN, STIL_LADEN } from './characters.js';
import { ladeSpielstand, speichereSpielstand } from './save.js';
import { kiEingabe, leereEingabe } from './ai.js';
import { wendePhysikAn, trenneKaempfer } from './physics.js';
import { verarbeiteKampf } from './combat.js';
import { zeichneStage, zeichneVordergrund } from './stage.js';
import { zeichneUI, zeichneMenue, zeichneStory, zeichneGegnerWahl, zeichneTouchSteuerung, zeichneAusruestung, MENUE_KNOPF } from './ui.js';
import { spawnTrefferFunken, updatePartikel, zeichnePartikel, leerePartikel } from './particles.js';
import { spieleTreffer, spieleBlock, spieleKo, spieleGong, spieleSpezialTreffer, setzeEffekte } from './sound.js';
import { setzeMusik, setzeMusikAn } from './music.js';

const canvas = document.getElementById('spiel');
const ctx = canvas.getContext('2d');

const START_X_SPIELER = 320;
const START_X_GEGNER = 640;

// Oberster Spielzustand: Menü → (Story-Text) → Kampf → zurück
let modus = 'menue'; // 'menue' | 'gegnerWahl' | 'story' | 'kampf' | 'ausruestung'
let menueIndex = 0;  // gewählter Menüeintrag
let wahlIndex = 0;   // gewählter Gegner im freien Kampf
let menueZeit = 0;   // für Atem-Animationen im Menü
let gegnerIndex = 0; // Position auf dem Schattenpfad
let storyModus = true;
let spiel = null;

// Dauerhafter Fortschritt (localStorage): Splitter, Käufe, Story-Station, Schwierigkeit
const spielstand = ladeSpielstand();
const SCHWIERIGKEITEN = ['leicht', 'normal', 'schwer'];
const TON_MODI = ['alles', 'effekte', 'aus'];

function wendeTonEinstellungAn() {
  setzeEffekte(spielstand.ton !== 'aus');
  setzeMusikAn(spielstand.ton === 'alles');
}
wendeTonEinstellungAn();

// Weicher Übergang zwischen Bildschirmen (kurzes Abdunkeln)
let blende = 0;
let letzterModus = modus;

// Auswahl-Zustand im Ausrüstungs-Bildschirm
let ausruestungZeile = 0;
let waffenIndex = Math.max(0, WAFFEN_LADEN.findIndex((w) => w.id === spielstand.waffe));
let stilIndex = Math.max(0, STIL_LADEN.findIndex((s) => s.id === spielstand.extra));

// Juro mit der aktuell ausgerüsteten Waffe und dem gewählten Stil
function spielerCharakter() {
  return { ...CHARAKTERE.juro, waffe: spielstand.waffe, extras: [spielstand.extra] };
}

// Gegner mit angewendetem Schwierigkeitsgrad
function gegnerCharakter(id) {
  const basis = CHARAKTERE[id];
  const s = CONFIG.schwierigkeiten[spielstand.schwierigkeit];
  return {
    ...basis,
    schadenFaktor: basis.schadenFaktor * s.schaden,
    hpFaktor: basis.hpFaktor * s.hp,
    denkFaktor: s.denken,
  };
}

const kamera = { x: 0, shake: 0 };

function neuerKampf() {
  const gegnerDaten = gegnerCharakter(GEGNER_PFAD[gegnerIndex]);
  const naechsterName = GEGNER_PFAD[gegnerIndex + 1] ? CHARAKTERE[GEGNER_PFAD[gegnerIndex + 1]].name : null;
  spiel = {
    spieler: new Kaempfer(spielerCharakter(), START_X_SPIELER, 1),
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
    gegnerId: GEGNER_PFAD[gegnerIndex],
    storyModus,
    training: false,
    trainingModus: 0,
  };
  kamera.x = 0;
  kamera.shake = 0;
  leerePartikel();
  modus = 'kampf';
}

// Trainings-Modus: Dummy-Gegner, kein K.O., HP regenerieren sich
function neuesTraining() {
  storyModus = false;
  spiel = {
    spieler: new Kaempfer(spielerCharakter(), START_X_SPIELER, 1),
    gegner: new Kaempfer(CHARAKTERE.scharr, START_X_GEGNER, -1),
    runde: 1,
    phase: 'kampf', // kein Intro — direkt loslegen
    phasenZeit: 0,
    hitstop: 0,
    rundenSieger: null,
    matchSieger: null,
    spielerHatGewonnen: false,
    kampfNummer: 1,
    kampfAnzahl: 1,
    naechsterGegner: null,
    arena: 'aschenpass',
    gegnerId: 'scharr',
    storyModus: false,
    training: true,
    trainingModus: 0, // 0 = steht, 1 = blockt, 2 = kämpft
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
    spezial: verbraucheFrisch('KeyW'),
  };
}

// ---------- Menü- und Story-Logik ----------

function menueEintraege() {
  const s = CONFIG.schwierigkeiten[spielstand.schwierigkeit];
  const ton = { alles: 'Musik + Effekte', effekte: 'Nur Effekte', aus: 'Aus' }[spielstand.ton];
  return ['Story-Modus', 'Freier Kampf', 'Training', 'Ausrüstung', `Schwierigkeit: ${s.name}`, `Ton: ${ton}`];
}

function updateMenue() {
  const anzahl = menueEintraege().length;
  if (verbraucheFrisch('ArrowUp')) menueIndex = (menueIndex + anzahl - 1) % anzahl;
  if (verbraucheFrisch('ArrowDown')) menueIndex = (menueIndex + 1) % anzahl;
  // Touch: Tipp auf einen Menüeintrag wählt und bestätigt ihn
  const tap = verbraucheTap();
  let bestaetigt = verbraucheFrisch('Enter');
  if (tap) {
    // Einträge stehen bei y = 240 + i·44 (je ±22 Tipp-Toleranz)
    for (let i = 0; i < anzahl; i++) {
      const mitte = 240 + i * 44;
      if (tap.y > mitte - 22 && tap.y <= mitte + 22) { menueIndex = i; bestaetigt = true; }
    }
  }
  if (bestaetigt) {
    if (menueIndex === 0) {
      storyModus = true;
      // Story setzt an der höchsten erreichten Station fort
      gegnerIndex = Math.min(spielstand.fortschritt, GEGNER_PFAD.length - 1);
      modus = 'story';
    } else if (menueIndex === 1) {
      modus = 'gegnerWahl';
    } else if (menueIndex === 2) {
      neuesTraining();
    } else if (menueIndex === 3) {
      modus = 'ausruestung';
    } else if (menueIndex === 4) {
      // Schwierigkeitsgrad durchschalten und merken
      const i = SCHWIERIGKEITEN.indexOf(spielstand.schwierigkeit);
      spielstand.schwierigkeit = SCHWIERIGKEITEN[(i + 1) % SCHWIERIGKEITEN.length];
      speichereSpielstand(spielstand);
    } else {
      // Ton-Einstellung durchschalten
      const i = TON_MODI.indexOf(spielstand.ton);
      spielstand.ton = TON_MODI[(i + 1) % TON_MODI.length];
      wendeTonEinstellungAn();
      speichereSpielstand(spielstand);
    }
  }
}

function updateAusruestung() {
  const tap = verbraucheTap();
  let bestaetigt = verbraucheFrisch('Enter');
  let links = verbraucheFrisch('ArrowLeft');
  let rechts = verbraucheFrisch('ArrowRight');

  if (verbraucheFrisch('ArrowUp') || verbraucheFrisch('ArrowDown')) ausruestungZeile = 1 - ausruestungZeile;
  if (verbraucheFrisch('Escape')) { zumMenue(); return; }

  if (tap) {
    // Tipp auf eine Zeile wählt sie; links/rechts davon blättert, Mitte bestätigt
    if (tap.y > 140 && tap.y < 280) ausruestungZeile = 0;
    else if (tap.y >= 280 && tap.y < 430) ausruestungZeile = 1;
    else { zumMenue(); return; } // Tipp ganz unten/oben = zurück
    if (tap.x < 220) links = true;
    else if (tap.x > 440 && tap.x < 580) bestaetigt = true;
  }

  const liste = ausruestungZeile === 0 ? WAFFEN_LADEN : STIL_LADEN;
  let index = ausruestungZeile === 0 ? waffenIndex : stilIndex;
  if (links) index = (index + liste.length - 1) % liste.length;
  if (rechts) index = (index + 1) % liste.length;
  if (ausruestungZeile === 0) waffenIndex = index; else stilIndex = index;

  if (bestaetigt) {
    const eintrag = liste[index];
    const besitzt = spielstand.gekauft.includes(eintrag.id);
    if (!besitzt && spielstand.splitter >= eintrag.preis) {
      spielstand.splitter -= eintrag.preis;
      spielstand.gekauft.push(eintrag.id);
    }
    if (spielstand.gekauft.includes(eintrag.id)) {
      // Gekauftes wird direkt ausgerüstet
      if (ausruestungZeile === 0) spielstand.waffe = eintrag.id;
      else spielstand.extra = eintrag.id;
    }
    speichereSpielstand(spielstand);
  }
}

function updateGegnerWahl() {
  // Touch: links/rechts tippen blättert, Mitte startet den Kampf
  const tap = verbraucheTap();
  let links = verbraucheFrisch('ArrowLeft');
  let rechts = verbraucheFrisch('ArrowRight');
  let start = verbraucheFrisch('Enter');
  if (tap) {
    if (tap.x < 320) links = true;
    else if (tap.x > 640) rechts = true;
    else start = true;
  }
  if (links) wahlIndex = (wahlIndex + GEGNER_PFAD.length - 1) % GEGNER_PFAD.length;
  if (rechts) wahlIndex = (wahlIndex + 1) % GEGNER_PFAD.length;
  if (start) {
    storyModus = false;
    gegnerIndex = wahlIndex;
    neuerKampf();
  }
  if (verbraucheFrisch('Escape')) zumMenue();
}

function updateStory() {
  if (verbraucheFrisch('Enter') || verbraucheTap()) neuerKampf();
  if (verbraucheFrisch('Escape')) zumMenue();
}

// ---------- Kampf-Logik ----------

function updateKampf(dt) {
  const tap = verbraucheTap();

  if (verbraucheFrisch('Escape')) {
    zumMenue();
    return;
  }
  // Touch: MENÜ-Knopf oben in der Mitte verlässt den Kampf
  if (tap && tap.x > MENUE_KNOPF.x && tap.x < MENUE_KNOPF.x + MENUE_KNOPF.b
      && tap.y > MENUE_KNOPF.y && tap.y < MENUE_KNOPF.y + MENUE_KNOPF.h) {
    zumMenue();
    return;
  }
  // Training: T oder Tipp oben wechselt das Dummy-Verhalten
  if (spiel.training && (verbraucheFrisch('KeyT') || (tap && tap.y < 140))) {
    spiel.trainingModus = (spiel.trainingModus + 1) % 3;
  }
  if (verbraucheFrisch('KeyR') && !spiel.training) {
    if (spiel.phase === 'pfadEnde') { gegnerIndex = 0; zumMenue(); } else neuerKampf();
    return;
  }
  if (spiel.phase === 'pfadEnde' && (verbraucheFrisch('Enter') || tap)) {
    gegnerIndex = 0;
    zumMenue();
    return;
  }
  // Touch: nach dem Match-Ende reicht ein Tipp irgendwo für die Revanche
  if (spiel.phase === 'matchEnde' && !(spiel.storyModus && spiel.spielerHatGewonnen) && tap) {
    neuerKampf();
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

  // Trainings-Dummy: je nach Modus still stehen, nur blocken oder normal kämpfen
  let gegnerEingabe = leereEingabe();
  if (kampfAktiv) {
    if (!spiel.training || spiel.trainingModus === 2) gegnerEingabe = kiEingabe(gegner, spieler, dt);
    else if (spiel.trainingModus === 1) gegnerEingabe.block = true;
  }

  spieler.update(dt, kampfAktiv ? spielerEingabe() : leereEingabe(), gegner);
  gegner.update(dt, gegnerEingabe, spieler);

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
      const wuchtig = e.spezial || e.wurf || e.finisher;
      spawnTrefferFunken(e.x, e.y, e.richtung, e.blockt, e.ko || wuchtig);
      spiel.hitstop = e.ko ? G.hitstopKo : wuchtig ? 0.12 : e.blockt ? G.hitstopBlock : G.hitstopTreffer;
      kamera.shake = Math.max(kamera.shake, e.ko ? G.shakeKo : wuchtig ? 12 : e.blockt ? G.shakeBlock : G.shakeTreffer);
      if (e.ko) spieleKo();
      else if (wuchtig && !e.blockt) spieleSpezialTreffer();
      else if (e.blockt) spieleBlock();
      else spieleTreffer();
    }

    // Training: niemand geht K.O., beide regenerieren langsam
    if (spiel.training) {
      for (const k of [spieler, gegner]) {
        k.hp = Math.min(k.maxHp, k.hp + CONFIG.training.regeneration * dt);
        if (k.hp <= 0 || !k.lebt()) {
          k.hp = k.maxHp;
          k.anzeigeHp = k.maxHp;
          k.wechsle('stehen');
        }
      }
      return;
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

        // Belohnung gutschreiben und Fortschritt dauerhaft speichern
        const B = CONFIG.belohnungen;
        const istBoss = CHARAKTERE[GEGNER_PFAD[gegnerIndex]].boss;
        spiel.belohnung = spiel.spielerHatGewonnen
          ? (spiel.storyModus ? (istBoss ? B.bossSieg : B.storySieg) : B.freierSieg)
          : B.niederlage;
        spielstand.splitter += spiel.belohnung;
        if (spiel.storyModus && spiel.spielerHatGewonnen) {
          spielstand.fortschritt = Math.max(spielstand.fortschritt, gegnerIndex + 1);
          // Pfad geschafft → nächster Story-Durchlauf beginnt wieder vorn
          if (spielstand.fortschritt >= GEGNER_PFAD.length) spielstand.fortschritt = 0;
        }
        speichereSpielstand(spielstand);
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
  else if (modus === 'ausruestung') updateAusruestung();
  else updateKampf(dt);

  // Musik folgt dem Ort: Arena im Kampf, sonst Menü-Stück
  setzeMusik(modus === 'kampf' && spiel ? spiel.arena : 'menue');

  // Bildschirmwechsel kurz abdunkeln (weicher Übergang)
  if (modus !== letzterModus) {
    blende = 1;
    letzterModus = modus;
  }
  blende = Math.max(0, blende - dt * 4);

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

  if (istTouchAktiv()) zeichneTouchSteuerung(ctx, spiel.spieler);
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

  if (modus === 'menue') {
    zeichneMenue(ctx, menueEintraege(), menueIndex, menueZeit, spielstand.splitter);
  } else if (modus === 'ausruestung') {
    zeichneAusruestung(ctx, {
      zeile: ausruestungZeile,
      waffenEintrag: WAFFEN_LADEN[waffenIndex],
      stilEintrag: STIL_LADEN[stilIndex],
      spielstand,
      zeit: menueZeit,
    });
  } else if (modus === 'story') {
    const karte = {
      stationen: GEGNER_PFAD.map((id) => CHARAKTERE[id].name),
      aktuell: gegnerIndex,
    };
    zeichneStory(ctx, STORY[GEGNER_PFAD[gegnerIndex]], karte, GEGNER_PFAD[gegnerIndex]);
  } else {
    zeichneGegnerWahl(ctx, CHARAKTERE[GEGNER_PFAD[wahlIndex]], menueZeit, GEGNER_PFAD[wahlIndex]);
  }
}

function render() {
  if (modus === 'kampf') renderKampf();
  else renderMenue();

  if (blende > 0) {
    ctx.fillStyle = `rgba(8, 6, 16, ${(blende * 0.9).toFixed(2)})`;
    ctx.fillRect(0, 0, CONFIG.canvas.breite, CONFIG.canvas.hoehe);
  }
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

aktiviereTouch(canvas);
requestAnimationFrame(schleife);
