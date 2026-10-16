// Palette definitions for the Gruvbox / Everforest userstyles library.
//
// This is the single source of truth for both:
//   - `src/palettes.json` (consumed by the app UI / uno preflight)
//   - the inlined Less library in `import.json` (consumed by Stylus)
//
// Run `node scripts/gen-palettes.mjs` + `node scripts/build-import.mjs` after
// editing.

/** The seven base accent hues shared by Gruvbox and Everforest. */
export const ACCENT_BASES = [
	'red',
	'orange',
	'yellow',
	'green',
	'aqua',
	'blue',
	'purple',
];

// Every base hue is offered in three intensities:
//   `<hue>`         the palette's own accent
//   `bright-<hue>`  lighter + more saturated (pops on dark backgrounds)
//   `deep-<hue>`    darker + more saturated (pops on light backgrounds)
export const ACCENT_VARIANTS = ['', 'bright-', 'deep-'];
export const ACCENTS = ACCENT_BASES.flatMap((hue) =>
	ACCENT_VARIANTS.map((variant) => `${variant}${hue}`),
);

export const CONTRASTS = ['hard', 'medium', 'soft'];

export const PALETTE_LABELS = { gruvbox: 'Gruvbox', everforest: 'Everforest' };

// Non-accent colour keys (Catppuccin-compatible names used by the per-style
// extra variables, plus the surfaces/text ramp).
const AUX_KEYS = [
	'rosewater',
	'flamingo',
	'pink',
	'mauve',
	'maroon',
	'peach',
	'teal',
	'sky',
	'sapphire',
	'lavender',
	'text',
	'subtext1',
	'subtext0',
	'overlay2',
	'overlay1',
	'overlay0',
	'surface2',
	'surface1',
	'surface0',
	'base',
	'mantle',
	'crust',
];

/** Canonical colour keys used by the userstyles library. */
export const KEYS = [...ACCENTS, ...AUX_KEYS];

// ---------------------------------------------------------------------------
// Colour maths (HSL shifting, used to derive the bright/deep variants)
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
	const value = Number.parseInt(hex.slice(1), 16);
	return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex([r, g, b]) {
	return `#${[r, g, b]
		.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
		.join('')}`;
}

function rgbToHsl([r, g, b]) {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	const d = max - min;
	let h = 0;
	let s = 0;
	if (d !== 0) {
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			default:
				h = (r - g) / d + 4;
		}
		h *= 60;
	}
	return [h, s, l];
}

function hueToRgb(p, q, t) {
	if (t < 0) t += 1;
	if (t > 1) t -= 1;
	if (t < 1 / 6) return p + (q - p) * 6 * t;
	if (t < 1 / 2) return q;
	if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
	return p;
}

function hslToRgb([h, s, l]) {
	const hn = (((h % 360) + 360) % 360) / 360;
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	return [
		hueToRgb(p, q, hn + 1 / 3) * 255,
		hueToRgb(p, q, hn) * 255,
		hueToRgb(p, q, hn - 1 / 3) * 255,
	];
}

/** Shift a colour's lightness/saturation in HSL space (both in 0..1). */
function shift(hex, deltaLightness, deltaSaturation) {
	const [h, s, l] = rgbToHsl(hexToRgb(hex));
	return rgbToHex(
		hslToRgb([
			h,
			Math.max(0, Math.min(1, s + deltaSaturation)),
			Math.max(0, Math.min(1, l + deltaLightness)),
		]),
	);
}

const LIGHTEN = [0.14, 0.1];
const DARKEN = [-0.14, 0.1];

/** Expand the seven base accents into the full 21-key accent set. */
function expandAccents(accents) {
	const out = {};
	for (const hue of ACCENT_BASES) {
		out[hue] = accents[hue];
		out[`bright-${hue}`] = shift(accents[hue], ...LIGHTEN);
		out[`deep-${hue}`] = shift(accents[hue], ...DARKEN);
	}
	return out;
}

// ---------------------------------------------------------------------------
// Raw ramps
// ---------------------------------------------------------------------------

