import { CONFIG } from './config.js';

// Jede Station des Schattenpfads hat ihre eigene Arena mit eigener Farbwelt.
// Eine Arena besteht aus: generierter Kulisse (Himmel + ferne Berge),
// freigestellter Hügel-Ebene (Parallax) und Farben für Boden/Vordergrund.
// Jede Ebene bewegt sich unterschiedlich stark mit der Kamera (Parallax):
// ferne Ebenen kaum, nahe Ebenen stark — das erzeugt Tiefe.

function ladeBild(pfad) {
  const bild = { img: new Image(), bereit: false };
  bild.img.onload = () => { bild.bereit = true; };
  bild.img.src = pfad;
  return bild;
}

// Lädt eine Silhouette auf weißem Grund, macht das Weiß transparent und
// kann die Silhouette zusätzlich abdunkeln (für zu helle Generierungen).
function ladeFreigestellt(pfad, abdunkeln = 1) {
  const ebene = { canvas: null, bereit: false };
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const cctx = c.getContext('2d');
    cctx.drawImage(img, 0, 0);
    const daten = cctx.getImageData(0, 0, c.width, c.height);
    const px = daten.data;
    for (let i = 0; i < px.length; i += 4) {
      const helligkeit = (px[i] + px[i + 1] + px[i + 2]) / 3;
      if (helligkeit > 235) px[i + 3] = 0; // fast weiß → unsichtbar
      else if (helligkeit > 180) px[i + 3] = Math.round(255 * ((235 - helligkeit) / 55)); // weicher Rand
      px[i] *= abdunkeln;
      px[i + 1] *= abdunkeln;
      px[i + 2] *= abdunkeln;
    }
    cctx.putImageData(daten, 0, 0);
    ebene.canvas = c;
    ebene.bereit = true;
  };
  img.src = pfad;
  return ebene;
}

// Lichtfarbe jeder Arena — färbt die Leucht-Kante (Rim-Light) der Silhouetten
export const ARENA_RIM = {
  aschenpass: '#F5A65B',
  mondhain: '#A8D8E8',
  glutschmiede: '#FF9A4D',
  nebelschlucht: '#9FD0C0',
  leere: '#8A5CF6',
};

const ARENEN = {
  aschenpass: {
    himmel: ladeBild('assets/backgrounds/aschenpass-himmel.png'),
    huegel: ladeFreigestellt('assets/backgrounds/aschenpass-huegel.png'),
    fallbackHimmel: ['#2b1a4e', '#8e3b6b', '#e8734a', '#f5a65b'],
    boden: '#17101f',
    vordergrund: '#0a070f',
  },
  mondhain: {
    himmel: ladeBild('assets/backgrounds/mondhain-himmel.png'),
    huegel: ladeFreigestellt('assets/backgrounds/mondhain-huegel.png'),
    fallbackHimmel: ['#060a1c', '#0d1733', '#16254d', '#1d3461'],
    boden: '#0a0f1e',
    vordergrund: '#04060f',
  },
  nebelschlucht: {
    himmel: ladeBild('assets/backgrounds/nebelschlucht-himmel.png'),
    huegel: ladeFreigestellt('assets/backgrounds/nebelschlucht-huegel.png', 0.4),
    fallbackHimmel: ['#1a2626', '#27403c', '#3c5a52', '#4e6e62'],
    boden: '#0e1517',
    vordergrund: '#060b0c',
  },
  // Für die beiden neuen Arenen gibt es noch keine generierten Bilder —
  // bis dahin zeichnet der Fallback (Farbverlauf + Silhouetten) die Stimmung.
  glutschmiede: {
    himmel: ladeBild('assets/backgrounds/glutschmiede-himmel.png'),
    huegel: ladeFreigestellt('assets/backgrounds/glutschmiede-huegel.png', 0.5),
    fallbackHimmel: ['#1c0a08', '#4a1410', '#8a2c14', '#d4551e'],
    boden: '#140808',
    vordergrund: '#090404',
  },
  leere: {
    himmel: ladeBild('assets/backgrounds/leere-himmel.png'),
    huegel: ladeFreigestellt('assets/backgrounds/leere-huegel.png', 0.5),
    fallbackHimmel: ['#050308', '#120a24', '#1f1240', '#190f33'],
    boden: '#07040d',
    vordergrund: '#030207',
  },
};

// Fallback-Silhouetten, solange die Bilder noch laden.
// Breiter als der Bildschirm, damit beim Kameraschwenk keine Lücken entstehen.
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

