export function generateNoise(imageData: ImageData, length: number, skipRed = false) {
	const data = imageData.data;
	let j = 0;
	for (let i = 0; i < length; i++) {
		const value = Math.random() * 255;
		//noise[i] = value;

		data[j + 0] = skipRed ? 0 : value; // R
		data[j + 1] = value; // G
		data[j + 2] = value; // B
		j += 4;
	}
	return imageData;
}
