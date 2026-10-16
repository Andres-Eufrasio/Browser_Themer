<script setup lang="ts">
import type { FlavorName } from './palette';

import rawUserstylesImport from '../import.json' with { type: 'json' };

import { get, set } from '@vueuse/core';
import {
	accentEntries,
	contrastEntries,
	darkFlavorEntries,
	flavors,
	lightFlavorEntries,
	paletteLabels,
} from './palette';

const isDark = usePreferredDark();

const themeMode = useStorage<'dark' | 'light'>(
	'themeMode',
	isDark.value ? 'dark' : 'light',
);
const darkFlavor = useStorage<string>('darkFlavor', 'gruvbox-dark');
const lightFlavor = useStorage<string>('lightFlavor', 'gruvbox-light');
const contrast = useStorage<string>('contrast', 'medium');
const accentColor = useStorage<string>('accentColor', 'orange');

const activeFlavor = computed(() =>
	themeMode.value === 'dark' ? darkFlavor.value : lightFlavor.value,
);
const previewFlavor = computed<FlavorName>(() => {
	const key = `${activeFlavor.value}-${contrast.value}` as FlavorName;
	return flavors[key] ? key : 'gruvbox-dark-medium';
});
const themeLabel = computed(() => {
	const flavor = flavors[previewFlavor.value];
	return `${paletteLabels[flavor.palette]} ${flavor.dark ? 'Dark' : 'Light'}`;
});

// --- Download button contrast -------------------------------------------
// The button is filled with the selected accent; pick whichever of the
// flavour's background/foreground reads better on top of it.
function relativeLuminance(hex: string) {
	const channels = [1, 3, 5]
		.map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
		.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(a: string, b: string) {
	const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
		(x, y) => y - x,
	);
	return (light + 0.05) / (dark + 0.05);
}

const downloadStyle = computed(() => {
	const flavor = flavors[previewFlavor.value];
	const accentHex =
		flavor.colors[get(accentColor)]?.hex ?? flavor.colors.text.hex;
	const on = (['base', 'text'] as const).sort(
		(a, b) =>
			contrastRatio(accentHex, flavor.colors[b].hex) -
			contrastRatio(accentHex, flavor.colors[a].hex),
	)[0];
	return {
		backgroundColor: `var(--gv-${get(accentColor)})`,
		color: `var(--gv-${on})`,
	};
});

function toggleMode() {
	set(themeMode, themeMode.value === 'dark' ? 'light' : 'dark');
}

watchEffect(() => {
	document.documentElement.setAttribute('theme', previewFlavor.value);
});

const [settings, ...userstyles] = rawUserstylesImport as [
	SettingsEntry,
	UserstyleEntry,
];

const THEME_SUFFIX = / (?:Gruvbox|Everforest)(?: \+ (?:Gruvbox|Everforest))?$/;

function siteName(name: string) {
	return name.replace(THEME_SUFFIX, '');
}

function paletteLabel(flavor: string) {
	return flavor.startsWith('everforest')
		? paletteLabels.everforest
		: paletteLabels.gruvbox;
}

function createCustomUserstylesImport() {
	const light = paletteLabel(get(lightFlavor));
	const dark = paletteLabel(get(darkFlavor));
	const suffix = light === dark ? light : `${light} + ${dark}`;

	const customSelectedUserstyles = userstyles
		.filter(({ name }) => get(selectedUserstyles)[name])
		.map((userstyle) => {
			const vars = { ...userstyle.usercssData.vars };
			if (vars.accentColor) {
				vars.accentColor = { ...vars.accentColor, value: get(accentColor) };
			}
			if (vars.darkFlavor) {
				vars.darkFlavor = { ...vars.darkFlavor, value: get(darkFlavor) };
			}
			if (vars.lightFlavor) {
				vars.lightFlavor = { ...vars.lightFlavor, value: get(lightFlavor) };
			}
			if (vars.contrast) {
				vars.contrast = { ...vars.contrast, value: get(contrast) };
			}

			const name = `${siteName(userstyle.name)} ${suffix}`;
			return {
				...userstyle,
				name,
				usercssData: { ...userstyle.usercssData, name, vars },
				sourceCode: userstyle.sourceCode.replace(
					/^@name .*$/m,
					`@name ${name}`,
				),
			};
		});

	return JSON.stringify([settings, ...customSelectedUserstyles]);
}

const searchText = ref('');
const selectedUserstyles = useStorage<Record<string, boolean>>(
	'selectedUserstyles',
	getAllSelected(),
);
function getAllSelected() {
	return userstyles.reduce((acc, { name }) => ({ ...acc, [name]: true }), {});
}
function getFilteredUserstyles() {
	return userstyles.filter(({ name }) =>
		name.toLowerCase().includes(searchText.value.toLowerCase()),
	);
}

const downloaded = ref(false);

