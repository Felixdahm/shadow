// Puppen-Renderer (Masken-Pipeline):
// Blender rendert die ZUSAMMENGEBAUTE Figur + pro Körperteil eine Maske an
// identischer Position. Die KI übermalt die Figur (gemalt.png). Hier werden die
// bemalten Teile pixelgenau per Maske ausgestanzt und an die Skelett-Gelenke
// gehängt. Vordere Teile stanzen ihr Gebiet aus dahinter liegenden Masken aus,
// damit Überlappungs-Pixel eindeutig gehören.
import { CONFIG } from './config.js';
import { ladeBild } from './bilder.js';

// Gelenk-Pixel im 1024er-Render (vom Blender-Skript exakt ausgegeben)
const GELENKE = {
  schulter: [474, 384], huefte: [474, 563], hals: [474, 369], scheitel: [474, 198],
  elle: [573, 484], hand: [664, 574],
  knieV: [541, 715], fussV: [619, 862], knieH: [406, 715], fussH: [328, 862],
};

// Teil → [von-Gelenk, bis-Gelenk]
const TEIL_ANKER = {
  beinH_O: ['huefte', 'knieH'], beinH_U: ['knieH', 'fussH'],
  beinV_O: ['huefte', 'knieV'], beinV_U: ['knieV', 'fussV'],
  torso: ['schulter', 'huefte'], kopf: ['hals', 'scheitel'],
  armO: ['schulter', 'elle'], armU: ['elle', 'hand'],
};

// Zeichen-/Stanz-Reihenfolge: hinten → vorn
const REIHENFOLGE = ['beinH_U', 'beinH_O', 'beinV_U', 'beinV_O', 'torso', 'kopf', 'armO', 'armU'];

const farbBild = ladeBild('assets/teile/juro/gemalt.png');
const masken = {};
for (const n of REIHENFOLGE) masken[n] = ladeBild(`assets/teile/juro/maske-${n}.png`);

let teileCache = null;