const gruvbox = {
	dark: {
		accents: {
			red: '#fb4934',
			orange: '#fe8019',
			yellow: '#fabd2f',
			green: '#b8bb26',
			aqua: '#8ec07c',
			blue: '#83a598',
			purple: '#d3869b',
		},
		fg: {
			text: '#ebdbb2',
			subtext1: '#d5c4a1',
			subtext0: '#bdae93',
			overlay2: '#a89984',
			overlay1: '#928374',
		},
		surface: {
			hard: {
				base: '#1d2021',
				mantle: '#171717',
				crust: '#101010',
				surface0: '#3c3836',
				surface1: '#504945',
				surface2: '#665c54',
				overlay0: '#7c6f64',
			},
			medium: {
				base: '#282828',
				mantle: '#1d2021',
				crust: '#171717',
				surface0: '#3c3836',
				surface1: '#504945',
				surface2: '#665c54',
				overlay0: '#7c6f64',
			},
			soft: {
				base: '#32302f',
				mantle: '#282828',
				crust: '#1d2021',
				surface0: '#3c3836',
				surface1: '#504945',
				surface2: '#665c54',
				overlay0: '#7c6f64',
			},
		},
	},
	light: {
		accents: {
			red: '#cc241d',
			orange: '#d65d0e',
			yellow: '#d79921',
			green: '#98971a',
			aqua: '#689d6a',
			blue: '#458588',
			purple: '#b16286',
		},
		fg: {
			text: '#3c3836',
			subtext1: '#504945',
			subtext0: '#665c54',
			overlay2: '#7c6f64',
			overlay1: '#928374',
		},
		surface: {
			hard: {
				base: '#f9f5d7',
				mantle: '#f2e5bc',
				crust: '#e8dcb8',
				surface0: '#ebdbb2',
				surface1: '#d5c4a1',
				surface2: '#bdae93',
				overlay0: '#a89984',
			},
			medium: {
				base: '#fbf1c7',
				mantle: '#f2e5bc',
				crust: '#e8dcb8',
				surface0: '#ebdbb2',
				surface1: '#d5c4a1',
				surface2: '#bdae93',
				overlay0: '#a89984',
			},
			soft: {
				base: '#f2e5bc',
				mantle: '#e8dcb8',
				crust: '#ddcfad',
				surface0: '#ebdbb2',
				surface1: '#d5c4a1',
				surface2: '#bdae93',
				overlay0: '#a89984',
			},
		},
	},
};

// Gruvbox accent aliases for the extra Catppuccin-style names.
const gruvboxAlias = (a) => ({
	rosewater: a.yellow,
	flamingo: a.red,
	pink: a.purple,
	mauve: a.purple,
	red: a.red,
	maroon: a.red,
	peach: a.orange,
	yellow: a.yellow,
	green: a.green,
	teal: a.aqua,
	sky: a.aqua,
	sapphire: a.blue,
	blue: a.blue,
	lavender: a.purple,
	orange: a.orange,
	aqua: a.aqua,
	purple: a.purple,
});

const everforest = {
	dark: {
		accents: {
			red: '#e67e80',
			orange: '#e69875',
			yellow: '#dbbc7f',
			green: '#a7c080',
			aqua: '#83c092',
			blue: '#7fbbb3',
			purple: '#d699b6',
		},
		grey: { grey0: '#7a8478', grey1: '#859289', grey2: '#9da9a0', fg: '#d3c6aa' },
		// crust is the next-darkest step of the background ramp.
		crust: { hard: '#191d1f', medium: '#1e2326', soft: '#232a2e' },
		surface: {
			hard: {
				base: '#272e33',
				mantle: '#1e2326',
				surface0: '#2e383c',
				surface1: '#374145',
				surface2: '#414b50',
				overlay0: '#495156',
				overlay1: '#4f5b58',
			},
			medium: {
				base: '#2d353b',
				mantle: '#232a2e',
				surface0: '#343f44',
				surface1: '#3d484d',
				surface2: '#475258',
				overlay0: '#4f585e',
				overlay1: '#56635f',
			},
			soft: {
				base: '#333c43',
				mantle: '#293136',
				surface0: '#3a464c',
				surface1: '#434f55',
				surface2: '#4d5960',
				overlay0: '#555f66',
				overlay1: '#5d6b66',
			},
		},
	},
	light: {
		accents: {
			red: '#f85552',
			orange: '#f57d26',
			yellow: '#dfa000',
			green: '#8da101',
			aqua: '#35a77c',
			blue: '#3a94c5',
			purple: '#df69ba',
		},
		grey: { grey0: '#a6b0a0', grey1: '#939f91', grey2: '#829181', fg: '#5c6a72' },
		crust: { hard: '#edeada', medium: '#e6e2cc', soft: '#ddd8be' },
		surface: {
			hard: {
				base: '#fffbef',
				mantle: '#f2efdf',
				surface0: '#f8f5e4',
				surface1: '#f2efdf',
				surface2: '#edeada',
				overlay0: '#e8e5d5',
				overlay1: '#bec5b2',
			},
			medium: {
				base: '#fdf6e3',
				mantle: '#efebd4',
				surface0: '#f4f0d9',
				surface1: '#efebd4',
				surface2: '#e6e2cc',
				overlay0: '#e0dcc7',
				overlay1: '#bdc3af',
			},
			soft: {
				base: '#f3ead3',
				mantle: '#e5dfc5',
				surface0: '#eae4ca',
				surface1: '#e5dfc5',
				surface2: '#ddd8be',
				overlay0: '#d8d3ba',
				overlay1: '#b9c0ab',
			},
		},
	},
};

