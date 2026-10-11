Projekt: SCHATTENPFAD — ein 2D-Silhouetten-Kampfspiel

Worum es geht
Schattenpfad ist kein Test- oder Lernprojekt mehr. Ziel ist ein richtig gutes, veröffentlichbares Spiel: ein 2D-Kampfspiel im Geist von Shadow Fight 2 — schwarze Silhouetten-Kämpfer vor atmosphärischen Arenen, präzises Kampfgefühl, eigene Welt und Geschichte. Es soll sich auf dem Handy und am PC gleich gut spielen und Leute freiwillig zurückkommen lassen.

Eigenes Werk: eigener Name, eigene Figuren, eigene Welt. Nichts aus Shadow Fight oder anderen Spielen übernehmen oder imitieren, was Namen, Figuren und Grafiken angeht.

Qualitätsanspruch (der Maßstab für jede Änderung)
Spielgefühl zuerst. Jede Mechanik muss sich gut ANFÜHLEN, bevor sie fertig ist: Treffer-Feedback, Timing, Lesbarkeit der Animationen. Im Zweifel lieber eine Sache poliert als zwei Sachen halb.
Kein Feature ohne Feinschliff. Neu eingebaute Mechanik = eingebaut + ausbalanciert + mit Sound/Partikeln/Animation versehen + auf Touch UND Tastatur getestet.
Lesbarkeit im Kampf. Der Spieler muss jederzeit erkennen können, was der Gegner tut und was er selbst tun kann (Ausholen sichtbar, Zustände klar unterscheidbar).
Performance: stabil 60 fps auch auf mittleren Handys. Keine Speicherlecks (Partikel, Bilder, Audio).
Code bleibt wartbar: klare Module, sprechende Namen, deutsche Warum-Kommentare, alle Balancing-Werte in src/config.js.

Aktueller Stand (bereits gebaut)
Kern: Game Loop (fester Zeitschritt), Skelett-Silhouetten mit Vorwärtskinematik, Keyframe-Animationen mit Pose-Blending und Easing-Kurven, Physik, Hitboxen/Hurtboxen, Blocken, Ducken, Kombo-Ketten (3er), Rolle (schräg unten), Salto (schräg oben), Sprung über den Gegner, Spezialangriff „Schattenstoß" mit Energie-Leiste.
Präsentation: Hitstop, Kamerawackeln, Funken-Partikel, HP-Nachlauf-Balken, Best-of-3-Runden, synthetisierter Sound (WebAudio), 3 fal-generierte Arenen mit Parallax (Aschenpass, Mondhain, Nebelschlucht).
Struktur: Hauptmenü, Story-Modus (3 Kämpfe mit Texten), Freier Kampf mit Gegner-Wahl, Touch-Steuerung mit virtuellem Joystick, responsives Canvas, Dreh-Hinweis und Vollbild am Handy.
Figuren: Juro (Spieler, Schwert), Scharr (ausgewogen), Veyra (flink, Stab), Dorn (Tank, Schwert) — alle datengetrieben in src/characters.js.
Deployment: GitHub (Felixdahm/shadow) → Vercel. JEDER PUSH GEHT LIVE: nur funktionierende, getestete Stände pushen. Committen gern oft, pushen nur Releases.

Wie du (Claude) mit mir arbeitest
Große Schritte, hoher Anspruch. Baue in sinnvollen Paketen und poliere sie fertig. Nach jedem Schritt: kurz was neu ist (2–3 Sätze) und wie ich es teste.
Entscheide selbst (Design, Balance, Posen, Farben) mit sinnvollen Defaults. Ich melde mich, wenn mir etwas nicht gefällt.
Frag nur bei Geld (fal-Generierungen: vorher Anzahl + Modell nennen) oder bei Richtungsentscheidungen, die das Spiel grundlegend verändern.
Nach jedem fertigen Meilenstein committen (ohne zu fragen). Pushen nur, wenn der Stand spielbar und getestet ist.
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
Look: Kämpfer sind reine schwarze Silhouetten aus Code (Skelett + dicke runde Linien). Keine Sprites für Figuren. Hintergründe farbig-atmosphärisch in Parallax-Ebenen; jede Arena hat eine eigene Farbwelt. Vordergrund-Elemente ebenfalls Silhouetten.
Figuren: unterscheiden sich über Umriss (Proportionen, Extras, Waffe) und Datenwerte; Persönlichkeit zeigt sich in Animation und KI-Stil.
Kampf: Jeder Angriff hat Ausholen → aktiv → Erholen. Leicht = schnell/schwach, schwer = langsam/stark/mehr Reichweite. Treffer brauchen Feedback (Hitstop, Rückstoß, Kamera, Funken, Sound). Ausweichen (Rolle, Salto, Ducken) muss sich immer lohnenswert anfühlen, aber riskant bleiben.
Steuerung: Tastatur (←→↑↓ + Schräglagen für Rolle/Salto, A Schlag, S Tritt, D Block, W Spezial) und Touch (Joystick links, 4 Buttons rechts). Beide gleichwertig gut.

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
