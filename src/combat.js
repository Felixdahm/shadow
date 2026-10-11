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
  const A = CONFIG.angriffe[angreifer.zustand];
  if (!A) return; // kein Angriffs-Zustand
  // Nur im aktiven Fenster des Angriffs kann getroffen werden, und nur einmal
  if (angreifer.hatGetroffen) return;
  if (angreifer.zustandZeit < A.aktivVon || angreifer.zustandZeit > A.aktivBis) return;
  if (!ziel.lebt()) return;
  // Während des Schattenschritts ist der Boss unverwundbar
  if (ziel.zustand === 'schatten') return;
  // Werfen kann man nur jemanden, der am Boden steht
  if (angreifer.zustand === 'wurf' && !ziel.amBoden()) return;

  // Waffen zählen nur beim Arm-Angriff (Schlag); Größe skaliert die Reichweite mit
  const waffe = angreifer.zustand === 'schlag' ? angreifer.waffenDaten : null;
  const reichweite = (A.reichweite + (waffe?.reichweiteBonus ?? 0)) * angreifer.skalierung;

  // Hitbox: Bereich vor dem Angreifer auf Schlag- bzw. Tritthöhe
  const vorderkante = angreifer.x + angreifer.blick * 18;
  const spitze = angreifer.x + angreifer.blick * reichweite;
  const hitY = angreifer.y - A.hoeheVomBoden * angreifer.skalierung;

  // Hurtbox des Ziels: Rechteck um den Körper, geduckt deutlich niedriger
  const K = CONFIG.kaempfer;
  // Geduckt und während der Rolle ist die Hurtbox niedrig — Schläge gehen drüber weg
  const istTief = ziel.zustand === 'ducken' || ziel.zustand === 'rolle';
  const hoehe = (istTief ? K.koerperHoehe * K.duckHoehenFaktor : K.koerperHoehe) * ziel.skalierung;
  const zielLinks = ziel.x - K.koerperBreite / 2;
  const zielRechts = ziel.x + K.koerperBreite / 2;

  const trifftX = Math.min(vorderkante, spitze) <= zielRechts && Math.max(vorderkante, spitze) >= zielLinks;
  const trifftY = hitY >= ziel.y - hoehe && hitY <= ziel.y + 5;
  if (!trifftX || !trifftY) return;

  angreifer.hatGetroffen = true;

  const istSpezial = angreifer.zustand === 'spezial';
  const istWurf = angreifer.zustand === 'wurf';
  // Schattenstoß und Wurf durchbrechen jeden Block
  const blockt = ziel.zustand === 'block' && !istSpezial && !istWurf;
  const basisSchaden = Math.round((A.schaden + (waffe?.schadenBonus ?? 0)) * angreifer.charakter.schadenFaktor);
  const schaden = blockt ? Math.max(1, Math.round(basisSchaden * CONFIG.treffer.blockSchadenFaktor)) : basisSchaden;
  ziel.hp = Math.max(0, ziel.hp - schaden);
  ziel.rueckstoss = angreifer.blick * A.rueckstoss * (blockt ? CONFIG.treffer.blockRueckstossFaktor : 1);

  // Energie: Austeilen lädt die eigene Leiste, Einstecken die des Ziels
  const S = CONFIG.spezial;
  if (!istSpezial) angreifer.energie = Math.min(S.energieMax, angreifer.energie + S.energieProTreffer);
  ziel.energie = Math.min(S.energieMax, ziel.energie + (blockt ? S.energieProBlock : S.energieProEinstecken));

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
    spezial: istSpezial,
    wurf: istWurf,
  });
}
