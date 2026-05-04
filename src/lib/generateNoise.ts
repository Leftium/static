const chunkSize = 65536; // max allowed

export function generateNoise(data: Uint8Array) {
	for (let i = 0; i < data.length; i += chunkSize) {
		const view = data.subarray(i, i + chunkSize);
		crypto.getRandomValues(view as Uint8Array<ArrayBuffer>);
	}
	return data;
}

export function renderNoise(noise: Uint8Array, imageData: ImageData, skipRed = false) {
	const data = imageData.data;
	let j = 0;
	for (let i = 0; i < noise.length; i++) {
		const value = noise[i];
		data[j + 0] = skipRed ? 0 : value; // R
		data[j + 1] = value; // G
		data[j + 2] = value; // B
		j += 4;
	}
	return imageData;
}
