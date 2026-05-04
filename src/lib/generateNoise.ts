const chunkSize = 65536; // max allowed

export function generateNoise(data: Uint8Array) {
	for (let i = 0; i < data.length; i += chunkSize) {
		const view = data.subarray(i, i + chunkSize);
		crypto.getRandomValues(view as Uint8Array<ArrayBuffer>);
	}
	return data;
}

export function renderNoise(noise: Uint8Array, imageData: ImageData, skipRed = false) {
	// reinterpret the buffer as 32‑bit words
	const data32 = new Uint32Array(imageData.data.buffer);

	for (let i = 0; i < noise.length; i++) {
		const value = noise[i];

		// pack RGBA into one 32‑bit integer
		// little‑endian order: lowest byte is R, then G, B, A
		const r = skipRed ? 0 : value;
		const g = value;
		const b = value;
		const a = 255;

		data32[i] = (a << 24) | (b << 16) | (g << 8) | r;
	}

	return imageData;
}
