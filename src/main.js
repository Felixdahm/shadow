import { CONFIG } from './config.js';
import { istGedrueckt, verbraucheFrisch, tickEnde, aktiviereTouch, istTouchAktiv, verbraucheTap } from './input.js';
import { Kaempfer } from './fighter.js';
import { CHARAKTERE, GEGNER_PFAD, STORY, WAFFEN_LADEN, STIL_LADEN } from './characters.js';
import { ladeSpielstand, speichereSpielstand } from './save.js';
import { kiEingabe, leereEingabe } from './ai.js';
import { wendePhysikAn, trenneKaempfer } from './physics.js';
import { verarbeiteKampf } from './combat.js';
import { zeichneStage, zeichneVordergrund, zeichneAmbiente } from './stage.js';
import {
  zeichneUI, zeichneStory, zeichneAusruestung, zeichneTouchSteuerung,
  zeichnePanel, zeichneWeltKarte, zeichneVignette,
  MENUE_KNOPF, ZURUECK_KNOPF, PANEL_EINTRAG,
} from './ui.js';
import { spawnTrefferFunken, updatePartikel, zeichnePartikel, leerePartikel } from './particles.js';
import { spieleTreffer, spieleBlock, spieleKo, spieleGong, spieleSpezialTreffer, setzeEffekte } from './sound.js';
import { setzeMusik, setzeMusikAn } from './music.js';

const canvas = document.getElementById('spiel');
const ctx = canvas.getContext('2d');

const START_X_SPIELER = 320;
const START_X_GEGNER = 640;

// Spielablauf wie in Shadow Fight: Man startet im DOJO (Trainingskampf) und
// öffnet von dort das Panel → Karte (Turnier/Boss), Ausrüstung, Einstellungen.
// modus: 'kampf' (Dojo oder echter Kampf) | 'karte' | 'story' | 'ausruestung'
let modus = 'kampf';
let panelOffen = false; // Seitenpanel im Dojo
let panelIndex = 0;
let menueZeit = 0;
let gegnerIndex = 0;    // welcher Karten-Knoten gerade bekämpft wird (0–4)
let kampfTurnier = false;
let spiel = null;

const spielstand = ladeSpielstand();
const SCHWIERIGKEITEN = ['leicht', 'normal', 'schwer'];
const TON_MODI = ['alles', 'effekte', 'aus'];
let karteIndex = Math.min(spielstand.turnierFortschritt, GEGNER_PFAD.length - 1);

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

const kamera = { x: 0, shake: 0, zoom: 1 };

// Jede Welt macht Gegner und Belohnungen größer
function weltFaktor() {
  return 1 + CONFIG.weltSteigerung * (spielstand.welt - 1);
}

// Juro mit der aktuell ausgerüsteten Waffe und dem gewählten Stil
function spielerCharakter() {
  return { ...CHARAKTERE.juro, waffe: spielstand.waffe, extras: [spielstand.extra] };
}

// Gegner mit Schwierigkeitsgrad UND Welt-Steigerung
function gegnerCharakter(id) {
  const basis = CHARAKTERE[id];
  const s = CONFIG.schwierigkeiten[spielstand.schwierigkeit];
  const w = weltFaktor();
  return {
    ...basis,
    schadenFaktor: basis.schadenFaktor * s.schaden * w,
    hpFaktor: basis.hpFaktor * s.hp * w,
    denkFaktor: s.denken,
  };
}

// Belohnung für einen Karten-Knoten (Turnier steigt mit der Stufe, Welt multipliziert)
function turnierBelohnung(index) {
  const B = CONFIG.belohnungen;
  const istBoss = index === GEGNER_PFAD.length - 1;
  return Math.round((B.turnierBasis + B.turnierProStufe * index + (istBoss ? B.bossBonus : 0)) * weltFaktor());
}

function kampfGeruest(gegnerDaten, gegnerId) {
  return {
    spieler: new Kaempfer(spielerCharakter(), START_X_SPIELER, 1),
    gegner: new Kaempfer(gegnerDaten, START_X_GEGNER, -1),
    runde: 1,
    phase: 'intro',
    phasenZeit: 0,
    hitstop: 0,
    rundenSieger: null,
    matchSieger: null,
    spielerHatGewonnen: false,
    belohnung: 0,
    kampfNummer: gegnerIndex + 1,
    kampfAnzahl: GEGNER_PFAD.length,
    weltNummer: spielstand.welt,
    arena: gegnerDaten.arena ?? 'aschenpass',
    gegnerId,
    turnier: kampfTurnier,
    istBoss: !!gegnerDaten.boss,
    istDojo: false,
    training: false,
    trainingModus: 0,
  };
}

