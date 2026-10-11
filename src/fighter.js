import { CONFIG } from './config.js';
import { poseZumZeitpunkt, mischePosen, weich, sprungPose, ANIMATIONEN } from './animations.js';
import { zeichneSkelett } from './skeleton.js';
import { spieleSchwung, spieleSpezialStart, spieleTeleport } from './sound.js';
import { spawnSchattenWolke, spawnStaub } from './particles.js';
import { KOEPFE, TEXTUREN } from './bilder.js';

export class Kaempfer {
  constructor(charakter, x, blick) {
    this.charakter = charakter;
    this.name = charakter.name;
    this.skalierung = charakter.skalierung;
    this.maxHp = Math.round(CONFIG.kaempfer.maxHp * charakter.hpFaktor);
    this.waffenDaten = charakter.waffe ? CONFIG.waffen[charakter.waffe] : null;
    // Jeder Charakter hat seinen eigenen Spezialangriff (Stoß, Beben, Wirbel …)
    this.spezialArt = charakter.spezial ?? 'stoss';
    this.spezialDaten = CONFIG.spezialArten[this.spezialArt];
    // Manche Waffen (Dolch) machen den Träger schneller
    this.tempo = CONFIG.kaempfer.laufTempo * charakter.tempoFaktor * (1 + (this.waffenDaten?.tempoBonus ?? 0));

    this.x = x;
    this.y = CONFIG.physik.bodenY; // y = Fußposition
    this.vx = 0;
    this.vy = 0;
    this.blick = blick; // +1 schaut nach rechts, -1 nach links
    this.hp = this.maxHp;
    this.anzeigeHp = this.hp; // läuft dem echten HP-Wert hinterher (Balken-Nachlauf)
    this.rundenSiege = 0;
    this.zustand = 'stehen';
    this.zustandZeit = 0;
    this.hatGetroffen = false; // jeder Angriff trifft höchstens einmal
    this.rueckstoss = 0;       // Rückstoß-Geschwindigkeit nach einem Treffer
    this.energie = 0;          // füllt sich durch Treffer; voll = Spezialangriff bereit
    this.kombo = 0;            // Position in der Angriffskette
    this.aktionsPuffer = null; // gepufferter Angriffs-Wunsch { aktion, alter }
    this.rolleRichtung = 1;    // Bildschirm-Richtung der aktuellen Rolle
    this.saltoRichtung = 1;    // Bildschirm-Richtung des aktuellen Saltos
    this.teleportiert = false; // Schattenschritt: wurde schon gesprungen?
    this.trefferZeit = 0;      // wann (Zustands-Zeit) der laufende Angriff getroffen hat
    this.letzterTrefferZug = null; // für die Spam-Strafe: welcher Angriff traf zuletzt?
    this.spamZaehler = 0;
    this.trefferSerie = { anzahl: 0, timer: 0 }; // Kombo-Zähler fürs UI
    this.kiGedaechtnis = { timer: 0, eingabe: null };
    // Für weiche Übergänge: die zuletzt gezeichnete Pose wird beim
    // Zustandswechsel als Startpunkt der Überblendung gemerkt.
    this.letztePose = null;
    this.uebergangVon = null;
    this.uebergangZeit = 1;
    this.spur = [];      // Nachbilder bei Rolle/Salto/Sturm/Spezial
    this.spurTimer = 0;
  }

  amBoden() {
    return this.y >= CONFIG.physik.bodenY - 0.5;
  }

  lebt() {
    return this.zustand !== 'ko';
  }

  // Luft-Angriffe haben eigene Zweige, weil die Schwerkraft weiterwirkt
  istLuftAngriff() {
    return ['luftTritt', 'luftSchlag', 'sturzTritt'].includes(this.zustand);
  }

  // Boden-Angriffe
  istAngriff() {
    return this.zustand === 'spezial' || (!this.istLuftAngriff() && CONFIG.angriffe[this.zustand] !== undefined);
  }

