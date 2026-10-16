// Minimal ZIP writer: store method (no compression), which is all the theme
// packages need — a manifest is a couple of kB of text.
//
// Pure ESM using only TextEncoder/Uint8Array, so it runs unchanged in Node
// (`scripts/build-themes.mjs`) and in the browser (the app's download button).

const encoder = new TextEncoder();

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let bit = 0; bit < 8; bit++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[i] = c >>> 0;
	}
	return table;
})();

function crc32(bytes) {
	let c = 0xffffffff;
	for (let i = 0; i < bytes.length; i++) {
		c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
	}
	return (c ^ 0xffffffff) >>> 0;
}

// Fixed timestamp (2026-01-01 00:00) so regenerating the themes produces
// byte-identical archives.
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
const DOS_TIME = 0;

/**
 * Build a ZIP archive.
 *
 * @param {{ path: string, data: string | Uint8Array }[]} files
 * @returns {Uint8Array}
 */
export function createZip(files, { date = DOS_DATE, time = DOS_TIME } = {}) {
	const parts = [];
	const entries = [];
	let offset = 0;

	for (const file of files) {
		const name = encoder.encode(file.path);
		const data =
			typeof file.data === 'string'
				? encoder.encode(file.data)
				: file.data;
		const crc = crc32(data);

		const local = new Uint8Array(30 + name.length);
		const view = new DataView(local.buffer);
		view.setUint32(0, 0x04034b50, true); // local file header
		view.setUint16(4, 20, true); // version needed
		view.setUint16(6, 0x0800, true); // UTF-8 file names
		view.setUint16(8, 0, true); // stored
		view.setUint16(10, time, true);
		view.setUint16(12, date, true);
		view.setUint32(14, crc, true);
		view.setUint32(18, data.length, true);
		view.setUint32(22, data.length, true);
		view.setUint16(26, name.length, true);
		view.setUint16(28, 0, true); // no extra field
		local.set(name, 30);

		parts.push(local, data);
		entries.push({ name, crc, size: data.length, offset });
		offset += local.length + data.length;
	}

	const central = [];
	let centralSize = 0;
	for (const entry of entries) {
		const record = new Uint8Array(46 + entry.name.length);
		const view = new DataView(record.buffer);
		view.setUint32(0, 0x02014b50, true); // central directory header
		view.setUint16(4, 20, true); // version made by
		view.setUint16(6, 20, true); // version needed
		view.setUint16(8, 0x0800, true);
		view.setUint16(10, 0, true);
		view.setUint16(12, time, true);
		view.setUint16(14, date, true);
		view.setUint32(16, entry.crc, true);
		view.setUint32(20, entry.size, true);
		view.setUint32(24, entry.size, true);
		view.setUint16(28, entry.name.length, true);
		view.setUint16(30, 0, true); // extra
		view.setUint16(32, 0, true); // comment
		view.setUint16(34, 0, true); // disk number
		view.setUint16(36, 0, true); // internal attributes
		view.setUint32(38, 0, true); // external attributes
		view.setUint32(42, entry.offset, true);
		record.set(entry.name, 46);
		central.push(record);
		centralSize += record.length;
	}

	const end = new Uint8Array(22);
	const view = new DataView(end.buffer);
	view.setUint32(0, 0x06054b50, true); // end of central directory
	view.setUint16(4, 0, true);
	view.setUint16(6, 0, true);
	view.setUint16(8, entries.length, true);
	view.setUint16(10, entries.length, true);
	view.setUint32(12, centralSize, true);
	view.setUint32(16, offset, true);
	view.setUint16(20, 0, true); // no archive comment

	parts.push(...central, end);

	const total = parts.reduce((sum, part) => sum + part.length, 0);
	const out = new Uint8Array(total);
	let cursor = 0;
	for (const part of parts) {
		out.set(part, cursor);
		cursor += part.length;
	}
	return out;
}