// Das Dojo: Trainingskampf als Heimat-Bildschirm
function zumDojo() {
  kampfTurnier = false;
  const id = 'scharr';
  spiel = {
    ...kampfGeruest(CHARAKTERE[id], id),
    phase: 'kampf', // kein Intro
    istDojo: true,
    training: true,
  };
  kamera.x = 0;
  kamera.shake = 0;
  leerePartikel();
  modus = 'kampf';
  panelOffen = false;
}

function starteKampf(index, turnier) {
  gegnerIndex = index;
  kampfTurnier = turnier;
  const id = GEGNER_PFAD[index];
  spiel = kampfGeruest(gegnerCharakter(id), id);
  kamera.x = 0;
  kamera.shake = 0;
  leerePartikel();
  modus = 'kampf';
}

function zurKarte() {
  modus = 'karte';
  spiel = null;
  karteIndex = Math.min(spielstand.turnierFortschritt, GEGNER_PFAD.length - 1);
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

// ---------- Panel (Dojo-Seitenmenü) ----------

function panelEintraege() {
  const s = CONFIG.schwierigkeiten[spielstand.schwierigkeit];
  const ton = { alles: 'Musik + Effekte', effekte: 'Nur Effekte', aus: 'Aus' }[spielstand.ton];
  return ['⚔ Spielkarte', '🛡 Ausrüstung', `Schwierigkeit: ${s.name}`, `Ton: ${ton}`, 'Weiter trainieren'];
}

function updatePanel() {
  const anzahl = panelEintraege().length;
  if (verbraucheFrisch('ArrowUp')) panelIndex = (panelIndex + anzahl - 1) % anzahl;
  if (verbraucheFrisch('ArrowDown')) panelIndex = (panelIndex + 1) % anzahl;
  if (verbraucheFrisch('Escape')) { panelOffen = false; return; }

  const tap = verbraucheTap();
  let bestaetigt = verbraucheFrisch('Enter');
  if (tap) {
    if (tap.x > 340) { panelOffen = false; return; } // neben das Panel getippt
    for (let i = 0; i < anzahl; i++) {
      const r = PANEL_EINTRAG(i);
      if (tap.x >= r.x && tap.x <= r.x + r.b && tap.y >= r.y && tap.y <= r.y + r.h) {
        panelIndex = i;
        bestaetigt = true;
      }
    }
  }
  if (!bestaetigt) return;

  if (panelIndex === 0) { zurKarte(); panelOffen = false; }
  else if (panelIndex === 1) { modus = 'ausruestung'; panelOffen = false; }
  else if (panelIndex === 2) {
    const i = SCHWIERIGKEITEN.indexOf(spielstand.schwierigkeit);
    spielstand.schwierigkeit = SCHWIERIGKEITEN[(i + 1) % SCHWIERIGKEITEN.length];
    speichereSpielstand(spielstand);
  } else if (panelIndex === 3) {
    const i = TON_MODI.indexOf(spielstand.ton);
    spielstand.ton = TON_MODI[(i + 1) % TON_MODI.length];
    wendeTonEinstellungAn();
    speichereSpielstand(spielstand);
  } else {
    panelOffen = false;
  }
}

// ---------- Karte ----------

function kartenEintraege() {
  return GEGNER_PFAD.map((id, i) => ({
    id,
    name: CHARAKTERE[id].name,
    beschreibung: CHARAKTERE[id].beschreibung,
    status: i < spielstand.turnierFortschritt ? 'besiegt' : i === spielstand.turnierFortschritt ? 'offen' : 'gesperrt',
    belohnung: i < spielstand.turnierFortschritt ? Math.round(CONFIG.belohnungen.freierSieg * weltFaktor()) : turnierBelohnung(i),
  }));
}

function updateKarte() {
  const n = GEGNER_PFAD.length;
  if (verbraucheFrisch('ArrowLeft')) karteIndex = (karteIndex + n - 1) % n;
  if (verbraucheFrisch('ArrowRight')) karteIndex = (karteIndex + 1) % n;
  if (verbraucheFrisch('Escape')) { zumDojo(); return; }

  const tap = verbraucheTap();
  let bestaetigt = verbraucheFrisch('Enter');
  if (tap) {
    const Z = ZURUECK_KNOPF;
    if (tap.x >= Z.x && tap.x <= Z.x + Z.b && tap.y >= Z.y && tap.y <= Z.y + Z.h) { zumDojo(); return; }
    // Tipp auf einen Knoten: erst wählen, gleicher Knoten nochmal = starten
    const abstand = 165;
    const startX = CONFIG.canvas.breite / 2 - ((n - 1) * abstand) / 2;
    for (let i = 0; i < n; i++) {
      const px = startX + i * abstand;
      if (Math.abs(tap.x - px) < 70 && tap.y > 120 && tap.y < 300) {
        if (karteIndex === i) bestaetigt = true;
        karteIndex = i;
      }
    }
  }
  if (!bestaetigt) return;

  const eintrag = kartenEintraege()[karteIndex];
  if (eintrag.status === 'gesperrt') return;
  if (eintrag.status === 'offen') {
    // Neuer Turnierkampf: erst die Geschichte, dann der Kampf
    gegnerIndex = karteIndex;
    modus = 'story';
  } else {
    starteKampf(karteIndex, false); // Revanche (freier Kampf)
  }
}

function updateStory() {
  if (verbraucheFrisch('Enter') || verbraucheTap()) starteKampf(gegnerIndex, true);
  if (verbraucheFrisch('Escape')) zurKarte();
}

// ---------- Ausrüstung ----------

function updateAusruestung() {
  const tap = verbraucheTap();
  let bestaetigt = verbraucheFrisch('Enter');
  let links = verbraucheFrisch('ArrowLeft');
  let rechts = verbraucheFrisch('ArrowRight');

  if (verbraucheFrisch('ArrowUp') || verbraucheFrisch('ArrowDown')) ausruestungZeile = 1 - ausruestungZeile;
  if (verbraucheFrisch('Escape')) { zumDojo(); panelOffen = true; return; }

  if (tap) {
    if (tap.y > 140 && tap.y < 280) ausruestungZeile = 0;
    else if (tap.y >= 280 && tap.y < 430) ausruestungZeile = 1;
    else { zumDojo(); panelOffen = true; return; }
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
      if (ausruestungZeile === 0) spielstand.waffe = eintrag.id;
      else spielstand.extra = eintrag.id;
    }
    speichereSpielstand(spielstand);
  }
}