  // Werte des laufenden Angriffs — der Spezial hat pro Charakter eigene
  angriffsDaten() {
    return this.zustand === 'spezial' ? this.spezialDaten : CONFIG.angriffe[this.zustand];
  }

  // Grund-Schlag hängt von der Waffe ab: Faust, Schwert-Hieb, Stab-Feger, Dolch-Stich
  basisSchlag() {
    return this.charakter.waffe ? `hieb_${this.charakter.waffe}` : 'schlag';
  }

  wechsle(zustand) {
    this.zustand = zustand;
    this.zustandZeit = 0;
    this.hatGetroffen = false;
    this.uebergangVon = this.letztePose;
    this.uebergangZeit = 0;
    if (zustand === 'spezial') {
      spieleSpezialStart();
    } else if (zustand === 'schatten') {
      this.teleportiert = false;
      spieleTeleport();
    } else if (CONFIG.angriffe[zustand] || zustand === 'rolle' || zustand === 'salto') {
      spieleSchwung();
    } else {
      this.kombo = 0;
      if (zustand === 'liegen') spawnStaub(this.x, CONFIG.physik.bodenY);
    }
  }

  // Setzt alles für eine neue Runde zurück (Siege bleiben erhalten)
  neueRunde(x, blick) {
    this.x = x;
    this.y = CONFIG.physik.bodenY;
    this.vx = 0;
    this.vy = 0;
    this.blick = blick;
    this.hp = this.maxHp;
    this.anzeigeHp = this.hp;
    this.rueckstoss = 0;
    // Energie bleibt über die Runden erhalten — den Spezial für Runde 2
    // aufzusparen ist eine echte taktische Entscheidung (wie in Shadow Fight 3)
    this.aktionsPuffer = null;
    this.letzterTrefferZug = null;
    this.spamZaehler = 0;
    this.trefferSerie = { anzahl: 0, timer: 0 };
    this.wechsle('stehen');
  }

