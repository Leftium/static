export function generateNoise(imageData: ImageData, skipRed = false) {
	const data = imageData.data;
	const len = data.length / 4;
	let j = 0;
	for (let i = 0; i < len; i++) {
		const value = Math.random() * 255;
		//noise[i] = value;

		data[j + 0] = skipRed ? 0 : value; // R
		data[j + 1] = value; // G
		data[j + 2] = value; // B
		j += 4;
	}
	return imageData;
}
