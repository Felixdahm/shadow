// Hintergrundmusik, komplett im Code erzeugt (WebAudio) — keine Audiodateien.
// Jede Arena hat ihr eigenes Stück: ein tiefer Bass-Puls plus ein Arpeggio
// (nacheinander gespielte Töne einer Skala). Die Muster sind deterministisch,
// damit die Loops ruhig und vorhersehbar bleiben statt zufällig zu dudeln.
import { holeAudio } from './sound.js';

const STUECKE = {
  menue:         { takt: 1.9, bass: 110,   skala: [220, 261.6, 329.6, 392],     stil: 'ruhig' },
  aschenpass:    { takt: 1.7, bass: 146.8, skala: [293.7, 349.2, 440, 523.3],   stil: 'ruhig' },
  mondhain:      { takt: 2.1, bass: 98,    skala: [392, 466.2, 587.3, 698.5],   stil: 'glitzer' },
  glutschmiede:  { takt: 1.1, bass: 87.3,  skala: [174.6, 207.7, 261.6, 311.1], stil: 'treibend' },
  nebelschlucht: { takt: 2.4, bass: 73.4,  skala: [146.8, 174.6, 220, 261.6],   stil: 'karg' },
  leere:         { takt: 2.6, bass: 55,    skala: [110, 130.8, 164.8, 196],     stil: 'drone' },
};

let an = true;
let aktuell = null;     // Name des laufenden Stücks
let naechsteZeit = 0;   // WebAudio-Zeit des nächsten Takts
let schritt = 0;        // Takt-Zähler fürs Muster
let planer = null;      // Intervall, das vorausplant

function note(zeit, freq, dauer, typ, lautstaerke) {
  const a = holeAudio();
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = typ;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, zeit);
  gain.gain.exponentialRampToValueAtTime(lautstaerke, zeit + 0.05); // weich einschwingen
  gain.gain.exponentialRampToValueAtTime(0.0001, zeit + dauer);
  osc.connect(gain).connect(a.destination);
  osc.start(zeit);
  osc.stop(zeit + dauer + 0.05);
}

function spieleTakt(stueck, zeit) {
  // Bass-Puls trägt das Stück
  note(zeit, stueck.bass, stueck.takt * 0.9, 'sine', 0.06);

  const s = stueck.skala;
  if (stueck.stil === 'drone') {
    // Die Leere: nur ein zweiter, leicht verstimmter Drone — bedrohlich statt melodisch
    note(zeit, stueck.bass * 1.498, stueck.takt, 'sine', 0.03);
    return;
  }
  if (stueck.stil === 'karg' && schritt % 2 === 1) return; // Nebelschlucht lässt Takte aus

  const anzahl = stueck.stil === 'treibend' ? 4 : 2;
  for (let i = 0; i < anzahl; i++) {
    const freq = s[(schritt * 3 + i * 2) % s.length];
    const start = zeit + (i * stueck.takt) / anzahl;
    note(start, freq, (stueck.takt / anzahl) * 0.8, 'triangle', stueck.stil === 'glitzer' ? 0.025 : 0.035);
  }
}

// Plant immer ~0,6 s Musik voraus — so bleibt der Loop auch bei Rucklern sauber
function plane() {
  const a = holeAudio();
  if (!a || !an || !aktuell) return;
  if (naechsteZeit < a.currentTime) naechsteZeit = a.currentTime + 0.05;
  const stueck = STUECKE[aktuell];
  while (naechsteZeit < a.currentTime + 0.6) {
    spieleTakt(stueck, naechsteZeit);
    naechsteZeit += stueck.takt;
    schritt++;
  }
}

// Wechselt das laufende Stück (null = Stille). Gleiches Stück = kein Neustart.
export function setzeMusik(name) {
  if (name === aktuell) return;
  aktuell = name && STUECKE[name] ? name : 'menue';
  schritt = 0;
  naechsteZeit = 0;
  if (!planer) planer = setInterval(plane, 250);
}

export function setzeMusikAn(neuAn) {
  an = neuAn;
  naechsteZeit = 0;
}
