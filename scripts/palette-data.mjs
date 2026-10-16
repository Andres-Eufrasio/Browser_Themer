// Palette definitions for the Gruvbox / Everforest / Kanagawa / Catppuccin
// userstyles library.
//
// This is the single source of truth for both:
//   - `src/palettes.json` (consumed by the app UI / uno preflight)
//   - the inlined Less library in `import.json` (consumed by Stylus)
//
// Run `node scripts/gen-palettes.mjs` + `node scripts/build-import.mjs` after
// editing.

/** The seven base accent hues shared by every palette. */
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

// Accents offered in the UI and in the generated `@var select accentColor`,
// in order: upstream Catppuccin's fifteen names first, then the intensity
// variants of the shared base hues. A few keys are the same colour in every
// palette (`peach`/`orange`, `teal`/`aqua`, `mauve`/`purple`), so each is only
// listed once.
const ACCENT_NAMES = [
	'rosewater',
	'flamingo',
	'pink',
	'mauve',
	'red',
	'maroon',
	'peach',
	'yellow',
	'green',
	'teal',
	'blue',
	'sapphire',
	'sky',
	'lavender',
	'subtext0',
];
// Upstream labelled `subtext0` as "Gray"; keep that name.
const ACCENT_LABELS = { subtext0: 'Gray' };

