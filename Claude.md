Projekt: SCHATTENPFAD — ein 2D-Silhouetten-Kampfspiel

Worum es geht
Schattenpfad ist kein Test- oder Lernprojekt mehr. Ziel ist ein richtig gutes, veröffentlichbares Spiel: ein 2D-Kampfspiel im Geist von Shadow Fight 2 — schwarze Silhouetten-Kämpfer vor atmosphärischen Arenen, präzises Kampfgefühl, eigene Welt und Geschichte.

HANDY ZUERST: Das Spiel ist ein Handy-Spiel (Querformat, Touch). Jede Entscheidung — Steuerung, UI-Größen, Lesbarkeit, Performance — wird fürs Handy getroffen und dort beurteilt. Der PC (Tastatur) bleibt voll spielbar, dient aber vor allem dem schnellen Testen während der Entwicklung.

Eigenes Werk: eigener Name, eigene Figuren, eigene Welt. Nichts aus Shadow Fight oder anderen Spielen übernehmen oder imitieren, was Namen, Figuren und Grafiken angeht.

Qualitätsanspruch (der Maßstab für jede Änderung)
Spielgefühl zuerst. Jede Mechanik muss sich gut ANFÜHLEN, bevor sie fertig ist: Treffer-Feedback, Timing, Lesbarkeit der Animationen. Im Zweifel lieber eine Sache poliert als zwei Sachen halb.
Kein Feature ohne Feinschliff. Neu eingebaute Mechanik = eingebaut + ausbalanciert + mit Sound/Partikeln/Animation versehen. Maßstab ist die Touch-Bedienung am Handy; Tastatur muss funktionieren (fürs Testen am PC), wird aber nicht extra poliert.
Daumen-Regeln fürs Handy: Buttons und Joystick groß genug für Daumen, nichts Wichtiges unter den Fingern verstecken, UI-Texte auf Handy-Größe lesbar, keine Hover-Effekte, alles mit maximal zwei Daumen bedienbar.
Lesbarkeit im Kampf. Der Spieler muss jederzeit erkennen können, was der Gegner tut und was er selbst tun kann (Ausholen sichtbar, Zustände klar unterscheidbar).
Performance: stabil 60 fps auch auf mittleren Handys. Keine Speicherlecks (Partikel, Bilder, Audio).
Code bleibt wartbar: klare Module, sprechende Namen, deutsche Warum-Kommentare, alle Balancing-Werte in src/config.js.

Aktueller Stand (bereits gebaut)
Kern: Game Loop (fester Zeitschritt), Skelett-Silhouetten mit Vorwärtskinematik, Keyframe-Animationen mit Pose-Blending und Easing-Kurven, Physik, Hitboxen/Hurtboxen, Blocken, Ducken, Kombo-Ketten (3er), Rolle (schräg unten), Salto (schräg oben), Sprung über den Gegner, Spezialangriff „Schattenstoß" mit Energie-Leiste.
Präsentation: Hitstop, Kamerawackeln, Funken-Partikel, HP-Nachlauf-Balken, Best-of-3-Runden, synthetisierter Sound (WebAudio), 3 fal-generierte Arenen mit Parallax (Aschenpass, Mondhain, Nebelschlucht).
Struktur: Hauptmenü, Story-Modus (3 Kämpfe mit Texten), Freier Kampf mit Gegner-Wahl, Touch-Steuerung mit virtuellem Joystick, responsives Canvas, Dreh-Hinweis und Vollbild am Handy.
Figuren: Juro (Spieler, Schwert), Scharr (ausgewogen), Veyra (flink, Stab), Dorn (Tank, Schwert) — alle datengetrieben in src/characters.js.
Deployment: GitHub (Felixdahm/shadow) → Vercel. JEDER PUSH GEHT LIVE: nur funktionierende, getestete Stände pushen. Committen gern oft, pushen nur Releases.
WICHTIG bei jedem Push: Die Cache-Version in sw.js hochzählen (schattenpfad-vN), sonst bekommen wiederkehrende Spieler das Update nicht (der Service Worker liefert Cache zuerst aus). Neue Asset-Dateien auch in die KERN-Liste in sw.js eintragen.

Wie du (Claude) mit mir arbeitest
KLEINE SCHRITTE, PERFEKTIONIEREN VOR DEM PUSH. Der Arbeitszyklus ist:
1. EIN Baustein pro Schritt — eine Mechanik, ein Bildschirm, ein Detail. Nicht mehrere Features in einem Rutsch.
2. Nach jedem Schritt: kurz erklären, was neu ist, und GENAU sagen, was ich testen soll (welcher Modus, welche Tasten, worauf achten).
3. Ich teste und gebe Feedback. Wir iterieren an demselben Baustein, bis er sich perfekt anfühlt — erst dann kommt der nächste.
4. Committen nach jedem Schritt (ohne zu fragen). GEPUSHT wird erst, wenn ich den Stand ausdrücklich freigebe ("push") — ein Push kann mehrere perfektionierte Schritte bündeln.
Entscheide selbst bei Kleinkram (Posen, Farben, Zahlenwerte als Startpunkt) — aber erwarte, dass wir sie gemeinsam feinjustieren.
Frag bei Geld (fal: vorher Anzahl + Modell nennen) und bei Richtungsentscheidungen.
Am Ende jedes Schritts steht ein spielbarer Stand im Browser.
Antworte auf Deutsch.

