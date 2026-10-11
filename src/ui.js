import { CONFIG } from './config.js';
import { zeichneSkelett } from './skeleton.js';
import { poseZumZeitpunkt } from './animations.js';
import { TOUCH_BUTTONS, istGedrueckt, stickZustand, istTouchAktiv } from './input.js';

// Tipp-Bereich des MENÜ-Knopfs oben in der Mitte (Touch); main.js prüft Taps dagegen
export const MENUE_KNOPF = { x: 415, y: 50, b: 130, h: 36 };

const BALKEN_BREITE = 340;
const BALKEN_HOEHE = 20;

function lebensbalken(ctx, x, y, kaempfer, gespiegelt) {
  // dunkler Rahmen + leerer (roter) Hintergrund
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(x - 4, y - 4, BALKEN_BREITE + 8, BALKEN_HOEHE + 8);
  ctx.fillStyle = '#541c2a';
  ctx.fillRect(x, y, BALKEN_BREITE, BALKEN_HOEHE);

  const maxHp = kaempfer.maxHp;

  // Nachlauf-Balken: zeigt hell, wie viel gerade abgezogen wurde
  const geisterBreite = BALKEN_BREITE * (kaempfer.anzeigeHp / maxHp);
  ctx.fillStyle = '#f2e6b8';
  ctx.fillRect(gespiegelt ? x + BALKEN_BREITE - geisterBreite : x, y, geisterBreite, BALKEN_HOEHE);

  const anteil = kaempfer.hp / maxHp;
  ctx.fillStyle = anteil > 0.5 ? '#7ddc6a' : anteil > 0.25 ? '#e8c84a' : '#e06046';
  const fuellung = BALKEN_BREITE * anteil;
  // Der Gegner-Balken leert sich zur Mitte hin (gespiegelt)
  ctx.fillRect(gespiegelt ? x + BALKEN_BREITE - fuellung : x, y, fuellung, BALKEN_HOEHE);

  // Energie-Leiste direkt unter dem Lebensbalken; pulsiert golden, wenn voll
  const energieAnteil = kaempfer.energie / CONFIG.spezial.energieMax;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(x, y + BALKEN_HOEHE + 5, BALKEN_BREITE, 7);
  const voll = energieAnteil >= 1;
  const puls = voll ? 0.7 + 0.3 * Math.sin(performance.now() / 120) : 1;
  ctx.fillStyle = voll ? `rgba(255, 210, 125, ${puls.toFixed(2)})` : '#8a6cc9';
  const eBreite = BALKEN_BREITE * energieAnteil;
  ctx.fillRect(gespiegelt ? x + BALKEN_BREITE - eBreite : x, y + BALKEN_HOEHE + 5, eBreite, 7);

  ctx.fillStyle = '#f3e9f7';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = gespiegelt ? 'right' : 'left';
  ctx.fillText(kaempfer.name, gespiegelt ? x + BALKEN_BREITE : x, y + BALKEN_HOEHE + 30);

  // Runden-Siege als Punkte unter dem Namen
  for (let i = 0; i < CONFIG.runden.gewinneNoetig; i++) {
    const px = gespiegelt ? x + BALKEN_BREITE - 8 - i * 24 : x + 8 + i * 24;
    ctx.beginPath();
    ctx.arc(px, y + BALKEN_HOEHE + 48, 7, 0, Math.PI * 2);
    ctx.fillStyle = i < kaempfer.rundenSiege ? '#ffd27d' : 'rgba(0, 0, 0, 0.35)';
    ctx.fill();
  }
}

