// Precompute grayscale palette

import { paletteGray } from '$lib/palette';

const chunkSize = 65536; // max allowed

export function generateNoise(data: Uint8Array) {
	for (let i = 0; i < data.length; i += chunkSize) {
		const view = data.subarray(i, i + chunkSize);
		crypto.getRandomValues(view as Uint8Array<ArrayBuffer>);
	}
	return data;
}

export function renderNoise(noise: Uint8Array, imageData: ImageData, palette = paletteGray) {
	// reinterpret the buffer as 32‑bit words
	const data32 = new Uint32Array(imageData.data.buffer);
	for (let i = 0; i < noise.length; i++) {
		data32[i] = palette[noise[i]];
	}
	return imageData;
}
