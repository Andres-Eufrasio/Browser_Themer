// CSS `filter` solver: finds a filter chain that turns black into a target
// colour. Used to tint SVG/img logos in the ported userstyles.
//
// Ported from the well-known "MultiplyByZer0" SPSA approach
// (https://stackoverflow.com/a/43960991). Pure matrix math, no canvas, so it
// runs in plain Node.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_PATH = path.join(root, 'scripts', 'filters-cache.json');

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

function applyMatrix(rgb, m) {
	const [r, g, b] = rgb;
	return [
		clamp(m[0] * r + m[1] * g + m[2] * b + m[3]),
		clamp(m[4] * r + m[5] * g + m[6] * b + m[7]),
		clamp(m[8] * r + m[9] * g + m[10] * b + m[11]),
	];
}

const matrices = {
	invert: (v = 1) => {
		const inv = 1 - v * 2;
		return [inv, 0, 0, v * 255, 0, inv, 0, v * 255, 0, 0, inv, v * 255];
	},
	sepia: (v = 1) => {
		const i = 1 - v;
		return [
			0.393 + 0.607 * i,
			0.769 - 0.769 * i,
			0.189 - 0.189 * i,
			0,
			0.349 - 0.349 * i,
			0.686 + 0.314 * i,
			0.168 - 0.168 * i,
			0,
			0.272 - 0.272 * i,
			0.534 - 0.534 * i,
			0.131 + 0.869 * i,
			0,
		];
	},
	saturate: (v = 1) => [
		0.213 + 0.787 * v,
		0.715 - 0.715 * v,
		0.072 - 0.072 * v,
		0,
		0.213 - 0.213 * v,
		0.715 + 0.285 * v,
		0.072 - 0.072 * v,
		0,
		0.213 - 0.213 * v,
		0.715 - 0.715 * v,
		0.072 + 0.928 * v,
		0,
	],
	hueRotate: (deg = 0) => {
		const a = (deg / 180) * Math.PI;
		const s = Math.sin(a);
		const c = Math.cos(a);
		return [
			0.213 + c * 0.787 - s * 0.213,
			0.715 - c * 0.715 - s * 0.715,
			0.072 - c * 0.072 + s * 0.928,
			0,
			0.213 - c * 0.213 + s * 0.143,
			0.715 + c * 0.285 + s * 0.14,
			0.072 - c * 0.072 - s * 0.283,
			0,
			0.213 - c * 0.213 - s * 0.787,
			0.715 - c * 0.715 + s * 0.715,
			0.072 + c * 0.928 + s * 0.072,
			0,
		];
	},
	brightness: (v = 1) => [v, 0, 0, 0, 0, v, 0, 0, 0, 0, v, 0],
	contrast: (v = 1) => {
		const o = -0.5 * v * 255 + 127.5;
		return [v, 0, 0, o, 0, v, 0, o, 0, 0, v, o];
	},
};

/** Apply a filter chain (CSS multiplier/degree values) to a starting rgb. */
export function applyFilters(rgb, [invert, sepia, saturate, hueRotate, brightness, contrast]) {
	let c = rgb;
	c = applyMatrix(c, matrices.invert(invert));
	c = applyMatrix(c, matrices.sepia(sepia));
	c = applyMatrix(c, matrices.saturate(saturate));
	c = applyMatrix(c, matrices.hueRotate(hueRotate));
	c = applyMatrix(c, matrices.brightness(brightness));
	c = applyMatrix(c, matrices.contrast(contrast));
	return c;
}

