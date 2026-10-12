// Puppen-Renderer: hängt die Teile eines generierten Charakter-Bilds an das
// Animations-Skelett (wie Spine). Jedes Teil kennt sein Quell-Rechteck im Bild
// und zwei Anker (von → bis), die auf die Skelett-Gelenke abgebildet werden —
// daraus ergeben sich Drehung und Skalierung automatisch.
import { CONFIG } from './config.js';
import { ladeBild } from './bilder.js';

// Quell-Koordinaten im Blender-Teileblatt (vom Render-Skript exakt berechnet —
// jedes Teil liegt einzeln auf transparentem Grund, keine Nachbar-Reste)
const JURO_TEILE = {
  kopf:       { x: 737, y: 82,  w: 246, h: 184, von: [860, 241], bis: [860, 108] },
  torso:      { x: 522, y: 195, w: 205, h: 245, von: [625, 246], bis: [625, 389] },
  oberarm:    { x: 358, y: 179, w: 103, h: 164, von: [410, 205], bis: [410, 317] },
  unterarm:   { x: 230, y: 179, w: 93,  h: 154, von: [276, 205], bis: [276, 307] },
  schenkel:   { x: 358, y: 425, w: 103, h: 184, von: [410, 451], bis: [410, 584] },
  schienbein: { x: 189, y: 425, w: 113, h: 184, von: [246, 451], bis: [246, 584] },
};

export const PUPPEN = {
  juro: { bild: ladeBild('assets/teile/juro-blender.png'), teile: JURO_TEILE },
};

export function puppeBereit(name) {
  return PUPPEN[name]?.bild.bereit ?? false;
}

export function zeichnePuppe(ctx, x, fussY, blick, pose, puppe, skalierung = 1) {
  const s = CONFIG.skelett;
  const sk = skalierung;

  // Gelenke in lokalen Koordinaten (Blick nach rechts); gespiegelt wird per Transform
  const ende = (p, winkel, laenge, nachOben = false) => [
    p[0] + Math.sin(winkel) * laenge * sk,
    p[1] + Math.cos(winkel) * laenge * sk * (nachOben ? -1 : 1),
  ];

  const huefte = [0, fussY - s.hueftHoehe * sk * pose.hueftFaktor];
  const schulter = ende(huefte, pose.rumpf, s.rumpfLaenge, true);
  const kopfMitte = ende(schulter, pose.rumpf + pose.kopf, s.halsLaenge + s.kopfRadius, true);
  const hals = [schulter[0] + (kopfMitte[0] - schulter[0]) * 0.3, schulter[1] + (kopfMitte[1] - schulter[1]) * 0.3];
  const kopfOben = [kopfMitte[0] + (kopfMitte[0] - schulter[0]), kopfMitte[1] + (kopfMitte[1] - schulter[1])];

  const elleV = ende(schulter, pose.vSchulter, s.oberarm);
  const handV = ende(elleV, pose.vSchulter + pose.vEllbogen, s.unterarm);
  const elleH = ende(schulter, pose.hSchulter, s.oberarm);
  const handH = ende(elleH, pose.hSchulter + pose.hEllbogen, s.unterarm);
  const knieV = ende(huefte, pose.vHuefte, s.oberschenkel);
  const fussV = ende(knieV, pose.vHuefte - pose.vKnie, s.unterschenkel);
  const knieH = ende(huefte, pose.hHuefte, s.oberschenkel);
  const fussH = ende(knieH, pose.hHuefte - pose.hKnie, s.unterschenkel);

  const img = puppe.bild.img;

  // Ein Bildteil so zeichnen, dass seine Anker auf die Zielgelenke fallen
  const teil = (name, A, B, dunkel = false) => {
    const t = puppe.teile[name];
    const quellWinkel = Math.atan2(t.bis[1] - t.von[1], t.bis[0] - t.von[0]);
    const zielWinkel = Math.atan2(B[1] - A[1], B[0] - A[0]);
    const faktor = Math.hypot(B[0] - A[0], B[1] - A[1]) / Math.hypot(t.bis[0] - t.von[0], t.bis[1] - t.von[1]);
    ctx.save();
    ctx.translate(A[0], A[1]);
    ctx.rotate(zielWinkel - quellWinkel);
    ctx.scale(faktor, faktor);
    if (dunkel) ctx.filter = 'brightness(0.55)';
    ctx.drawImage(img, t.x, t.y, t.w, t.h, -(t.von[0] - t.x), -(t.von[1] - t.y), t.w, t.h);
    if (dunkel) ctx.filter = 'none';
    ctx.restore();
  };

  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(blick, 1); // Blick nach links = ganze Puppe spiegeln

  // Zeichen-Reihenfolge: hinten → vorn; der Mantel (Torso) liegt über den Hüftgelenken
  teil('oberarm', schulter, elleH, true);   // hintere Gliedmaßen: gleiche Teile, abgedunkelt
  teil('unterarm', elleH, handH, true);
  teil('schenkel', huefte, knieH, true);
  teil('schienbein', knieH, fussH, true);
  teil('schenkel', huefte, knieV);
  teil('schienbein', knieV, fussV);
  teil('torso', schulter, huefte);
  teil('kopf', hals, kopfOben);
  teil('oberarm', schulter, elleV);
  teil('unterarm', elleV, handV);

  ctx.restore();
}
