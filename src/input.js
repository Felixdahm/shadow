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

// Bildschirm-Buttons in Canvas-Koordinaten (960×540).
// "halten" = Taste bleibt gedrückt, solange der Finger liegt (Laufen, Block).
export const TOUCH_BUTTONS = [
  { code: 'ArrowUp',    label: '▲',       x: 50,  y: 310, b: 95, h: 85 },
  { code: 'ArrowDown',  label: '▼',       x: 165, y: 310, b: 95, h: 85 },
  { code: 'ArrowLeft',  label: '◀',       x: 50,  y: 415, b: 95, h: 85 },
  { code: 'ArrowRight', label: '▶',       x: 165, y: 415, b: 95, h: 85 },
  { code: 'KeyA',       label: 'SCHLAG',  x: 700, y: 310, b: 95, h: 85 },
  { code: 'KeyS',       label: 'TRITT',   x: 815, y: 310, b: 95, h: 85 },
  { code: 'KeyD',       label: 'BLOCK',   x: 700, y: 415, b: 95, h: 85 },
  { code: 'KeyW',       label: 'SPEZIAL', x: 815, y: 415, b: 95, h: 85 },
];

let touchAktiv = false;        // wird beim ersten Touch wahr → Buttons einblenden
const touchZuCode = new Map(); // Finger-ID → gehaltener Tasten-Code
let tapPunkt = null;           // letzter Tipp neben den Buttons (für Menüs)

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
      } else {
        tapPunkt = { x, y };
      }
    }
  }, { passive: false });

  const loslassen = (ev) => {
    ev.preventDefault();
    for (const t of ev.changedTouches) {
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
