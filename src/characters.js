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
  lith: {
    name: 'Lith',
    skalierung: 0.88,
    tempoFaktor: 1.45,
    schadenFaktor: 0.75,
    hpFaktor: 0.8,
    waffe: 'dolch',
    extras: ['irokese'],
    kiStil: 'wild',
    arena: 'glutschmiede',
    beschreibung: 'Messertänzer der Glutschmiede · rastlos, wild, kaum zu fassen',
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
  umbra: {
    name: 'Umbra',
    skalierung: 1.02,
    tempoFaktor: 1.05,
    schadenFaktor: 1.1,
    hpFaktor: 1.5,
    waffe: 'schwert',
    extras: ['stirnband'], // Juros Spiegelbild — gleiche Silhouette, anderes Wesen
    kiStil: 'boss',
    arena: 'leere',
    boss: true, // eigene Mechanik: Schattenschritt (Teleport) + Wut-Phase unter 50 % HP
    farbe: { vorn: '#190b2b', hinten: '#2b1546' },
    beschreibung: 'Juros eigener Schatten · Endboss · erscheint, wo du nicht hinsiehst',
  },
};

// Die Gegner-Reihenfolge auf dem Schattenpfad
export const GEGNER_PFAD = ['scharr', 'veyra', 'lith', 'dorn', 'umbra'];

// Story-Texte vor jedem Kampf (Story-Modus)
export const STORY = {
  scharr: 'Juro verlässt sein Dorf mit nichts als dem Schwert seines Vaters. Am Aschenpass versperrt ihm Scharr den Weg — ein Wächter, der niemanden ohne Kampf passieren lässt.',
  veyra: 'Hinter dem Pass beginnt der Mondhain. Zwischen den Bäumen wartet Veyra, die flinke Stabkämpferin. Sie kämpft nicht aus Zorn — sie will sehen, ob Juro würdig ist.',
  lith: 'Unter dem Mondhain glüht die alte Glutschmiede. Dort tanzt Lith zwischen den Funken — zwei Schritte, ein Schnitt. Noch nie hat er jemanden vorbeigelassen, nur weil der müde war.',
  dorn: 'Tiefer im Gebirge liegt die Nebelschlucht. Dort herrscht Dorn, der gepanzerte Schatten. Hinter ihm, sagt man, endet der Pfad. Doch das stimmt nicht ganz.',
  umbra: 'Am Ende des Pfads wartet kein Fremder. Der Schatten, der Juro seit dem ersten Schritt folgt, löst sich vom Boden und zieht das Schwert: Umbra. Wer den Pfad beenden will, muss den eigenen Schatten bezwingen.',
  ende: 'Umbra zerfällt zu Nebel — und Juro steht zum ersten Mal ohne Schatten in der Sonne. Der Pfad ist zu Ende. Für heute.',
};

// Der Ausrüstungs-Laden: Waffen verändern Juros Kampfwerte,
// Stile nur seine Silhouette. Preise in Schatten-Splittern ◆.
export const WAFFEN_LADEN = [
  { id: 'schwert', name: 'Schwert', preis: 0,   info: 'Ausgewogen — gute Reichweite, guter Schaden' },
  { id: 'dolch',   name: 'Dolch',   preis: 100, info: 'Kurze Klinge, aber du läufst 12 % schneller' },
  { id: 'stab',    name: 'Stab',    preis: 140, info: 'Riesige Reichweite, wenig Bonus-Schaden' },
];

export const STIL_LADEN = [
  { id: 'stirnband', name: 'Stirnband', preis: 0 },
  { id: 'zopf',      name: 'Zopf',      preis: 60 },
  { id: 'irokese',   name: 'Irokese',   preis: 60 },
  { id: 'kapuze',    name: 'Kapuze',    preis: 80 },
];

// KI-Persönlichkeiten: Wahrscheinlichkeiten für Angriff, Block und Rückzug
export const KI_STILE = {
  ausgewogen: { angriffsLust: 0.5, blockNeigung: 0.45, rueckzug: 0.15 },
  aggressiv:  { angriffsLust: 0.72, blockNeigung: 0.2, rueckzug: 0.05 },
  defensiv:   { angriffsLust: 0.35, blockNeigung: 0.65, rueckzug: 0.25 },
  wild:       { angriffsLust: 0.8, blockNeigung: 0.1, rueckzug: 0.08 },
  boss:       { angriffsLust: 0.6, blockNeigung: 0.35, rueckzug: 0.1 },
};
