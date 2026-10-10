// Tastatur-Eingabe. "frisch" merkt sich Tasten nur für den aktuellen
// Simulationsschritt, damit ein Tastendruck genau einen Angriff auslöst.
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

// Nach jedem Simulationsschritt aufrufen, damit keine alten Tastendrücke liegen bleiben.
export function tickEnde() {
  frisch.clear();
}
