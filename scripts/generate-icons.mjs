import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';

// Dependency-free PNGs: a geometric S, centered inside the maskable safe circle.
function crc32(bytes) {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit++)
			crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
	}
	return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
	const body = Buffer.concat([Buffer.from(type), data]);
	const size = Buffer.alloc(4);
	size.writeUInt32BE(data.length);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(body));
	return Buffer.concat([size, body, crc]);
}
function icon(size) {
	const rows = Buffer.alloc((size * 3 + 1) * size);
	const shape = ['11111', '10000', '11111', '00001', '11111'];
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const col = Math.floor((x / size - 0.25) * 10);
			const row = Math.floor((y / size - 0.25) * 10);
			const ink =
				row >= 0 && row < 5 && col >= 0 && col < 5 && shape[row][col] === '1';
			rows.set(
				ink ? [100, 185, 255] : [2, 9, 23],
				y * (size * 3 + 1) + 1 + x * 3,
			);
		}
	}
	const header = Buffer.alloc(13);
	header.writeUInt32BE(size, 0);
	header.writeUInt32BE(size, 4);
	header[8] = 8;
	header[9] = 2;
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(rows)),
		chunk('IEND', Buffer.alloc(0)),
	]);
}
await mkdir('public/icons', { recursive: true });
for (const [name, size] of [
	['icon-192', 192],
	['icon-512', 512],
	['maskable-512', 512],
	['apple-touch-icon', 180],
]) {
	await writeFile(`public/icons/${name}.png`, icon(size));
}
