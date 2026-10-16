// Builds `import.json` (a Stylus "import" export) from the Catppuccin reference
// export `cattpuchin-mocha.json`, re-themed to the Gruvbox / Everforest /
// Kanagawa / Catppuccin palettes.
//
//   node scripts/build-import.mjs
//
// Every per-site stylesheet is ported verbatim (selectors, structure, comments)
// and only re-coloured. The shared Catppuccin library is replaced by an inlined
// Gruvbox / Everforest / Kanagawa / Catppuccin library.
//
// The palette colours live in `scripts/palette-data.mjs`; `src/palettes.json`
// (for the app UI) is generated separately by `scripts/gen-palettes.mjs`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	ACCENT_CHOICES,
	CONTRASTS,
	FLAVORS,
	KEYS,
	PALETTES,
	PALETTE_LABELS,
} from './palette-data.mjs';
import { saveCache, solveFilter } from './filter-solver.mjs';
import {
	AUTHOR,
	BASE_PALETTE,
	HOMEPAGE,
	VERSION,
	descriptionFor,
} from './meta.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REF = JSON.parse(fs.readFileSync(path.join(root, 'cattpuchin-mocha.json'), 'utf8'));
const [refSettings, ...refStyles] = REF;

const STANDARD_VARS = ['lightFlavor', 'darkFlavor', 'accentColor'];

// Imports to drop: the shared Catppuccin library, the Catppuccin-hosted syntax
// highlighters (their `--ctp-*` variables are unused here), and the
// flavour-dependent Catppuccin-hosted theme imports (their flavour names no
// longer match upstream, so they would 404). Flavour-independent functional CDN
// assets (e.g. the giscus loading gif) are kept.
const DROP_IMPORT =
	/(std\/v1\.less|pygments|prismjs|chroma\.catppuccin\.com|catppuccin\.github\.io|unpkg\.com\/@catppuccin\/)/;

// Hand-written body replacements (in reference form) for styles whose upstream
// port no longer matches the live site. Keyed by the last path segment of the
// reference namespace.
const BODY_OVERRIDES = {
	chatgpt: 'scripts/bodies/chatgpt.less',
	claude: 'scripts/bodies/claude.less',
	youtube: 'scripts/bodies/youtube.less',
};

// ---------------------------------------------------------------------------
// Body transform (Catppuccin reference -> neutral Gruvbox/Everforest body)
// ---------------------------------------------------------------------------

/** Extract the per-site stylesheet (everything after the metadata block). */
function refBody(src) {
	return src
		.slice(src.indexOf('==/UserStyle== */') + '==/UserStyle== */'.length)
		.trim();
}

/** Rename Catppuccin identifiers and comments to Gruvbox, guarding real URLs. */
function deBrand(s) {
	const urls = [];
	s = s.replace(/https?:\/\/[^\s"')]+/g, (m) => {
		urls.push(m);
		return `\u0000u${urls.length - 1}\u0000`;
	});
	s = s.replace(/catppuccin/gi, (m) => (m[0] === 'C' ? 'Gruvbox' : 'gruvbox'));
	return s.replace(/\u0000u(\d+)\u0000/g, (_, i) => urls[Number(i)]);
}

/**
 * Normalise `#lib.rgbify(..)` / `#lib.hslify(..)` calls. The upstream sources
 * sometimes append `[]` accessors to nested function calls, which Less rejects;
 * we collapse them and keep exactly one outer accessor.
 */
function fixAccessors(s) {
	for (const name of ['#lib.rgbify', '#lib.hslify']) {
		let out = '';
		let i = 0;
		for (;;) {
			const idx = s.indexOf(`${name}(`, i);
			if (idx === -1) {
				out += s.slice(i);
				break;
			}
			out += s.slice(i, idx + name.length + 1);
			let depth = 1;
			let j = idx + name.length + 1;
			let arg = '';
			while (j < s.length && depth > 0) {
				const ch = s[j];
				if (ch === '(') depth++;
				else if (ch === ')') {
					depth--;
					if (depth === 0) break;
				}
				arg += ch;
				j++;
			}
			let k = j + 1;
			while (s.slice(k, k + 2) === '[]') k += 2;
			out += `${arg.replace(/\)\[\]/g, ')')})[]`;
			i = k;
		}
		s = out;
	}
	return s;
}

