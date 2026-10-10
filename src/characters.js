// Jede Figur ist ein reines Datenobjekt: gleiches Skelett, andere Werte = andere Figur.
// skalierung  → Körpergröße (skaliert auch Reichweite und Hurtbox)
// tempoFaktor → Lauf- UND Angriffsgeschwindigkeit
// extras      → Silhouetten-Details (Stirnband, Zopf, Kapuze), rein optisch

export const CHARAKTERE = {
  juro: {
    name: 'Juro',
    skalierung: 1,
    tempoFaktor: 1,
    schadenFaktor: 1,
    hpFaktor: 1,
    waffe: 'schwert',
    extras: ['stirnband'],
    kiStil: null, // wird vom Spieler gesteuert
  },
  scharr: {
    name: 'Scharr',
    skalierung: 0.98,
    tempoFaktor: 1,
    schadenFaktor: 1,
    hpFaktor: 1,
    waffe: null,
    extras: [],
    kiStil: 'ausgewogen',
    arena: 'aschenpass',
  },
  veyra: {
    name: 'Veyra',
    skalierung: 0.9,
    tempoFaktor: 1.3,
    schadenFaktor: 0.8,
    hpFaktor: 0.85,
    waffe: 'stab',
    extras: ['zopf'],
    kiStil: 'aggressiv',
    arena: 'mondhain',
  },
  dorn: {
    name: 'Dorn',
    skalierung: 1.12,
    tempoFaktor: 0.78,
    schadenFaktor: 1.45,
    hpFaktor: 1.3,
    waffe: 'schwert',
    extras: ['kapuze'],
    kiStil: 'defensiv',
    arena: 'nebelschlucht',
  },
};

// Die Gegner-Reihenfolge auf dem Schattenpfad
export const GEGNER_PFAD = ['scharr', 'veyra', 'dorn'];

// KI-Persönlichkeiten: Wahrscheinlichkeiten für Angriff, Block und Rückzug
export const KI_STILE = {
  ausgewogen: { angriffsLust: 0.5, blockNeigung: 0.45, rueckzug: 0.15 },
  aggressiv:  { angriffsLust: 0.72, blockNeigung: 0.2, rueckzug: 0.05 },
  defensiv:   { angriffsLust: 0.35, blockNeigung: 0.65, rueckzug: 0.25 },
};
