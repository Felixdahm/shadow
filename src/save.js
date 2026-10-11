// Speicherstand im Browser (localStorage): überlebt Neuladen und Browser-Neustart.
// Alles Fortschritts-Relevante liegt in EINEM Objekt, damit Speichern einfach bleibt.

const SCHLUESSEL = 'schattenpfad-spielstand';

const STANDARD = {
  version: 1,
  splitter: 0,              // Währung: Schatten-Splitter ◆
  fortschritt: 0,           // höchste erreichte Story-Station (Index in GEGNER_PFAD)
  waffe: 'schwert',         // ausgerüstete Waffe
  extra: 'stirnband',       // ausgerüsteter Silhouetten-Stil
  gekauft: ['schwert', 'stirnband'],
  schwierigkeit: 'normal',
  ton: 'alles', // 'alles' | 'effekte' | 'aus'
};

export function ladeSpielstand() {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return { ...STANDARD };
    // Mit dem Standard mischen, damit alte Speicherstände neue Felder bekommen
    return { ...STANDARD, ...JSON.parse(roh) };
  } catch {
    return { ...STANDARD };
  }
}

export function speichereSpielstand(stand) {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
  } catch {
    // z. B. Privatmodus ohne Speicher — das Spiel läuft trotzdem weiter
  }
}
