// Tastatur- und Touch-Eingabe. "frisch" merkt sich Tasten nur für den aktuellen
// Simulationsschritt, damit ein Tastendruck genau einen Angriff auslöst.
// Touch-Buttons werden auf dieselben Tasten-Codes abgebildet — die Spiellogik
// merkt keinen Unterschied zwischen Tastatur und Bildschirm-Buttons.
const gedrueckt = new Set();
const frisch = new Set();

window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
    e.preventDefault(); // sonst scrollt der Browser die Seite
  }
  if (!e.repeat) frisch.add(e.code);
  gedrueckt.add(e.code);
});

window.addEventListener('keyup', (e) => {
  gedrueckt.delete(e.code);
});

export function istGedrueckt(code) {
  return gedrueckt.has(code);
}

export function verbraucheFrisch(code) {
  const hat = frisch.has(code);
  frisch.delete(code);
  return hat;
}

// ---------- Touch ----------

// Aktions-Buttons rechts in Canvas-Koordinaten (960×540).
// Die Bewegung links läuft über einen virtuellen Joystick (siehe unten).
export const TOUCH_BUTTONS = [
  { code: 'KeyA', label: 'SCHLAG',  x: 700, y: 310, b: 95, h: 85 },
  { code: 'KeyS', label: 'TRITT',   x: 815, y: 310, b: 95, h: 85 },
  { code: 'KeyD', label: 'BLOCK',   x: 700, y: 415, b: 95, h: 85 },
  { code: 'KeyW', label: 'SPEZIAL', x: 815, y: 415, b: 95, h: 85 },
];

// Virtueller Joystick: erscheint dort, wo der Finger die linke Bildschirmhälfte
// berührt. Ziehen steuert laufen/springen/ducken — schräg ziehen macht
// Salto (oben) oder Rolle (unten).
const STICK_RADIUS = 60;     // sichtbarer Radius
const STICK_TOT_X = 22;      // ab hier zählt links/rechts
const STICK_TOT_Y = 30;      // ab hier zählt oben/unten
let stick = null;            // { id, x, y, dx, dy } solange ein Finger steuert
let stickCodes = new Set();  // aktuell vom Stick gehaltene Richtungs-Codes

let touchAktiv = false;        // wird beim ersten Touch wahr → Steuerung einblenden
const touchZuCode = new Map(); // Finger-ID → gehaltener Button-Code
let tapPunkt = null;           // letzter kurzer Tipp (für Menüs)

export function stickZustand() {
  if (!stick) return null;
  // Auslenkung fürs Zeichnen auf den Radius begrenzen
  const laenge = Math.hypot(stick.dx, stick.dy) || 1;
  const faktor = Math.min(1, STICK_RADIUS / laenge);
  return { x: stick.x, y: stick.y, dx: stick.dx * faktor, dy: stick.dy * faktor };
}

// Richtungs-Codes aus der Stick-Auslenkung ableiten und wie Tasten behandeln
function aktualisiereStickCodes() {
  const neu = new Set();
  if (stick) {
    if (stick.dx > STICK_TOT_X) neu.add('ArrowRight');
    if (stick.dx < -STICK_TOT_X) neu.add('ArrowLeft');
    if (stick.dy < -STICK_TOT_Y) neu.add('ArrowUp');
    if (stick.dy > STICK_TOT_Y) neu.add('ArrowDown');
  }
  for (const code of neu) {
    if (!stickCodes.has(code)) {
      gedrueckt.add(code);
      frisch.add(code); // Impuls z. B. für den Sprung beim Überschreiten der Schwelle
    }
  }
  for (const code of stickCodes) {
    if (!neu.has(code)) gedrueckt.delete(code);
  }
  stickCodes = neu;
}

export function istTouchAktiv() {
  return touchAktiv;
}

// Gibt den letzten freien Tipp (nicht auf einem Button) zurück und löscht ihn
export function verbraucheTap() {
  const t = tapPunkt;
  tapPunkt = null;
  return t;
}

// Beim ersten Tipp: Vollbild anfordern und das Querformat sperren.
// Funktioniert auf Android-Browsern; iOS (iPhone) unterstützt das nicht —
// dort zeigt das Overlay in index.html den "Bitte drehen"-Hinweis.
let vollbildVersucht = false;
async function vollbildUndQuerformat() {
  if (vollbildVersucht) return;
  vollbildVersucht = true;
  try {
    await document.documentElement.requestFullscreen?.();
  } catch { /* nicht unterstützt — macht nichts */ }
  try {
    await screen.orientation?.lock?.('landscape');
  } catch { /* nicht unterstützt — macht nichts */ }
}

export function aktiviereTouch(canvas) {
  // Browser-Koordinaten → Canvas-Koordinaten (das Canvas wird per CSS skaliert)
  const umrechnen = (touch) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((touch.clientX - rect.left) * 960) / rect.width,
      y: ((touch.clientY - rect.top) * 540) / rect.height,
    };
  };

  canvas.addEventListener('touchstart', (ev) => {
    ev.preventDefault();
    touchAktiv = true;
    vollbildUndQuerformat();
    for (const t of ev.changedTouches) {
      const { x, y } = umrechnen(t);
      const button = TOUCH_BUTTONS.find((b) => x >= b.x && x <= b.x + b.b && y >= b.y && y <= b.y + b.h);
      if (button) {
        touchZuCode.set(t.identifier, button.code);
        gedrueckt.add(button.code);
        frisch.add(button.code);
      } else if (x < 480 && !stick) {
        // Linke Hälfte: Joystick genau unter dem Finger aufspannen
        stick = { id: t.identifier, x, y, dx: 0, dy: 0 };
      } else {
        tapPunkt = { x, y };
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (ev) => {
    ev.preventDefault();
    if (!stick) return;
    for (const t of ev.changedTouches) {
      if (t.identifier !== stick.id) continue;
      const { x, y } = umrechnen(t);
      stick.dx = x - stick.x;
      stick.dy = y - stick.y;
      aktualisiereStickCodes();
    }
  }, { passive: false });

  const loslassen = (ev) => {
    ev.preventDefault();
    for (const t of ev.changedTouches) {
      if (stick && t.identifier === stick.id) {
        // Kaum bewegt? Dann war es ein Tipp (für die Menüs).
        if (Math.hypot(stick.dx, stick.dy) < 15) tapPunkt = { x: stick.x, y: stick.y };
        stick = null;
        aktualisiereStickCodes();
        continue;
      }
      const code = touchZuCode.get(t.identifier);
      touchZuCode.delete(t.identifier);
      // Nur loslassen, wenn kein anderer Finger denselben Button hält
      if (code && ![...touchZuCode.values()].includes(code)) gedrueckt.delete(code);
    }
  };
  canvas.addEventListener('touchend', loslassen, { passive: false });
  canvas.addEventListener('touchcancel', loslassen, { passive: false });
}

// Nach jedem Simulationsschritt aufrufen, damit keine alten Eingaben liegen bleiben.
export function tickEnde() {
  frisch.clear();
}
