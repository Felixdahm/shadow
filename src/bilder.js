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
