// Metadata shared by the generated userstyles (`scripts/build-import.mjs`) and
// the app (its header links to the same repository), so the two cannot drift.

/** Author credited in every generated userstyle's metadata. */
export const AUTHOR = 'Andres Eufrasio';

/** Homepage (and repository) advertised in every generated userstyle. */
export const HOMEPAGE = 'https://github.com/Andres-Eufrasio/Browser_Themer';

/** `@version` every generated userstyle is stamped with. */
export const VERSION = '1.0.0';

/**
 * The description every generated userstyle carries: the palette it is built
 * from, then the site it themes. The app rewrites the palette half on download.
 *
 * @param {string} palette palette label, e.g. `Gruvbox`
 * @param {string} site style name without its palette suffix, e.g. `YouTube`
 */
export function descriptionFor(palette, site) {
	return `${palette} theme for ${site}`;
}

/** The palette every generated userstyle is built around. */
export const BASE_PALETTE = 'Gruvbox';