function accentTitleCase(key) {
	return key
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export const ACCENT_CHOICES = [...ACCENT_NAMES, ...ACCENTS]
	.filter((key, index, all) => all.indexOf(key) === index)
	.map((key) => ({ key, label: ACCENT_LABELS[key] ?? accentTitleCase(key) }));

export const PALETTE_LABELS = {
	gruvbox: 'Gruvbox',
	everforest: 'Everforest',
	kanagawa: 'Kanagawa',
	// Catppuccin's four flavours are palettes of their own: they have no
	// contrast levels, so the flavour *is* the variant.
	'catppuccin-latte': 'Catppuccin Latte',
	'catppuccin-frappe': 'Catppuccin Frappé',
	'catppuccin-macchiato': 'Catppuccin Macchiato',
	'catppuccin-mocha': 'Catppuccin Mocha',
	// The Tier-1 palettes. Like Catppuccin's flavours these have no contrast
	// levels, so each variant (Rosé Pine main/moon/dawn, Tokyo Night
	// night/storm/light, Flexoki and Dracula/Alucard) is a palette of its own.
	'rose-pine': 'Rosé Pine',
	'rose-pine-moon': 'Rosé Pine Moon',
	'rose-pine-dawn': 'Rosé Pine Dawn',
	'tokyo-night': 'Tokyo Night',
	'tokyo-night-storm': 'Tokyo Night Storm',
	'tokyo-night-light': 'Tokyo Night Light',
	'flexoki-dark': 'Flexoki Dark',
	'flexoki-light': 'Flexoki Light',
	dracula: 'Dracula',
	alucard: 'Alucard',
	'modus-operandi': 'Modus Operandi',
	'modus-vivendi': 'Modus Vivendi',
	nord: 'Nord',
	'nord-light': 'Nord Light',
	solarized: 'Solarized',
	'solarized-light': 'Solarized Light',
	'ayu-dark': 'Ayu Dark',
	'ayu-mirage': 'Ayu Mirage',
	'ayu-light': 'Ayu Light',
};

// Catppuccin flavours are inherently light or dark, and each one is offered in
// both dropdowns (as upstream did), so the colour scheme cannot come from the
// slot the flavour was picked from. Palettes without a fixed scheme take it
// from the slot instead.
const FIXED_SCHEMES = {
	'catppuccin-latte': 'light',
	'catppuccin-frappe': 'dark',
	'catppuccin-macchiato': 'dark',
	'catppuccin-mocha': 'dark',
	'rose-pine': 'dark',
	'rose-pine-moon': 'dark',
	'rose-pine-dawn': 'light',
	'tokyo-night': 'dark',
	'tokyo-night-storm': 'dark',
	'tokyo-night-light': 'light',
	'flexoki-dark': 'dark',
	'flexoki-light': 'light',
	dracula: 'dark',
	alucard: 'light',
	'modus-operandi': 'light',
	'modus-vivendi': 'dark',
	nord: 'dark',
	'nord-light': 'light',
	solarized: 'dark',
	'solarized-light': 'light',
	'ayu-dark': 'dark',
	'ayu-mirage': 'dark',
	'ayu-light': 'light',
};

/** Palette -> { dark, light } colour scheme, independent of the dropdown slot. */
export const PALETTE_SCHEMES = Object.fromEntries(
	Object.keys(PALETTE_LABELS).map((palette) => {
		const fixed = FIXED_SCHEMES[palette];
		return [
			palette,
			fixed
				? { dark: fixed, light: fixed }
				: { dark: 'dark', light: 'light' },
		];
	}),
);

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
		.map((v) =>
			Math.max(0, Math.min(255, Math.round(v)))
				.toString(16)
				.padStart(2, '0'),
		)
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

/** Linear sRGB mix: `t = 0` returns `a`, `t = 1` returns `b`. */
function mix(a, b, t) {
	const [ar, ag, ab] = hexToRgb(a);
	const [br, bg, bb] = hexToRgb(b);
	return rgbToHex([
		ar + (br - ar) * t,
		ag + (bg - ag) * t,
		ab + (bb - ab) * t,
	]);
}

/** Mix towards black / white (used to fill ramp steps a palette doesn't name). */
const darker = (hex, t) => mix(hex, '#000000', t);
const lighter = (hex, t) => mix(hex, '#ffffff', t);

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
		grey: {
			grey0: '#7a8478',
			grey1: '#859289',
			grey2: '#9da9a0',
			fg: '#d3c6aa',
		},
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
		grey: {
			grey0: '#a6b0a0',
			grey1: '#939f91',
			grey2: '#829181',
			fg: '#5c6a72',
		},
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

// Kanagawa (https://github.com/rebelot/kanagawa.nvim). The dark side is the
// "wave" theme, the light side is "lotus"; every value below is a named colour
// from the palette (`lua/kanagawa/colors.lua`). The three contrast levels slide
// a six-step window along each background ramp:
//   dark  sumiInk0..sumiInk6 + waveBlue1/waveBlue2
//   light lotusWhite0..lotusWhite5 + lotusViolet/lotusBlue greys
const kanagawa = {
	dark: {
		accents: {
			red: '#e46876', // waveRed
			orange: '#ffa066', // surimiOrange
			yellow: '#e6c384', // carpYellow
			green: '#98bb6c', // springGreen
			aqua: '#7aa89f', // waveAqua2
			blue: '#7e9cd8', // crystalBlue
			purple: '#957fb8', // oniViolet
		},
		text: '#dcd7ba', // fujiWhite
		subtext1: '#c8c093', // oldWhite
		subtext0: '#9cabca', // springViolet2
		overlay2: '#938aa9', // springViolet1
		overlay1: '#727169', // fujiGray
		overlay0: '#54546d', // sumiInk6
		surface: {
			hard: {
				base: '#1a1a22', // sumiInk2
				mantle: '#181820', // sumiInk1
				crust: '#16161d', // sumiInk0
				surface0: '#1f1f28', // sumiInk3
				surface1: '#223249', // waveBlue1
				surface2: '#2a2a37', // sumiInk4
			},
			medium: {
				base: '#1f1f28', // sumiInk3
				mantle: '#1a1a22', // sumiInk2
				crust: '#181820', // sumiInk1
				surface0: '#223249', // waveBlue1
				surface1: '#2a2a37', // sumiInk4
				surface2: '#2d4f67', // waveBlue2
			},
			soft: {
				base: '#223249', // waveBlue1
				mantle: '#1f1f28', // sumiInk3
				crust: '#1a1a22', // sumiInk2
				surface0: '#2a2a37', // sumiInk4
				surface1: '#2d4f67', // waveBlue2
				surface2: '#363646', // sumiInk5
			},
		},
	},
	light: {
		accents: {
			red: '#c84053', // lotusRed
			orange: '#cc6d00', // lotusOrange
			yellow: '#de9800', // lotusYellow3
			green: '#6f894e', // lotusGreen
			aqua: '#597b75', // lotusAqua
			blue: '#4d699b', // lotusBlue4
			purple: '#766b90', // lotusViolet2
		},
		text: '#545464', // lotusInk1
		subtext1: '#716e61', // lotusGray2
		subtext0: '#8a8980', // lotusGray3
		overlay2: '#a09cac', // lotusViolet1
		overlay1: '#9fb5c9', // lotusBlue3
		overlay0: '#b5cbd2', // lotusBlue2
		surface: {
			hard: {
				base: '#f2ecbc', // lotusWhite3
				mantle: '#e5ddb0', // lotusWhite2
				crust: '#e7dba0', // lotusWhite4
				surface0: '#dcd7ba', // lotusGray
				surface1: '#e4d794', // lotusWhite5
				surface2: '#dcd5ac', // lotusWhite1
			},
			medium: {
				base: '#e5ddb0', // lotusWhite2
				mantle: '#e7dba0', // lotusWhite4
				crust: '#dcd7ba', // lotusGray
				surface0: '#e4d794', // lotusWhite5
				surface1: '#dcd5ac', // lotusWhite1
				surface2: '#d5cea3', // lotusWhite0
			},
			soft: {
				base: '#e7dba0', // lotusWhite4
				mantle: '#dcd7ba', // lotusGray
				crust: '#e4d794', // lotusWhite5
				surface0: '#dcd5ac', // lotusWhite1
				surface1: '#d5cea3', // lotusWhite0
				surface2: '#c9cbd1', // lotusViolet3
			},
		},
	},
};

const kanagawaAlias = (a) => ({
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

// Catppuccin (https://github.com/catppuccin/catppuccin). Exact hex values from
// the vendored `@catppuccin/palette` 1.8.0 data (`css/catppuccin.css`), one set
// per flavour. Latte is the light flavour; Frappé, Macchiato and Mocha are the
// three dark ones, in increasing darkness.
const catppuccin = {
	latte: {
		rosewater: '#dc8a78',
		flamingo: '#dd7878',
		pink: '#ea76cb',
		mauve: '#8839ef',
		red: '#d20f39',
		maroon: '#e64553',
		peach: '#fe640b',
		yellow: '#df8e1d',
		green: '#40a02b',
		teal: '#179299',
		sky: '#04a5e5',
		sapphire: '#209fb5',
		blue: '#1e66f5',
		lavender: '#7287fd',
		text: '#4c4f69',
		subtext1: '#5c5f77',
		subtext0: '#6c6f85',
		overlay2: '#7c7f93',
		overlay1: '#8c8fa1',
		overlay0: '#9ca0b0',
		surface2: '#acb0be',
		surface1: '#bcc0cc',
		surface0: '#ccd0da',
		base: '#eff1f5',
		mantle: '#e6e9ef',
		crust: '#dce0e8',
	},
	frappe: {
		rosewater: '#f2d5cf',
		flamingo: '#eebebe',
		pink: '#f4b8e4',
		mauve: '#ca9ee6',
		red: '#e78284',
		maroon: '#ea999c',
		peach: '#ef9f76',
		yellow: '#e5c890',
		green: '#a6d189',
		teal: '#81c8be',
		sky: '#99d1db',
		sapphire: '#85c1dc',
		blue: '#8caaee',
		lavender: '#babbf1',
		text: '#c6d0f5',
		subtext1: '#b5bfe2',
		subtext0: '#a5adce',
		overlay2: '#949cbb',
		overlay1: '#838ba7',
		overlay0: '#737994',
		surface2: '#626880',
		surface1: '#51576d',
		surface0: '#414559',
		base: '#303446',
		mantle: '#292c3c',
		crust: '#232634',
	},
	macchiato: {
		rosewater: '#f4dbd6',
		flamingo: '#f0c6c6',
		pink: '#f5bde6',
		mauve: '#c6a0f6',
		red: '#ed8796',
		maroon: '#ee99a0',
		peach: '#f5a97f',
		yellow: '#eed49f',
		green: '#a6da95',
		teal: '#8bd5ca',
		sky: '#91d7e3',
		sapphire: '#7dc4e4',
		blue: '#8aadf4',
		lavender: '#b7bdf8',
		text: '#cad3f5',
		subtext1: '#b8c0e0',
		subtext0: '#a5adcb',
		overlay2: '#939ab7',
		overlay1: '#8087a2',
		overlay0: '#6e738d',
		surface2: '#5b6078',
		surface1: '#494d64',
		surface0: '#363a4f',
		base: '#24273a',
		mantle: '#1e2030',
		crust: '#181926',
	},
	mocha: {
		rosewater: '#f5e0dc',
		flamingo: '#f2cdcd',
		pink: '#f5c2e7',
		mauve: '#cba6f7',
		red: '#f38ba8',
		maroon: '#eba0ac',
		peach: '#fab387',
		yellow: '#f9e2af',
		green: '#a6e3a1',
		teal: '#94e2d5',
		sky: '#89dceb',
		sapphire: '#74c7ec',
		blue: '#89b4fa',
		lavender: '#b4befe',
		text: '#cdd6f4',
		subtext1: '#bac2de',
		subtext0: '#a6adc8',
		overlay2: '#9399b2',
		overlay1: '#7f849c',
		overlay0: '#6c7086',
		surface2: '#585b70',
		surface1: '#45475a',
		surface0: '#313244',
		base: '#1e1e2e',
		mantle: '#181825',
		crust: '#11111b',
	},
};

// Catppuccin has 26 colours: fourteen accents plus the text/overlay/surface
// ramp, which map onto the shared keys one-to-one. Only the base hues need
// aliasing (Catppuccin calls them peach/teal/mauve) and the bright/deep
// variants, which Catppuccin doesn't define, are derived like the other
// palettes' are.
function buildCatppuccin(flavor) {
	const src = catppuccin[flavor];
	const accents = expandAccents({
		red: src.red,
		orange: src.peach,
		yellow: src.yellow,
		green: src.green,
		aqua: src.teal,
		blue: src.blue,
		purple: src.mauve,
	});
	const alias = {
		rosewater: src.rosewater,
		flamingo: src.flamingo,
		pink: src.pink,
		mauve: src.mauve,
		red: src.red,
		maroon: src.maroon,
		peach: src.peach,
		yellow: src.yellow,
		green: src.green,
		teal: src.teal,
		sky: src.sky,
		sapphire: src.sapphire,
		blue: src.blue,
		lavender: src.lavender,
		orange: src.peach,
		aqua: src.teal,
		purple: src.mauve,
	};
	const ramp = {
		text: src.text,
		subtext1: src.subtext1,
		subtext0: src.subtext0,
		overlay2: src.overlay2,
		overlay1: src.overlay1,
		overlay0: src.overlay0,
		surface2: src.surface2,
		surface1: src.surface1,
		surface0: src.surface0,
		base: src.base,
		mantle: src.mantle,
		crust: src.crust,
	};
	// No contrast variants: all three levels are the same theme.
	const out = {};
	for (const contrast of CONTRASTS) {
		out[contrast] = { ...accents, ...alias, ...ramp };
	}
	return out;
}

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

function buildKanagawa(mode) {
	const src = kanagawa[mode];
	const accents = expandAccents(src.accents);
	const alias = kanagawaAlias(src.accents);
	const out = {};
	for (const contrast of CONTRASTS) {
		out[contrast] = {
			...accents,
			...alias,
			text: src.text,
			subtext1: src.subtext1,
			subtext0: src.subtext0,
			overlay2: src.overlay2,
			overlay1: src.overlay1,
			overlay0: src.overlay0,
			...src.surface[contrast],
		};
	}
	return out;
}

// ---------------------------------------------------------------------------
// Tier-1 palettes
//
// Rosé Pine, Tokyo Night, Flexoki, Dracula/Alucard. Like Catppuccin's flavours,
// every variant is a palette of its own: upstream ships no contrast levels, so
// all three Contrast settings resolve to the same colours (the app says so when
// one is selected). Where a palette doesn't name a ramp step, it is mixed from
// the palette's own roles; light variants step the opposite way from dark ones.
// ---------------------------------------------------------------------------

/**
 * Build a palette whose contrast levels are all identical. `seed` is
 * `{ accents, alias, ramp }` where `ramp` already lists text -> crust in the
 * canonical key order.
 */
function buildFlat(seed) {
	const colors = {
		...expandAccents(seed.accents),
		...seed.alias,
		...seed.ramp,
	};
	const out = {};
	for (const contrast of CONTRASTS) out[contrast] = { ...colors };
	return out;
}

/** A fixed-scheme palette: both dropdown slots hold the same colours. */
function fixed(seed) {
	return { dark: buildFlat(seed), light: buildFlat(seed) };
}

// Rosé Pine (https://rosepinetheme.com, palette data from `rose-pine/palette`).
// Main and Moon are the dark variants, Dawn the light one. The palette has no
// green, so `green`/`blue` both fall back to pine; the warm end is love/rose.
const rosePine = {
	main: {
		base: '#191724',
		surface: '#1f1d2e',
		overlay: '#26233a',
		muted: '#6e6a86',
		subtle: '#908caa',
		text: '#e0def4',
		love: '#eb6f92',
		gold: '#f6c177',
		rose: '#ebbcba',
		pine: '#31748f',
		foam: '#9ccfd8',
		iris: '#c4a7e7',
	},
	moon: {
		base: '#232136',
		surface: '#2a273f',
		overlay: '#393552',
		muted: '#6e6a86',
		subtle: '#908caa',
		text: '#e0def4',
		love: '#eb6f92',
		gold: '#f6c177',
		rose: '#ea9a97',
		pine: '#3e8fb0',
		foam: '#9ccfd8',
		iris: '#c4a7e7',
	},
	dawn: {
		base: '#faf4ed',
		surface: '#fffaf3',
		overlay: '#f2e9e1',
		muted: '#9893a5',
		subtle: '#797593',
		text: '#464261',
		love: '#b4637a',
		gold: '#ea9d34',
		rose: '#d7827e',
		pine: '#286983',
		foam: '#56949f',
		iris: '#907aa9',
	},
};

function rosePineSeed(r, mode) {
	const dark = mode === 'dark';
	return {
		accents: {
			red: r.love,
			orange: r.rose,
			yellow: r.gold,
			green: r.pine,
			aqua: r.foam,
			blue: r.pine,
			purple: r.iris,
		},
		alias: {
			rosewater: r.rose,
			flamingo: r.love,
			pink: r.love,
			mauve: r.iris,
			maroon: r.love,
			peach: r.rose,
			teal: r.foam,
			sky: r.foam,
			sapphire: r.pine,
			lavender: r.iris,
		},
		ramp: dark
			? {
					text: r.text,
					subtext1: mix(r.text, r.subtle, 0.5),
					subtext0: r.subtle,
					overlay2: mix(r.subtle, r.muted, 0.5),
					overlay1: r.muted,
					overlay0: mix(r.muted, r.overlay, 0.5),
					surface2: r.overlay,
					surface1: mix(r.overlay, r.surface, 0.5),
					surface0: r.surface,
					base: r.base,
					mantle: darker(r.base, 0.18),
					crust: darker(r.base, 0.34),
				}
			: {
					text: r.text,
					subtext1: mix(r.subtle, r.text, 0.5),
					subtext0: r.subtle,
					overlay2: mix(r.subtle, r.muted, 0.5),
					overlay1: r.muted,
					overlay0: mix(r.muted, r.base, 0.3),
					surface2: mix(r.muted, r.base, 0.5),
					surface1: mix(r.muted, r.base, 0.68),
					surface0: mix(r.muted, r.base, 0.84),
					base: r.base,
					mantle: mix(r.base, r.text, 0.05),
					crust: mix(r.base, r.text, 0.1),
				},
	};
}

// Tokyo Night (enkia/tokyo-night-vscode-theme for the editor colours, plus the
// extra background steps from folke/tokyonight.nvim). Night and Storm are dark,
// Light is the light variant.
const tokyoNightAccents = {
	dark: {
		red: '#f7768e',
		orange: '#ff9e64',
		yellow: '#e0af68',
		green: '#9ece6a',
		aqua: '#7dcfff',
		blue: '#7aa2f7',
		purple: '#bb9af7',
	},
	light: {
		red: '#8c4351',
		orange: '#965027',
		yellow: '#8f5e15',
		green: '#385f0d',
		aqua: '#006c86',
		blue: '#2959aa',
		purple: '#65359d',
	},
};

const tokyoNightAlias = {
	dark: {
		rosewater: '#e0af68',
		flamingo: '#f7768e',
		pink: '#ff007c',
		mauve: '#bb9af7',
		maroon: '#f7768e',
		peach: '#ff9e64',
		teal: '#73daca',
		sky: '#89ddff',
		sapphire: '#2ac3de',
		lavender: '#bb9af7',
	},
	light: {
		rosewater: '#b05467',
		flamingo: '#8c4351',
		pink: '#b05467',
		mauve: '#65359d',
		maroon: '#8c4351',
		peach: '#965027',
		teal: '#33635c',
		sky: '#0f4b6e',
		sapphire: '#006c86',
		lavender: '#65359d',
	},
};

const tokyoNightFg = {
	dark: {
		text: '#c0caf5',
		subtext1: '#a9b1d6',
		subtext0: '#9aa5ce',
		overlay2: mix('#737aa2', '#9aa5ce', 0.5),
		overlay1: '#737aa2',
	},
	light: {
		text: '#343b59',
		subtext1: mix('#343b59', '#606269', 0.35),
		subtext0: '#484c61',
		overlay2: '#606269',
		overlay1: '#888b94',
	},
};

const tokyoNightSurface = {
	night: {
		overlay0: '#545c7e',
		surface2: '#414868',
		surface1: '#292e42',
		surface0: '#202330',
		base: '#1a1b26',
		mantle: '#16161e',
		crust: '#0f0f14',
	},
	storm: {
		overlay0: '#545c7e',
		surface2: '#414868',
		surface1: '#2c324a',
		surface0: '#292e42',
		base: '#24283b',
		mantle: '#1f2335',
		crust: '#1b1e2d',
	},
	light: {
		overlay0: '#9da0ab',
		surface2: mix('#c1c2c7', '#9da0ab', 0.65),
		surface1: mix('#c1c2c7', '#e6e7ed', 0.4),
		surface0: mix('#c1c2c7', '#e6e7ed', 0.6),
		base: '#e6e7ed',
		mantle: mix('#c1c2c7', '#e6e7ed', 0.88),
		crust: mix('#c1c2c7', '#e6e7ed', 0.75),
	},
};

function tokyoNightSeed(variant) {
	const side = variant === 'light' ? 'light' : 'dark';
	return {
		accents: tokyoNightAccents[side],
		alias: tokyoNightAlias[side],
		ramp: { ...tokyoNightFg[side], ...tokyoNightSurface[variant] },
	};
}

// Flexoki (https://stephango.com/flexoki, `kepano/flexoki`). Every value is one
// of the palette's own steps from its CSS ramps: light uses the 600-weight
// accents, dark the 400-weight ones, and the surfaces are the paper/ink greys.
const flexoki = {
	light: {
		accents: {
			red: '#af3029',
			orange: '#bc5215',
			yellow: '#ad8301',
			green: '#66800b',
			aqua: '#24837b',
			blue: '#205ea6',
			purple: '#5e409d',
		},
		alias: {
			rosewater: '#a02f6f',
			flamingo: '#af3029',
			pink: '#a02f6f',
			mauve: '#5e409d',
			maroon: '#af3029',
			peach: '#bc5215',
			teal: '#24837b',
			sky: '#4385be',
			sapphire: '#205ea6',
			lavender: '#5e409d',
		},
		ramp: {
			text: '#100f0f',
			subtext1: '#343331',
			subtext0: '#575653',
			overlay2: '#6f6e69',
			overlay1: '#878580',
			overlay0: '#9f9d96',
			surface2: '#b7b5ac',
			surface1: '#cecdc3',
			surface0: '#dad8ce',
			base: '#fffcf0',
			mantle: '#f2f0e5',
			crust: '#e6e4d9',
		},
	},
	dark: {
		accents: {
			red: '#d14d41',
			orange: '#da702c',
			yellow: '#d0a215',
			green: '#879a39',
			aqua: '#3aa99f',
			blue: '#4385be',
			purple: '#8b7ec8',
		},
		alias: {
			rosewater: '#ce5d97',
			flamingo: '#d14d41',
			pink: '#ce5d97',
			mauve: '#8b7ec8',
			maroon: '#d14d41',
			peach: '#da702c',
			teal: '#3aa99f',
			sky: '#66a0c8',
			sapphire: '#4385be',
			lavender: '#8b7ec8',
		},
		ramp: {
			text: '#cecdc3',
			subtext1: '#b7b5ac',
			subtext0: '#9f9d96',
			overlay2: '#878580',
			overlay1: '#6f6e69',
			overlay0: '#575653',
			surface2: '#403e3c',
			surface1: '#343331',
			surface0: '#282726',
			base: '#1c1b1a',
			mantle: '#100f0f',
			crust: darker('#100f0f', 0.5),
		},
	},
};

// Dracula (https://draculatheme.com) and its light sibling Alucard, both from
// the official `dracula/dracula-theme` palette tables. Dracula has no dedicated
// blue, so `blue` uses the purple its ANSI palette calls blue; the ramp steps
// between the palette's background / current-line / comment / foreground greys.
const dracula = {
	dark: {
		accents: {
			red: '#ff5555',
			orange: '#ffb86c',
			yellow: '#f1fa8c',
			green: '#50fa7b',
			aqua: '#8be9fd',
			blue: '#bd93f9',
			purple: '#bd93f9',
		},
		alias: {
			rosewater: '#ff79c6',
			flamingo: '#ff5555',
			pink: '#ff79c6',
			mauve: '#bd93f9',
			maroon: '#ff5555',
			peach: '#ffb86c',
			teal: '#8be9fd',
			sky: '#8be9fd',
			sapphire: '#bd93f9',
			lavender: '#bd93f9',
		},
		ramp: {
			text: '#f8f8f2',
			subtext1: mix('#6272a4', '#f8f8f2', 0.75),
			subtext0: mix('#6272a4', '#f8f8f2', 0.5),
			overlay2: mix('#6272a4', '#f8f8f2', 0.25),
			overlay1: '#6272a4',
			overlay0: mix('#44475a', '#6272a4', 0.7),
			surface2: mix('#44475a', '#6272a4', 0.35),
			surface1: '#44475a',
			surface0: mix('#282a36', '#44475a', 0.45),
			base: '#282a36',
			mantle: darker('#282a36', 0.18),
			crust: darker('#282a36', 0.34),
		},
	},
	light: {
		accents: {
			red: '#cb3a2a',
			orange: '#a34d14',
			yellow: '#846e15',
			green: '#14710a',
			aqua: '#036a96',
			blue: '#644ac9',
			purple: '#644ac9',
		},
		alias: {
			rosewater: '#a3144d',
			flamingo: '#cb3a2a',
			pink: '#a3144d',
			mauve: '#644ac9',
			maroon: '#cb3a2a',
			peach: '#a34d14',
			teal: '#036a96',
			sky: '#036a96',
			sapphire: '#644ac9',
			lavender: '#644ac9',
		},
		ramp: {
			text: '#1f1f1f',
			subtext1: mix('#6c664b', '#1f1f1f', 0.6),
			subtext0: mix('#6c664b', '#1f1f1f', 0.25),
			overlay2: '#6c664b',
			overlay1: mix('#6c664b', '#cfcfde', 0.35),
			overlay0: mix('#6c664b', '#cfcfde', 0.6),
			surface2: '#cfcfde',
			surface1: mix('#fffbeb', '#cfcfde', 0.75),
			surface0: mix('#fffbeb', '#cfcfde', 0.55),
			base: '#fffbeb',
			mantle: mix('#fffbeb', '#6c664b', 0.05),
			crust: mix('#fffbeb', '#6c664b', 0.1),
		},
	},
};

// Modus themes (https://protesilaos.com/emacs/modus-themes). Operandi is the
// light theme, Vivendi the dark one; both are built from the same semantic
// names (`bg-main`, `bg-dim`, `bg-active`, `bg-inactive`, `border`, `fg-main`,
// `fg-dim`, plus six accent hues x five shades). The greys Modus names map
// straight onto the ramp and the accent foregrounds onto the seven base hues.
const modus = {
	operandi: {
		accents: {
			red: '#a60000',
			orange: '#972500', // red-warmer
			yellow: '#6f5500',
			green: '#006800',
			aqua: '#005e8b', // cyan
			blue: '#0031a9',
			purple: '#721045', // magenta
		},
		alias: {
			rosewater: '#6c501c', // gold
			flamingo: '#a0132f', // red-cooler
			pink: '#8f0075', // magenta-warmer
			mauve: '#531ab6', // magenta-cooler
			maroon: '#7f0000', // red-faint
			peach: '#8a290f', // rust
			teal: '#005f5f', // cyan-cooler
			sky: '#3f578f', // cyan-warmer
			sapphire: '#0000b0', // blue-cooler
			lavender: '#7c318f', // magenta-faint
		},
		ramp: {
			text: '#000000', // fg-main
			subtext1: mix('#595959', '#000000', 0.5),
			subtext0: '#595959', // fg-dim
			overlay2: mix('#9f9f9f', '#595959', 0.5),
			overlay1: '#9f9f9f', // border
			overlay0: mix('#c4c4c4', '#9f9f9f', 0.5),
			surface2: '#c4c4c4', // bg-active
			surface1: mix('#e0e0e0', '#c4c4c4', 0.5),
			surface0: '#e0e0e0', // bg-inactive
			base: '#ffffff', // bg-main
			mantle: mix('#ffffff', '#f2f2f2', 0.4),
			crust: '#f2f2f2', // bg-dim
		},
	},
	vivendi: {
		accents: {
			red: '#ff5f59',
			orange: '#ff6b55', // red-warmer
			yellow: '#d0bc00',
			green: '#44bc44',
			aqua: '#00d3d0', // cyan
			blue: '#2fafff',
			purple: '#b6a0ff', // magenta-cooler
		},
		alias: {
			rosewater: '#c0965b', // gold
			flamingo: '#ff7f86', // red-cooler
			pink: '#feacd0', // magenta
			mauve: '#b6a0ff', // magenta-cooler
			maroon: '#ff9580', // red-faint
			peach: '#db7b5f', // rust
			teal: '#6ae4b9', // cyan-cooler
			sky: '#4ae2f0', // cyan-warmer
			sapphire: '#00bcff', // blue-cooler
			lavender: '#9099d9', // indigo
		},
		ramp: {
			text: '#ffffff', // fg-main
			subtext1: mix('#989898', '#ffffff', 0.5),
			subtext0: '#989898', // fg-dim
			overlay2: mix('#646464', '#989898', 0.5),
			overlay1: '#646464', // border
			overlay0: mix('#535353', '#646464', 0.5),
			surface2: '#535353', // bg-active
			surface1: '#303030', // bg-inactive
			surface0: '#1e1e1e', // bg-dim
			base: '#000000', // bg-main
			mantle: '#000000',
			crust: '#000000',
		},
	},
};

// Nord (https://www.nordtheme.com/docs/colors-and-palettes). Upstream only
// ships the dark "Polar Night" theme; the light variant uses "Snow Storm"
// (nord4 nord6) for its surfaces, so it is a derivation rather than an
// invention. Only four accent hues exist (Frost blues plus Aurora), so `aqua`,
// `green` and `purple` pick the closest Nord colours.
const nord = {
	dark: {
		accents: {
			red: '#bf616a', // nord11
			orange: '#d08770', // nord12
			yellow: '#ebcb8b', // nord13
			green: '#a3be8c', // nord14
			aqua: '#8fbcbb', // nord7
			blue: '#81a1c1', // nord9
			purple: '#b48ead', // nord15
		},
		alias: {
			rosewater: '#d08770', // nord12
			flamingo: '#bf616a', // nord11
			pink: '#b48ead', // nord15
			mauve: '#b48ead', // nord15
			maroon: '#bf616a', // nord11
			peach: '#d08770', // nord12
			teal: '#8fbcbb', // nord7
			sky: '#88c0d0', // nord8
			sapphire: '#5e81ac', // nord10
			lavender: '#b48ead', // nord15
		},
		ramp: {
			text: '#eceff4', // nord6
			subtext1: '#e5e9f0', // nord5
			subtext0: '#d8dee9', // nord4
			overlay2: mix('#4c566a', '#d8dee9', 0.66),
			overlay1: mix('#4c566a', '#d8dee9', 0.33),
			overlay0: '#4c566a', // nord3
			surface2: '#434c5e', // nord2
			surface1: '#3b4252', // nord1
			surface0: mix('#2e3440', '#3b4252', 0.5),
			base: '#2e3440', // nord0
			mantle: darker('#2e3440', 0.2),
			crust: darker('#2e3440', 0.4),
		},
	},
	light: {
		accents: {
			red: '#bf616a',
			orange: '#d08770',
			yellow: '#ebcb8b',
			green: '#a3be8c',
			aqua: '#8fbcbb',
			blue: '#81a1c1',
			purple: '#b48ead',
		},
		alias: {
			rosewater: '#d08770',
			flamingo: '#bf616a',
			pink: '#b48ead',
			mauve: '#b48ead',
			maroon: '#bf616a',
			peach: '#d08770',
			teal: '#8fbcbb',
			sky: '#88c0d0',
			sapphire: '#5e81ac',
			lavender: '#b48ead',
		},
		ramp: {
			text: '#2e3440', // nord0
			subtext1: '#3b4252', // nord1
			subtext0: '#434c5e', // nord2
			overlay2: mix('#4c566a', '#434c5e', 0.5),
			overlay1: '#4c566a', // nord3
			overlay0: mix('#d8dee9', '#4c566a', 0.65),
			surface2: mix('#d8dee9', '#4c566a', 0.5),
			surface1: mix('#d8dee9', '#4c566a', 0.3),
			surface0: '#d8dee9', // nord4
			base: '#eceff4', // nord6
			mantle: '#e5e9f0', // nord5
			crust: mix('#e5e9f0', '#d8dee9', 0.5),
		},
	},
};

// Solarized (https://ethanschoonover.com/solarized/). One sixteen-colour
// palette serves both themes: the greys run base03 (darkest) to base3
// (lightest), and the eight accents are the same in each. `purple` is Solarized
// violet, `pink`/`rosewater` its magenta.
const solarized = {
	dark: {
		accents: {
			red: '#dc322f',
			orange: '#cb4b16',
			yellow: '#b58900',
			green: '#859900',
			aqua: '#2aa198', // cyan
			blue: '#268bd2',
			purple: '#6c71c4', // violet
		},
		alias: {
			rosewater: '#d33682', // magenta
			flamingo: '#dc322f', // red
			pink: '#d33682', // magenta
			mauve: '#6c71c4', // violet
			maroon: '#cb4b16', // orange
			peach: '#cb4b16', // orange
			teal: '#2aa198', // cyan
			sky: '#2aa198', // cyan
			sapphire: '#268bd2', // blue
			lavender: '#6c71c4', // violet
		},
		ramp: {
			text: '#93a1a1', // base1
			subtext1: '#839496', // base0
			subtext0: '#657b83', // base00
			overlay2: '#586e75', // base01
			overlay1: mix('#586e75', '#073642', 0.5),
			overlay0: mix('#586e75', '#073642', 0.75),
			surface2: '#073642', // base02
			surface1: mix('#073642', '#002b36', 0.5),
			surface0: mix('#073642', '#002b36', 0.75),
			base: '#002b36', // base03
			mantle: darker('#002b36', 0.15),
			crust: darker('#002b36', 0.3),
		},
	},
	light: {
		accents: {
			red: '#dc322f',
			orange: '#cb4b16',
			yellow: '#b58900',
			green: '#859900',
			aqua: '#2aa198',
			blue: '#268bd2',
			purple: '#6c71c4',
		},
		alias: {
			rosewater: '#d33682',
			flamingo: '#dc322f',
			pink: '#d33682',
			mauve: '#6c71c4',
			maroon: '#cb4b16',
			peach: '#cb4b16',
			teal: '#2aa198',
			sky: '#2aa198',
			sapphire: '#268bd2',
			lavender: '#6c71c4',
		},
		ramp: {
			text: '#586e75', // base01
			subtext1: '#657b83', // base00
			subtext0: '#839496', // base0
			overlay2: '#93a1a1', // base1
			overlay1: mix('#93a1a1', '#eee8d5', 0.5),
			overlay0: mix('#93a1a1', '#eee8d5', 0.75),
			surface2: '#eee8d5', // base2
			surface1: mix('#eee8d5', '#fdf6e3', 0.15),
			surface0: mix('#eee8d5', '#fdf6e3', 0.35),
			base: '#fdf6e3', // base3
			mantle: mix('#fdf6e3', '#eee8d5', 0.35),
			crust: mix('#fdf6e3', '#eee8d5', 0.6),
		},
	},
};

// Ayu (https://ayutheme.com, resolved colours from the `ayu` 9.1.0 npm package).
// Dark and Mirage are the two dark themes, Light the light one. `aqua` is Ayu's
// teal, `purple` its (pink-ish) purple and `yellow`/`orange` its yellow/orange;
// the greys come from the package's `gray` ramp and the still greys.
const ayu = {
	dark: {
		accents: {
			red: '#f07178',
			orange: '#ff8f40',
			yellow: '#ffb454',
			green: '#aad94c',
			aqua: '#95e6cb', // teal
			blue: '#59c2ff',
			purple: '#d2a6ff',
		},
		alias: {
			rosewater: '#f6b18f', // pink l4
			flamingo: '#f07178', // red l2
			pink: '#f29668', // pink l3
			mauve: '#d2a6ff', // purple l3
			maroon: '#f07178', // red l2
			peach: '#e6c08a', // peach l4
			teal: '#95e6cb', // teal l5
			sky: '#39bae6', // indigo l2
			sapphire: '#59c2ff', // blue l3
			lavender: '#d2a6ff', // purple l3
		},
		ramp: {
			text: '#bfbdb6', // editor.fg
			subtext1: mix('#bfbdb6', '#5a6673', 0.4),
			subtext0: mix('#bfbdb6', '#5a6673', 0.65),
			overlay2: '#667381', // gray l5
			overlay1: '#5a6673', // gray l4
			overlay0: '#4d5763', // gray l3
			surface2: '#404953', // gray l2
			surface1: '#333b44', // gray l1
			surface0: '#1b1f29', // ui.line
			base: '#0d1017', // surface.base
			mantle: mix('#0d1017', '#010102', 0.4),
			crust: mix('#0d1017', '#010102', 0.7),
		},
	},
	mirage: {
		accents: {
			red: '#f28779',
			orange: '#ffa659',
			yellow: '#ffcd66',
			green: '#d5ff80',
			aqua: '#95e6cb', // teal l4
			blue: '#73d0ff',
			purple: '#dfbfff',
		},
		alias: {
			rosewater: '#f9cab3', // pink l4
			flamingo: '#f28779', // red l1
			pink: '#f29e74', // pink l2
			mauve: '#dfbfff', // purple l4
			maroon: '#f28779', // red l1
			peach: '#d9be98', // peach l3
			teal: '#95e6cb', // teal l4
			sky: '#5ccfe6', // indigo l2
			sapphire: '#73d0ff', // blue l3
			lavender: '#dfbfff', // purple l4
		},
		ramp: {
			text: '#cccac2', // editor.fg
			subtext1: mix('#cccac2', '#707a8c', 0.4),
			subtext0: mix('#cccac2', '#707a8c', 0.65),
			overlay2: '#6e7c8f', // gray l1
			overlay1: mix('#6e7c8f', '#1f2430', 0.4),
			overlay0: mix('#6e7c8f', '#1f2430', 0.65),
			surface2: '#282e3b', // ui.panel
			surface1: '#242936', // surface.lift
			surface0: mix('#1f2430', '#242936', 0.5),
			base: '#1f2430', // surface.base
			mantle: '#181c26', // surface.sunk
			crust: '#171b24', // ui.line
		},
	},
	light: {
		accents: {
			red: '#f07171',
			orange: '#fa8532',
			yellow: '#eba400',
			green: '#86b300',
			aqua: '#4cbf99', // teal l3
			blue: '#22a4e6',
			purple: '#a37acc',
		},
		alias: {
			rosewater: '#f2a191', // pink l4
			flamingo: '#f07171', // red l2
			pink: '#f2a191', // pink l4
			mauve: '#a37acc', // purple l2
			maroon: '#f07171', // red l2
			peach: '#e59645', // peach l3
			teal: '#4cbf99', // teal l3
			sky: '#55b4d4', // indigo l3
			sapphire: '#22a4e6', // blue l2
			lavender: '#a37acc', // purple l2
		},
		ramp: {
			text: '#5c6166', // editor.fg
			subtext1: mix('#5c6166', '#828e9f', 0.4),
			subtext0: mix('#5c6166', '#828e9f', 0.65),
			overlay2: '#939498', // gray l2
			overlay1: '#a0a1a4', // gray l3
			overlay0: '#adaeb1', // gray l4
			surface2: '#c5c5c8', // gray l5
			surface1: '#dcdee1',
			surface0: '#ebeef0', // surface.sunk
			base: '#f8f9fa', // surface.base
			mantle: mix('#f8f9fa', '#ebeef0', 0.4),
			crust: mix('#f8f9fa', '#ebeef0', 0.7),
		},
	},
};

export const PALETTES = {
	gruvbox: { dark: buildGruvbox('dark'), light: buildGruvbox('light') },
	everforest: {
		dark: buildEverforest('dark'),
		light: buildEverforest('light'),
	},
	kanagawa: { dark: buildKanagawa('dark'), light: buildKanagawa('light') },
	// Catppuccin's flavours are each offered in both dropdowns (upstream listed
	// all four in both selects), so both slots hold the same colours.
	'catppuccin-latte': {
		dark: buildCatppuccin('latte'),
		light: buildCatppuccin('latte'),
	},
	'catppuccin-frappe': {
		dark: buildCatppuccin('frappe'),
		light: buildCatppuccin('frappe'),
	},
	'catppuccin-macchiato': {
		dark: buildCatppuccin('macchiato'),
		light: buildCatppuccin('macchiato'),
	},
	'catppuccin-mocha': {
		dark: buildCatppuccin('mocha'),
		light: buildCatppuccin('mocha'),
	},
	// Tier 1. Every variant is a fixed-scheme palette (upstream defines no
	// contrast levels), so both dropdowns show the same colours and the app
	// flags the inert Contrast setting.
	'rose-pine': fixed(rosePineSeed(rosePine.main, 'dark')),
	'rose-pine-moon': fixed(rosePineSeed(rosePine.moon, 'dark')),
	'rose-pine-dawn': fixed(rosePineSeed(rosePine.dawn, 'light')),
	'tokyo-night': fixed(tokyoNightSeed('night')),
	'tokyo-night-storm': fixed(tokyoNightSeed('storm')),
	'tokyo-night-light': fixed(tokyoNightSeed('light')),
	'flexoki-dark': fixed(flexoki.dark),
	'flexoki-light': fixed(flexoki.light),
	dracula: fixed(dracula.dark),
	alucard: fixed(dracula.light),
	'modus-operandi': fixed(modus.operandi),
	'modus-vivendi': fixed(modus.vivendi),
	nord: fixed(nord.dark),
	'nord-light': fixed(nord.light),
	solarized: fixed(solarized.dark),
	'solarized-light': fixed(solarized.light),
	'ayu-dark': fixed(ayu.dark),
	'ayu-mirage': fixed(ayu.mirage),
	'ayu-light': fixed(ayu.light),
};

/**
 * All flavour keys, e.g. `gruvbox-dark`, `kanagawa-light`,
 * `catppuccin-mocha-dark`. `scheme` is the flavour's actual light/dark side
 * (see PALETTE_SCHEMES); `mode` is the dropdown it was selected from.
 */
export const FLAVORS = [];
for (const palette of Object.keys(PALETTES)) {
	for (const mode of ['dark', 'light']) {
		FLAVORS.push({
			key: `${palette}-${mode}`,
			palette,
			mode,
			scheme: PALETTE_SCHEMES[palette][mode],
			label: PALETTE_LABELS[palette],
		});
	}
}

/** Look up a single resolved colour for a flavour + contrast. */
export function colorFor(flavorKey, contrast, key) {
	const { palette, mode } = FLAVORS.find((f) => f.key === flavorKey);
	return PALETTES[palette][mode][contrast][key];
}
