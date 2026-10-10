// Bildgenerierung mit fal. Nutzung:
//   node tools/fal-image.mjs --prompt "..." --modell fal-ai/... --groesse landscape_16_9 --ausgabe assets/backgrounds/himmel.png [--seed 42]
//
// Das Skript liest FAL_KEY aus .env, lädt das fertige Bild herunter und
// protokolliert Prompt, Modell und Seed in assets/prompts.md (Reproduzierbarkeit).
import { fal } from '@fal-ai/client';
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projektOrdner = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// --- .env einlesen (bewusst ohne Zusatzpaket) ---
const envPfad = resolve(projektOrdner, '.env');
if (!existsSync(envPfad)) {
  console.error('Fehler: .env nicht gefunden. Erwartet wird eine Zeile FAL_KEY=...');
  process.exit(1);
}
const falKey = readFileSync(envPfad, 'utf8').match(/^FAL_KEY=(.+)$/m)?.[1]?.trim();
if (!falKey) {
  console.error('Fehler: In .env fehlt die Zeile FAL_KEY=...');
  process.exit(1);
}
fal.config({ credentials: falKey });

// --- Argumente einlesen ---
function argument(name, pflicht = true) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1]) {
    if (pflicht) {
      console.error(`Fehler: Argument --${name} fehlt.`);
      console.error('Beispiel: node tools/fal-image.mjs --prompt "..." --modell fal-ai/... --groesse landscape_16_9 --ausgabe assets/backgrounds/test.png');
      process.exit(1);
    }
    return null;
  }
  return process.argv[i + 1];
}

const prompt = argument('prompt');
const modell = argument('modell');
const groesse = argument('groesse');
const ausgabe = argument('ausgabe');
const seed = argument('seed', false);

// --- Bild generieren ---
console.log(`Generiere mit ${modell} …`);
const ergebnis = await fal.subscribe(modell, {
  input: {
    prompt,
    image_size: groesse,
    num_images: 1,
    ...(seed ? { seed: Number(seed) } : {}),
  },
});

const bild = ergebnis.data?.images?.[0] ?? ergebnis.data?.image;
if (!bild?.url) {
  console.error('Fehler: Die Antwort enthielt kein Bild. Antwort:');
  console.error(JSON.stringify(ergebnis.data, null, 2));
  process.exit(1);
}

// --- Herunterladen und speichern ---
const antwort = await fetch(bild.url);
const daten = Buffer.from(await antwort.arrayBuffer());
const zielPfad = resolve(projektOrdner, ausgabe);
mkdirSync(dirname(zielPfad), { recursive: true });
writeFileSync(zielPfad, daten);
console.log(`Gespeichert: ${ausgabe} (${Math.round(daten.length / 1024)} kB)`);

// --- Protokoll für Reproduzierbarkeit ---
const benutzterSeed = ergebnis.data?.seed ?? seed ?? 'unbekannt';
const protokollPfad = resolve(projektOrdner, 'assets/prompts.md');
mkdirSync(dirname(protokollPfad), { recursive: true });
if (!existsSync(protokollPfad)) {
  appendFileSync(protokollPfad, '# Generierte Bilder\n\n| Datei | Modell | Seed | Prompt |\n|---|---|---|---|\n');
}
appendFileSync(protokollPfad, `| ${ausgabe} | ${modell} | ${benutzterSeed} | ${prompt.replaceAll('|', '/')} |\n`);
console.log('In assets/prompts.md protokolliert.');
