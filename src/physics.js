import { CONFIG } from './config.js';

export function wendePhysikAn(k, dt) {
  const P = CONFIG.physik;
  k.vy += P.schwerkraft * dt;
  k.x += k.vx * dt;
  k.y += k.vy * dt;

  if (k.y >= P.bodenY) {
    k.y = P.bodenY;
    k.vy = 0;
  }
  k.x = Math.max(P.randLinks, Math.min(P.randRechts, k.x));
}

// Verhindert, dass die Kämpfer ineinander stehen: beide werden sanft auseinandergeschoben.
export function trenneKaempfer(a, b) {
  if (!a.lebt() || !b.lebt()) return;
  // Sobald einer in der Luft ist, darf man über- und durcheinander hinweg —
  // so kann man wie in Shadow Fight über den Gegner springen und die Seite wechseln.
  if (!a.amBoden() || !b.amBoden()) return;
  // Spezial-Dashes (Liths Klingentanz!) dürfen durch den Gegner hindurch
  if (a.zustand === 'spezial' || b.zustand === 'spezial') return;
  const P = CONFIG.physik;
  const abstand = b.x - a.x;
  if (Math.abs(abstand) >= P.minAbstand) return;

  const schub = (P.minAbstand - Math.abs(abstand)) / 2;
  const richtung = abstand >= 0 ? 1 : -1;
  a.x -= richtung * schub;
  b.x += richtung * schub;
  a.x = Math.max(P.randLinks, Math.min(P.randRechts, a.x));
  b.x = Math.max(P.randLinks, Math.min(P.randRechts, b.x));
}
