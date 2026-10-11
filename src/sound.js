// Alle Geräusche werden mit WebAudio direkt im Code erzeugt — keine Audiodateien nötig.
// Browser erlauben Ton erst nach der ersten Nutzereingabe, deshalb wird der
// AudioContext bei der ersten Eingabe angelegt — Taste ODER Touch (Handy!).

let audio = null;
let effekteAn = true;

function weckeAudio() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
}

window.addEventListener('keydown', weckeAudio);
window.addEventListener('touchstart', weckeAudio);
window.addEventListener('pointerdown', weckeAudio);

// music.js teilt sich denselben AudioContext
export function holeAudio() {
  return audio;
}

// Einstellung "Ton": Effekte lassen sich getrennt von der Musik abschalten
export function setzeEffekte(an) {
  effekteAn = an;
}

// Ein Ton, der von einer Frequenz zu einer anderen gleitet und ausklingt
function ton(freqStart, freqEnde, dauer, typ = 'sine', lautstaerke = 0.3) {
  if (!audio || !effekteAn) return;
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = typ;
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnde), t + dauer);
  gain.gain.setValueAtTime(lautstaerke, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dauer);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + dauer);
}

// Kurzes gefiltertes Rauschen (für "Luft"- und Aufprall-Geräusche)
function rauschen(dauer, filterFrequenz, lautstaerke = 0.25) {
  if (!audio || !effekteAn) return;
  const t = audio.currentTime;
  const puffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * dauer), audio.sampleRate);
  const daten = puffer.getChannelData(0);
  for (let i = 0; i < daten.length; i++) daten[i] = Math.random() * 2 - 1;

  const quelle = audio.createBufferSource();
  quelle.buffer = puffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFrequenz;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(lautstaerke, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dauer);
  quelle.connect(filter).connect(gain).connect(audio.destination);
  quelle.start(t);
}

export function spieleSchwung() {
  rauschen(0.09, 900, 0.12);
}

// stufe = Position in der Treffer-Serie: jeder Folgetreffer klingt etwas höher,
// das macht Kombos hörbar ("dup, dap, DÄNG")
export function spieleTreffer(stufe = 0) {
  const s = Math.min(4, stufe);
  ton(160 + s * 28, 55 + s * 10, 0.14, 'sine', 0.5);
  rauschen(0.06, 400 + s * 120, 0.2);
}

export function spieleBlock() {
  ton(850, 620, 0.08, 'square', 0.1); // kurzes metallisches "Klack"
}

export function spieleKo() {
  ton(110, 28, 0.6, 'sine', 0.6);     // tiefer Wumms
  rauschen(0.25, 200, 0.3);
}

export function spieleSpezialStart() {
  ton(180, 950, 0.3, 'sawtooth', 0.12); // aufsteigendes Aufladen
  rauschen(0.25, 1400, 0.1);
}

export function spieleSpezialTreffer() {
  ton(130, 32, 0.4, 'sine', 0.6);
  ton(420, 90, 0.2, 'square', 0.15);
  rauschen(0.2, 300, 0.3);
}

export function spieleTeleport() {
  ton(700, 120, 0.25, 'sine', 0.18); // abtauchendes "Wusch"
  rauschen(0.18, 2000, 0.08);
}

export function spieleGong() {
  ton(440, 430, 0.9, 'triangle', 0.25);
  ton(662, 650, 0.7, 'triangle', 0.12); // leicht verstimmte Oberton-Schwebung
}
