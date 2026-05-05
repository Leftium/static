// Precompute grayscale palette
const palette = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
	const r = i,
		g = i,
		b = i,
		a = 255;
	palette[i] = (a << 24) | (b << 16) | (g << 8) | r;
}

const paletteCyan = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
	const g = i,
		b = i,
		a = 255;
	paletteCyan[i] = (a << 24) | (b << 16) | (g << 8);
}

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

	if (skipRed) {
		for (let i = 0; i < noise.length; i++) {
			data32[i] = paletteCyan[noise[i]];
		}
	} else {
		for (let i = 0; i < noise.length; i++) {
			data32[i] = palette[noise[i]];
		}
	}
	return imageData;
}
