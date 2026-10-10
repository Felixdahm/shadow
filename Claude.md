Projekt: Schatten-Kampfspiel

Worum es geht
Ich baue ein 2D-Kampfspiel im Stil von Shadow Fight 2 nach: schwarze Silhouetten-Kämpfer vor stimmungsvollen, farbigen Hintergründen, flüssige Animationen, Nahkampf 1 gegen 1.

Das Hauptziel: so schnell wie möglich ein spielbares Spiel. Es soll ein eigenes Spiel werden mit eigenem Namen, eigenen Figuren und eigener Welt. Keine Namen, Figuren oder Grafiken aus Shadow Fight übernehmen.

Wie du (Claude) mit mir arbeitest
Tempo vor Lehrbuch. Baue in großen Schritten, gern mehrere Features auf einmal. Keine langen Erklärungen — nach jedem Schritt reicht: was ist neu (2–3 Sätze) und wie ich es teste (Datei/URL öffnen, Tasten).
Entscheide selbst. Design-Entscheidungen (Posen, Timing, Farben, Balance-Werte) triffst du mit sinnvollen Defaults, statt mich zu fragen. Ich sage Bescheid, wenn mir etwas nicht gefällt.
Frag nur bei Dingen, die Geld kosten (fal-Bildgenerierung) oder das Spiel grundlegend ändern würden.
Nach jedem spielbaren Meilenstein einen Git-Commit machen, ohne nachzufragen.
Code bleibt lesbar: klare Namen, deutsche Kommentare nur da, wo das Warum nicht offensichtlich ist.
Am Ende jedes Schritts muss ein spielbarer Stand stehen, den ich im Browser testen kann.

Technik
HTML + JavaScript + Canvas 2D. Keine Game-Engine, kein Framework, kein Build-Schritt.
Von Anfang an ES-Module in src/. Lokaler Server: python3 -m http.server 8000 → http://localhost:8000
Feste Zeitschritte in der Game-Loop (Delta-Time), damit das Spiel auf 60-Hz- und 120-Hz-Bildschirmen gleich schnell läuft.
Alle Spielwerte (Schaden, Tempo, Sprungkraft …) stehen gesammelt in src/config.js, damit sich das Balancing leicht anpassen lässt.

Ordnerstruktur
index.html
src/
main.js          # Start, Game Loop
config.js        # alle Spielwerte zum Balancen
input.js         # Tastatur (später Touch)
physics.js       # Schwerkraft, Boden, Bewegung
skeleton.js      # Knochen, Gelenke, Zeichnen der Silhouette
animations.js    # Keyframe-Posen und Interpolation
fighter.js       # Kämpfer inkl. State Machine
combat.js        # Hitboxen, Hurtboxen, Schaden, Hitstop
ai.js            # Gegner-KI
stage.js         # Hintergrund mit Parallax-Ebenen
ui.js            # Lebensbalken, Runden, Texte
assets/
backgrounds/     # mit fal generierte Hintergrundebenen
ui/
tools/
fal-image.mjs    # Skript zur Bildgenerierung mit fal
docs/
design.md        # Design-Dokument (Welt, Figuren, Balance)

Fahrplan (große Schritte, jeder endet spielbar)
Phase	Ergebnis
1 — Spielbarer Kern	Zwei Skelett-Silhouetten-Kämpfer, Laufen/Springen/Ducken, Schlag/Tritt/Block mit Basis-Animationen, Hitboxen, Schaden, Lebensbalken, einfache Gegner-KI, K.O. und Neustart. Danach kann man das Spiel schon spielen.
2 — Spielgefühl & Präsentation	Bessere Animationen (Easing, Antizipation), Hitstop, Rückstoß, Kamerawackeln, Partikel, Runden-Ablauf („FIGHT!", „K.O."), Parallax-Hintergrund mit fal-Bildern, UI-Politur.
3 — Ausbau	Waffen (Schwert, Stab), mehrere Gegner mit eigenem Stil, Sound, Kombos, Spezialangriffe, Touch-Steuerung.