function transformBody(body) {
	let b = fixAccessors(body);
	// Drop the shared library / Catppuccin-hosted imports (including multi-line ones).
	b = b.replace(/@import\b[^;]*;/gi, (m) => (DROP_IMPORT.test(m) ? '' : m));
	// De-brand identifiers and comments (e.g. `#catppuccin` -> `#gruvbox`).
	b = deBrand(b);
	// Flavour keywords -> light/dark.
	b = b.replace(/\blatte\b/g, 'light');
	b = b.replace(/\b(frappe|macchiato|mocha)\b/g, 'dark');
	// The inverse flavour must resolve through the palette-family-aware map.
	b = b.replace(
		/@inverse-theme:\s*if\(@flavor = light, dark, light\);/g,
		'@inverse-theme: @inverse-flavor[@@flavor];',
	);
	// `@flavor = light` etc. -> `@flavor-mode = light` (flavour keys now encode palette+mode).
	b = b.replace(/@flavor\s*=\s*"?light"?/g, '@flavor-mode = light');
	b = b.replace(/@flavor\s*=\s*"?dark"?/g, '@flavor-mode = dark');
	// A handful of styles declare a local `@contrast` (unrelated to our new
	// contrast variable); rename it so it can't shadow the library's lookup.
	b = b.replace(/@contrast(?![\w-])/g, '@contrast-fg');
	// Static flavour keys in direct palette references.
	b = b.replace(/@gruvbox\[@dark\]/g, '@gruvbox[@gruvbox-dark]');
	b = b.replace(/@gruvbox\[@light\]/g, '@gruvbox[@gruvbox-light]');
	// Direct palette references now need the contrast level in the key path.
	b = b.replace(/@gruvbox\[([^[\]]+)\]/g, '@gruvbox[$1][@@contrast-level]');
	b = b.replace(/@gruvbox-filters\[([^[\]]+)\]/g, '@gruvbox-filters[$1][@@contrast-level]');
	return b;
}

// ---------------------------------------------------------------------------
// Library rendering
// ---------------------------------------------------------------------------

function flavor(id, contrast, key) {
	return PALETTES[id.palette][id.mode][contrast][key];
}

/**
 * Emits one definition per distinct set of values and a `@<name>` map that
 * points the flavour/contrast combinations at them.
 *
 * Combinations that resolve to the same colours share a set: Catppuccin has no
 * contrast variants, and each of its flavours is offered in both dropdowns, so
 * its 24 combinations collapse into 4 sets. Less maps can point at other maps,
 * so `@gruvbox[@flavour][@contrast][@key]` and friends keep working.
 */
function renderSetMap(name, prefix, keys, valueOf) {
	const sets = [];
	const refs = new Map();
	const seen = new Map();
	for (const f of FLAVORS) {
		for (const c of CONTRASTS) {
			const values = keys.map((key) => valueOf(f, c, key));
			const signature = values.join('\u0000');
			let setName = seen.get(signature);
			if (!setName) {
				setName = `${prefix}${sets.length}`;
				seen.set(signature, setName);
				sets.push({ setName, values });
			}
			refs.set(`${f.key} ${c}`, setName);
		}
	}

	const lines = [];
	for (const { setName, values } of sets) {
		lines.push(`@${setName}: {`);
		keys.forEach((key, index) =>
			lines.push(`  @${key}: ${values[index]};`),
		);
		lines.push('};');
	}
	lines.push('', `@${name}: {`);
	for (const f of FLAVORS) {
		lines.push(`  @${f.key}: {`);
		for (const c of CONTRASTS) {
			lines.push(`    @${c}: @${refs.get(`${f.key} ${c}`)};`);
		}
		lines.push('  };');
	}
	lines.push('};');
	return lines.join('\n');
}