// Großer Text in der Bildmitte mit "Pop"-Effekt beim Einblenden
function ansage(ctx, text, groesse, zeit, y = 215) {
  const skala = 1 + 0.35 * Math.exp(-9 * Math.max(0, zeit));
  ctx.save();
  ctx.translate(CONFIG.canvas.breite / 2, y);
  ctx.scale(skala, skala);
  ctx.fillStyle = 'rgba(255, 235, 200, 0.95)';
  ctx.font = `bold ${groesse}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function untertitel(ctx, text, y = 262) {
  ctx.fillStyle = 'rgba(255, 235, 200, 0.9)';
  ctx.font = '26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, CONFIG.canvas.breite / 2, y);
}

export function zeichneUI(ctx, spiel) {
  const breite = CONFIG.canvas.breite;
  lebensbalken(ctx, 40, 28, spiel.spieler, false);
  lebensbalken(ctx, breite - 40 - BALKEN_BREITE, 28, spiel.gegner, true);

  // Fortschritt auf dem Schattenpfad bzw. Trainings-Anzeige
  ctx.fillStyle = 'rgba(243, 233, 247, 0.75)';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  if (spiel.training) {
    const modi = ['Steht still', 'Blockt', 'Kämpft'];
    ctx.fillText(`TRAINING · Dummy: ${modi[spiel.trainingModus]}  (T / oben tippen)`, breite / 2, 42);
  } else {
    ctx.fillText(`Kampf ${spiel.kampfNummer} von ${spiel.kampfAnzahl}`, breite / 2, 42);
  }

  // Auf Touch-Geräten: MENÜ-Knopf, um den Kampf verlassen zu können
  if (istTouchAktiv()) {
    const K = MENUE_KNOPF;
    ctx.fillStyle = 'rgba(10, 8, 18, 0.4)';
    ctx.strokeStyle = 'rgba(243, 233, 247, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(K.x, K.y, K.b, K.h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(243, 233, 247, 0.75)';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('✕ MENÜ', K.x + K.b / 2, K.y + 23);
  }

  if (spiel.phase === 'intro') {
    if (spiel.phasenZeit < 0.85) {
      ansage(ctx, `RUNDE ${spiel.runde}`, 64, spiel.phasenZeit);
    } else {
      ansage(ctx, 'FIGHT!', 76, spiel.phasenZeit - 0.85);
    }
  } else if (spiel.phase === 'rundenEnde') {
    ansage(ctx, 'K.O.', 84, spiel.phasenZeit);
    untertitel(ctx, `${spiel.rundenSieger} holt die Runde`);
  } else if (spiel.phase === 'matchEnde') {
    ansage(ctx, `${spiel.matchSieger.toUpperCase()} GEWINNT`, 56, spiel.phasenZeit);
    if (spiel.storyModus && spiel.spielerHatGewonnen && spiel.naechsterGegner) {
      untertitel(ctx, `Der Pfad führt weiter … (${spiel.naechsterGegner} wartet)`);
    } else if (spiel.storyModus && spiel.spielerHatGewonnen) {
      untertitel(ctx, 'Das Ende des Pfads ist nah …');
    } else {
      untertitel(ctx, 'R für Revanche · Esc für das Menü');
    }
    // Verdiente Schatten-Splitter anzeigen
    if (spiel.belohnung > 0) {
      ctx.fillStyle = '#ffd27d';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${spiel.belohnung} ◆`, breite / 2, 300);
    }
  } else if (spiel.phase === 'pfadEnde') {
    ansage(ctx, 'PFAD BEZWUNGEN', 60, spiel.phasenZeit);
    untertitel(ctx, 'Enter für das Menü');
  }

  ctx.textAlign = 'left';
}

// Bildschirm-Steuerung für Touch-Geräte: virtueller Joystick links,
// Aktions-Buttons rechts; der Spezial-Button leuchtet bei voller Energie
export function zeichneTouchSteuerung(ctx, spieler) {
  ctx.textAlign = 'center';

  const stick = stickZustand();
  if (stick) {
    // Äußerer Ring am Aufsetzpunkt, Knubbel folgt dem Finger
    ctx.strokeStyle = 'rgba(243, 233, 247, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(stick.x, stick.y, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 235, 200, 0.5)';
    ctx.beginPath();
    ctx.arc(stick.x + stick.dx, stick.y + stick.dy, 26, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Dezenter Hinweis, wo der Joystick lebt
    ctx.strokeStyle = 'rgba(243, 233, 247, 0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(150, 445, 55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(243, 233, 247, 0.35)';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('BEWEGEN', 150, 449);
  }
  for (const b of TOUCH_BUTTONS) {
    const gehalten = istGedrueckt(b.code);
    const istSpezial = b.code === 'KeyW';
    const bereit = istSpezial && spieler.energie >= CONFIG.spezial.energieMax;

    ctx.fillStyle = gehalten ? 'rgba(255, 235, 200, 0.35)' : bereit ? 'rgba(255, 210, 125, 0.3)' : 'rgba(10, 8, 18, 0.35)';
    ctx.strokeStyle = bereit ? 'rgba(255, 210, 125, 0.9)' : 'rgba(243, 233, 247, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.b, b.h, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = bereit ? '#ffd27d' : 'rgba(243, 233, 247, 0.85)';
    const istSymbol = b.label.length === 1;
    ctx.font = istSymbol ? '30px system-ui, sans-serif' : 'bold 13px system-ui, sans-serif';
    ctx.fillText(b.label, b.x + b.b / 2, b.y + b.h / 2 + (istSymbol ? 11 : 5));
  }
  ctx.textAlign = 'left';
}

// ---------- Menü-Bildschirme ----------

// Dunkler Schleier über der Arena, damit Text gut lesbar ist
function schleier(ctx, alpha = 0.55) {
  ctx.fillStyle = `rgba(5, 4, 12, ${alpha})`;
  ctx.fillRect(0, 0, CONFIG.canvas.breite, CONFIG.canvas.hoehe);
}

// Mehrzeiliger Text mit Umbruch an der maximalen Breite
function textBlock(ctx, text, y, maxBreite, zeilenHoehe) {
  const mitte = CONFIG.canvas.breite / 2;
  const woerter = text.split(' ');
  let zeile = '';
  for (const wort of woerter) {
    const test = zeile ? `${zeile} ${wort}` : wort;
    if (ctx.measureText(test).width > maxBreite && zeile) {
      ctx.fillText(zeile, mitte, y);
      zeile = wort;
      y += zeilenHoehe;
    } else {
      zeile = test;
    }
  }
  if (zeile) ctx.fillText(zeile, mitte, y);
  return y;
}

// Splitter-Kontostand oben rechts (Menü-Bildschirme)
function zeichneSplitter(ctx, splitter) {
  ctx.fillStyle = '#ffd27d';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`◆ ${splitter}`, CONFIG.canvas.breite - 36, 42);
}

