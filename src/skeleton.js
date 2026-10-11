import { CONFIG } from './config.js';
import { holeMuster } from './bilder.js';

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
  const { einfaerbung = null, skalierung = 1, waffe = null, extras = [], farben = null, kopfBild = null, details = null, textur = null, silhouette = null } = optionen;
  const sil = silhouette && !einfaerbung; // Shadow-Fight-Silhouetten-Modus
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

  // Gliedmaße im gemalten Look: dunkle Kontur, gemalte Stoff-Textur (falls
  // geladen) mit Farb-Tönung darüber, dann eine Licht-Kante — wie ein
  // Pinselstrich mit Licht von oben.
  const muster = einfaerbung || sil ? null : holeMuster(ctx, textur);
  const rgba = (farbe, alpha) => {
    const [r, g, b] = (farbe.startsWith('#')
      ? [parseInt(farbe.slice(1, 3), 16), parseInt(farbe.slice(3, 5), 16), parseInt(farbe.slice(5, 7), 16)]
      : farbe.match(/\d+/g).map(Number));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const glied = (ax, ay, bx, by, breite, farbe) => {
    knochen(ax, ay, bx, by, breite + 3.5, einfaerbung ?? 'rgba(8, 6, 14, 0.6)');
    if (muster) {
      // Muster am Gliedmaßen-Anfang verankern, damit die Textur mitläuft
      muster.setTransform(new DOMMatrix().translateSelf(ax, ay).scaleSelf(0.07 * sk));
      knochen(ax, ay, bx, by, breite, muster);
      knochen(ax, ay, bx, by, breite, rgba(farbe, 0.4)); // Farb-Tönung
    } else {
      knochen(ax, ay, bx, by, breite, farbe);
    }
    if (!einfaerbung) {
      // Licht-Kante: im Silhouetten-Modus leuchtet sie in der Arena-Lichtfarbe
      const licht = breite * 0.26 * sk;
      const lichtFarbe = sil ? rgba(silhouette, 0.4) : toene(farbe, 1.35);
      knochen(ax, ay - licht, bx, by - licht, breite * (sil ? 0.26 : 0.38), lichtFarbe);
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

  // Farb-Satz: Hit-Flash färbt alles ein; im Silhouetten-Modus (Shadow-Fight-Look)
  // wird die ganze Figur tiefdunkel, hintere Gliedmaßen LEICHT heller fürs
  // Tiefen-Lesen, und die Licht-Kante leuchtet in der Arena-Lichtfarbe.
  const basis = sil
    ? { haut: '#0d0a14', oben: '#0d0a14', unten: '#0b0812', akzent: '#171020', haar: '#05030a' }
    : (farben ?? { haut: '#0a0a0f', oben: '#0a0a0f', unten: '#0a0a0f', akzent: '#1f1f28', haar: null });
  const F = einfaerbung
    ? { haut: einfaerbung, oben: einfaerbung, unten: einfaerbung, akzent: einfaerbung, haar: null, waffe: einfaerbung }
    : { haar: null, ...basis, waffe: sil ? '#241c33' : (WAFFEN_FARBEN[waffe] ?? '#aeb6c4') };
  const hinten = (farbe, faktor) => einfaerbung ?? (sil ? '#241a36' : dunkler(farbe, faktor));
  const obenHinten = hinten(basis.oben, 0.62);
  const untenHinten = hinten(basis.unten, 0.62);
  const hautHinten = hinten(basis.haut, 0.62);
  const schuhVorn = einfaerbung ?? (sil ? '#0b0812' : dunkler(basis.unten, 0.45));
  const schuhHinten = einfaerbung ?? (sil ? '#241a36' : dunkler(basis.unten, 0.3));

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

  // ---- Charakter-Details (handgebaut, animiert) ----
  // Phase "hinten" = hinter dem Körper (Umhang), Phase "vorn" = darüber (Gurte, Stoff).
  const zeit = performance.now() / 1000;

  const stoffband = (ax, ay, winkel, laenge, breite, farbe) => {
    // ein flatterndes Stoffende: Winkel 0 = hängt senkrecht, flattert mit der Zeit
    const [bx2, by2] = [ax + Math.sin(winkel) * laenge * blick, ay + Math.cos(winkel) * laenge];
    knochen(ax, ay, bx2, by2, breite, farbe);
  };

  const zeichneDetails = (phase) => {
    if (einfaerbung || !details) return;

    if (details === 'dorn' && phase === 'hinten') {
      // Schwerer Umhang, der hinter dem Körper schwingt
      const schwung = Math.sin(zeit * 1.6) * 6 * sk + pose.rumpf * -20 * sk;
      const farbe = toene(F.oben, 0.55);
      ctx.fillStyle = farbe;
      ctx.beginPath();
      ctx.moveTo(sx - blick * 4 * sk, sy - 6 * sk);
      ctx.lineTo(sx - blick * 20 * sk, sy + 10 * sk);
      ctx.lineTo(hx - blick * (34 * sk + schwung), hy + 52 * sk);
      ctx.lineTo(hx - blick * (8 * sk + schwung * 0.4), hy + 56 * sk);
      ctx.lineTo(hx + blick * 2 * sk, hy + 10 * sk);
      ctx.closePath();
      ctx.fill();
    }

    if (phase !== 'vorn') return;

    if (details === 'juro') {
      // Rote Gürtel-Enden, die beim Bewegen flattern + Gi-Kragen
      const knoten = [hx + blick * hueftBreite * 0.7, hy + 2 * sk];
      const flatter = Math.sin(zeit * 5) * 0.18 + pose.vHuefte * 0.25;
      stoffband(knoten[0], knoten[1], -0.25 - flatter, 20 * sk, 4, F.akzent);
      stoffband(knoten[0], knoten[1], -0.55 - flatter, 26 * sk, 4, toene(F.akzent, 0.75));
      knochen(sx + blick * 3 * sk, sy - 3 * sk, sx - blick * 5 * sk, sy + 14 * sk, 4, toene(F.oben, 1.45)); // Kragen
    } else if (details === 'scharr') {
      // Brustgurt quer über den Rumpf + helle Schulterplatte
      knochen(sx + blick * 6 * sk, sy + 2 * sk, hx - blick * 6 * sk, hy - 4 * sk, 5, toene(F.oben, 1.3));
      kreis(sx + blick * 3 * sk, sy - 2 * sk, schulterBreite * 0.7, toene(F.oben, 1.35));
    } else if (details === 'veyra') {
      // Silberne Schärpe + wehendes Schärpen-Ende an der Hüfte
      knochen(sx + blick * 5 * sk, sy + 3 * sk, hx - blick * 5 * sk, hy - 3 * sk, 5.5, F.akzent);
      const flatter = -0.7 + Math.sin(zeit * 4.2) * 0.2 + pose.hHuefte * 0.3;
      stoffband(hx - blick * hueftBreite * 0.6, hy, flatter, 30 * sk, 5, toene(F.akzent, 0.85));
    } else if (details === 'lith') {
      // Zerfetzter Schal, der nach hinten weht + Messer-Riemen am Oberschenkel
      const flatter = -0.9 + Math.sin(zeit * 6) * 0.25;
      stoffband(sx - blick * 4 * sk, sy - 2 * sk, flatter, 24 * sk, 5, F.akzent);
      stoffband(sx - blick * 6 * sk, sy + 2 * sk, flatter - 0.3, 17 * sk, 4, toene(F.akzent, 0.7));
      const [ox, oy] = ende(hx, hy, pose.vHuefte, s.oberschenkel * 0.55);
      knochen(ox - 6 * sk, oy, ox + 6 * sk, oy, 4, toene(F.unten, 0.4));
    } else if (details === 'umbra') {
      // Rauchschwaden, die vom Schattenkörper aufsteigen
      for (let i = 0; i < 3; i++) {
        const lauf = (zeit * 26 + i * 40) % 110;
        const wx2 = hx + Math.sin(zeit * 2 + i * 2.1) * 10 * sk - blick * 6 * sk;
        const wy2 = hy + 10 * sk - lauf * sk;
        ctx.globalAlpha = Math.max(0, 0.3 - lauf / 400);
        kreis(wx2, wy2, (5 + i * 2) * sk, '#8A5CF6');
      }
      ctx.globalAlpha = 1;
    }
  };

  zeichneDetails('hinten');

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
  // Gemalter Rumpf: Stoff-Textur (falls geladen) + Verlauf von Licht nach Schatten
  const rumpfPfad = () => {
    ctx.beginPath();
    ctx.moveTo(sx + qx * schulterBreite, sy + qy * schulterBreite);
    ctx.lineTo(sx - qx * schulterBreite, sy - qy * schulterBreite);
    ctx.lineTo(hx - qx * hueftBreite, hy - qy * hueftBreite);
    ctx.lineTo(hx + qx * hueftBreite, hy + qy * hueftBreite);
    ctx.closePath();
  };
  if (einfaerbung) {
    ctx.fillStyle = einfaerbung;
    rumpfPfad();
    ctx.fill();
  } else {
    if (muster) {
      muster.setTransform(new DOMMatrix().translateSelf(hx, hy).scaleSelf(0.09 * sk));
      ctx.fillStyle = muster;
      rumpfPfad();
      ctx.fill();
    }
    const verlauf = ctx.createLinearGradient(
      sx + qx * schulterBreite, sy + qy * schulterBreite,
      hx - qx * hueftBreite, hy - qy * hueftBreite,
    );
    if (sil) {
      // Silhouette: Schulterpartie fängt etwas Arena-Licht, Rest bleibt tiefdunkel
      verlauf.addColorStop(0, rgba(silhouette, 0.28));
      verlauf.addColorStop(0.3, F.oben);
      verlauf.addColorStop(1, F.oben);
    } else {
      verlauf.addColorStop(0, rgba(toene(F.oben, 1.3), muster ? 0.45 : 1));
      verlauf.addColorStop(0.45, rgba(F.oben, muster ? 0.4 : 1));
      verlauf.addColorStop(1, rgba(toene(F.oben, 0.6), muster ? 0.55 : 1));
    }
    ctx.fillStyle = verlauf;
    rumpfPfad();
    ctx.fill();
  }
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

  // ---- Kopf: gemaltes fal-Kopfbild am Skelett (dreht sich mit) — oder Fallback.
  // Im Silhouetten-Modus immer der Silhouetten-Kopf (mit Glühaugen).
  if (kopfBild?.bereit && !einfaerbung && !sil) {
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
    if (sil) {
      // Glühauge in der Arena-Lichtfarbe — das Markenzeichen der Silhouette
      const ax2 = kx + blick * s.kopfRadius * sk * 0.45;
      const ay2 = ky - 2 * sk;
      kreis(ax2, ay2, 4.5 * sk, rgba(silhouette, 0.25));
      kreis(ax2, ay2, 2.4 * sk, rgba(silhouette, 0.95));
    }
  }

  // ---- Extras (in der Akzentfarbe; Kopf-Details nur ohne gemalten Kopf) ----
  const vorn = sil ? '#171020' : F.akzent;
  const kopfGemalt = kopfBild?.bereit && !einfaerbung && !sil;
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

  zeichneDetails('vorn');
}