function renderPaletteMap() {
	return renderSetMap('gruvbox', 'gv-set', KEYS, (f, c, key) =>
		flavor(f, c, key),
	);
}

function renderFiltersMap(usedKeys) {
	const keys = KEYS.filter((key) => usedKeys.has(key));
	return renderSetMap('gruvbox-filters', 'gv-fset', keys, (f, c, key) =>
		solveFilter(flavor(f, c, key)),
	);
}

function renderMaps() {
	const lines = ['@gruvbox-modes: {'];
	for (const f of FLAVORS) lines.push(`  @${f.key}: ${f.scheme};`);
	lines.push('};', '', '@inverse-flavor: {');
	for (const f of FLAVORS) {
		const inv = `${f.palette}-${f.mode === 'dark' ? 'light' : 'dark'}`;
		lines.push(`  @${f.key}: ${inv};`);
	}
	lines.push('};');
	return lines.join('\n');
}

function renderLib(usedKeys, usesAccentFilter) {
	const paletteGetters = KEYS.map(
		(k) => `    @${k}: @gruvbox[@@flavor][@@contrast-level][@${k}];`,
	);
	const filterGetters = KEYS.filter((k) => usedKeys.has(k)).map(
		(k) => `    @${k}-filter: @gruvbox-filters[@@flavor][@@contrast-level][@${k}];`,
	);
	if (usesAccentFilter) {
		filterGetters.push(
			'    @accent-filter: @gruvbox-filters[@@flavor][@@contrast-level][@@accentColor];',
		);
	}

	return `#lib {
  .palette() {
    @flavor-mode: @gruvbox-modes[@@flavor];

${paletteGetters.join('\n')}
    @accent: @gruvbox[@@flavor][@@contrast-level][@@accentColor];
${filterGetters.length ? `\n${filterGetters.join('\n')}` : ''}
  }

  .defaults() {
    @flavor-mode: @gruvbox-modes[@@flavor];
    color-scheme: if(@flavor-mode = light, light, dark);

    ::selection {
      background-color: fade(@accent, 30%);
    }

    input,
    textarea {
      &::placeholder {
        color: @subtext0 !important;
      }
    }
  }

  .rgbify(@color) {
    @rgb: red(@color), green(@color), blue(@color);
  }

  .hslify(@color) {
    @raw: e(
      %("%s, %s%, %s%", hue(@color), saturation(@color), lightness(@color))
    );
  }

  .css-variables() {
${KEYS.map((k) => `    --gv-${k}: @${k};`).join('\n')}
  }
}`;
}