const everforestAlias = (a) => ({
	rosewater: a.yellow,
	flamingo: a.red,
	pink: a.purple,
	mauve: a.purple,
	red: a.red,
	maroon: a.red,
	peach: a.orange,
	yellow: a.yellow,
	green: a.green,
	teal: a.aqua,
	sky: a.blue,
	sapphire: a.blue,
	blue: a.blue,
	lavender: a.purple,
	orange: a.orange,
	aqua: a.aqua,
	purple: a.purple,
});

// ---------------------------------------------------------------------------
// Assemble full palettes, keyed by palette -> mode -> contrast.
// ---------------------------------------------------------------------------

function buildGruvbox(mode) {
	const src = gruvbox[mode];
	const accents = expandAccents(src.accents);
	const alias = gruvboxAlias(src.accents);
	const out = {};
	for (const contrast of CONTRASTS) {
		const s = src.surface[contrast];
		out[contrast] = {
			...accents,
			...alias,
			text: src.fg.text,
			subtext1: src.fg.subtext1,
			subtext0: src.fg.subtext0,
			overlay2: src.fg.overlay2,
			overlay1: src.fg.overlay1,
			overlay0: s.overlay0,
			surface2: s.surface2,
			surface1: s.surface1,
			surface0: s.surface0,
			base: s.base,
			mantle: s.mantle,
			crust: s.crust,
		};
	}
	return out;
}

function buildEverforest(mode) {
	const src = everforest[mode];
	const accents = expandAccents(src.accents);
	const alias = everforestAlias(src.accents);
	const out = {};
	for (const contrast of CONTRASTS) {
		const s = src.surface[contrast];
		out[contrast] = {
			...accents,
			...alias,
			text: src.grey.fg,
			subtext1: src.grey.grey2,
			subtext0: src.grey.grey1,
			overlay2: src.grey.grey0,
			overlay1: s.overlay1,
			overlay0: s.overlay0,
			surface2: s.surface2,
			surface1: s.surface1,
			surface0: s.surface0,
			base: s.base,
			mantle: s.mantle,
			crust: src.crust[contrast],
		};
	}
	return out;
}

export const PALETTES = {
	gruvbox: { dark: buildGruvbox('dark'), light: buildGruvbox('light') },
	everforest: { dark: buildEverforest('dark'), light: buildEverforest('light') },
};

/** All flavour keys, e.g. `gruvbox-dark`, `everforest-light`. */
export const FLAVORS = [];
for (const palette of Object.keys(PALETTES)) {
	for (const mode of ['dark', 'light']) {
		FLAVORS.push({
			key: `${palette}-${mode}`,
			palette,
			mode,
			label: PALETTE_LABELS[palette],
		});
	}
}

/** Look up a single resolved colour for a flavour + contrast. */
export function colorFor(flavorKey, contrast, key) {
	const { palette, mode } = FLAVORS.find((f) => f.key === flavorKey);
	return PALETTES[palette][mode][contrast][key];
}
