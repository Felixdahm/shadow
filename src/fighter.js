import { CONFIG } from './config.js';
import { poseZumZeitpunkt, mischePosen, weich, sprungPose } from './animations.js';
import { zeichneSkelett } from './skeleton.js';
import { spieleSchwung } from './sound.js';

export class Kaempfer {
  constructor(charakter, x, blick) {
    this.charakter = charakter;
    this.name = charakter.name;
    this.skalierung = charakter.skalierung;
    this.maxHp = Math.round(CONFIG.kaempfer.maxHp * charakter.hpFaktor);
    this.tempo = CONFIG.kaempfer.laufTempo * charakter.tempoFaktor;
    this.waffenDaten = charakter.waffe ? CONFIG.waffen[charakter.waffe] : null;

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
    this.kombo = 0;            // Position in der Angriffskette
    this.puffer = null;        // vorgemerkter Folgeangriff (Kombo)
    this.kiGedaechtnis = { timer: 0, eingabe: null };
    // Für weiche Übergänge: die zuletzt gezeichnete Pose wird beim
    // Zustandswechsel als Startpunkt der Überblendung gemerkt.
    this.letztePose = null;
    this.uebergangVon = null;
    this.uebergangZeit = 1;
  }

  amBoden() {
    return this.y >= CONFIG.physik.bodenY - 0.5;
  }

  lebt() {
    return this.zustand !== 'ko';
  }

  istAngriff() {
    return this.zustand === 'schlag' || this.zustand === 'tritt';
  }

  wechsle(zustand) {
    this.zustand = zustand;
    this.zustandZeit = 0;
    this.hatGetroffen = false;
    this.uebergangVon = this.letztePose;
    this.uebergangZeit = 0;
    if (zustand === 'schlag' || zustand === 'tritt') {
      spieleSchwung();
    } else {
      this.kombo = 0;
      this.puffer = null;
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
    this.wechsle('stehen');
  }

  update(dt, eingabe, gegner) {
    // Schnelle Charaktere führen Angriffe schneller aus und laufen hektischer:
    // die Zustands-Uhr läuft mit tempoFaktor, Animation und Treffer-Fenster bleiben synchron.
    const eiltEs = this.istAngriff() || this.zustand === 'laufen';
    this.zustandZeit += dt * (eiltEs ? this.charakter.tempoFaktor : 1);
    this.uebergangZeit += dt;

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

    if (this.istAngriff()) {
      const A = CONFIG.angriffe[this.zustand];
      // Leichter Ausfallschritt nach vorn macht Angriffe druckvoller
      this.vx = this.zustandZeit < A.aktivBis ? this.blick * 90 : 0;

      // Kombo: Während des Angriffs gedrückte Tasten werden gepuffert …
      if (eingabe.schlag) this.puffer = 'schlag';
      if (eingabe.tritt) this.puffer = 'tritt';

      // … und nach dem Treffer-Fenster darf direkt der nächste Angriff starten
      const kettenFenster = A.aktivBis + CONFIG.kombo.fensterNach;
      if (this.puffer && this.kombo < CONFIG.kombo.maxKette - 1 && this.zustandZeit >= kettenFenster) {
        this.kombo++;
        const naechster = this.puffer;
        this.puffer = null;
        this.wechsle(naechster);
        return;
      }

      if (this.zustandZeit >= A.dauer) {
        this.kombo = 0;
        this.puffer = null;
        this.wechsle('stehen');
      }
      return;
    }

    if (this.zustand === 'springen') {
      // In der Luft volle Steuerung — so springt man über den Gegner hinweg
      this.vx = ((eingabe.rechts ? 1 : 0) - (eingabe.links ? 1 : 0)) * this.tempo;
      if (this.amBoden() && this.vy >= 0) this.wechsle('stehen');
      return;
    }

    // Ab hier: steuerbare Boden-Zustände (stehen, laufen, ducken, block)
    this.blick = gegner.x >= this.x ? 1 : -1; // immer zum Gegner schauen
    this.vx = 0;

    if (eingabe.schlag) {
      this.wechsle('schlag');
    } else if (eingabe.tritt) {
      this.wechsle('tritt');
    } else if (eingabe.springen) {
      this.vy = -CONFIG.kaempfer.sprungKraft;
      this.wechsle('springen');
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
    // Bodenschatten, damit die Figur nicht "schwebt"
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, CONFIG.physik.bodenY + 8, 42 * this.skalierung, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Im Sprung folgt die Pose der Flugbahn, sonst der Keyframe-Animation
    let pose = this.zustand === 'springen'
      ? sprungPose(this.vy)
      : poseZumZeitpunkt(this.zustand, this.zustandZeit);

    // Weiche Überblendung vom letzten Zustand in den neuen
    const D = CONFIG.animation.uebergangsDauer;
    if (this.uebergangVon && this.uebergangZeit < D) {
      pose = mischePosen(this.uebergangVon, pose, weich(this.uebergangZeit / D));
    }
    this.letztePose = pose;

    // Hit-Flash: direkt nach einem Treffer färbt sich die Silhouette kurz dunkelrot
    const flash = this.zustand === 'treffer' && this.zustandZeit < 0.12 ? '#6b1626' : null;
    zeichneSkelett(ctx, this.x, this.y, this.blick, pose, {
      einfaerbung: flash,
      skalierung: this.skalierung,
      waffe: this.charakter.waffe,
      extras: this.charakter.extras,
    });
  }
}