function renderLibrary(body) {
	const usedKeys = new Set();
	let usesAccentFilter = false;
	for (const m of body.matchAll(/@([a-z0-9-]+)-filter\b/g)) {
		if (m[1] === 'accent') {
			usesAccentFilter = true;
			for (const { key } of ACCENT_CHOICES) usedKeys.add(key);
		} else if (KEYS.includes(m[1])) {
			usedKeys.add(m[1]);
		}
	}

	const parts = [
		'/* Gruvbox / Everforest / Kanagawa / Catppuccin palette library */',
		renderPaletteMap(),
	];
	if (usesAccentFilter || usedKeys.size > 0) {
		parts.push(
			'',
			'/* Image filters (brightness(0) + invert/sepia/... tints monochrome icons). */',
			renderFiltersMap(usedKeys),
		);
	}
	parts.push('', renderMaps(), '', '@contrast-level: @contrast;', '', renderLib(usedKeys, usesAccentFilter));
	return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

function selectVar(name, label, options, defaultValue) {
	return {
		type: 'select',
		label,
		name,
		value: defaultValue,
		default: defaultValue,
		options: options.map((o) => ({ name: o.name, label: o.label, value: o.name })),
	};
}

// One option per palette family, e.g. `gruvbox-light`, `kanagawa-dark`.
function flavorOptions(mode) {
	return Object.entries(PALETTE_LABELS).map(([palette, label]) => ({
		name: `${palette}-${mode}`,
		label,
	}));
}

const VAR_DEFS = {
	lightFlavor: () =>
		selectVar('lightFlavor', 'Light Flavor', flavorOptions('light'), 'gruvbox-light'),
	darkFlavor: () =>
		selectVar('darkFlavor', 'Dark Flavor', flavorOptions('dark'), 'gruvbox-dark'),
	contrast: () =>
		selectVar(
			'contrast',
			'Contrast',
			[
				{ name: 'hard', label: 'Hard' },
				{ name: 'medium', label: 'Medium' },
				{ name: 'soft', label: 'Soft' },
			],
			'medium',
		),
	accentColor: () =>
		selectVar(
			'accentColor',
			'Accent',
			ACCENT_CHOICES.map(({ key, label }) => ({ name: key, label })),
			'orange',
		),
};

const STANDARD_VAR_ORDER = ['lightFlavor', 'darkFlavor', 'contrast', 'accentColor'];

function buildEntry(ref) {
	const site = ref.name.replace(/ Catppuccin$/, '');
	const name = `${site} ${BASE_PALETTE}`;
	const description = descriptionFor(BASE_PALETTE, site);
	const key = ref.usercssData.namespace.split('/').pop();

	const source = BODY_OVERRIDES[key]
		? fs.readFileSync(path.join(root, BODY_OVERRIDES[key]), 'utf8').trim()
		: refBody(ref.sourceCode);
	const body = transformBody(source);
	const library = renderLibrary(body);

	const refVars = ref.usercssData.vars;
	const extras = Object.entries(refVars).filter(([k]) => !STANDARD_VARS.includes(k));

	// Preserve the per-style extra `@var` lines verbatim from the reference.
	const refVarLines = ref.sourceCode
		.slice(0, ref.sourceCode.indexOf('==/UserStyle== */'))
		.split('\n')
		.filter((l) => l.startsWith('@var '));
	const extraVarLines = refVarLines.slice(STANDARD_VARS.length);

	const varLines = STANDARD_VAR_ORDER.map((n) => {
		const v = VAR_DEFS[n]();
		const group = v.options
			.map((o) => `"${o.name}:${o.label}${o.name === v.default ? '*' : ''}"`)
			.join(', ');
		return `@var select ${n} "${v.label}" [${group}]`;
	});

	const metadata = [
		'/* ==UserStyle==',
		`@name ${name}`,
		`@namespace gruvbox-userstyles-${key}`,
		`@homepageURL ${HOMEPAGE}`,
		`@version ${VERSION}`,
		`@description ${description}`,
		`@author ${AUTHOR}`,
		'@license MIT',
		'',
		'@preprocessor less',
		...varLines,
		...extraVarLines,
		'==/UserStyle== */',
	].join('\n');

	const vars = {
		lightFlavor: VAR_DEFS.lightFlavor(),
		darkFlavor: VAR_DEFS.darkFlavor(),
		contrast: VAR_DEFS.contrast(),
		accentColor: VAR_DEFS.accentColor(),
	};
	for (const [k, v] of extras) vars[k] = v;

	return {
		enabled: ref.enabled,
		name,
		description,
		author: AUTHOR,
		updateUrl: '',
		usercssData: {
			name,
			namespace: `gruvbox-userstyles-${key}`,
			homepageURL: HOMEPAGE,
			version: VERSION,
			updateURL: '',
			supportURL: '',
			description,
			author: AUTHOR,
			license: 'MIT',
			preprocessor: 'less',
			vars,
		},
		sourceCode: `${metadata}\n\n${library}\n\n${body}\n`,
		originalDigest: ref.originalDigest ?? null,
	};
}

const settings = {
	settings: {
		updateInterval: refSettings.settings.updateInterval,
		updateOnlyEnabled: false,
		patchCsp: refSettings.settings.patchCsp,
	},
};

const entries = refStyles.map(buildEntry);
saveCache();
const output = JSON.stringify([settings, ...entries]);
fs.writeFileSync(path.join(root, 'import.json'), output);
console.log(
	`wrote import.json: ${entries.length} userstyles, ${(output.length / 1024 / 1024).toFixed(2)} MB`,
);