export function zeichneStage(ctx, kameraX, arenaName = 'aschenpass') {
  const arena = ARENEN[arenaName] ?? ARENEN.aschenpass;
  const { breite, hoehe } = CONFIG.canvas;

  if (arena.himmel.bereit) {
    // Generierte Kulisse: Himmel, Licht und ferne Berge in einem Bild, kaum Parallax
    ebene(ctx, kameraX, 0.08, () => {
      ctx.drawImage(arena.himmel.img, -200, 0, breite + 400, hoehe);
    });
  } else {
    // Fallback: Farbverlauf aus der Arena-Palette
    const [a, b, c, d] = arena.fallbackHimmel;
    const himmel = ctx.createLinearGradient(0, 0, 0, hoehe);
    himmel.addColorStop(0, a);
    himmel.addColorStop(0.45, b);
    himmel.addColorStop(0.75, c);
    himmel.addColorStop(1, d);
    ctx.fillStyle = himmel;
    ctx.fillRect(-300, 0, breite + 600, hoehe);

    ebene(ctx, kameraX, 0.15, () => silhouette(ctx, BERGE_FERN, 'rgba(20, 15, 35, 0.55)'));
  }

  if (arena.huegel.bereit) {
    // Freigestellte Silhouetten-Ebene (Hügel, Bäume oder Klippen) in der Mitte
    ebene(ctx, kameraX, 0.3, () => {
      ctx.drawImage(arena.huegel.canvas, -200, 240, breite + 400, 300);
    });
  } else {
    ebene(ctx, kameraX, 0.3, () => silhouette(ctx, HUEGEL_NAH, 'rgba(15, 10, 25, 0.8)'));
  }

  // Kampfboden bewegt sich wie die Kämpfer selbst (Faktor 1)
  ebene(ctx, kameraX, 1, () => {
    ctx.fillStyle = arena.boden;
    ctx.fillRect(-300, CONFIG.physik.bodenY, breite + 600, hoehe - CONFIG.physik.bodenY);
  });
}

// Wird NACH den Kämpfern gezeichnet und bewegt sich schneller als sie (Faktor > 1)
export function zeichneVordergrund(ctx, kameraX, arenaName = 'aschenpass') {
  const arena = ARENEN[arenaName] ?? ARENEN.aschenpass;
  ebene(ctx, kameraX, 1.25, () => silhouette(ctx, FELSEN_VORN, arena.vordergrund));
}

// Atmosphären-Partikel pro Arena: Funken, Glühwürmchen, Asche, Nebel, Schatten-Motten.
// Bewusst ZUSTANDSLOS: jede Position wird aus Index und Uhrzeit berechnet —
// kein Update nötig, läuft einfach immer.
const AMBIENTE = {
  aschenpass:    { farbe: 'rgba(235, 190, 150,', anzahl: 20, tempo: 13, steigt: false, groesse: 2.2 }, // sinkende Asche
  mondhain:      { farbe: 'rgba(190, 235, 180,', anzahl: 14, tempo: 6,  steigt: true,  groesse: 2.6 }, // Glühwürmchen
  glutschmiede:  { farbe: 'rgba(255, 150, 70,',  anzahl: 28, tempo: 28, steigt: true,  groesse: 2.4 }, // Funken
  nebelschlucht: { farbe: 'rgba(205, 225, 215,', anzahl: 9,  tempo: 7,  steigt: true,  groesse: 16 },  // Nebelschwaden
  leere:         { farbe: 'rgba(150, 110, 220,', anzahl: 18, tempo: 10, steigt: true,  groesse: 2.2 }, // Schatten-Motten
};

export function zeichneAmbiente(ctx, arenaName, kameraX) {
  const a = AMBIENTE[arenaName] ?? AMBIENTE.aschenpass;
  const t = performance.now() / 1000;
  for (let i = 0; i < a.anzahl; i++) {
    const basisX = ((i * 379) % 1260) - 150;
    const x = basisX + Math.sin(t * 0.4 + i * 1.7) * 30 - kameraX * 0.6;
    const lauf = (i * 97 + t * a.tempo) % 580;
    const y = a.steigt ? 560 - lauf : lauf - 20;
    const alpha = (0.22 + 0.18 * Math.sin(t + i)) * (a.groesse > 5 ? 0.3 : 1);
    ctx.fillStyle = `${a.farbe}${Math.max(0.05, alpha).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x, y, a.groesse + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
}