export function zeichneMenue(ctx, eintraege, auswahl, zeit, splitter) {
  const mitte = CONFIG.canvas.breite / 2;
  schleier(ctx, 0.45);
  zeichneSplitter(ctx, splitter);

  // Titel "atmet" ganz leicht
  const skala = 1 + 0.015 * Math.sin(zeit * 1.5);
  ctx.save();
  ctx.translate(mitte, 150);
  ctx.scale(skala, skala);
  ctx.fillStyle = 'rgba(255, 235, 200, 0.97)';
  ctx.font = 'bold 76px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCHATTENPFAD', 0, 0);
  ctx.restore();

  ctx.textAlign = 'center';
  eintraege.forEach((eintrag, i) => {
    const gewaehlt = i === auswahl;
    ctx.fillStyle = gewaehlt ? '#ffd27d' : 'rgba(243, 233, 247, 0.75)';
    ctx.font = gewaehlt ? 'bold 28px system-ui, sans-serif' : '25px system-ui, sans-serif';
    ctx.fillText(gewaehlt ? `▸ ${eintrag} ◂` : eintrag, mitte, 240 + i * 44);
  });

  ctx.fillStyle = 'rgba(243, 233, 247, 0.55)';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('↑ ↓ wählen · Enter bestätigen', mitte, 505);
  ctx.textAlign = 'left';
}

// Ausrüstungs-Bildschirm: Waffe und Stil wählen/kaufen, Juro als Live-Vorschau
export function zeichneAusruestung(ctx, daten) {
  const { zeile, waffenEintrag, stilEintrag, spielstand, zeit } = daten;
  const mitte = CONFIG.canvas.breite / 2;
  schleier(ctx, 0.55);
  zeichneSplitter(ctx, spielstand.splitter);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 235, 200, 0.95)';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText('AUSRÜSTUNG', mitte, 90);

  // Juro-Vorschau rechts — zeigt sofort die gerade angewählte Kombination,
  // auch wenn sie noch nicht gekauft ist
  const pose = poseZumZeitpunkt('stehen', zeit);
  zeichneSkelett(ctx, 740, CONFIG.physik.bodenY, -1, pose, {
    waffe: waffenEintrag.id,
    extras: [stilEintrag.id],
  });

  const reihe = (y, label, eintrag, aktiv) => {
    const besitzt = spielstand.gekauft.includes(eintrag.id);
    const ausgeruestet = spielstand.waffe === eintrag.id || spielstand.extra === eintrag.id;

    ctx.fillStyle = 'rgba(243, 233, 247, 0.5)';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(label, 330, y - 38);

    ctx.fillStyle = aktiv ? '#ffd27d' : 'rgba(243, 233, 247, 0.85)';
    ctx.font = aktiv ? 'bold 32px system-ui, sans-serif' : '28px system-ui, sans-serif';
    ctx.fillText(`◂  ${eintrag.name}  ▸`, 330, y);

    ctx.font = '16px system-ui, sans-serif';
    if (ausgeruestet) {
      ctx.fillStyle = '#7ddc6a';
      ctx.fillText('✓ Ausgerüstet', 330, y + 30);
    } else if (besitzt) {
      ctx.fillStyle = 'rgba(243, 233, 247, 0.7)';
      ctx.fillText('Enter: ausrüsten', 330, y + 30);
    } else if (spielstand.splitter >= eintrag.preis) {
      ctx.fillStyle = '#ffd27d';
      ctx.fillText(`Enter: kaufen für ${eintrag.preis} ◆`, 330, y + 30);
    } else {
      ctx.fillStyle = '#e06046';
      ctx.fillText(`${eintrag.preis} ◆ — zu wenig Splitter`, 330, y + 30);
    }
    if (eintrag.info) {
      ctx.fillStyle = 'rgba(243, 233, 247, 0.55)';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(eintrag.info, 330, y + 54);
    }
  };

  reihe(200, 'WAFFE', waffenEintrag, zeile === 0);
  reihe(350, 'STIL', stilEintrag, zeile === 1);

  ctx.fillStyle = 'rgba(243, 233, 247, 0.55)';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('↑↓ Zeile · ←→ wählen · Enter kaufen/ausrüsten · Esc zurück', mitte, 505);
  ctx.textAlign = 'left';
}