  update(dt, eingabe, gegner) {
    // Schnelle Charaktere führen Angriffe schneller aus und laufen hektischer:
    // die Zustands-Uhr läuft mit tempoFaktor, Animation und Treffer-Fenster bleiben synchron.
    const eiltEs = this.istAngriff() || this.zustand === 'laufen';
    this.zustandZeit += dt * (eiltEs ? this.charakter.tempoFaktor : 1);
    this.uebergangZeit += dt;

    // Eingabe-Puffer: Angriffs-Wünsche bleiben kurz gültig, damit ein Tipp kurz
    // vor Ende einer Aktion nicht verloren geht (wichtig für Touch-Steuerung).
    if (eingabe.schlag) this.aktionsPuffer = { aktion: 'schlag', alter: 0 };
    else if (eingabe.tritt) this.aktionsPuffer = { aktion: 'tritt', alter: 0 };
    else if (eingabe.spezial) this.aktionsPuffer = { aktion: 'spezial', alter: 0 };
    else if (this.aktionsPuffer) {
      this.aktionsPuffer.alter += dt;
      if (this.aktionsPuffer.alter > CONFIG.kombo.pufferDauer) this.aktionsPuffer = null;
    }

    // Treffer-Serie reißt ab, wenn zu lange kein Treffer landet
    if (this.trefferSerie.timer > 0) {
      this.trefferSerie.timer -= dt;
      if (this.trefferSerie.timer <= 0) this.trefferSerie.anzahl = 0;
    }

    // Der Anzeige-Balken gleitet dem echten HP-Stand hinterher
    this.anzeigeHp += (this.hp - this.anzeigeHp) * Math.min(1, 5 * dt);
    if (Math.abs(this.anzeigeHp - this.hp) < 0.3) this.anzeigeHp = this.hp;

    // Rückstoß schiebt den Kämpfer und klingt von selbst ab
    this.x += this.rueckstoss * dt;
    this.rueckstoss *= Math.exp(-8 * dt);

    if (this.zustand === 'ko') {
      this.vx = 0;
      return;
    }

    if (this.zustand === 'treffer') {
      this.vx = 0;
      if (this.zustandZeit >= CONFIG.treffer.hitstunDauer) this.wechsle('stehen');
      return;
    }

    if (this.zustand === 'liegen') {
      // Am Boden: unverwundbar (siehe combat.js), rutscht mit dem Rückstoß aus,
      // steht danach von selbst wieder auf
      this.vx = 0;
      if (this.zustandZeit >= CONFIG.treffer.liegenDauer) this.wechsle('stehen');
      return;
    }

    if (this.istAngriff()) {
      const A = this.angriffsDaten();

      if (this.zustand === 'spezial') {
        // Manche Spezials (Stoß, Klingentanz) tragen den Kämpfer mit einem Dash
        const dash = A.dash && this.zustandZeit > 0.12 && this.zustandZeit < A.aktivBis;
        this.vx = dash ? this.blick * A.dash : 0;
      } else if (this.zustand === 'wurf') {
        this.vx = 0;
      } else {
        const K = CONFIG.kombo;
        // Ausfallschritt nach vorn; manche Angriffe (Sturmstoß!) haben ihren eigenen
        const schritt = A.ausfall ?? (this.kombo > 0 ? K.kettenAusfall : 90);
        this.vx = this.zustandZeit < A.aktivBis ? this.blick * schritt : 0;

        // Treffer-Cancel: Hat der Angriff GETROFFEN, darf sofort nach dem Einschlag
        // der nächste folgen — die Kette fließt. Verfehlte Angriffe müssen erst
        // ausschwingen, Whiffen ist also riskant.
        const wunsch = this.aktionsPuffer?.aktion;
        const kettenFenster = this.hatGetroffen
          ? Math.max(this.trefferZeit + K.treffCancel, A.aktivVon)
          : A.aktivBis + K.whiffCancel;
        if (wunsch && wunsch !== 'spezial' && this.kombo < K.maxKette - 1 && this.zustandZeit >= kettenFenster) {
          this.kombo++;
          this.aktionsPuffer = null;
          // Waffen-Hieb auf Waffen-Hieb wechselt zur freien Faust (Haken) und zurück —
          // so wechseln sich Waffe und Faust in der Kette sichtbar ab
          let naechster = wunsch === 'schlag' ? this.basisSchlag() : wunsch;
          if (wunsch === 'schlag' && this.zustand === this.basisSchlag()) naechster = 'schlag2';
          this.wechsle(naechster);
          // Folgeangriffe starten schon halb ausgeholt — das macht die Kette schnell
          this.zustandZeit = K.kettenVorlauf;
          return;
        }
      }

      if (this.zustandZeit >= A.dauer) {
        this.kombo = 0;
        this.wechsle('stehen');
      }
      return;
    }

    // Nachbilder: schnelle Bewegungen ziehen eine Geister-Spur hinter sich her
    const zieht = ['rolle', 'salto', 'sturm', 'spezial', 'dreh'].includes(this.zustand);
    this.spurTimer -= dt;
    if (zieht && this.spurTimer <= 0 && this.letztePose) {
      this.spur.push({ x: this.x, y: this.y, blick: this.blick, pose: this.letztePose });
      if (this.spur.length > 4) this.spur.shift();
      this.spurTimer = 0.045;
    } else if (!zieht && this.spur.length) {
      this.spur.shift();
    }

    if (this.zustand === 'luftTritt' || this.zustand === 'luftSchlag') {
      // Schwung aus dem Sprung bleibt, Schwerkraft wirkt weiter
      if (this.amBoden() && this.vy >= 0) { spawnStaub(this.x, CONFIG.physik.bodenY); this.wechsle('stehen'); }
      else if (this.zustand === 'luftSchlag' && this.zustandZeit >= CONFIG.angriffe.luftSchlag.dauer) this.wechsle('springen');
      return;
    }

    if (this.zustand === 'sturzTritt') {
      // Divekick: schießt diagonal nach unten, bis der Boden kommt
      this.vx = this.blick * 260;
      if (this.amBoden()) {
        spawnStaub(this.x, CONFIG.physik.bodenY);
        spawnStaub(this.x + this.blick * 25, CONFIG.physik.bodenY);
        this.wechsle('stehen');
      }
      return;
    }

    if (this.zustand === 'springen' || this.zustand === 'salto') {
      // Angriff in der Luft: A = Luftschlag (Juggle), S = Flugkick, ↓+A/S = Sturztritt
      const wunsch = this.aktionsPuffer?.aktion;
      if (wunsch === 'schlag' || wunsch === 'tritt') {
        this.aktionsPuffer = null;
        if (eingabe.ducken) {
          this.vy = Math.max(this.vy, 700); // sofort nach unten schießen
          this.wechsle('sturzTritt');
        } else {
          this.wechsle(wunsch === 'schlag' ? 'luftSchlag' : 'luftTritt');
        }
        return;
      }
      if (this.zustand === 'springen') {
        // In der Luft volle Steuerung — so springt man über den Gegner hinweg
        this.vx = ((eingabe.rechts ? 1 : 0) - (eingabe.links ? 1 : 0)) * this.tempo;
      } else {
        this.vx = this.saltoRichtung * this.tempo * 1.15;
      }
      if (this.amBoden() && this.vy >= 0) { spawnStaub(this.x, CONFIG.physik.bodenY); this.wechsle('stehen'); }
      return;
    }

    if (this.zustand === 'schatten') {
      // Schattenschritt des Endbosses: ausblenden, hinter dem Gegner auftauchen.
      // Während des Schritts ist er unverwundbar (siehe combat.js).
      this.vx = 0;
      const B = CONFIG.boss;
      if (!this.teleportiert && this.zustandZeit >= B.teleportDauer / 2) {
        this.teleportiert = true;
        const P = CONFIG.physik;
        spawnSchattenWolke(this.x, this.y - 90 * this.skalierung);
        // "Hinter" dem Gegner = die Seite, von der er wegschaut
        this.x = Math.max(P.randLinks, Math.min(P.randRechts, gegner.x - gegner.blick * B.teleportAbstand));
        this.blick = gegner.x >= this.x ? 1 : -1;
        spawnSchattenWolke(this.x, this.y - 90 * this.skalierung);
      }
      if (this.zustandZeit >= B.teleportDauer) this.wechsle('stehen');
      return;
    }

    if (this.zustand === 'rolle') {
      // Die Rolle trägt den Kämpfer tief über den Boden — Schläge gehen drüber weg
      this.vx = this.rolleRichtung * CONFIG.bewegung.rollTempo;
      if (this.zustandZeit >= CONFIG.bewegung.rollDauer) {
        this.wechsle(eingabe.ducken && !(eingabe.links || eingabe.rechts) ? 'ducken' : 'stehen');
      }
      return;
    }

    // Ab hier: steuerbare Boden-Zustände (stehen, laufen, ducken, block)
    this.blick = gegner.x >= this.x ? 1 : -1; // immer zum Gegner schauen
    this.vx = 0;

    const wunsch = this.aktionsPuffer?.aktion;

    if (eingabe.teleport && this.charakter.boss) {
      this.wechsle('schatten');
    } else if (wunsch === 'spezial' && this.energie >= CONFIG.spezial.energieMax) {
      this.aktionsPuffer = null;
      this.energie = 0;
      this.wechsle('spezial');
    } else if (wunsch === 'schlag' || wunsch === 'tritt') {
      this.aktionsPuffer = null;
      // Richtung + Angriff = eigene Attacke (wie in großen Kampfspielen)
      const vorwaerts = (eingabe.rechts && this.blick === 1) || (eingabe.links && this.blick === -1);
      const rueckwaerts = (eingabe.links && this.blick === 1) || (eingabe.rechts && this.blick === -1);
      const W = CONFIG.angriffe.wurf;
      const wurfNah = Math.abs(gegner.x - this.x) < W.reichweite;
      if (wunsch === 'schlag') {
        if (gegner.zustand === 'block' && gegner.amBoden() && wurfNah) {
          this.wechsle('wurf'); // Blocker werden geworfen
        } else if (eingabe.ducken) {
          this.wechsle('aufwaerts'); // ↓+Schlag: Uppercut, schleudert in die Luft
        } else if (vorwaerts) {
          this.wechsle('sturm'); // vorwärts+Schlag: Dash-Ramme
        } else if (rueckwaerts) {
          this.wechsle('dreh'); // zurück+Schlag: Drehschlag mit vollem Körperschwung
        } else {
          this.wechsle(this.basisSchlag()); // Waffen-Hieb bzw. Fauststoß
        }
      } else if (eingabe.ducken) {
        this.wechsle('fege'); // ↓+Tritt: tiefer Fegetritt, streckt nieder
      } else {
        this.wechsle('tritt');
      }
    } else if (eingabe.springen) {
      this.vy = -CONFIG.kaempfer.sprungKraft;
      if (eingabe.links || eingabe.rechts) {
        // Schräg nach oben → Salto in diese Richtung (vorwärts oder rückwärts)
        this.saltoRichtung = eingabe.rechts ? 1 : -1;
        this.wechsle('salto');
      } else {
        this.wechsle('springen');
      }
    } else if (eingabe.ducken && (eingabe.links || eingabe.rechts)) {
      // Schräg nach unten → Rolle in diese Richtung
      this.rolleRichtung = eingabe.rechts ? 1 : -1;
      spawnStaub(this.x, CONFIG.physik.bodenY);
      this.wechsle('rolle');
    } else if (eingabe.block) {
      if (this.zustand !== 'block') this.wechsle('block');
    } else if (eingabe.ducken) {
      if (this.zustand !== 'ducken') this.wechsle('ducken');
    } else if (eingabe.links || eingabe.rechts) {
      this.vx = (eingabe.rechts ? 1 : -1) * this.tempo;
      if (this.zustand !== 'laufen') this.wechsle('laufen');
    } else if (this.zustand !== 'stehen') {
      this.wechsle('stehen');
    }
  }

