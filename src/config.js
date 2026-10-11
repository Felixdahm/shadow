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
    tritt:   { dauer: 0.52, aktivVon: 0.18, aktivBis: 0.32, schaden: 13, reichweite: 95,  hoeheVomBoden: 82,  rueckstoss: 260 },
    spezial: { dauer: 0.6,  aktivVon: 0.25, aktivBis: 0.42, schaden: 24, reichweite: 110, hoeheVomBoden: 120, rueckstoss: 430 },
    // Flugkick: Höhe ist relativ zu den Füßen des Springenden — trifft also dort, wo er gerade fliegt
    luftTritt: { dauer: 0.5, aktivVon: 0.08, aktivBis: 0.3, schaden: 10, reichweite: 88, hoeheVomBoden: 40, rueckstoss: 300 },
    // Wurf: Konter gegen Dauerblocker — durchbricht den Block, braucht Nähe
    wurf: { dauer: 0.55, aktivVon: 0.22, aktivBis: 0.34, schaden: 10, reichweite: 90, hoeheVomBoden: 110, rueckstoss: 540 },
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
    hitstunDauer: 0.3,        // so lange ist der Getroffene handlungsunfähig
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
  waffen: {
    schwert: { laenge: 55, reichweiteBonus: 45, schadenBonus: 4 },
    stab:    { laenge: 95, reichweiteBonus: 55, schadenBonus: 2 },
    dolch:   { laenge: 30, reichweiteBonus: 15, schadenBonus: 2 },
  },

  // Endboss-Mechanik "Schattenschritt": kurz unsichtbar, dann hinter dem Gegner
  boss: {
    teleportDauer: 0.4,
    teleportAbstand: 110,
  },

  kombo: {
    maxKette: 3,        // höchstens 3 Angriffe hintereinander
    fensterNach: 0.05,  // so lange nach dem Treffer-Fenster darf verkettet werden
    pufferDauer: 0.25,  // Angriffs-Eingaben bleiben so lange gültig (wichtig auf Touch)
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
