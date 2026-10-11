import { CONFIG } from './config.js';

// Farbe heller/dunkler machen — versteht '#rrggbb' UND 'rgb(r, g, b)'
function toene(farbe, faktor) {
  let r;
  let g;
  let b;
  if (farbe.startsWith('#')) {
    r = parseInt(farbe.slice(1, 3), 16);
    g = parseInt(farbe.slice(3, 5), 16);
    b = parseInt(farbe.slice(5, 7), 16);
  } else {
    [r, g, b] = farbe.match(/\d+/g).map(Number);
  }
  const f = (w) => Math.min(255, Math.round(w * faktor));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

const dunkler = toene;

// Klingen-/Holzfarben der Waffen
const WAFFEN_FARBEN = {
  schwert: '#aeb6c4',
  dolch: '#49404f',
  stab: '#6b4a32',
};

// Zeichnet einen Kämpfer als farbige Figur: geformter Oberkörper, Becken,
// Gürtel, Fäuste, Schuhe und Haar — kein Strichmännchen mehr.
// Winkel-Konvention: 0 = senkrecht (Gliedmaßen hängen nach unten, Rumpf zeigt
// nach oben), positive Winkel drehen nach vorn in Blickrichtung.
//
// optionen: { einfaerbung, skalierung, waffe, extras, farben }
// farben = { haut, oben, unten, akzent, haar? }
export function zeichneSkelett(ctx, x, fussY, blick, pose, optionen = {}) {
  const { einfaerbung = null, skalierung = 1, waffe = null, extras = [], farben = null, kopfBild = null } = optionen;
  const s = CONFIG.skelett;
  const sk = skalierung;
  const hx = x;
  const hy = fussY - s.hueftHoehe * sk * pose.hueftFaktor;

  // Endpunkt eines Knochens per Vorwärtskinematik
  const ende = (px, py, winkel, laenge, nachOben = false) => [
    px + Math.sin(winkel) * laenge * sk * blick,
    py + Math.cos(winkel) * laenge * sk * (nachOben ? -1 : 1),
  ];

  const knochen = (ax, ay, bx, by, breite, farbe) => {
    ctx.strokeStyle = farbe;
    ctx.lineWidth = breite * sk;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  };

  // Gliedmaße im gemalten Look: dunkle Kontur, Grundfarbe und eine
  // Licht-Kante oben — wie ein Pinselstrich mit Licht von oben.
  const glied = (ax, ay, bx, by, breite, farbe) => {
    knochen(ax, ay, bx, by, breite + 3.5, einfaerbung ?? 'rgba(8, 6, 14, 0.6)');
    knochen(ax, ay, bx, by, breite, farbe);
    if (!einfaerbung) {
      const licht = breite * 0.26 * sk;
      knochen(ax, ay - licht, bx, by - licht, breite * 0.38, toene(farbe, 1.35));
    }
  };

  const kreis = (cx, cy, r, farbe) => {
    ctx.fillStyle = farbe;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };

  // Rumpf hoch zur Schulter, darüber der Kopf
  const [sx, sy] = ende(hx, hy, pose.rumpf, s.rumpfLaenge, true);
  const [kx, ky] = ende(sx, sy, pose.rumpf + pose.kopf, s.halsLaenge + s.kopfRadius, true);

  // Farb-Satz: Hit-Flash färbt alles ein, sonst die Charakter-Palette
  const basis = farben ?? { haut: '#0a0a0f', oben: '#0a0a0f', unten: '#0a0a0f', akzent: '#1f1f28', haar: null };
  const F = einfaerbung
    ? { haut: einfaerbung, oben: einfaerbung, unten: einfaerbung, akzent: einfaerbung, haar: null, waffe: einfaerbung }
    : { haar: null, ...basis, waffe: WAFFEN_FARBEN[waffe] ?? '#aeb6c4' };
  const hinten = (farbe, faktor) => einfaerbung ?? dunkler(farbe, faktor);
  const obenHinten = hinten(basis.oben, 0.62);
  const untenHinten = hinten(basis.unten, 0.62);
  const hautHinten = hinten(basis.haut, 0.62);
  const schuhVorn = hinten(basis.unten, 0.45);
  const schuhHinten = hinten(basis.unten, 0.3);

  const zeichneWaffe = (wx, wy, winkel) => {
    const W = CONFIG.waffen[waffe];
    // Richtung, in die der Unterarm zeigt — die Waffe verlängert ihn
    const dx = Math.sin(winkel) * blick;
    const dy = Math.cos(winkel);
    if (waffe === 'schwert') {
      knochen(wx, wy, wx + dx * W.laenge * sk, wy + dy * W.laenge * sk, 7, F.waffe);
      // Parierstange quer zur Klinge
      knochen(wx - dy * 10 * sk, wy + dx * 10 * sk, wx + dy * 10 * sk, wy - dx * 10 * sk, 5, F.waffe);
    } else if (waffe === 'dolch') {
      knochen(wx, wy, wx + dx * W.laenge * sk, wy + dy * W.laenge * sk, 5, F.waffe);
    } else if (waffe === 'stab') {
      // Der Stab wird etwa mittig gehalten und ragt nach beiden Seiten hinaus
      knochen(
        wx - dx * W.laenge * 0.35 * sk, wy - dy * W.laenge * 0.35 * sk,
        wx + dx * W.laenge * 0.65 * sk, wy + dy * W.laenge * 0.65 * sk,
        6, F.waffe,
      );
    }
  };

  const arm = (schulter, ellbogen, farbe, faustFarbe, mitWaffe = false) => {
    const [ex, ey] = ende(sx, sy, schulter, s.oberarm);
    const unterarmWinkel = schulter + ellbogen;
    const [wx, wy] = ende(ex, ey, unterarmWinkel, s.unterarm);
    glied(sx, sy, ex, ey, s.linienBreite, farbe);
    glied(ex, ey, wx, wy, s.linienBreite, farbe);
    kreis(wx, wy, s.linienBreite * 0.55 * sk, faustFarbe); // Faust
    if (mitWaffe && waffe) zeichneWaffe(wx, wy, unterarmWinkel);
  };

  const bein = (huefte, knie, farbe, schuhFarbe) => {
    // Das Knie beugt nach hinten, deshalb wird der Knie-Winkel abgezogen.
    const [ex, ey] = ende(hx, hy, huefte, s.oberschenkel);
    const [fx, fy] = ende(ex, ey, huefte - knie, s.unterschenkel);
    glied(hx, hy, ex, ey, s.linienBreite * 1.1, farbe);
    glied(ex, ey, fx, fy, s.linienBreite * 1.1, farbe);
    knochen(fx, fy, fx + blick * 9 * sk, fy, s.linienBreite * 0.9, schuhFarbe); // Schuh
  };

  // ---- Hintere Gliedmaßen (dunkler → Tiefe) ----
  bein(pose.hHuefte, pose.hKnie, untenHinten, schuhHinten);
  arm(pose.hSchulter, pose.hEllbogen, obenHinten, hautHinten);

  // ---- Rumpf als Form: breite Schultern, schmale Hüfte ----
  const tx = sx - hx;
  const ty = sy - hy;
  const tl = Math.hypot(tx, ty) || 1;
  const qx = -ty / tl; // senkrecht zur Rumpf-Achse
  const qy = tx / tl;
  const schulterBreite = s.linienBreite * 1.05 * sk;
  const hueftBreite = s.linienBreite * 0.78 * sk;
  // Gemalter Rumpf: Verlauf von Licht (vorn-oben) nach Schatten (hinten-unten)
  if (einfaerbung) {
    ctx.fillStyle = einfaerbung;
  } else {
    const verlauf = ctx.createLinearGradient(
      sx + qx * schulterBreite, sy + qy * schulterBreite,
      hx - qx * hueftBreite, hy - qy * hueftBreite,
    );
    verlauf.addColorStop(0, toene(F.oben, 1.3));
    verlauf.addColorStop(0.45, F.oben);
    verlauf.addColorStop(1, toene(F.oben, 0.6));
    ctx.fillStyle = verlauf;
  }
  ctx.beginPath();
  ctx.moveTo(sx + qx * schulterBreite, sy + qy * schulterBreite);
  ctx.lineTo(sx - qx * schulterBreite, sy - qy * schulterBreite);
  ctx.lineTo(hx - qx * hueftBreite, hy - qy * hueftBreite);
  ctx.lineTo(hx + qx * hueftBreite, hy + qy * hueftBreite);
  ctx.closePath();
  ctx.fill();
  kreis(sx, sy, schulterBreite, F.oben);  // runde Schulterpartie
  kreis(hx, hy, hueftBreite, F.unten);    // Becken in Hosenfarbe

  // Gi-Rock: ein Stofflappen am Gürtel, der mit der Beinbewegung mitschwingt —
  // macht aus dem Körper sichtbar Kleidung statt Geometrie
  if (!einfaerbung) {
    const schwung = (pose.vHuefte + pose.hHuefte) * 0.3; // folgt den Beinen
    const laenge = 24 * sk;
    const obenB = hueftBreite * 1.5;
    const untenB = hueftBreite * 1.1;
    const ux = hx + Math.sin(schwung) * laenge * blick;
    const uy = hy + Math.cos(schwung) * laenge;
    ctx.fillStyle = toene(F.oben, 0.8);
    ctx.beginPath();
    ctx.moveTo(hx - obenB, hy);
    ctx.lineTo(hx + obenB, hy);
    ctx.lineTo(ux + untenB, uy);
    ctx.lineTo(ux - untenB, uy);
    ctx.closePath();
    ctx.fill();
  }
  // Gürtel an der Hüfte
  knochen(hx - qx * hueftBreite * 1.15, hy - qy * hueftBreite * 1.15, hx + qx * hueftBreite * 1.15, hy + qy * hueftBreite * 1.15, 4.5, F.akzent);

  // ---- Kopf: gemaltes fal-Kopfbild am Skelett (dreht sich mit) — oder Fallback ----
  if (kopfBild?.bereit && !einfaerbung) {
    const g = s.kopfRadius * sk * 4.6; // die Bilder enthalten Haare/Kapuzen → größer als der Kopfkreis
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate((pose.rumpf + pose.kopf) * 0.5 * blick);
    ctx.scale(blick * (kopfBild.spiegeln ? -1 : 1), 1);
    ctx.drawImage(kopfBild.canvas, -g / 2, -g * 0.45, g, g);
    ctx.restore();
  } else {
    kreis(kx, ky, s.kopfRadius * sk, F.haut);
    if (F.haar) {
      ctx.fillStyle = F.haar;
      ctx.beginPath();
      ctx.arc(kx, ky - 1 * sk, s.kopfRadius * sk * 1.05, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fill();
    }
  }

  // ---- Extras (in der Akzentfarbe; Kopf-Details nur ohne gemalten Kopf) ----
  const vorn = F.akzent;
  const kopfGemalt = kopfBild?.bereit && !einfaerbung;
  if (!kopfGemalt && extras.includes('stirnband')) {
    const bx = kx - blick * s.kopfRadius * sk;
    knochen(bx, ky, bx - blick * 16 * sk, ky + 4 * sk, 3, vorn);
    knochen(bx, ky, bx - blick * 13 * sk, ky + 10 * sk, 3, vorn);
  }
  if (!kopfGemalt && extras.includes('zopf')) {
    const bx = kx - blick * s.kopfRadius * 0.6 * sk;
    knochen(bx, ky - 6 * sk, bx - blick * 11 * sk, ky + 14 * sk, 5, vorn);
  }
  if (!kopfGemalt && extras.includes('irokese')) {
    // drei kurze Stachel auf dem Kopf
    for (let i = -1; i <= 1; i++) {
      knochen(
        kx + blick * i * 5 * sk, ky - s.kopfRadius * sk * 0.6,
        kx + blick * i * 8 * sk, ky - (s.kopfRadius + 9) * sk,
        4, vorn,
      );
    }
  }
  if (!kopfGemalt && extras.includes('kapuze')) {
    ctx.fillStyle = vorn;
    ctx.beginPath();
    ctx.moveTo(kx - blick * (s.kopfRadius + 7) * sk, ky + 7 * sk);
    ctx.lineTo(kx - blick * 2 * sk, ky - (s.kopfRadius + 13) * sk);
    ctx.lineTo(kx + blick * (s.kopfRadius + 5) * sk, ky + 8 * sk);
    ctx.closePath();
    ctx.fill();
  }

  // ---- Vordere Gliedmaßen (volle Farben, Waffe in der vorderen Hand) ----
  bein(pose.vHuefte, pose.vKnie, F.unten, schuhVorn);
  arm(pose.vSchulter, pose.vEllbogen, F.oben, einfaerbung ?? basis.haut, true);
}
