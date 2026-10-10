import { CONFIG } from './config.js';

const BALKEN_BREITE = 340;
const BALKEN_HOEHE = 20;

function lebensbalken(ctx, x, y, kaempfer, gespiegelt) {
  // dunkler Rahmen + leerer (roter) Hintergrund
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(x - 4, y - 4, BALKEN_BREITE + 8, BALKEN_HOEHE + 8);
  ctx.fillStyle = '#541c2a';
  ctx.fillRect(x, y, BALKEN_BREITE, BALKEN_HOEHE);

  const anteil = kaempfer.hp / CONFIG.kaempfer.maxHp;
  ctx.fillStyle = anteil > 0.5 ? '#7ddc6a' : anteil > 0.25 ? '#e8c84a' : '#e06046';
  const fuellung = BALKEN_BREITE * anteil;
  // Der Gegner-Balken leert sich zur Mitte hin (gespiegelt)
  ctx.fillRect(gespiegelt ? x + BALKEN_BREITE - fuellung : x, y, fuellung, BALKEN_HOEHE);

  ctx.fillStyle = '#f3e9f7';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = gespiegelt ? 'right' : 'left';
  ctx.fillText(kaempfer.name, gespiegelt ? x + BALKEN_BREITE : x, y + BALKEN_HOEHE + 20);
}

export function zeichneUI(ctx, spiel) {
  const breite = CONFIG.canvas.breite;
  lebensbalken(ctx, 40, 28, spiel.spieler, false);
  lebensbalken(ctx, breite - 40 - BALKEN_BREITE, 28, spiel.gegner, true);

  ctx.textAlign = 'center';

  // "FIGHT!" am Anfang kurz einblenden
  if (!spiel.vorbei && spiel.zeit < 1.3) {
    const alpha = spiel.zeit < 0.9 ? 1 : (1.3 - spiel.zeit) / 0.4;
    ctx.fillStyle = `rgba(255, 235, 200, ${alpha.toFixed(2)})`;
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.fillText('FIGHT!', breite / 2, 220);
  }

  if (spiel.vorbei) {
    ctx.fillStyle = 'rgba(255, 235, 200, 0.95)';
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillText('K.O.', breite / 2, 215);
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillText(`${spiel.sieger} gewinnt — R für Neustart`, breite / 2, 262);
  }

  ctx.textAlign = 'left';
}
