import { CONFIG } from './config.js';

const BALKEN_BREITE = 340;
const BALKEN_HOEHE = 20;

function lebensbalken(ctx, x, y, kaempfer, gespiegelt) {
  // dunkler Rahmen + leerer (roter) Hintergrund
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(x - 4, y - 4, BALKEN_BREITE + 8, BALKEN_HOEHE + 8);
  ctx.fillStyle = '#541c2a';
  ctx.fillRect(x, y, BALKEN_BREITE, BALKEN_HOEHE);

  const maxHp = CONFIG.kaempfer.maxHp;

  // Nachlauf-Balken: zeigt hell, wie viel gerade abgezogen wurde
  const geisterBreite = BALKEN_BREITE * (kaempfer.anzeigeHp / maxHp);
  ctx.fillStyle = '#f2e6b8';
  ctx.fillRect(gespiegelt ? x + BALKEN_BREITE - geisterBreite : x, y, geisterBreite, BALKEN_HOEHE);

  const anteil = kaempfer.hp / maxHp;
  ctx.fillStyle = anteil > 0.5 ? '#7ddc6a' : anteil > 0.25 ? '#e8c84a' : '#e06046';
  const fuellung = BALKEN_BREITE * anteil;
  // Der Gegner-Balken leert sich zur Mitte hin (gespiegelt)
  ctx.fillRect(gespiegelt ? x + BALKEN_BREITE - fuellung : x, y, fuellung, BALKEN_HOEHE);

  ctx.fillStyle = '#f3e9f7';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = gespiegelt ? 'right' : 'left';
  ctx.fillText(kaempfer.name, gespiegelt ? x + BALKEN_BREITE : x, y + BALKEN_HOEHE + 20);

  // Runden-Siege als Punkte unter dem Namen
  for (let i = 0; i < CONFIG.runden.gewinneNoetig; i++) {
    const px = gespiegelt ? x + BALKEN_BREITE - 8 - i * 24 : x + 8 + i * 24;
    ctx.beginPath();
    ctx.arc(px, y + BALKEN_HOEHE + 38, 7, 0, Math.PI * 2);
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
    untertitel(ctx, 'R für Neustart');
  }

  ctx.textAlign = 'left';
}