Technik (bewährt, bleibt so)
HTML + JavaScript + Canvas 2D, ES-Module in src/. Keine Game-Engine, kein Framework, kein Build-Schritt — das Spiel lädt überall sofort.
Lokal entwickeln: python3 -m http.server 8000 → http://localhost:8000 (im WLAN auch vom Handy erreichbar).
Fester Zeitschritt (120 Hz Simulation), alle Spielwerte in src/config.js.
package.json nur für das fal-Werkzeug (tools/fal-image.mjs). Das Spiel selbst hat null Abhängigkeiten.

Fahrplan zum richtig guten Spiel
A — Kampf-Feinschliff (als Nächstes)
Eingabe-Puffer und Kombo-Feintuning, bessere Treffer-Lesbarkeit (Ausholen deutlicher), Luftangriff, Wurf/Griff als Konter gegen Dauerblocker, Balancing-Pass über alle Charaktere, Trainings-Modus (Gegner steht still / blockt nur).
B — Inhalt & Kampagne
6–8 Gegner mit eigenen Silhouetten, Waffen und KI-Persönlichkeiten; pro Gegner eine Arena-Stimmung; Story-Kampagne mit Karte/Fortschritt und einem echten Endboss mit eigener Mechanik; Zwischengegner-Varianten für Wiederspielwert.
C — Progression & Meta
Belohnungen nach Kämpfen, Waffen/Fähigkeiten freischalten, Charakter-Anpassung (Silhouetten-Extras), Speicherstand in localStorage, Schwierigkeitsgrade.
D — Präsentation & Release
Generiertes Titelbild, Musik (Loop pro Arena) und mehr Soundvielfalt, UI-Redesign (eigene Schrift, Übergänge zwischen Bildschirmen), Einstellungs-Menü (Ton, Steuerung), Lade-/Fehlerzustände, Favicon + Meta-Tags, PWA (am Handy installierbar, offline spielbar), Playtest-Runde mit Freunden und Balancing danach.

Design-Grundsätze
Look (nach Spieler-Feedback überarbeitet): Kämpfer sind Code-gezeichnete, FARBIGE Figuren (Skelett + dicke runde Linien, aber mit Hautton, Kleidungs- und Akzentfarben pro Charakter — keine schwarzen Silhouetten mehr). Jeder Charakter hat zusätzlich ein fal-generiertes PORTRAIT (assets/portraits/) für Story, Gegner-Wahl und den VS-Screen vor jedem Kampf — das macht die Figuren zu echten Charakteren. Animierte Sprites aus fal sind technisch nicht machbar (keine konsistenten Einzelbilder) — die Animation bleibt Skelett-basiert. Hintergründe farbig-atmosphärisch in Parallax-Ebenen; jede Arena hat eine eigene Farbwelt. Shop-Gegenstände haben eigenes fal-Artwork (assets/ui/waffe-*).
Figuren: unterscheiden sich über Umriss (Proportionen, Extras, Waffe) und Datenwerte; Persönlichkeit zeigt sich in Animation und KI-Stil.
Kampf: Jeder Angriff hat Ausholen → aktiv → Erholen. Leicht = schnell/schwach, schwer = langsam/stark/mehr Reichweite. Treffer brauchen Feedback (Hitstop, Rückstoß, Kamera, Funken, Sound). Ausweichen (Rolle, Salto, Ducken) muss sich immer lohnenswert anfühlen, aber riskant bleiben.
Steuerung: Touch ist die Haupt-Steuerung (Joystick links, 4 Buttons rechts) und muss sich erstklassig anfühlen. Tastatur (←→↑↓ + Schräglagen für Rolle/Salto, A Schlag, S Tritt, D Block, W Spezial) ist die Test-Steuerung am PC.

Bilder mit fal generieren
Für Hintergründe, Titelbild, UI — nie für die Kämpfer selbst.
API-Schlüssel in .env als FAL_KEY=... — niemals in Code, Commits oder Chat. .env bleibt in .gitignore.
Skript: tools/fal-image.mjs (Prompt, Modell, Größe, Ausgabepfad; protokolliert in assets/prompts.md für Reproduzierbarkeit).
Vor jeder Generierung: Anzahl + Modell nennen und fragen (kostet Geld). Modell-IDs in der fal-Doku prüfen, nicht raten. Stil-Vorlage für einheitlichen Look beibehalten (painterly, layered silhouettes, no characters, no text).
Parallax: Ebenen separat generieren; Silhouetten-Ebenen auf Weiß generieren und im Code freistellen (bewährtes Verfahren in src/stage.js).

Offene Richtungsfragen (bei Gelegenheit mit mir klären)
Endboss: Wer ist der Schatten hinter dem Pfad? (Story-Finale)
Progression: eher Arcade (Highscores) oder RPG-light (Ausrüstung freischalten)?
Soll das Spiel einen eigenen Domain-Namen bekommen?