Design-Grundsätze
Look
Kämpfer sind reine schwarze Silhouetten, die im Code gezeichnet werden (Skelett + dicke Linien/Formen mit runden Enden). Keine Bild-Sprites für die Figuren, denn die Animation lebt vom Skelett.
Hintergründe sind farbig und atmosphärisch (Sonnenuntergang, Mondnacht, Nebel), in mehreren Ebenen für Tiefe (Parallax). Vordergrund-Elemente sind ebenfalls Silhouetten.
Jede Arena hat eine eigene Farbpalette.
Charaktere
Figuren unterscheiden sich nur über den Umriss: Proportionen, Haltung, Extras (Hut, Zopf, Umhang, Bart), Waffe.
Jede Figur ist ein Datenobjekt (Größe, Armlänge, Rumpfbreite, Extras, Tempo, Schaden). Gleiches Skelett mit anderen Werten ergibt eine andere Figur.
Persönlichkeit zeigt sich durch Animation (ruhiger Meister vs. hektischer Wilder).
Spielgefühl
Jeder Angriff hat drei Phasen: Ausholen → aktiv (Treffer möglich) → Erholen.
Leichte Angriffe: schnell, wenig Schaden. Schwere Angriffe: langsam, mehr Schaden und Reichweite.
Treffer brauchen Feedback: Hitstop (ca. 50–100 ms Einfrieren), Rückstoß, kurzes Kamerawackeln.
Steuerung (Tastatur, Startbelegung)
← → laufen, ↑ springen, ↓ ducken
A Schlag, S Tritt, D blocken

Bilder mit fal generieren
Mit fal generieren wir Bilder für Hintergründe, Titelbild und UI. Die Kämpfer selbst werden nicht generiert (siehe oben).

Einrichtung
API-Schlüssel steht in .env als FAL_KEY=.... Niemals den Schlüssel in Code, Commits oder Chat ausgeben. .env muss in .gitignore stehen.
Paket: @fal-ai/client (Node.js). Lege package.json nur dafür an. Das Spiel selbst bleibt ohne Build und ohne Abhängigkeiten.
Lege das Skript tools/fal-image.mjs an. Es soll Folgendes können:
Prompt, Modell, Seitenverhältnis/Größe und Ausgabepfad als Argumente annehmen
das Bild herunterladen und unter assets/... speichern
Prompt, Modell und Seed in assets/prompts.md protokollieren (damit Bilder reproduzierbar sind)
Aktuelle Modell-IDs und Parameter in der fal-Doku prüfen und nicht aus dem Gedächtnis nehmen. Grobe Richtung: ein FLUX-Modell oder Nano Banana für Bilder, ein Background-Removal-Modell (z. B. BiRefNet) für transparente Vordergrund-Ebenen.
Regeln für die Bildgenerierung
Vor jeder Generierung fragen und Anzahl und Modell nennen (fal kostet Geld). Lieber erst 1–2 Testbilder als gleich zehn.
Einheitlicher Stil über eine feste Stil-Vorlage im Prompt, z. B.:
„2D side-scrolling fighting game background, layered silhouettes, atmospheric sunset gradient, painterly, soft fog, no characters, no text, wide 16:9"

Für Parallax: jede Ebene separat generieren (Himmel, ferne Berge, mittlere Ebene, Vordergrund), Vordergrund-Ebenen danach freistellen (transparentes PNG).
Keine Figuren, keine Schrift und keine Logos in Hintergrundbildern.
Nichts generieren, das Shadow Fight oder andere bekannte Spiele kopiert (kein „in the style of Shadow Fight" im Prompt).

Offene Entscheidungen
Name des Spiels, Setting, Held und Gegner: Claude schlägt selbst etwas Passendes vor und baut damit weiter — ich kann es jederzeit ändern lassen.
Gespielt wird zuerst am PC (Tastatur), Touch kommt in Phase 3.