function rgbToHsl([r, g, b]) {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;
	const d = max - min;
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

// Parameter ranges are expressed in the reference's units:
//   [invert %, sepia %, saturate %, hue-rotate 0-100 (x3.6 = deg), brightness %, contrast %]
function fix(value, idx) {
	let max = 100;
	if (idx === 2) max = 7500;
	else if (idx === 4 || idx === 5) max = 200;
	if (idx === 3) {
		if (value > max) value %= max;
		else if (value < 0) value %= max;
	} else if (value < 0) {
		value = 0;
	} else if (value > max) {
		value = max;
	}
	return value;
}

const randomWithin = (max) => Math.random() * max;

function makeLoss(target, targetHSL) {
	return (values) => {
		const color = applyFilters([0, 0, 0], [
			values[0] / 100,
			values[1] / 100,
			values[2] / 100,
			values[3] * 3.6,
			values[4] / 100,
			values[5] / 100,
		]);
		const hsl = rgbToHsl(color);
		return (
			Math.abs(color[0] - target[0]) +
			Math.abs(color[1] - target[1]) +
			Math.abs(color[2] - target[2]) +
			Math.abs(hsl[0] - targetHSL[0]) +
			Math.abs(hsl[1] - targetHSL[1]) +
			Math.abs(hsl[2] - targetHSL[2])
		);
	};
}

function spsa(A, a, c, values, iters, loss) {
	const alpha = 1;
	const gamma = 1 / 6;
	let best = values.slice();
	let bestLoss = loss(values);
	const deltas = new Array(6).fill(0);
	const highArgs = values.slice();
	const lowArgs = values.slice();

	for (let k = 0; k < iters; k++) {
		const ck = c / Math.pow(k + 1, gamma);
		for (let i = 0; i < 6; i++) {
			deltas[i] = Math.random() > 0.5 ? 1 : -1;
			highArgs[i] = values[i] + ck * deltas[i];
			lowArgs[i] = values[i] - ck * deltas[i];
		}
		const lossDiff = loss(highArgs) - loss(lowArgs);
		for (let i = 0; i < 6; i++) {
			const g = (lossDiff / (2 * ck)) * deltas[i];
			const ak = a[i] / Math.pow(A + k + 1, alpha);
			values[i] = fix(values[i] - ak * g, i);
		}
		const l = loss(values);
		if (l < bestLoss) {
			best = values.slice();
			bestLoss = l;
		}
	}
	return { values: best, loss: bestLoss };
}

function solve(target) {
	const targetHSL = rgbToHsl(target);
	const loss = makeLoss(target, targetHSL);

	// Wide search.
	let wide = { values: [50, 20, 3750, 50, 100, 100], loss: Infinity };
	for (let i = 0; wide.loss > 25 && i < 5; i++) {
		const A = 5;
		const c = 15;
		const a = [60, 180, 18000, 600, 1.2, 1.2];
		const result = spsa(A, a, c, [50, 20, 3750, 50, 100, 100], 1000, loss);
		if (result.loss < wide.loss) wide = result;
	}

	// Narrow search.
	const A = wide.loss + 1;
	const c = 2;
	const a = [0.25 * A, 0.25 * A, A, 0.25 * A, 0.2 * A, 0.2 * A];
	const narrow = spsa(A, a, c, wide.values.slice(), 500, loss);
	return narrow.values;
}

function format(values) {
	return [
		'brightness(0)',
		'saturate(100%)',
		`invert(${Math.round(values[0])}%)`,
		`sepia(${Math.round(values[1])}%)`,
		`saturate(${Math.round(values[2])}%)`,
		`hue-rotate(${Math.round(values[3] * 3.6)}deg)`,
		`brightness(${Math.round(values[4])}%)`,
		`contrast(${Math.round(values[5])}%)`,
	].join(' ');
}

export function hexToRgb(hex) {
	const h = hex.replace('#', '');
	return [
		parseInt(h.slice(0, 2), 16),
		parseInt(h.slice(2, 4), 16),
		parseInt(h.slice(4, 6), 16),
	];
}

let cache = null;

function loadCache() {
	if (cache) return cache;
	cache = fs.existsSync(CACHE_PATH)
		? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
		: {};
	return cache;
}

export function saveCache() {
	if (cache) fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, '\t')}\n`);
}

/** Solve (with on-disk memoisation) a filter chain for `hex`. */
export function solveFilter(hex) {
	const key = hex.toLowerCase();
	const c = loadCache();
	if (c[key]) return c[key];
	const filter = format(solve(hexToRgb(hex)));
	c[key] = filter;
	return filter;
}
