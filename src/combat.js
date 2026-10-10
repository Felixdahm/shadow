import { CONFIG } from './config.js';

export function verarbeiteKampf(a, b) {
  pruefeTreffer(a, b);
  pruefeTreffer(b, a);
}

function pruefeTreffer(angreifer, ziel) {
  if (angreifer.zustand !== 'schlag' && angreifer.zustand !== 'tritt') return;

  const A = CONFIG.angriffe[angreifer.zustand];
  // Nur im aktiven Fenster des Angriffs kann getroffen werden, und nur einmal
  if (angreifer.hatGetroffen) return;
  if (angreifer.zustandZeit < A.aktivVon || angreifer.zustandZeit > A.aktivBis) return;
  if (!ziel.lebt()) return;

  // Hitbox: Bereich vor dem Angreifer auf Schlag- bzw. Tritthöhe
  const vorderkante = angreifer.x + angreifer.blick * 18;
  const spitze = angreifer.x + angreifer.blick * A.reichweite;
  const hitY = angreifer.y - A.hoeheVomBoden;

  // Hurtbox des Ziels: Rechteck um den Körper, geduckt deutlich niedriger
  const K = CONFIG.kaempfer;
  const hoehe = ziel.zustand === 'ducken' ? K.koerperHoehe * K.duckHoehenFaktor : K.koerperHoehe;
  const zielLinks = ziel.x - K.koerperBreite / 2;
  const zielRechts = ziel.x + K.koerperBreite / 2;

  const trifftX = Math.min(vorderkante, spitze) <= zielRechts && Math.max(vorderkante, spitze) >= zielLinks;
  const trifftY = hitY >= ziel.y - hoehe && hitY <= ziel.y + 5;
  if (!trifftX || !trifftY) return;

  angreifer.hatGetroffen = true;

  const blockt = ziel.zustand === 'block';
  const schaden = blockt ? Math.max(1, Math.round(A.schaden * CONFIG.treffer.blockSchadenFaktor)) : A.schaden;
  ziel.hp = Math.max(0, ziel.hp - schaden);
  ziel.rueckstoss = angreifer.blick * A.rueckstoss * (blockt ? CONFIG.treffer.blockRueckstossFaktor : 1);

  if (ziel.hp <= 0) {
    ziel.wechsle('ko');
  } else if (!blockt) {
    ziel.wechsle('treffer');
  }
}