function download() {
	const blob = new Blob([createCustomUserstylesImport()], {
		type: 'application/json',
	});
	const href = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = href;
	link.download = 'import.json';
	link.click();
	URL.revokeObjectURL(href);
	set(downloaded, true);
	setTimeout(() => {
		set(downloaded, false);
	}, 1000);
}
</script>

<template>
	<div class="h-100vh w-full flex flex-col px4 pt4 text-lg gap-24">
		<header class="flex justify-between">
			<h1 class="text-3xl">Userstyles Customizer</h1>
			<div class="flex flex-row gap-2 h-[min-content]">
				<a
					class="border border-surface0 border-rounded flex h-auto p2 hover:bg-mantle"
					aria-label="GitHub repository"
					href="https://github.com/morhetz/gruvbox"
					target="_blank"
				>
					<div class="self-center i-carbon-logo-github" />
				</a>
				<button
					class="border border-surface0 border-rounded flex p2 hover:bg-mantle"
					:aria-label="`Toggle to ${themeMode === 'dark' ? 'light' : 'dark'} mode`"
					@click="toggleMode()"
				>
					<span>{{ themeLabel }}</span>
				</button>
			</div>
		</header>
		<main class="flex flex-col gap-8 md:gap-4">
			<div
				class="flex flex-wrap justify-center md:flex-row gap-4 sm:gap-6 self-center mx-auto"
			>
				<div class="flex flex-col gap-2">
					<label for="lightFlavor">Light Flavor</label>
					<select
						id="lightFlavor"
						v-model="lightFlavor"
						class="border border-surface0 border-rounded bg-base p2"
						name="lightFlavor"
					>
						<option
							v-for="[flavor, label] in lightFlavorEntries"
							:key="flavor"
							:value="flavor"
						>
							{{ label }}
						</option>
					</select>
				</div>
				<div class="flex flex-col gap-2">
					<label for="darkFlavor">Dark Flavor</label>
					<select
						id="darkFlavor"
						v-model="darkFlavor"
						class="border border-surface0 border-rounded bg-base p2"
						name="darkFlavor"
					>
						<option
							v-for="[flavor, label] in darkFlavorEntries"
							:key="flavor"
							:value="flavor"
						>
							{{ label }}
						</option>
					</select>
				</div>
				<div class="flex flex-col gap-2">
					<label for="contrast">Contrast</label>
					<select
						id="contrast"
						v-model="contrast"
						class="border border-surface0 border-rounded bg-base p2"
						name="contrast"
					>
						<option
							v-for="[value, label] in contrastEntries"
							:key="value"
							:value="value"
						>
							{{ label }}
						</option>
					</select>
				</div>
				<div class="flex flex-col gap-2">
					<label for="accentColor">Accent Color</label>
					<select
						id="accentColor"
						v-model="accentColor"
						class="border border-surface0 border-rounded bg-base p2"
						name="accentColor"
					>
						<option
							v-for="[color, { name }] in accentEntries"
							:key="color"
							:value="color"
						>
							{{ name }}
						</option>
					</select>
				</div>
			</div>
			<button
				class="border-rounded mx-auto flex flex-row gap-2 py-2 px-4 justify-center items-center hover:scale-105 transition-transform group"
				:style="downloadStyle"
				title="Download"
				@click="download()"
			>
				<span v-text="downloaded ? 'Downloaded!' : 'Download'" />
				<i v-if="downloaded" class="i-carbon-checkmark" />
				<i v-else class="i-carbon-download group-hover:animate-tada" />
			</button>
			<div class="mx-auto flex flex-col gap-2 w-full lg:w-3/4">
				<div class="flex flex-col sm:flex-row gap-2 self-center my-4">
					<input
						type="text"
						placeholder="Search"
						v-model="searchText"
						class="border border-surface0 border-rounded bg-base p2"
					/>
					<div class="flex flex-row gap-2">
						<button
							class="border-rounded flex p2 bg-surface0 hover:bg-surface1"
							@click="selectedUserstyles = {}"
						>
							Deselect All
						</button>
						<button
							class="border-rounded flex p2 bg-surface0 hover:bg-surface1"
							@click="selectedUserstyles = getAllSelected()"
						>
							Select All
						</button>
					</div>
				</div>
				<div
					class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
				>
					<template
						v-for="userstyle in userstyles"
						:key="userstyle.name"
					>
						<label
							v-if="getFilteredUserstyles().includes(userstyle)"
							:for="userstyle.name"
							class="flex flex-row gap-2 border border-surface0 border-rounded p2 items-center justify-between"
						>
							<h2 class="text-xl">
								{{ siteName(userstyle.name) }}
							</h2>
							<input
								type="checkbox"
								v-model="selectedUserstyles[userstyle.name]"
								class="size-5"
								:name="userstyle.name"
								:id="userstyle.name"
							/>
						</label>
					</template>
				</div>
			</div>
		</main>
	</div>
</template>

<style></style>
