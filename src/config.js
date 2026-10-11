// Alle Spielwerte an einem Ort, damit sich das Balancing leicht anpassen lässt.
export const CONFIG = {
  canvas: { breite: 960, hoehe: 540 },

  physik: {
    bodenY: 470,
    schwerkraft: 2300,
    randLinks: 70,
    randRechts: 890,
    minAbstand: 95, // Kämpfer schieben sich gegenseitig weg, wenn sie näher kommen
  },

  kaempfer: {
    maxHp: 100,
    laufTempo: 250,
    sprungKraft: 850,
    koerperBreite: 56,   // Hurtbox-Breite
    koerperHoehe: 185,   // Hurtbox-Höhe im Stehen
    duckHoehenFaktor: 0.55, // geduckt ist die Hurtbox niedriger → Schläge gehen drüber
  },

  // Maße des gezeichneten Skeletts (Pixel)
  skelett: {
    hueftHoehe: 95,
    rumpfLaenge: 55,
    halsLaenge: 10,
    kopfRadius: 13,
    oberarm: 36,
    unterarm: 34,
    oberschenkel: 54,
    unterschenkel: 52,
    linienBreite: 13,
  },

  // Jeder Angriff: Gesamtdauer, aktives Treffer-Fenster, Schaden, Reichweite,
  // Höhe der Hitbox über dem Boden und Rückstoß für den Getroffenen.
  angriffe: {
    schlag:  { dauer: 0.5,  aktivVon: 0.18, aktivBis: 0.32, schaden: 8,  reichweite: 105, hoeheVomBoden: 140, rueckstoss: 170 },
    // Kombo-Haken mit der hinteren Faust (ohne Waffen-Bonus, etwas kürzer)
    schlag2: { dauer: 0.5,  aktivVon: 0.18, aktivBis: 0.32, schaden: 9,  reichweite: 95,  hoeheVomBoden: 140, rueckstoss: 190 },
    tritt:   { dauer: 0.68, aktivVon: 0.26, aktivBis: 0.44, schaden: 13, reichweite: 125, hoeheVomBoden: 82,  rueckstoss: 260 },
    // Flugkick: Höhe ist relativ zu den Füßen des Springenden — trifft also dort, wo er gerade fliegt
    luftTritt: { dauer: 0.55, aktivVon: 0.1, aktivBis: 0.36, schaden: 10, reichweite: 115, hoeheVomBoden: 40, rueckstoss: 300 },
    // Wurf: Konter gegen Dauerblocker — durchbricht den Block, braucht Nähe
    wurf: { dauer: 0.65, aktivVon: 0.28, aktivBis: 0.42, schaden: 10, reichweite: 110, hoeheVomBoden: 110, rueckstoss: 540 },

    // Waffen-eigene Hiebe (ersetzen den Faust-Schlag, wenn eine Waffe getragen wird)
    hieb_schwert: { dauer: 0.62, aktivVon: 0.24, aktivBis: 0.42, schaden: 13, reichweite: 155, hoeheVomBoden: 135, rueckstoss: 220 },
    hieb_stab:    { dauer: 0.7,  aktivVon: 0.28, aktivBis: 0.48, schaden: 10, reichweite: 185, hoeheVomBoden: 115, rueckstoss: 260 },
    hieb_dolch:   { dauer: 0.38, aktivVon: 0.12, aktivBis: 0.24, schaden: 9,  reichweite: 115, hoeheVomBoden: 135, rueckstoss: 140 },

    // Richtungs-Attacken: ↓+Schlag, vorwärts+Schlag, ↓+Tritt
    aufwaerts: { dauer: 0.55, aktivVon: 0.18, aktivBis: 0.32, schaden: 10, reichweite: 95,  hoeheVomBoden: 120, rueckstoss: 100, knockup: 540, ausfall: 40 },
    sturm:     { dauer: 0.6,  aktivVon: 0.22, aktivBis: 0.4,  schaden: 11, reichweite: 130, hoeheVomBoden: 130, rueckstoss: 320, ausfall: 300 },
    fege:      { dauer: 0.6,  aktivVon: 0.2,  aktivBis: 0.36, schaden: 8,  reichweite: 125, hoeheVomBoden: 30,  rueckstoss: 180, niederschlag: true, ausfall: 60 },
  },

  // Charakter-eigene Spezialangriffe (W bei voller Energie-Leiste)
  spezialArten: {
    stoss:  { dauer: 0.75, aktivVon: 0.3,  aktivBis: 0.52, schaden: 24, reichweite: 150, hoeheVomBoden: 120, rueckstoss: 430, dash: 420 },
    beben:  { dauer: 0.85, aktivVon: 0.4,  aktivBis: 0.55, schaden: 20, reichweite: 170, hoeheVomBoden: 60,  rueckstoss: 520, aoe: true, niederschlag: true },
    wirbel: { dauer: 0.8,  aktivVon: 0.3,  aktivBis: 0.55, schaden: 18, reichweite: 210, hoeheVomBoden: 110, rueckstoss: 300, knockup: 480 },
    tanz:   { dauer: 0.6,  aktivVon: 0.18, aktivBis: 0.42, schaden: 20, reichweite: 130, hoeheVomBoden: 120, rueckstoss: 260, dash: 650 },
    sturz:  { dauer: 1.0,  aktivVon: 0.5,  aktivBis: 0.68, schaden: 34, reichweite: 150, hoeheVomBoden: 130, rueckstoss: 480, niederschlag: true },
  },

  // Spezialangriff "Schattenstoß": braucht eine volle Energie-Leiste,
  // ist unblockbar und trägt den Angreifer mit einem Dash nach vorn.
  spezial: {
    energieMax: 100,
    energieProTreffer: 16,    // Energie fürs Austeilen
    energieProEinstecken: 10, // Energie fürs Einstecken
    energieProBlock: 6,       // geblockte Treffer geben dem Blocker etwas Energie
    dashTempo: 420,
  },

  treffer: {
    hitstunDauer: 0.34,       // so lange ist der Getroffene handlungsunfähig
    blockSchadenFaktor: 0.15, // geblockt kommt nur ein Bruchteil des Schadens durch
    blockRueckstossFaktor: 0.4,
    liegenDauer: 0.9,         // so lange liegt man nach einem Niederschlag (unverwundbar)
    sturzAbSerie: 4,          // ab dem 4. Serientreffer geht man automatisch zu Boden — keine Endloskombos
    kritFaktor: 1.35,         // Treffer auf Kopfhöhe machen kritischen Schaden
    kritAbHoehe: 0.78,        // ab dieser Körperhöhe (Anteil) zählt ein Treffer als Kopftreffer
    ersterTrefferEnergie: 12, // Bonus-Energie für den ersten Treffer der Runde
  },

  // Ausweichbewegungen: Rolle am Boden (duckt unter Schlägen durch),
  // Salto = Sprung mit ganzer Körperdrehung bei Schräg-Steuerung
  bewegung: {
    rollTempo: 380,
    rollDauer: 0.45,
    saltoDauer: 0.72, // Zeit für die volle 360°-Drehung (≈ Flugzeit)
  },

  animation: {
    uebergangsDauer: 0.1, // Posen blenden bei Zustandswechseln weich ineinander über
  },

  // Waffen verstärken nur den Arm-Angriff (Schlag wird zum Hieb)
  // Waffen-Werte stecken in den hieb_*-Angriffen; hier nur Optik + Boni
  waffen: {
    schwert: { laenge: 55 },
    stab:    { laenge: 95 },
    dolch:   { laenge: 30, tempoBonus: 0.12 },
  },

  // Schwierigkeitsgrade wirken nur auf die KI-Gegner
  schwierigkeiten: {
    leicht: { name: 'Leicht', schaden: 0.7,  hp: 0.85, denken: 1.3 },
    normal: { name: 'Normal', schaden: 1,    hp: 1,    denken: 1 },
    schwer: { name: 'Schwer', schaden: 1.25, hp: 1.15, denken: 0.75 },
  },

  // Schatten-Splitter ◆ als Belohnung nach einem Match.
  // Turnier: je weiter auf der Karte, desto mehr — und jede Welt multipliziert.
  belohnungen: {
    turnierBasis: 20,
    turnierProStufe: 12,
    bossBonus: 60,
    freierSieg: 15,
    niederlage: 5,
  },

  // Jede Welt macht die Gegner stärker und die Belohnungen größer
  weltSteigerung: 0.3,

  // Endboss-Mechanik "Schattenschritt": kurz unsichtbar, dann hinter dem Gegner
  boss: {
    teleportDauer: 0.4,
    teleportAbstand: 110,
  },

  kombo: {
    maxKette: 3,        // höchstens 3 Angriffe hintereinander
    treffCancel: 0.06,  // nach einem TREFFER darf so schnell der nächste Angriff folgen
    whiffCancel: 0.1,   // VERFEHLT? Dann erst nach dem Ausschwingen (aktivBis + diese Zeit)
    kettenVorlauf: 0.05,       // Folgeangriffe starten schon halb ausgeholt (schneller)
    kettenAusfall: 130,        // größerer Ausfallschritt in der Kette — bleibt am Gegner dran
    kettenRueckstossFaktor: 0.55, // Ketten-Treffer stoßen wenig weg, nur der Finisher schleudert
    pufferDauer: 0.25,  // Angriffs-Eingaben bleiben so lange gültig (wichtig auf Touch)
    finisherSchaden: 1.4,   // der 3. Treffer der Kette haut deutlich härter rein
    finisherRueckstoss: 1.7,
    spamAbzug: 0.15,        // gleicher Angriff wiederholt → je 15 % weniger Schaden
    spamMinimum: 0.5,       // nie unter 50 % des Grundschadens
    serienFenster: 1.4,     // s ohne Treffer, bis die Treffer-Serie abreißt
  },

  training: {
    regeneration: 14,   // HP pro Sekunde, die sich beide im Training zurückholen
  },

  // Spielgefühl: kurzes Einfrieren bei Treffern (Hitstop) und Kamerawackeln
  gefuehl: {
    hitstopTreffer: 0.07,
    hitstopBlock: 0.03,
    hitstopKo: 0.14,
    shakeTreffer: 8,
    shakeBlock: 3,
    shakeKo: 14,
    kameraFolgen: 0.3,   // wie stark die Kamera der Kampfmitte folgt
    kameraMaxX: 120,
  },

  runden: {
    gewinneNoetig: 2,    // Best of 3
    introDauer: 1.6,
    rundenEndeDauer: 2.2,
    zeitLimit: 45,       // Sekunden pro Runde — bei Ablauf gewinnt, wer mehr Leben hat
  },

  ki: {
    denkIntervallMin: 0.2,  // die KI entscheidet alle 0,2–0,45 s neu
    denkIntervallMax: 0.45,
    angriffsAbstand: 150,   // näher als das → die KI greift an statt zu laufen
  },
};
