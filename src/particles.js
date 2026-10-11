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

// Staubwolke bei Landungen und Rollen — gibt Bewegungen Gewicht
export function spawnStaub(x, y) {
  for (let i = 0; i < 8; i++) {
    partikel.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y - Math.random() * 8,
      vx: (Math.random() - 0.5) * 90,
      vy: -10 - Math.random() * 35,
      leben: 0.35 + Math.random() * 0.25,
      alter: 0,
      groesse: 4 + Math.random() * 5,
      farbe: 'rgba(169, 158, 194, 0.5)',
      schwebt: true, // Staub fällt nicht, er verweht
    });
  }
}

// Schwebende Schadenszahlen über Treffern
const texte = [];

export function spawnSchadenText(x, y, text, farbe, gross = false) {
  texte.push({ x, y, text, farbe, gross, alter: 0, leben: 0.8, vx: (Math.random() - 0.5) * 36, vy: -95 });
}

export function updatePartikel(dt) {
  for (let i = partikel.length - 1; i >= 0; i--) {
    const p = partikel[i];
    p.alter += dt;
    if (p.alter >= p.leben) {
      partikel.splice(i, 1);
      continue;
    }
    if (!p.schwebt) p.vy += 900 * dt; // leichte Schwerkraft (außer Staub)
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  for (let i = texte.length - 1; i >= 0; i--) {
    const t = texte[i];
    t.alter += dt;
    if (t.alter >= t.leben) {
      texte.splice(i, 1);
      continue;
    }
    t.vy *= Math.exp(-2.5 * dt); // Zahl steigt und bremst ab
    t.x += t.vx * dt;
    t.y += t.vy * dt;
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

  // Schadenszahlen obendrauf
  ctx.textAlign = 'center';
  for (const t of texte) {
    const restleben = 1 - t.alter / t.leben;
    ctx.globalAlpha = Math.min(1, restleben * 1.6);
    ctx.font = `700 ${t.gross ? 30 : 20}px Cinzel, serif`;
    ctx.strokeStyle = 'rgba(8, 6, 14, 0.85)';
    ctx.lineWidth = 4;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.farbe;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function leerePartikel() {
  partikel.length = 0;
  texte.length = 0;
}