  zeichne(ctx) {
    // Geister-Spur (Nachbilder) hinter schnellen Bewegungen
    for (let i = 0; i < this.spur.length; i++) {
      const g = this.spur[i];
      ctx.globalAlpha = 0.08 + 0.05 * i;
      zeichneSkelett(ctx, g.x, g.y, g.blick, g.pose, {
        einfaerbung: '#8A5CF6',
        skalierung: this.skalierung,
      });
    }
    ctx.globalAlpha = 1;

    // Bodenschatten, damit die Figur nicht "schwebt"
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, CONFIG.physik.bodenY + 8, 42 * this.skalierung, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boss-Aura: violettes Glimmen, in der Wut-Phase (unter 50 % HP) deutlich stärker
    if (this.charakter.boss && this.lebt()) {
      const wut = this.hp < this.maxHp / 2;
      const puls = 0.6 + 0.4 * Math.sin(performance.now() / (wut ? 90 : 220));
      const mitteY = this.y - 85 * this.skalierung;
      const radius = 100 * this.skalierung;
      const aura = ctx.createRadialGradient(this.x, mitteY, 10, this.x, mitteY, radius);
      aura.addColorStop(0, `rgba(138, 108, 201, ${((wut ? 0.35 : 0.16) * puls).toFixed(2)})`);
      aura.addColorStop(1, 'rgba(138, 108, 201, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(this.x, mitteY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Während des Schattenschritts blendet die Figur aus und wieder ein
    if (this.zustand === 'schatten') {
      const halb = CONFIG.boss.teleportDauer / 2;
      ctx.globalAlpha = this.zustandZeit < halb
        ? Math.max(0, 1 - this.zustandZeit / halb)
        : Math.min(1, (this.zustandZeit - halb) / halb);
    }

    // Im Sprung folgt die Pose der Flugbahn, sonst der Keyframe-Animation.
    // Angriffs-Animationen strecken sich automatisch auf die Dauer aus der
    // Konfiguration — so bleiben Keyframes und Treffer-Fenster synchron.
    let pose;
    if (this.zustand === 'springen') {
      pose = sprungPose(this.vy);
    } else {
      const animName = this.zustand === 'spezial' ? `spezial_${this.spezialArt}` : this.zustand;
      let animZeit = this.zustandZeit;
      const A = this.istAngriff() || this.istLuftAngriff() ? this.angriffsDaten() : null;
      if (A && ANIMATIONEN[animName]) animZeit = this.zustandZeit * (ANIMATIONEN[animName].dauer / A.dauer);
      pose = poseZumZeitpunkt(animName, animZeit);
    }

    // Weiche Überblendung vom letzten Zustand in den neuen
    const D = CONFIG.animation.uebergangsDauer;
    if (this.uebergangVon && this.uebergangZeit < D) {
      pose = mischePosen(this.uebergangVon, pose, weich(this.uebergangZeit / D));
    }
    this.letztePose = pose;

    // Hit-Flash: direkt nach einem Treffer färbt sich die Silhouette kurz dunkelrot
    const flash = this.zustand === 'treffer' && this.zustandZeit < 0.12 ? '#6b1626' : null;

    // Rolle und Salto drehen den ganzen Körper um seinen Mittelpunkt
    const dreht = this.zustand === 'rolle' || this.zustand === 'salto';
    if (dreht) {
      const B = CONFIG.bewegung;
      const richtung = this.zustand === 'rolle' ? this.rolleRichtung : this.saltoRichtung;
      const dauer = this.zustand === 'rolle' ? B.rollDauer : B.saltoDauer;
      const winkel = Math.PI * 2 * Math.min(1, this.zustandZeit / dauer) * richtung;
      const pivotY = this.y - (this.zustand === 'rolle' ? 48 : 80) * this.skalierung;
      ctx.save();
      ctx.translate(this.x, pivotY);
      ctx.rotate(winkel);
      ctx.translate(-this.x, -pivotY);
    }

    zeichneSkelett(ctx, this.x, this.y, this.blick, pose, {
      einfaerbung: flash,
      skalierung: this.skalierung,
      waffe: this.charakter.waffe,
      extras: this.charakter.extras,
      farben: this.charakter.farben ?? null,
      kopfBild: KOEPFE[this.name.toLowerCase()] ?? null,
      details: this.name.toLowerCase(),
      textur: TEXTUREN[this.name.toLowerCase()] ?? null,
      silhouette: this.rim ?? null, // Arena-Lichtfarbe → Shadow-Fight-Silhouette
    });

    if (dreht) ctx.restore();
    ctx.globalAlpha = 1;

    this.zeichneSchwungSpur(ctx);
  }

  // Heller, wandernder Bogen während des aktiven Treffer-Fensters —
  // macht auf dem kleinen Handy-Bildschirm sofort lesbar, DASS und WO
  // gerade ein Angriff durchschwingt.
  zeichneSchwungSpur(ctx) {
    const A = this.istAngriff() || this.istLuftAngriff() ? this.angriffsDaten() : null;
    if (!A || this.zustand === 'wurf') return;
    const von = A.aktivVon - 0.05;
    const bis = A.aktivBis + 0.05;
    if (this.zustandZeit < von || this.zustandZeit > bis) return;

    const t = (this.zustandZeit - von) / (bis - von); // 0..1 über das Fenster
    const sk = this.skalierung;
    const mitteY = this.y - 88 * sk;
    const radius = A.reichweite * 0.8 * sk;
    const start = -1.1 + 1.7 * t; // der Bogen wandert von oben nach vorn-unten

    ctx.strokeStyle = `rgba(255, 245, 225, ${(0.45 * (1 - t)).toFixed(2)})`;
    ctx.lineWidth = 7 * sk;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (this.blick === 1) {
      ctx.arc(this.x, mitteY, radius, start - 0.5, start);
    } else {
      ctx.arc(this.x, mitteY, radius, Math.PI - start, Math.PI - (start - 0.5), true);
    }
    ctx.stroke();
  }
}
