import { CONFIG } from './config.js';

export function leereEingabe() {
  return { links: false, rechts: false, springen: false, ducken: false, schlag: false, tritt: false, block: false };
}

// Einfache Gegner-KI: entscheidet alle 0,2–0,45 s neu.
// Weit weg → hinlaufen. Nah dran → zufällig schlagen, treten, blocken oder ausweichen.
export function kiEingabe(ich, gegner, dt) {
  const g = ich.kiGedaechtnis;
  if (!g.eingabe) g.eingabe = leereEingabe();

  // Angriffe und Sprünge sind Impulse: nur im Entscheidungs-Tick aktiv
  g.eingabe.schlag = false;
  g.eingabe.tritt = false;
  g.eingabe.springen = false;

  g.timer -= dt;
  if (g.timer > 0) return g.eingabe;

  const K = CONFIG.ki;
  g.timer = K.denkIntervallMin + Math.random() * (K.denkIntervallMax - K.denkIntervallMin);

  const e = leereEingabe();
  g.eingabe = e;
  if (!gegner.lebt() || !ich.lebt()) return e;

  const abstand = Math.abs(gegner.x - ich.x);
  const gegnerIstRechts = gegner.x > ich.x;
  const wuerfel = Math.random();

  // Reaktion: Wenn der Gegner gerade angreift, oft blocken
  const gegnerGreiftAn = gegner.zustand === 'schlag' || gegner.zustand === 'tritt';
  if (gegnerGreiftAn && abstand < K.angriffsAbstand + 30 && wuerfel < 0.45) {
    e.block = true;
    return e;
  }

  if (abstand > K.angriffsAbstand) {
    if (wuerfel < 0.8) e[gegnerIstRechts ? 'rechts' : 'links'] = true;
    // sonst: kurz stehen bleiben (wirkt menschlicher)
  } else {
    if (wuerfel < 0.32) e.schlag = true;
    else if (wuerfel < 0.55) e.tritt = true;
    else if (wuerfel < 0.7) e.block = true;
    else if (wuerfel < 0.85) e[gegnerIstRechts ? 'links' : 'rechts'] = true; // Abstand aufbauen
    // sonst: nichts tun
  }
  return e;
}
