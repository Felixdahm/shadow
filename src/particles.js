// Funken-Partikel bei Treffern. Jeder Partikel lebt kurz, fliegt weg und fällt.
const partikel = [];

const TREFFER_FARBEN = ['#ffd27d', '#ff9a4d', '#fff3d6'];
const BLOCK_FARBEN = ['#aab4c8', '#7d8aa5', '#d7dde8'];

export function spawnTrefferFunken(x, y, richtung, blockt, ko = false) {
  const anzahl = ko ? 28 : blockt ? 6 : 14;
  const farben = blockt ? BLOCK_FARBEN : TREFFER_FARBEN;

  for (let i = 0; i < anzahl; i++) {
    partikel.push({
      x,
      y,
      // Funken spritzen hauptsächlich in Schlagrichtung weg
      vx: richtung * (80 + Math.random() * 280) + (Math.random() * 2 - 1) * 70,
      vy: -(40 + Math.random() * 240),
      leben: 0.25 + Math.random() * 0.35,
      alter: 0,
      groesse: 2 + Math.random() * 3.5,
      farbe: farben[Math.floor(Math.random() * farben.length)],
    });
  }
}

// Violette Rauchwolke beim Schattenschritt des Endbosses
const SCHATTEN_FARBEN = ['#5b3a8a', '#2b1546', '#8a6cc9'];

export function spawnSchattenWolke(x, y) {
  for (let i = 0; i < 18; i++) {
    partikel.push({
      x: x + (Math.random() - 0.5) * 50,
      y: y + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 140,
      vy: -20 - Math.random() * 70,
      leben: 0.4 + Math.random() * 0.35,
      alter: 0,
      groesse: 4 + Math.random() * 6,
      farbe: SCHATTEN_FARBEN[i % SCHATTEN_FARBEN.length],
    });
  }
}

export function updatePartikel(dt) {
  for (let i = partikel.length - 1; i >= 0; i--) {
    const p = partikel[i];
    p.alter += dt;
    if (p.alter >= p.leben) {
      partikel.splice(i, 1);
      continue;
    }
    p.vy += 900 * dt; // leichte Schwerkraft
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

export function zeichnePartikel(ctx) {
  for (const p of partikel) {
    const restleben = 1 - p.alter / p.leben;
    ctx.globalAlpha = restleben;
    ctx.fillStyle = p.farbe;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.groesse * restleben, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function leerePartikel() {
  partikel.length = 0;
}
