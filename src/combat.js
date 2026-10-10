import { CONFIG } from './config.js';

// Prüft beide Richtungen und gibt eine Liste von Treffer-Ereignissen zurück.
// main.js nutzt die Ereignisse für Hitstop, Kamerawackeln und Partikel.
export function verarbeiteKampf(a, b) {
  const ereignisse = [];
  pruefeTreffer(a, b, ereignisse);
  pruefeTreffer(b, a, ereignisse);
  return ereignisse;
}

function pruefeTreffer(angreifer, ziel, ereignisse) {
  if (angreifer.zustand !== 'schlag' && angreifer.zustand !== 'tritt') return;

  const A = CONFIG.angriffe[angreifer.zustand];
  // Nur im aktiven Fenster des Angriffs kann getroffen werden, und nur einmal
  if (angreifer.hatGetroffen) return;
  if (angreifer.zustandZeit < A.aktivVon || angreifer.zustandZeit > A.aktivBis) return;
  if (!ziel.lebt()) return;

  // Waffen zählen nur beim Arm-Angriff (Schlag); Größe skaliert die Reichweite mit
  const waffe = angreifer.zustand === 'schlag' ? angreifer.waffenDaten : null;
  const reichweite = (A.reichweite + (waffe?.reichweiteBonus ?? 0)) * angreifer.skalierung;

  // Hitbox: Bereich vor dem Angreifer auf Schlag- bzw. Tritthöhe
  const vorderkante = angreifer.x + angreifer.blick * 18;
  const spitze = angreifer.x + angreifer.blick * reichweite;
  const hitY = angreifer.y - A.hoeheVomBoden * angreifer.skalierung;

  // Hurtbox des Ziels: Rechteck um den Körper, geduckt deutlich niedriger
  const K = CONFIG.kaempfer;
  const hoehe = (ziel.zustand === 'ducken' ? K.koerperHoehe * K.duckHoehenFaktor : K.koerperHoehe) * ziel.skalierung;
  const zielLinks = ziel.x - K.koerperBreite / 2;
  const zielRechts = ziel.x + K.koerperBreite / 2;

  const trifftX = Math.min(vorderkante, spitze) <= zielRechts && Math.max(vorderkante, spitze) >= zielLinks;
  const trifftY = hitY >= ziel.y - hoehe && hitY <= ziel.y + 5;
  if (!trifftX || !trifftY) return;

  angreifer.hatGetroffen = true;

  const blockt = ziel.zustand === 'block';
  const basisSchaden = Math.round((A.schaden + (waffe?.schadenBonus ?? 0)) * angreifer.charakter.schadenFaktor);
  const schaden = blockt ? Math.max(1, Math.round(basisSchaden * CONFIG.treffer.blockSchadenFaktor)) : basisSchaden;
  ziel.hp = Math.max(0, ziel.hp - schaden);
  ziel.rueckstoss = angreifer.blick * A.rueckstoss * (blockt ? CONFIG.treffer.blockRueckstossFaktor : 1);

  const ko = ziel.hp <= 0;
  if (ko) {
    ziel.wechsle('ko');
  } else if (!blockt) {
    ziel.wechsle('treffer');
  }

  ereignisse.push({
    // Funken entstehen an der getroffenen Körperkante
    x: ziel.x - angreifer.blick * (K.koerperBreite / 2),
    y: hitY,
    richtung: angreifer.blick,
    blockt,
    ko,
  });
}
