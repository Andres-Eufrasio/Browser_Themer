// Generates `src/palettes.json` (consumed by the app UI) from palette-data.mjs.
//
//   node scripts/gen-palettes.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	ACCENT_CHOICES,
	PALETTES,
	PALETTE_LABELS,
	PALETTE_SCHEMES,
} from './palette-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const palettes = {};
for (const [palette, modes] of Object.entries(PALETTES)) {
	palettes[palette] = {
		label: PALETTE_LABELS[palette],
		scheme: PALETTE_SCHEMES[palette],
		dark: modes.dark,
		light: modes.light,
	};
}

const out = { palettes, accents: ACCENT_CHOICES };

const target = path.join(root, 'src', 'palettes.json');
fs.writeFileSync(target, `${JSON.stringify(out, null, '\t')}\n`);
console.log(`wrote ${path.relative(root, target)}`);
