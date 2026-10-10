import { CONFIG } from './config.js';
import { poseZumZeitpunkt } from './animations.js';
import { zeichneSkelett } from './skeleton.js';

export class Kaempfer {
  constructor(name, x, blick) {
    this.name = name;
    this.x = x;
    this.y = CONFIG.physik.bodenY; // y = Fußposition
    this.vx = 0;
    this.vy = 0;
    this.blick = blick; // +1 schaut nach rechts, -1 nach links
    this.hp = CONFIG.kaempfer.maxHp;
    this.zustand = 'stehen';
    this.zustandZeit = 0;
    this.hatGetroffen = false; // jeder Angriff trifft höchstens einmal
    this.rueckstoss = 0;       // Rückstoß-Geschwindigkeit nach einem Treffer
    this.kiGedaechtnis = { timer: 0, eingabe: null };
  }

  amBoden() {
    return this.y >= CONFIG.physik.bodenY - 0.5;
  }

  lebt() {
    return this.zustand !== 'ko';
  }

  wechsle(zustand) {
    this.zustand = zustand;
    this.zustandZeit = 0;
    this.hatGetroffen = false;
  }

  update(dt, eingabe, gegner) {
    this.zustandZeit += dt;
    const K = CONFIG.kaempfer;

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

    if (this.zustand === 'schlag' || this.zustand === 'tritt') {
      this.vx = 0;
      if (this.zustandZeit >= CONFIG.angriffe[this.zustand].dauer) this.wechsle('stehen');
      return;
    }

    if (this.zustand === 'springen') {
      // In der Luft lässt sich die Richtung noch leicht steuern
      this.vx = ((eingabe.rechts ? 1 : 0) - (eingabe.links ? 1 : 0)) * K.laufTempo * 0.8;
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
      this.vy = -K.sprungKraft;
      this.wechsle('springen');
    } else if (eingabe.block) {
      if (this.zustand !== 'block') this.wechsle('block');
    } else if (eingabe.ducken) {
      if (this.zustand !== 'ducken') this.wechsle('ducken');
    } else if (eingabe.links || eingabe.rechts) {
      this.vx = (eingabe.rechts ? 1 : -1) * K.laufTempo;
      if (this.zustand !== 'laufen') this.wechsle('laufen');
    } else if (this.zustand !== 'stehen') {
      this.wechsle('stehen');
    }
  }

  zeichne(ctx) {
    // Bodenschatten, damit die Figur nicht "schwebt"
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, CONFIG.physik.bodenY + 8, 42, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    const pose = poseZumZeitpunkt(this.zustand, this.zustandZeit);
    zeichneSkelett(ctx, this.x, this.y, this.blick, pose);
  }
}
