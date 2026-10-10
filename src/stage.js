import { CONFIG } from './config.js';

// Arena "Aschenpass": Abendhimmel über Bergen, alles als Silhouetten-Ebenen.
// In Phase 2 werden die Ebenen durch fal-generierte Bilder mit Parallax ersetzt.

const BERGE_FERN = [
  [0, 300], [90, 225], [200, 285], [310, 195], [430, 275],
  [560, 215], [680, 285], [800, 205], [960, 265], [960, 540], [0, 540],
];

const HUEGEL_NAH = [
  [0, 385], [140, 335], [300, 375], [470, 325], [640, 375],
  [820, 335], [960, 370], [960, 540], [0, 540],
];

function silhouette(ctx, punkte, farbe) {
  ctx.fillStyle = farbe;
  ctx.beginPath();
  ctx.moveTo(punkte[0][0], punkte[0][1]);
  for (let i = 1; i < punkte.length; i++) ctx.lineTo(punkte[i][0], punkte[i][1]);
  ctx.closePath();
  ctx.fill();
}

export function zeichneStage(ctx) {
  const { breite, hoehe } = CONFIG.canvas;

  // Abendhimmel als Farbverlauf
  const himmel = ctx.createLinearGradient(0, 0, 0, hoehe);
  himmel.addColorStop(0, '#2b1a4e');
  himmel.addColorStop(0.45, '#8e3b6b');
  himmel.addColorStop(0.75, '#e8734a');
  himmel.addColorStop(1, '#f5a65b');
  ctx.fillStyle = himmel;
  ctx.fillRect(0, 0, breite, hoehe);

  // Tiefstehende Sonne
  ctx.fillStyle = 'rgba(255, 220, 160, 0.9)';
  ctx.beginPath();
  ctx.arc(breite * 0.72, 320, 55, 0, Math.PI * 2);
  ctx.fill();

  silhouette(ctx, BERGE_FERN, 'rgba(60, 30, 80, 0.55)');
  silhouette(ctx, HUEGEL_NAH, 'rgba(40, 20, 55, 0.8)');

  // Kampfboden
  ctx.fillStyle = '#17101f';
  ctx.fillRect(0, CONFIG.physik.bodenY, breite, hoehe - CONFIG.physik.bodenY);
}
