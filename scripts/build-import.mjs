// Builds `import.json` (a Stylus "import" export) from the Catppuccin reference
// export `cattpuchin-mocha.json`, re-themed to the Gruvbox / Everforest palettes.
//
//   node scripts/build-import.mjs
//
// Every per-site stylesheet is ported verbatim (selectors, structure, comments)
// and only re-coloured. The shared Catppuccin library is replaced by an inlined
// Gruvbox / Everforest library.
//
// The palette colours live in `scripts/palette-data.mjs`; `src/palettes.json`
// (for the app UI) is generated separately by `scripts/gen-palettes.mjs`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	ACCENTS,
	CONTRASTS,
	FLAVORS,
	KEYS,
	PALETTES,
	PALETTE_LABELS,
} from './palette-data.mjs';
import { saveCache, solveFilter } from './filter-solver.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REF = JSON.parse(fs.readFileSync(path.join(root, 'cattpuchin-mocha.json'), 'utf8'));
const [refSettings, ...refStyles] = REF;

const AUTHOR = 'gruvbox-userstyles';
const HOMEPAGE = 'https://github.com/morhetz/gruvbox';
const VERSION = '1.0.0';
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

function renderPaletteMap() {
	const lines = ['@gruvbox: {'];
	for (const f of FLAVORS) {
		lines.push(`  @${f.key}: {`);
		for (const c of CONTRASTS) {
			lines.push(`    @${c}: {`);
			for (const k of KEYS) lines.push(`      @${k}: ${flavor(f, c, k)};`);
			lines.push('    };');
		}
		lines.push('  };');
	}
	lines.push('};');
	return lines.join('\n');
}

function renderFiltersMap(usedKeys) {
	const lines = ['@gruvbox-filters: {'];
	for (const f of FLAVORS) {
		lines.push(`  @${f.key}: {`);
		for (const c of CONTRASTS) {
			lines.push(`    @${c}: {`);
			for (const k of KEYS) {
				if (!usedKeys.has(k)) continue;
				lines.push(`      @${k}: ${solveFilter(flavor(f, c, k))};`);
			}
			lines.push('    };');
		}
		lines.push('  };');
	}
	lines.push('};');
	return lines.join('\n');
}

function renderMaps() {
	const lines = ['@gruvbox-modes: {'];
	for (const f of FLAVORS) lines.push(`  @${f.key}: ${f.mode};`);
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
			for (const a of ACCENTS) usedKeys.add(a);
		} else if (KEYS.includes(m[1])) {
			usedKeys.add(m[1]);
		}
	}

	const parts = [
		'/* Gruvbox / Everforest palette library */',
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

// `bright-red` -> `Bright Red`
function accentLabel(key) {
	return key
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

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

const VAR_DEFS = {
	lightFlavor: () =>
		selectVar(
			'lightFlavor',
			'Light Flavor',
			[
				{ name: 'gruvbox-light', label: PALETTE_LABELS.gruvbox },
				{ name: 'everforest-light', label: PALETTE_LABELS.everforest },
			],
			'gruvbox-light',
		),
	darkFlavor: () =>
		selectVar(
			'darkFlavor',
			'Dark Flavor',
			[
				{ name: 'gruvbox-dark', label: PALETTE_LABELS.gruvbox },
				{ name: 'everforest-dark', label: PALETTE_LABELS.everforest },
			],
			'gruvbox-dark',
		),
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
			ACCENTS.map((a) => ({ name: a, label: accentLabel(a) })),
			'orange',
		),
};

const STANDARD_VAR_ORDER = ['lightFlavor', 'darkFlavor', 'contrast', 'accentColor'];

function buildEntry(ref) {
	const baseName = ref.name.replace(/ Catppuccin$/, '');
	const name = `${baseName} Gruvbox`;
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
		`@description ${ref.usercssData.description}`,
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
		description: ref.usercssData.description,
		author: AUTHOR,
		updateUrl: '',
		usercssData: {
			name,
			namespace: `gruvbox-userstyles-${key}`,
			homepageURL: HOMEPAGE,
			version: VERSION,
			updateURL: '',
			supportURL: '',
			description: ref.usercssData.description,
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
