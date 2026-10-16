import {
	defineConfig,
	presetIcons,
	presetUno,
	transformerDirectives,
} from 'unocss';

import { flavorEntries, flavors } from './src/palette';

const GV_PREFIX = false;
const GV_SELECTOR = (flavor: string) => `[theme="${flavor}"]`;

// All flavours share the same colour keys, so one flavour is enough to declare
// the utilities; the preflight then defines the values per selected flavour.
const colorEntries = flavors['gruvbox-dark-medium'].colorEntries;

export default defineConfig({
	theme: {
		colors: {
			...Object.fromEntries(
				colorEntries.map(([name]) => [
					`${GV_PREFIX ? `${GV_PREFIX}-` : ''}${name}`,
					`var(--gv-${name})`,
				]),
			),
		},
	},
	preflights: [
		{
			getCSS: () => {
				return flavorEntries
					.map(
						([flavor, { colors, dark }]) => `
:root${GV_SELECTOR(flavor)} {
    ${dark ? 'color-scheme: dark;' : 'color-scheme: light;'}
    ${Object.entries(colors)
		.map(([name, { hex }]) => `--gv-${name}: ${hex};`)
		.join('\n')};
}`,
					)
					.join('\n');
			},
		},
	],
	presets: [
		presetUno(),
		presetIcons({
			scale: 1.2,
			warn: true,
		}),
	],
	transformers: [transformerDirectives()],
});