// Kampagnen-Karte: die Stationen des Pfads als verbundene Punkte.
// Geschaffte Stationen sind golden, die aktuelle pulsiert, kommende sind dunkel.
function zeichneKarte(ctx, karte, y) {
  const n = karte.stationen.length;
  const abstand = 110;
  const startX = CONFIG.canvas.breite / 2 - ((n - 1) * abstand) / 2;

  ctx.strokeStyle = 'rgba(243, 233, 247, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(startX + (n - 1) * abstand, y);
  ctx.stroke();

  for (let i = 0; i < n; i++) {
    const px = startX + i * abstand;
    const geschafft = i < karte.aktuell;
    const aktuell = i === karte.aktuell;

    ctx.beginPath();
    ctx.arc(px, y, aktuell ? 10 : 8, 0, Math.PI * 2);
    ctx.fillStyle = geschafft ? '#ffd27d' : aktuell ? '#f3e9f7' : 'rgba(10, 8, 18, 0.7)';
    ctx.fill();
    if (aktuell) {
      const puls = 12 + 3 * Math.sin(performance.now() / 180);
      ctx.strokeStyle = 'rgba(255, 210, 125, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, y, puls, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = aktuell ? '#ffd27d' : 'rgba(243, 233, 247, 0.6)';
    ctx.font = aktuell ? 'bold 13px system-ui, sans-serif' : '13px system-ui, sans-serif';
    ctx.fillText(karte.stationen[i], px, y + 30);
  }
}

export function zeichneStory(ctx, text, karte) {
  const mitte = CONFIG.canvas.breite / 2;
  schleier(ctx, 0.68);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 235, 200, 0.95)';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('DER SCHATTENPFAD', mitte, 110);

  if (karte) zeichneKarte(ctx, karte, 165);

  ctx.fillStyle = 'rgba(243, 233, 247, 0.92)';
  ctx.font = '22px system-ui, sans-serif';
  textBlock(ctx, text, 250, 660, 35);

  ctx.fillStyle = 'rgba(243, 233, 247, 0.55)';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('Enter / Tippen — weiter', mitte, 480);
  ctx.textAlign = 'left';
}

export function zeichneGegnerWahl(ctx, charakter, zeit) {
  const mitte = CONFIG.canvas.breite / 2;
  schleier(ctx, 0.35);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 235, 200, 0.95)';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText('FREIER KAMPF', mitte, 110);

  // Der gewählte Gegner steht atmend in seiner eigenen Arena
  const pose = poseZumZeitpunkt('stehen', zeit);
  zeichneSkelett(ctx, mitte, CONFIG.physik.bodenY, -1, pose, {
    skalierung: charakter.skalierung,
    waffe: charakter.waffe,
    extras: charakter.extras,
  });

  ctx.fillStyle = '#ffd27d';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(`◂  ${charakter.name}  ▸`, mitte, 180);
  ctx.fillStyle = 'rgba(243, 233, 247, 0.8)';
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText(charakter.beschreibung, mitte, 214);

  ctx.fillStyle = 'rgba(243, 233, 247, 0.55)';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('← → Gegner wählen · Enter kämpfen · Esc zurück', mitte, 510);
  ctx.textAlign = 'left';
}
