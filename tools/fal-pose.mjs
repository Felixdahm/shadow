// Pose-kontrollierte Generierung: Die KI muss den vorgegebenen Umriss ausmalen.
// Nutzung:
//   node tools/fal-pose.mjs --kontrolle assets/teile/pose-kontrolle.png \
//        --prompt "..." --ausgabe assets/teile/juro-puppe.png [--staerke 0.8]
import { fal } from '@fal-ai/client';
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projektOrdner = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const envPfad = resolve(projektOrdner, '.env');
const falKey = readFileSync(envPfad, 'utf8').match(/^FAL_KEY=(.+)$/m)?.[1]?.trim();
if (!falKey) {
  console.error('Fehler: FAL_KEY fehlt in .env');
  process.exit(1);
}
fal.config({ credentials: falKey });

function argument(name, pflicht = true) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1]) {
    if (pflicht) {
      console.error(`Fehler: Argument --${name} fehlt.`);
      process.exit(1);
    }
    return null;
  }
  return process.argv[i + 1];
}

const kontrolle = argument('kontrolle');
const prompt = argument('prompt');
const ausgabe = argument('ausgabe');
const staerke = Number(argument('staerke', false) ?? 0.8);
const modus = argument('modus', false) ?? 'canny'; // 'canny' | 'pose' | 'depth' …

// Kontrollbild zu fal hochladen
const blob = new Blob([readFileSync(resolve(projektOrdner, kontrolle))], { type: 'image/png' });
const kontrollUrl = await fal.storage.upload(blob);
console.log('Kontrollbild hochgeladen.');

// Zwei Betriebsarten:
//  --modus canny/pose/…  → ControlNet (Kanten/Gelenke steuern die Form)
//  --modus i2i           → Image-to-Image (Referenzbild wird übermalt;
//                           Stärke = wie viel verändert werden darf, 0–1)
const istI2i = modus === 'i2i';
const MODELL = istI2i ? 'fal-ai/flux/dev/image-to-image' : 'fal-ai/flux-general';
console.log(`Generiere mit ${MODELL} (${modus}, Stärke ${staerke}) …`);
const ergebnis = await fal.subscribe(MODELL, {
  input: istI2i ? {
    prompt,
    image_url: kontrollUrl,
    strength: staerke,
    num_images: 1,
  } : {
    prompt,
    image_size: 'square_hd',
    num_inference_steps: 28,
    guidance_scale: 3.5,
    num_images: 1,
    controlnet_unions: [{
      path: 'InstantX/FLUX.1-dev-Controlnet-Union',
      conditioning_scale: staerke,
      controls: [{
        control_mode: modus,
        control_image_url: kontrollUrl,
      }],
    }],
  },
});

const bild = ergebnis.data?.images?.[0];
if (!bild?.url) {
  console.error('Fehler: keine Bild-Antwort:', JSON.stringify(ergebnis.data, null, 2));
  process.exit(1);
}

const antwort = await fetch(bild.url);
const daten = Buffer.from(await antwort.arrayBuffer());
const zielPfad = resolve(projektOrdner, ausgabe);
mkdirSync(dirname(zielPfad), { recursive: true });
writeFileSync(zielPfad, daten);
console.log(`Gespeichert: ${ausgabe} (${Math.round(daten.length / 1024)} kB)`);

const protokollPfad = resolve(projektOrdner, 'assets/prompts.md');
if (!existsSync(protokollPfad)) appendFileSync(protokollPfad, '# Generierte Bilder\n\n| Datei | Modell | Seed | Prompt |\n|---|---|---|---|\n');
appendFileSync(protokollPfad, `| ${ausgabe} | ${MODELL} (canny ${staerke}) | ${ergebnis.data?.seed ?? '-'} | ${prompt.replaceAll('|', '/')} |\n`);
