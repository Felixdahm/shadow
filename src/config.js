// Alle Spielwerte an einem Ort, damit sich das Balancing leicht anpassen lässt.
export const CONFIG = {
  canvas: { breite: 960, hoehe: 540 },

  physik: {
    bodenY: 470,
    schwerkraft: 2300,
    randLinks: 70,
    randRechts: 890,
    minAbstand: 60, // Kämpfer schieben sich gegenseitig weg, wenn sie näher kommen
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
    oberarm: 32,
    unterarm: 30,
    oberschenkel: 50,
    unterschenkel: 48,
    linienBreite: 13,
  },

  // Jeder Angriff: Gesamtdauer, aktives Treffer-Fenster, Schaden, Reichweite,
  // Höhe der Hitbox über dem Boden und Rückstoß für den Getroffenen.
  angriffe: {
    schlag:  { dauer: 0.38, aktivVon: 0.12, aktivBis: 0.24, schaden: 8,  reichweite: 78,  hoeheVomBoden: 140, rueckstoss: 170 },
    // Kombo-Haken mit der hinteren Faust (ohne Waffen-Bonus, etwas kürzer)
    schlag2: { dauer: 0.38, aktivVon: 0.12, aktivBis: 0.24, schaden: 9,  reichweite: 70,  hoeheVomBoden: 140, rueckstoss: 190 },
    tritt:   { dauer: 0.52, aktivVon: 0.18, aktivBis: 0.32, schaden: 13, reichweite: 95,  hoeheVomBoden: 82,  rueckstoss: 260 },
    spezial: { dauer: 0.6,  aktivVon: 0.25, aktivBis: 0.42, schaden: 24, reichweite: 110, hoeheVomBoden: 120, rueckstoss: 430 },
    // Flugkick: Höhe ist relativ zu den Füßen des Springenden — trifft also dort, wo er gerade fliegt
    luftTritt: { dauer: 0.5, aktivVon: 0.08, aktivBis: 0.3, schaden: 10, reichweite: 88, hoeheVomBoden: 40, rueckstoss: 300 },
    // Wurf: Konter gegen Dauerblocker — durchbricht den Block, braucht Nähe
    wurf: { dauer: 0.55, aktivVon: 0.22, aktivBis: 0.34, schaden: 10, reichweite: 90, hoeheVomBoden: 110, rueckstoss: 540 },

    // Waffen-eigene Hiebe (ersetzen den Faust-Schlag, wenn eine Waffe getragen wird)
    hieb_schwert: { dauer: 0.46, aktivVon: 0.16, aktivBis: 0.3,  schaden: 13, reichweite: 125, hoeheVomBoden: 135, rueckstoss: 220 },
    hieb_stab:    { dauer: 0.5,  aktivVon: 0.18, aktivBis: 0.32, schaden: 10, reichweite: 150, hoeheVomBoden: 115, rueckstoss: 260 },
    hieb_dolch:   { dauer: 0.3,  aktivVon: 0.08, aktivBis: 0.17, schaden: 9,  reichweite: 85,  hoeheVomBoden: 135, rueckstoss: 140 },

    // Richtungs-Attacken: ↓+Schlag, vorwärts+Schlag, ↓+Tritt
    aufwaerts: { dauer: 0.42, aktivVon: 0.12, aktivBis: 0.22, schaden: 10, reichweite: 70, hoeheVomBoden: 120, rueckstoss: 100, knockup: 540, ausfall: 40 },
    sturm:     { dauer: 0.44, aktivVon: 0.14, aktivBis: 0.28, schaden: 11, reichweite: 95, hoeheVomBoden: 130, rueckstoss: 320, ausfall: 300 },
    fege:      { dauer: 0.46, aktivVon: 0.14, aktivBis: 0.26, schaden: 8,  reichweite: 95, hoeheVomBoden: 30,  rueckstoss: 180, niederschlag: true, ausfall: 60 },
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

  // Schatten-Splitter ◆ als Belohnung nach einem Match
  belohnungen: {
    storySieg: 25,
    bossSieg: 60,
    freierSieg: 15,
    niederlage: 5,
  },

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
  },

  ki: {
    denkIntervallMin: 0.2,  // die KI entscheidet alle 0,2–0,45 s neu
    denkIntervallMax: 0.45,
    angriffsAbstand: 110,   // näher als das → die KI greift an statt zu laufen
  },
};
