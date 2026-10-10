import { CONFIG } from './config.js';

// Zeichnet einen Kämpfer als schwarze Silhouette aus dicken, runden Linien.
// Winkel-Konvention: 0 = senkrecht (Gliedmaßen hängen nach unten, Rumpf zeigt nach oben),
// positive Winkel drehen nach vorn in Blickrichtung. So funktioniert die Pose
// unabhängig davon, ob der Kämpfer nach links oder rechts schaut.
export function zeichneSkelett(ctx, x, fussY, blick, pose, einfaerbung = null) {
  const s = CONFIG.skelett;
  const hx = x;
  const hy = fussY - s.hueftHoehe * pose.hueftFaktor;

  // Endpunkt eines Knochens per Vorwärtskinematik
  const ende = (px, py, winkel, laenge, nachOben = false) => [
    px + Math.sin(winkel) * laenge * blick,
    py + Math.cos(winkel) * laenge * (nachOben ? -1 : 1),
  ];

  const knochen = (ax, ay, bx, by, breite, farbe) => {
    ctx.strokeStyle = farbe;
    ctx.lineWidth = breite;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  };

  // Rumpf hoch zur Schulter, darüber der Kopf
  const [sx, sy] = ende(hx, hy, pose.rumpf, s.rumpfLaenge, true);
  const [kx, ky] = ende(sx, sy, pose.rumpf + pose.kopf, s.halsLaenge + s.kopfRadius, true);

  const arm = (schulter, ellbogen, farbe) => {
    const [ex, ey] = ende(sx, sy, schulter, s.oberarm);
    const [wx, wy] = ende(ex, ey, schulter + ellbogen, s.unterarm);
    knochen(sx, sy, ex, ey, s.linienBreite, farbe);
    knochen(ex, ey, wx, wy, s.linienBreite, farbe);
  };

  const bein = (huefte, knie, farbe) => {
    // Das Knie beugt nach hinten, deshalb wird der Knie-Winkel abgezogen.
    const [ex, ey] = ende(hx, hy, huefte, s.oberschenkel);
    const [fx, fy] = ende(ex, ey, huefte - knie, s.unterschenkel);
    knochen(hx, hy, ex, ey, s.linienBreite * 1.1, farbe);
    knochen(ex, ey, fx, fy, s.linienBreite * 1.1, farbe);
  };

  // Hintere Gliedmaßen minimal heller — gibt der Silhouette Tiefe.
  // Bei einem Treffer wird die ganze Figur kurz eingefärbt (Hit-Flash).
  const hinten = einfaerbung ?? '#1f1f28';
  const vorn = einfaerbung ?? '#0a0a0f';

  bein(pose.hHuefte, pose.hKnie, hinten);
  arm(pose.hSchulter, pose.hEllbogen, hinten);

  knochen(hx, hy, sx, sy, s.linienBreite * 1.7, vorn);
  ctx.fillStyle = vorn;
  ctx.beginPath();
  ctx.arc(kx, ky, s.kopfRadius, 0, Math.PI * 2);
  ctx.fill();

  bein(pose.vHuefte, pose.vKnie, vorn);
  arm(pose.vSchulter, pose.vEllbogen, vorn);
}
