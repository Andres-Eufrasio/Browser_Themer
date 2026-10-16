// Generates `src/palettes.json` (consumed by the app UI) from palette-data.mjs.
//
//   node scripts/gen-palettes.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PALETTES, PALETTE_LABELS } from './palette-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const out = {};
for (const [palette, modes] of Object.entries(PALETTES)) {
	out[palette] = {
		label: PALETTE_LABELS[palette],
		dark: modes.dark,
		light: modes.light,
	};
}

const target = path.join(root, 'src', 'palettes.json');
fs.writeFileSync(target, `${JSON.stringify(out, null, '\t')}\n`);
console.log(`wrote ${path.relative(root, target)}`);
