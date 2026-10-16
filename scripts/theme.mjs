// Browser theme manifests built from a flavour's resolved colour map.
//
// Pure ESM, no Node or DOM APIs, so the same code drives both
// `scripts/build-themes.mjs` and the app's "browser theme" download button.
//
// Chrome/Chromium only accept the colour keys listed in Chromium's
// `kOverwritableColorTable` (chrome/browser/themes/browser_theme_pack.cc) and
// require RGB arrays; Firefox accepts CSS colour strings plus a larger key set.
// Anything outside those tables is silently ignored (or warned about) by the
// browser, so both maps below stay strictly inside them.

/** The accent each palette is best known for; used by the pre-generated themes. */
export const SIGNATURE_ACCENT = {
	gruvbox: 'orange',
	everforest: 'green',
	kanagawa: 'blue',
	// Catppuccin's signature accent is mauve, at every flavour.
	'catppuccin-latte': 'mauve',
	'catppuccin-frappe': 'mauve',
	'catppuccin-macchiato': 'mauve',
	'catppuccin-mocha': 'mauve',
};

// Placeholder token meaning "use the flavour's selected accent".
const ACCENT = '@accent';

// Chrome/Chromium key -> palette token.
//
// `background_tab*` is deliberately absent: leaving it unset makes Chrome
// derive the inactive tab colour from `frame`, which gives the flat
// frame-behind / raised-active-tab look these palettes are designed around.
const CHROME_COLORS = {
	frame: 'crust',
	frame_inactive: 'mantle',
	frame_incognito: 'crust',
	frame_incognito_inactive: 'mantle',
	toolbar: 'base',
	tab_text: 'text',
	tab_background_text: 'subtext1',
	tab_background_text_inactive: 'overlay0',
	tab_background_text_incognito: 'subtext1',
	tab_background_text_incognito_inactive: 'overlay0',
	bookmark_text: 'text',
	toolbar_text: 'text',
	toolbar_button_icon: 'text',
	button_background: 'surface0',
	omnibox_background: 'surface0',
	omnibox_text: 'text',
	ntp_background: 'base',
	ntp_text: 'text',
	ntp_link: ACCENT,
};

// Firefox key -> palette token.
const FIREFOX_COLORS = {
	frame: 'crust',
	frame_inactive: 'mantle',
	toolbar: 'base',
	toolbar_text: 'text',
	bookmark_text: 'text',
	icons: 'text',
	icons_attention: ACCENT,
	tab_text: 'text',
	tab_selected: 'base',
	tab_background_text: 'subtext1',
	tab_line: ACCENT,
	tab_loading: ACCENT,
	toolbar_field: 'surface0',
	toolbar_field_text: 'text',
	toolbar_field_border: 'surface1',
	toolbar_field_focus: 'surface1',
	toolbar_field_text_focus: 'text',
	toolbar_field_highlight: 'surface2',
	toolbar_field_highlight_text: 'text',
	toolbar_top_separator: 'surface0',
	toolbar_bottom_separator: 'surface0',
	button_background_hover: 'surface1',
	button_background_active: 'surface2',
	popup: 'mantle',
	popup_text: 'text',
	popup_border: 'surface0',
	popup_highlight: 'surface0',
	popup_highlight_text: 'text',
	sidebar: 'base',
	sidebar_border: 'surface0',
	sidebar_text: 'text',
	sidebar_highlight: 'surface0',
	sidebar_highlight_text: 'text',
	ntp_background: 'base',
	ntp_card_background: 'surface0',
	ntp_text: 'text',
};