// ---------- Kampf ----------

function updateKampf(dt) {
  // Im Dojo: Panel offen = Spiel pausiert, nur Panel bedienen
  if (spiel.istDojo && panelOffen) {
    updatePanel();
    return;
  }

  const tap = verbraucheTap();

  if (verbraucheFrisch('Escape')) {
    if (spiel.istDojo) panelOffen = true;
    else zurKarte();
    return;
  }
  // Knopf oben Mitte: Dojo → Panel, Kampf → Karte
  if (tap && tap.x > MENUE_KNOPF.x && tap.x < MENUE_KNOPF.x + MENUE_KNOPF.b
      && tap.y > MENUE_KNOPF.y && tap.y < MENUE_KNOPF.y + MENUE_KNOPF.h) {
    if (spiel.istDojo) panelOffen = true;
    else zurKarte();
    return;
  }
  // Training: T oder Tipp oben wechselt das Dummy-Verhalten
  if (spiel.training && (verbraucheFrisch('KeyT') || (tap && tap.y < 140))) {
    spiel.trainingModus = (spiel.trainingModus + 1) % 3;
  }
  if (verbraucheFrisch('KeyR') && !spiel.training) {
    starteKampf(gegnerIndex, kampfTurnier); // Revanche
    return;
  }
  if (spiel.phase === 'pfadEnde' && (verbraucheFrisch('Enter') || tap)) {
    // Welt abgeschlossen → nächste Welt beginnt
    spielstand.welt++;
    spielstand.turnierFortschritt = 0;
    speichereSpielstand(spielstand);
    zurKarte();
    return;
  }
  // Nach dem Match-Ende: Tipp = Revanche (bei Niederlage oder freiem Kampf)
  if (spiel.phase === 'matchEnde' && !(spiel.turnier && spiel.spielerHatGewonnen) && tap) {
    starteKampf(gegnerIndex, kampfTurnier);
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
  kamera.zoom += (1 - kamera.zoom) * Math.min(1, 6 * dt); // Zoom-Punch klingt ab

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
      if (e.ko) kamera.zoom = 1.1;
      else if (wuchtig && !e.blockt) kamera.zoom = 1.06;
      if (e.ko) spieleKo();
      else if (wuchtig && !e.blockt) spieleSpezialTreffer();
      else if (e.blockt) spieleBlock();
      else spieleTreffer(e.serie - 1);
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

        // Belohnung gutschreiben, Turnier-Fortschritt speichern
        const B = CONFIG.belohnungen;
        spiel.belohnung = spiel.spielerHatGewonnen
          ? (spiel.turnier ? turnierBelohnung(gegnerIndex) : Math.round(B.freierSieg * weltFaktor()))
          : B.niederlage;
        spielstand.splitter += spiel.belohnung;
        if (spiel.turnier && spiel.spielerHatGewonnen) {
          spielstand.turnierFortschritt = Math.max(spielstand.turnierFortschritt, gegnerIndex + 1);
        }
        speichereSpielstand(spielstand);
      } else {
        naechsteRunde();
      }
    }
  } else if (spiel.phase === 'matchEnde') {
    if (spiel.turnier && spiel.spielerHatGewonnen && spiel.phasenZeit >= 3) {
      if (spiel.istBoss) {
        spiel.phase = 'pfadEnde'; // Welt abgeschlossen
        spiel.phasenZeit = 0;
      } else {
        zurKarte();
      }
    }
  }
}

