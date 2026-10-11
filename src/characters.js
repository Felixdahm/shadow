// Jede Figur ist ein reines Datenobjekt: gleiches Skelett, andere Werte = andere Figur.
// skalierung  → Körpergröße (skaliert auch Reichweite und Hurtbox)
// tempoFaktor → Lauf- UND Angriffsgeschwindigkeit
// extras      → Details (Stirnband, Zopf, Kapuze), passend zum Portrait
// farben      → echte Charakter-Farben: haut, oben (Oberkörper/Arme),
//               unten (Beine), akzent (Extras). Statt schwarzer Silhouetten.

export const CHARAKTERE = {
  juro: {
    farben: { haut: '#e8b48a', oben: '#2c3a5e', unten: '#1f2a45', akzent: '#c43b3b', haar: '#222b3f' },
    name: 'Juro',
    skalierung: 1,
    tempoFaktor: 1,
    schadenFaktor: 1,
    hpFaktor: 1,
    waffe: 'schwert',
    extras: ['stirnband'],
    kiStil: null, // wird vom Spieler gesteuert
    spezial: 'stoss',   // Schattenstoß: Dash-Durchstoß
  },
  scharr: {
    farben: { haut: '#c99b6e', oben: '#6b5a48', unten: '#4a3f33', akzent: '#8a7a64' },
    name: 'Scharr',
    skalierung: 0.98,
    tempoFaktor: 1,
    schadenFaktor: 1,
    hpFaktor: 1,
    waffe: null,
    extras: [],
    kiStil: 'ausgewogen',
    arena: 'aschenpass',
    spezial: 'beben',   // Erdbeben: trifft BEIDE Seiten, streckt nieder
    beschreibung: 'Wächter des Aschenpasses · unbewaffnet · ausgewogen',
  },
  veyra: {
    farben: { haut: '#e6c3a0', oben: '#2e6e6a', unten: '#234f4d', akzent: '#b8c4cc', haar: '#241a2e' },
    name: 'Veyra',
    skalierung: 0.9,
    tempoFaktor: 1.3,
    schadenFaktor: 0.8,
    hpFaktor: 0.85,
    waffe: 'stab',
    extras: ['zopf'],
    kiStil: 'aggressiv',
    arena: 'mondhain',
    spezial: 'wirbel',  // Wirbelsturm: Riesen-Reichweite, schleudert hoch
    beschreibung: 'Stabkämpferin des Mondhains · schnell, aber zerbrechlich',
  },
  lith: {
    farben: { haut: '#d9a06e', oben: '#5a2a24', unten: '#3c1f1b', akzent: '#d4452a' },
    name: 'Lith',
    skalierung: 0.88,
    tempoFaktor: 1.45,
    schadenFaktor: 0.75,
    hpFaktor: 0.8,
    waffe: 'dolch',
    extras: ['irokese'],
    kiStil: 'wild',
    arena: 'glutschmiede',
    spezial: 'tanz',    // Klingentanz: Dash DURCH den Gegner
    beschreibung: 'Messertänzer der Glutschmiede · rastlos, wild, kaum zu fassen',
  },
  dorn: {
    farben: { haut: '#b9a584', oben: '#2f4a33', unten: '#24352a', akzent: '#3a5c40' },
    name: 'Dorn',
    skalierung: 1.12,
    tempoFaktor: 0.78,
    schadenFaktor: 1.3,
    hpFaktor: 1.3,
    waffe: 'schwert',
    extras: ['kapuze'],
    kiStil: 'defensiv',
    arena: 'nebelschlucht',
    spezial: 'sturz',   // Bergsturz: langsam, brutal, streckt nieder
    beschreibung: 'Herr der Nebelschlucht · langsam, blockt viel, trifft brutal',
  },
  umbra: {
    farben: { haut: '#241238', oben: '#190b2b', unten: '#140925', akzent: '#5b2d8a' },
    name: 'Umbra',
    skalierung: 1.02,
    tempoFaktor: 1.05,
    schadenFaktor: 1.1,
    hpFaktor: 1.5,
    waffe: 'schwert',
    extras: ['stirnband'], // Juros Spiegelbild — gleiche Silhouette, anderes Wesen
    kiStil: 'boss',
    arena: 'leere',
    spezial: 'stoss',   // wie Juro — er ist sein Schatten
    boss: true, // eigene Mechanik: Schattenschritt (Teleport) + Wut-Phase unter 50 % HP
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
  { id: 'schwert', name: 'Schwert', preis: 0,   info: 'Eigener Hieb: weiter Überkopf-Schlag, hoher Schaden' },
  { id: 'dolch',   name: 'Dolch',   preis: 100, info: 'Eigener Hieb: blitzschnelle Stiche · +12 % Lauftempo' },
  { id: 'stab',    name: 'Stab',    preis: 140, info: 'Eigener Hieb: fegender Rundumschlag, Riesen-Reichweite' },
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
