import { CONFIG } from './config.js';
import { KI_STILE } from './characters.js';

export function leereEingabe() {
  return { links: false, rechts: false, springen: false, ducken: false, schlag: false, tritt: false, block: false, spezial: false, teleport: false };
}

// Gegner-KI: entscheidet alle 0,2–0,45 s neu. Der KI-Stil des Charakters
// (ausgewogen / aggressiv / defensiv) bestimmt die Wahrscheinlichkeiten.
export function kiEingabe(ich, gegner, dt) {
  const g = ich.kiGedaechtnis;
  if (!g.eingabe) g.eingabe = leereEingabe();

  // Angriffe und Sprünge sind Impulse: nur im Entscheidungs-Tick aktiv
  g.eingabe.schlag = false;
  g.eingabe.tritt = false;
  g.eingabe.springen = false;
  g.eingabe.spezial = false;
  g.eingabe.teleport = false;

  g.timer -= dt;
  if (g.timer > 0) return g.eingabe;

  const K = CONFIG.ki;
  const stil = KI_STILE[ich.charakter.kiStil] ?? KI_STILE.ausgewogen;
  // denkFaktor kommt vom Schwierigkeitsgrad: leicht = träger, schwer = reaktionsschneller
  g.timer = (K.denkIntervallMin + Math.random() * (K.denkIntervallMax - K.denkIntervallMin)) * (ich.charakter.denkFaktor ?? 1);

  const e = leereEingabe();
  g.eingabe = e;
  if (!gegner.lebt() || !ich.lebt()) return e;

  const abstand = Math.abs(gegner.x - ich.x);
  const gegnerIstRechts = gegner.x > ich.x;
  const wuerfel = Math.random();

  // Fairness: Wer am Boden liegt, wird nicht bedrängt — Abstand nehmen
  if (gegner.zustand === 'liegen') {
    if (wuerfel < 0.6) e[gegnerIstRechts ? 'links' : 'rechts'] = true;
    return e;
  }

  // Reaktion: Wenn der Gegner gerade angreift, blocken — oder wegrollen
  const gegnerGreiftAn = gegner.zustand === 'schlag' || gegner.zustand === 'tritt' || gegner.zustand === 'spezial';
  if (gegnerGreiftAn && abstand < K.angriffsAbstand + 40) {
    if (wuerfel < stil.blockNeigung) {
      e.block = true;
      return e;
    }
    if (wuerfel < stil.blockNeigung + 0.18) {
      // Rolle nach hinten, aus der Reichweite raus
      e.ducken = true;
      e[gegnerIstRechts ? 'links' : 'rechts'] = true;
      return e;
    }
  }

  // Endboss: Schattenschritt — bei Abstand hinter den Gegner teleportieren.
  // In der Wut-Phase (unter 50 % HP) deutlich öfter und aggressiver.
  if (ich.charakter.boss) {
    const wut = ich.hp < ich.maxHp / 2;
    if (abstand > 170 && wuerfel < (wut ? 0.6 : 0.35)) {
      e.teleport = true;
      return e;
    }
    if (wut && ich.energie >= CONFIG.spezial.energieMax && wuerfel < 0.75) {
      e.spezial = true;
      return e;
    }
  }

  // Volle Energie-Leiste → mit hoher Wahrscheinlichkeit den Schattenstoß zünden
  if (ich.energie >= CONFIG.spezial.energieMax && abstand < K.angriffsAbstand + 70 && wuerfel < 0.55) {
    e.spezial = true;
    return e;
  }

  if (abstand > K.angriffsAbstand) {
    if (wuerfel < 0.8) e[gegnerIstRechts ? 'rechts' : 'links'] = true;
    // sonst: kurz stehen bleiben (wirkt menschlicher)
  } else {
    if (wuerfel < stil.angriffsLust) {
      // Gegen still Stehende (= Auto-Block) tiefe Angriffe oder Würfe wählen
      if (gegner.zustand === 'stehen' && Math.random() < 0.45) {
        if (Math.random() < 0.6) { e.tritt = true; e.ducken = true; } // Fegetritt unterläuft den Block
        else e.schlag = true; // nah dran wird daraus automatisch der Wurf
      } else if (Math.random() < (ich.waffenDaten ? 0.65 : 0.5)) e.schlag = true;
      else e.tritt = true;
      // Ab und zu Richtungs-Attacken: Sturmstoß, Uppercut oder Fegetritt
      const extra = Math.random();
      if (extra < 0.2) e[gegnerIstRechts ? 'rechts' : 'links'] = true;
      else if (extra < 0.35) e.ducken = true;
    } else if (wuerfel < stil.angriffsLust + stil.blockNeigung * 0.3) {
      e.block = true;
    } else if (wuerfel < stil.angriffsLust + stil.blockNeigung * 0.3 + stil.rueckzug) {
      e[gegnerIstRechts ? 'links' : 'rechts'] = true; // Abstand aufbauen
    }
    // sonst: nichts tun
  }
  return e;
}