function update(dt) {
  menueZeit += dt;
  if (modus === 'karte') updateKarte();
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

  // Zoom-Punch: kurzes Heranzoomen um die Bildmitte bei wuchtigen Treffern
  if (kamera.zoom > 1.001) {
    ctx.translate(CONFIG.canvas.breite / 2, CONFIG.canvas.hoehe / 2);
    ctx.scale(kamera.zoom, kamera.zoom);
    ctx.translate(-CONFIG.canvas.breite / 2, -CONFIG.canvas.hoehe / 2);
  }

  zeichneStage(ctx, kamera.x, spiel.arena); // Hintergrund-Ebenen mit Parallax

  ctx.save();
  ctx.translate(-kamera.x, 0); // Welt-Ebene: Kämpfer und Partikel
  spiel.gegner.zeichne(ctx);
  spiel.spieler.zeichne(ctx);
  zeichnePartikel(ctx);
  ctx.restore();

  zeichneAmbiente(ctx, spiel.arena, kamera.x); // Funken, Glühwürmchen, Nebel …
  zeichneVordergrund(ctx, kamera.x, spiel.arena); // Felsen vor den Kämpfern

  ctx.restore();

  zeichneVignette(ctx);
  zeichneUI(ctx, spiel); // UI wackelt nicht mit

  if (istTouchAktiv() && !panelOffen) zeichneTouchSteuerung(ctx, spiel.spieler);
  if (spiel.istDojo && panelOffen) zeichnePanel(ctx, panelEintraege(), panelIndex, spielstand.splitter);
}

function renderScreens() {
  // Passende Arena als lebendiger Hintergrund, Kamera driftet langsam
  const arena =
    modus === 'karte' ? CHARAKTERE[GEGNER_PFAD[karteIndex]].arena :
    modus === 'story' ? CHARAKTERE[GEGNER_PFAD[gegnerIndex]].arena :
    'aschenpass';
  const drift = Math.sin(menueZeit * 0.25) * 60;

  zeichneStage(ctx, drift, arena);
  zeichneAmbiente(ctx, arena, drift);
  zeichneVordergrund(ctx, drift, arena);
  zeichneVignette(ctx);

  if (modus === 'karte') {
    zeichneWeltKarte(ctx, {
      welt: spielstand.welt,
      eintraege: kartenEintraege(),
      auswahl: karteIndex,
      splitter: spielstand.splitter,
    });
  } else if (modus === 'story') {
    const karte = {
      stationen: GEGNER_PFAD.map((id) => CHARAKTERE[id].name),
      aktuell: gegnerIndex,
    };
    zeichneStory(ctx, STORY[GEGNER_PFAD[gegnerIndex]], karte, GEGNER_PFAD[gegnerIndex]);
  } else {
    zeichneAusruestung(ctx, {
      zeile: ausruestungZeile,
      waffenEintrag: WAFFEN_LADEN[waffenIndex],
      stilEintrag: STIL_LADEN[stilIndex],
      spielstand,
      zeit: menueZeit,
    });
  }
}

function render() {
  if (modus === 'kampf') renderKampf();
  else renderScreens();

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
zumDojo(); // Das Spiel beginnt im Dojo — wie bei den Großen
requestAnimationFrame(schleife);