function hexToRgb(hex) {
	const value = Number.parseInt(hex.slice(1), 16);
	return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** A colour's hue as the 0..1 float Chrome's `tints` block expects. */
function hueOf(hex) {
	const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	if (d === 0) return 0;
	let hue;
	if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
	else if (max === g) hue = (b - r) / d + 2;
	else hue = (r - g) / d + 4;
	return Math.round((hue / 6) * 1000) / 1000;
}

function resolve(table, colors, accent) {
	return Object.fromEntries(
		Object.entries(table).map(([key, token]) => [
			key,
			colors[token === ACCENT ? accent : token],
		]),
	);
}

/**
 * Chrome/Chromium theme manifest (also works in Edge and Brave).
 *
 * @param {{ name: string, colors: Record<string, string>, accent: string, version?: string }} options
 *   `colors` maps palette tokens (`base`, `surface0`, `text`, …) to hex strings.
 */
export function chromeThemeManifest({
	name,
	colors,
	accent,
	version = '1.0.0',
}) {
	const resolved = resolve(CHROME_COLORS, colors, accent);
	return {
		manifest_version: 3,
		name,
		version,
		description: `Browser theme matching the ${name} userstyles`,
		theme: {
			// Chrome rejects CSS colour strings here; RGB arrays only.
			colors: Object.fromEntries(
				Object.entries(resolved).map(([key, hex]) => [
					key,
					hexToRgb(hex),
				]),
			),
			// Hue-only nudge (saturation/lightness of 0.5 mean "no change"), so
			// hovered and pressed toolbar buttons pick up the accent without
			// Chrome altering their lightness.
			tints: { buttons: [hueOf(colors[accent]), 0.5, 0.5] },
		},
	};
}

/**
 * Firefox theme manifest.
 *
 * @param {{ name: string, colors: Record<string, string>, accent: string, dark?: boolean, version?: string, id?: string }} options
 */
export function firefoxThemeManifest({
	name,
	colors,
	accent,
	dark = true,
	version = '1.0.0',
	id,
}) {
	return {
		manifest_version: 3,
		name,
		version,
		description: `Browser theme matching the ${name} userstyles`,
		browser_specific_settings: {
			gecko: { id: id ?? `${slugify(name)}@userstyles-customizer` },
		},
		theme: {
			colors: resolve(FIREFOX_COLORS, colors, accent),
			properties: {
				// Keep Firefox's own chrome and built-in pages in step with the
				// flavour so the theme doesn't fight the light/dark side of it.
				color_scheme: dark ? 'dark' : 'light',
			},
		},
	};
}

function slugify(value) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/** Pretty-print a manifest, keeping RGB/tint triples on a single line. */
export function formatManifest(value) {
	return `${JSON.stringify(value, null, 2).replace(
		/\[\s*\n\s+([\d.]+),\s*\n\s+([\d.]+),\s*\n\s+([\d.]+)\s*\n\s+\]/g,
		'[$1, $2, $3]',
	)}\n`;
}

/** Load instructions shipped next to each pair of manifests. */
export function themeReadme(name) {
	return `${name}
${'-'.repeat(name.length)}

A browser theme matching the "${name}" userstyles palette.

Two manifests are included, one per browser engine. Neither contains
JavaScript.

Chrome, Edge, Brave
-------------------
This folder IS the theme: it holds manifest.json (the Chromium one).

  1. Open chrome://extensions
  2. Turn on "Developer mode" (top right)
  3. Click "Load unpacked"
  4. Select this folder ("${name}")
  5. Click "Keep it" in the confirmation bubble

Chrome blocks sideloaded .crx files, so there is no double-click install
outside of the Chrome Web Store; "Load unpacked" is the supported local route.
After loading, the theme also shows up under Settings > Appearance > Theme.
To remove it, click "Theme" in Settings > Appearance or reset the theme.

Firefox
-------
The Firefox manifest lives in ./firefox and only takes effect once Firefox has
verified a signature, so either:

  * Test it now: open about:debugging#/runtime/this-firefox,
    click "Load Temporary Add-on..." and pick "${name}-firefox.xpi".
    It lasts until Firefox restarts.
  * Install it properly: sign "${name}-firefox.xpi" for free through
    addons.mozilla.org (Developer Hub > Submit a New Add-on), then open the
    signed file. Requires the gecko id in the manifest, which is already set.

Applying the theme does not change any page content; only the browser chrome
(tabs, toolbar, omnibox, menus, New Tab page) is recoloured.
`;
}
