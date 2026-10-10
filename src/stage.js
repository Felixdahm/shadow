import { CONFIG } from './config.js';

// Arena "Aschenpass": Abendhimmel über Bergen, alles als Silhouetten-Ebenen.
// Jede Ebene bewegt sich unterschiedlich stark mit der Kamera (Parallax):
// ferne Ebenen kaum, nahe Ebenen stark — das erzeugt Tiefe.
// In einem späteren Schritt können die Ebenen durch fal-generierte Bilder ersetzt werden.

// Alle Polygone sind breiter als der Bildschirm, damit beim Kameraschwenk keine Lücken entstehen.
const BERGE_FERN = [
  [-250, 300], [-100, 240], [0, 300], [90, 225], [200, 285], [310, 195], [430, 275],
  [560, 215], [680, 285], [800, 205], [960, 265], [1080, 215], [1210, 280],
  [1210, 540], [-250, 540],
];

const HUEGEL_NAH = [
  [-250, 350], [-90, 390], [0, 385], [140, 335], [300, 375], [470, 325], [640, 375],
  [820, 335], [960, 370], [1100, 340], [1210, 375],
  [1210, 540], [-250, 540],
];

// Vordergrund-Felsen am unteren Rand, laufen VOR den Kämpfern vorbei
const FELSEN_VORN = [
  [-300, 540], [-250, 524], [-160, 536], [-40, 522], [80, 538], [230, 526], [360, 540],
  [520, 525], [660, 538], [790, 523], [930, 537], [1060, 524], [1180, 538], [1260, 540],
];

function silhouette(ctx, punkte, farbe) {
  ctx.fillStyle = farbe;
  ctx.beginPath();
  ctx.moveTo(punkte[0][0], punkte[0][1]);
  for (let i = 1; i < punkte.length; i++) ctx.lineTo(punkte[i][0], punkte[i][1]);
  ctx.closePath();
  ctx.fill();
}

// Zeichnet eine Ebene um ihren Parallax-Anteil verschoben
function ebene(ctx, kameraX, faktor, zeichnen) {
  ctx.save();
  ctx.translate(-kameraX * faktor, 0);
  zeichnen();
  ctx.restore();
}

export function zeichneStage(ctx, kameraX) {
  const { breite, hoehe } = CONFIG.canvas;

  // Abendhimmel als Farbverlauf (bewegt sich nicht)
  const himmel = ctx.createLinearGradient(0, 0, 0, hoehe);
  himmel.addColorStop(0, '#2b1a4e');
  himmel.addColorStop(0.45, '#8e3b6b');
  himmel.addColorStop(0.75, '#e8734a');
  himmel.addColorStop(1, '#f5a65b');
  ctx.fillStyle = himmel;
  ctx.fillRect(-300, 0, breite + 600, hoehe);

  // Tiefstehende Sonne — ganz weit weg, bewegt sich fast gar nicht
  ebene(ctx, kameraX, 0.05, () => {
    ctx.fillStyle = 'rgba(255, 220, 160, 0.9)';
    ctx.beginPath();
    ctx.arc(breite * 0.72, 320, 55, 0, Math.PI * 2);
    ctx.fill();
  });

  ebene(ctx, kameraX, 0.15, () => silhouette(ctx, BERGE_FERN, 'rgba(60, 30, 80, 0.55)'));
  ebene(ctx, kameraX, 0.3, () => silhouette(ctx, HUEGEL_NAH, 'rgba(40, 20, 55, 0.8)'));

  // Kampfboden bewegt sich wie die Kämpfer selbst (Faktor 1)
  ebene(ctx, kameraX, 1, () => {
    ctx.fillStyle = '#17101f';
    ctx.fillRect(-300, CONFIG.physik.bodenY, breite + 600, hoehe - CONFIG.physik.bodenY);
  });
}

// Wird NACH den Kämpfern gezeichnet und bewegt sich schneller als sie (Faktor > 1)
export function zeichneVordergrund(ctx, kameraX) {
  ebene(ctx, kameraX, 1.25, () => silhouette(ctx, FELSEN_VORN, '#0a070f'));
}
