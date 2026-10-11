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
    beschreibung: 'Wächter des Aschenpasses · unbewaffnet · ausgewogen',
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
    beschreibung: 'Stabkämpferin des Mondhains · schnell, aber zerbrechlich',
  },
  dorn: {
    name: 'Dorn',
    skalierung: 1.12,
    tempoFaktor: 0.78,
    schadenFaktor: 1.3,
    hpFaktor: 1.3,
    waffe: 'schwert',
    extras: ['kapuze'],
    kiStil: 'defensiv',
    arena: 'nebelschlucht',
    beschreibung: 'Herr der Nebelschlucht · langsam, blockt viel, trifft brutal',
  },
};

// Die Gegner-Reihenfolge auf dem Schattenpfad
export const GEGNER_PFAD = ['scharr', 'veyra', 'dorn'];

// Story-Texte vor jedem Kampf (Story-Modus)
export const STORY = {
  scharr: 'Juro verlässt sein Dorf mit nichts als dem Schwert seines Vaters. Am Aschenpass versperrt ihm Scharr den Weg — ein Wächter, der niemanden ohne Kampf passieren lässt.',
  veyra: 'Hinter dem Pass beginnt der Mondhain. Zwischen den Bäumen wartet Veyra, die flinke Stabkämpferin. Sie kämpft nicht aus Zorn — sie will sehen, ob Juro würdig ist.',
  dorn: 'Am Ende des Pfads liegt die Nebelschlucht. Dort herrscht Dorn, der gepanzerte Schatten. Wer ihn bezwingt, hat den Schattenpfad gemeistert.',
  ende: 'Der Nebel lichtet sich. Juro hat den Schattenpfad bezwungen — doch jenseits der Schlucht warten schon neue Schatten.',
};

// KI-Persönlichkeiten: Wahrscheinlichkeiten für Angriff, Block und Rückzug
export const KI_STILE = {
  ausgewogen: { angriffsLust: 0.5, blockNeigung: 0.45, rueckzug: 0.15 },
  aggressiv:  { angriffsLust: 0.72, blockNeigung: 0.2, rueckzug: 0.05 },
  defensiv:   { angriffsLust: 0.35, blockNeigung: 0.65, rueckzug: 0.25 },
};