function baueTeile() {
  if (teileCache) return teileCache;
  if (!farbBild.bereit || REIHENFOLGE.some((n) => !masken[n].bereit)) return null;

  // 1. Masken bereinigen: Alles, was weiter vorn gezeichnet wird, aus den
  //    hinteren Masken ausstanzen (Überlappung an Schulter/Hüfte)
  const bereinigt = {};
  for (let i = 0; i < REIHENFOLGE.length; i++) {
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const g = c.getContext('2d');
    g.drawImage(masken[REIHENFOLGE[i]].img, 0, 0);
    g.globalCompositeOperation = 'destination-out';
    for (let j = i + 1; j < REIHENFOLGE.length; j++) g.drawImage(masken[REIHENFOLGE[j]].img, 0, 0);
    bereinigt[REIHENFOLGE[i]] = c;
  }

  // 2. Pro Teil: Bounding-Box finden, bemaltes Bild per Maske ausstanzen, zuschneiden
  teileCache = {};
  for (const n of REIHENFOLGE) {
    const m = bereinigt[n];
    const d = m.getContext('2d').getImageData(0, 0, 1024, 1024).data;
    let minX = 1024;
    let minY = 1024;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < 1024; y += 2) {
      for (let x = 0; x < 1024; x += 2) {
        if (d[(y * 1024 + x) * 4 + 3] > 40) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    minX = Math.max(0, minX - 5);
    minY = Math.max(0, minY - 5);
    const b = Math.min(1023, maxX + 5) - minX;
    const h = Math.min(1023, maxY + 5) - minY;

    const teil = document.createElement('canvas');
    teil.width = b;
    teil.height = h;
    const tg = teil.getContext('2d');
    tg.drawImage(m, minX, minY, b, h, 0, 0, b, h);
    tg.globalCompositeOperation = 'source-in';
    tg.drawImage(farbBild.img, minX, minY, b, h, 0, 0, b, h);

    const [vonName, bisName] = TEIL_ANKER[n];
    teileCache[n] = {
      canvas: teil,
      von: [GELENKE[vonName][0] - minX, GELENKE[vonName][1] - minY],
      bis: [GELENKE[bisName][0] - minX, GELENKE[bisName][1] - minY],
    };
  }
  return teileCache;
}

export const PUPPEN = { juro: {} }; // Kompatibilität zur Aufruf-Signatur

// Solange die Puppe nicht perfekt ist, bleibt sie abgeschaltet —
// das Spiel zeigt die Edel-Silhouette (Workflow: perfektionieren, dann aktivieren)
const PUPPE_AKTIV = false;

export function puppeBereit(name) {
  return PUPPE_AKTIV && name === 'juro' && !!baueTeile();
}

export function zeichnePuppe(ctx, x, fussY, blick, pose, _puppe, skalierung = 1) {
  const teile = baueTeile();
  if (!teile) return;
  const s = CONFIG.skelett;
  const sk = skalierung;

  const ende = (p, winkel, laenge, nachOben = false) => [
    p[0] + Math.sin(winkel) * laenge * sk,
    p[1] + Math.cos(winkel) * laenge * sk * (nachOben ? -1 : 1),
  ];

  const huefte = [0, fussY - s.hueftHoehe * sk * pose.hueftFaktor];
  const schulter = ende(huefte, pose.rumpf, s.rumpfLaenge, true);
  const kopfMitte = ende(schulter, pose.rumpf + pose.kopf, s.halsLaenge + s.kopfRadius, true);
  const hals = [schulter[0] + (kopfMitte[0] - schulter[0]) * 0.25, schulter[1] + (kopfMitte[1] - schulter[1]) * 0.25];
  const scheitel = [kopfMitte[0] + (kopfMitte[0] - schulter[0]) * 0.9, kopfMitte[1] + (kopfMitte[1] - schulter[1]) * 0.9];
  const elleV = ende(schulter, pose.vSchulter, s.oberarm);
  const handV = ende(elleV, pose.vSchulter + pose.vEllbogen, s.unterarm);
  const elleH = ende(schulter, pose.hSchulter, s.oberarm);
  const handH = ende(elleH, pose.hSchulter + pose.hEllbogen, s.unterarm);
  const knieV = ende(huefte, pose.vHuefte, s.oberschenkel);
  const fussV = ende(knieV, pose.vHuefte - pose.vKnie, s.unterschenkel);
  const knieH = ende(huefte, pose.hHuefte, s.oberschenkel);
  const fussH = ende(knieH, pose.hHuefte - pose.hKnie, s.unterschenkel);

  const male = (name, A, B, dunkel = false) => {
    const t = teile[name];
    const quellWinkel = Math.atan2(t.bis[1] - t.von[1], t.bis[0] - t.von[0]);
    const zielWinkel = Math.atan2(B[1] - A[1], B[0] - A[0]);
    const faktor = Math.hypot(B[0] - A[0], B[1] - A[1]) / Math.hypot(t.bis[0] - t.von[0], t.bis[1] - t.von[1]);
    ctx.save();
    ctx.translate(A[0], A[1]);
    ctx.rotate(zielWinkel - quellWinkel);
    ctx.scale(faktor, faktor);
    if (dunkel) ctx.filter = 'brightness(0.62)';
    ctx.drawImage(t.canvas, -t.von[0], -t.von[1]);
    if (dunkel) ctx.filter = 'none';
    ctx.restore();
  };

  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(blick, 1); // Blick nach links = ganze Puppe spiegeln

  male('armO', schulter, elleH, true); // hinterer Arm: gleiche Teile, abgedunkelt
  male('armU', elleH, handH, true);
  male('beinH_O', huefte, knieH, true);
  male('beinH_U', knieH, fussH, true);
  male('beinV_O', huefte, knieV);
  male('beinV_U', knieV, fussV);
  male('torso', schulter, huefte);
  male('kopf', hals, scheitel);
  male('armO', schulter, elleV);
  male('armU', elleV, handV);

  ctx.restore();
}
