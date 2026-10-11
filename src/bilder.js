// Zentrale Verwaltung der generierten Bilder (Portraits, Waffen-Art).
// Jedes Bild meldet selbst, wenn es geladen ist — bis dahin zeichnet die UI ohne.

export function ladeBild(pfad) {
  const bild = { img: new Image(), bereit: false };
  bild.img.onload = () => { bild.bereit = true; };
  bild.img.src = pfad;
  return bild;
}

export const PORTRAITS = {
  juro: ladeBild('assets/portraits/juro.png'),
  scharr: ladeBild('assets/portraits/scharr.png'),
  veyra: ladeBild('assets/portraits/veyra.png'),
  lith: ladeBild('assets/portraits/lith.png'),
  dorn: ladeBild('assets/portraits/dorn.png'),
  umbra: ladeBild('assets/portraits/umbra.png'),
};

// Lädt ein Bild auf weißem Grund und stellt es frei (Weiß → transparent) —
// für die gemalten Köpfe, die am Animations-Skelett hängen.
function ladeFreigestellt(pfad, spiegeln = false) {
  const teil = { canvas: null, bereit: false, spiegeln };
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
      const hell = (px[i] + px[i + 1] + px[i + 2]) / 3;
      if (hell > 242) px[i + 3] = 0;
      else if (hell > 215) px[i + 3] = Math.round(255 * ((242 - hell) / 27));
    }
    cctx.putImageData(daten, 0, 0);
    teil.canvas = c;
    teil.bereit = true;
  };
  img.src = pfad;
  return teil;
}

// Gemalte Köpfe (Seitenprofil, schauen nach rechts; Umbra wird gespiegelt)
export const KOEPFE = {
  juro: ladeFreigestellt('assets/teile/juro-kopf.png'),
  scharr: ladeFreigestellt('assets/teile/scharr-kopf.png'),
  veyra: ladeFreigestellt('assets/teile/veyra-kopf.png'),
  lith: ladeFreigestellt('assets/teile/lith-kopf.png'),
  dorn: ladeFreigestellt('assets/teile/dorn-kopf.png'),
  umbra: ladeFreigestellt('assets/teile/umbra-kopf.png', true),
};

export const WAFFEN_BILDER = {
  schwert: ladeBild('assets/ui/waffe-schwert.png'),
  dolch: ladeBild('assets/ui/waffe-dolch.png'),
  stab: ladeBild('assets/ui/waffe-stab.png'),
};

// Portrait mit rundem Rahmen zeichnen (überall gleiche Optik)
export function zeichnePortrait(ctx, eintrag, x, y, groesse, alpha = 1) {
  if (!eintrag?.bereit) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.roundRect(x, y, groesse, groesse, 14);
  ctx.clip();
  ctx.drawImage(eintrag.img, x, y, groesse, groesse);
  ctx.restore();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(255, 210, 125, 0.65)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, groesse, groesse, 14);
  ctx.stroke();
  ctx.globalAlpha = 1;
}
