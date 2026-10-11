import { CONFIG } from './config.js';

// Zeichnet einen Kämpfer als schwarze Silhouette aus dicken, runden Linien.
// Winkel-Konvention: 0 = senkrecht (Gliedmaßen hängen nach unten, Rumpf zeigt nach oben),
// positive Winkel drehen nach vorn in Blickrichtung. So funktioniert die Pose
// unabhängig davon, ob der Kämpfer nach links oder rechts schaut.
//
// optionen: { einfaerbung, skalierung, waffe, extras }
// skalierung streckt das ganze Skelett — so entstehen große und kleine Figuren
// aus denselben Posen.
export function zeichneSkelett(ctx, x, fussY, blick, pose, optionen = {}) {
  const { einfaerbung = null, skalierung = 1, waffe = null, extras = [], farbe = null } = optionen;
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

  // Rumpf hoch zur Schulter, darüber der Kopf
  const [sx, sy] = ende(hx, hy, pose.rumpf, s.rumpfLaenge, true);
  const [kx, ky] = ende(sx, sy, pose.rumpf + pose.kopf, s.halsLaenge + s.kopfRadius, true);

  const zeichneWaffe = (wx, wy, winkel, farbeWaffe) => {
    const W = CONFIG.waffen[waffe];
    // Richtung, in die der Unterarm zeigt — die Waffe verlängert ihn
    const dx = Math.sin(winkel) * blick;
    const dy = Math.cos(winkel);
    if (waffe === 'schwert') {
      knochen(wx, wy, wx + dx * W.laenge * sk, wy + dy * W.laenge * sk, 7, farbeWaffe);
      // Parierstange quer zur Klinge
      knochen(wx - dy * 10 * sk, wy + dx * 10 * sk, wx + dy * 10 * sk, wy - dx * 10 * sk, 5, farbeWaffe);
    } else if (waffe === 'dolch') {
      // Kurze Klinge ohne Parierstange — schnell und unauffällig
      knochen(wx, wy, wx + dx * W.laenge * sk, wy + dy * W.laenge * sk, 5, farbeWaffe);
    } else if (waffe === 'stab') {
      // Der Stab wird etwa mittig gehalten und ragt nach beiden Seiten hinaus
      knochen(
        wx - dx * W.laenge * 0.35 * sk, wy - dy * W.laenge * 0.35 * sk,
        wx + dx * W.laenge * 0.65 * sk, wy + dy * W.laenge * 0.65 * sk,
        6, farbeWaffe,
      );
    }
  };

  const arm = (schulter, ellbogen, farbe, mitWaffe = false) => {
    const [ex, ey] = ende(sx, sy, schulter, s.oberarm);
    const unterarmWinkel = schulter + ellbogen;
    const [wx, wy] = ende(ex, ey, unterarmWinkel, s.unterarm);
    knochen(sx, sy, ex, ey, s.linienBreite, farbe);
    knochen(ex, ey, wx, wy, s.linienBreite, farbe);
    if (mitWaffe && waffe) zeichneWaffe(wx, wy, unterarmWinkel, farbe);
  };

  const bein = (huefte, knie, farbe) => {
    // Das Knie beugt nach hinten, deshalb wird der Knie-Winkel abgezogen.
    const [ex, ey] = ende(hx, hy, huefte, s.oberschenkel);
    const [fx, fy] = ende(ex, ey, huefte - knie, s.unterschenkel);
    knochen(hx, hy, ex, ey, s.linienBreite * 1.1, farbe);
    knochen(ex, ey, fx, fy, s.linienBreite * 1.1, farbe);
  };

  // Hintere Gliedmaßen minimal heller — gibt der Silhouette Tiefe.
  // Charaktere können eine eigene Grundfarbe haben (z. B. der violette Endboss).
  // Bei einem Treffer wird die ganze Figur kurz eingefärbt (Hit-Flash).
  const hinten = einfaerbung ?? farbe?.hinten ?? '#1f1f28';
  const vorn = einfaerbung ?? farbe?.vorn ?? '#0a0a0f';

  bein(pose.hHuefte, pose.hKnie, hinten);
  arm(pose.hSchulter, pose.hEllbogen, hinten);

  knochen(hx, hy, sx, sy, s.linienBreite * 1.7, vorn);
  ctx.fillStyle = vorn;
  ctx.beginPath();
  ctx.arc(kx, ky, s.kopfRadius * sk, 0, Math.PI * 2);
  ctx.fill();

  // Silhouetten-Extras: kleine Umriss-Details machen aus demselben Skelett andere Figuren
  if (extras.includes('stirnband')) {
    const bx = kx - blick * s.kopfRadius * sk;
    knochen(bx, ky, bx - blick * 16 * sk, ky + 4 * sk, 3, vorn);
    knochen(bx, ky, bx - blick * 13 * sk, ky + 10 * sk, 3, vorn);
  }
  if (extras.includes('zopf')) {
    const bx = kx - blick * s.kopfRadius * 0.6 * sk;
    knochen(bx, ky - 6 * sk, bx - blick * 11 * sk, ky + 14 * sk, 5, vorn);
  }
  if (extras.includes('irokese')) {
    // drei kurze Stachel auf dem Kopf
    for (let i = -1; i <= 1; i++) {
      knochen(
        kx + blick * i * 5 * sk, ky - s.kopfRadius * sk * 0.6,
        kx + blick * i * 8 * sk, ky - (s.kopfRadius + 9) * sk,
        4, vorn,
      );
    }
  }
  if (extras.includes('kapuze')) {
    ctx.fillStyle = vorn;
    ctx.beginPath();
    ctx.moveTo(kx - blick * (s.kopfRadius + 7) * sk, ky + 7 * sk);
    ctx.lineTo(kx - blick * 2 * sk, ky - (s.kopfRadius + 13) * sk);
    ctx.lineTo(kx + blick * (s.kopfRadius + 5) * sk, ky + 8 * sk);
    ctx.closePath();
    ctx.fill();
  }

  bein(pose.vHuefte, pose.vKnie, vorn);
  arm(pose.vSchulter, pose.vEllbogen, vorn, true); // Waffe liegt in der vorderen Hand
}
