export function makeColor(r: number, g: number, b: number, a = 255) {
	// ABGR packing
	return (a << 24) | (b << 16) | (g << 8) | r;
}

export function makePalette(calcColor: (i: number) => number) {
	return new Uint32Array(256).map((_value, i) => calcColor(i));
}

export function makePaletteGraySlice(low = 0, high = 255) {
	return makePalette((i) => {
		if (i < low) {
			return makeColor(0, i, 255);
		} else if (i <= high) {
			return makeColor(i, i, i);
		}
		return makeColor(255, i, 255);
	});
}

export const paletteGray = makePaletteGraySlice();

export const paletteCyan = makePalette((i) => {
	const g = i,
		b = i,
		a = 255;
	return (a << 24) | (b << 16) | (g << 8);
});

export function rotateRight(arr: Uint32Array<ArrayBuffer>) {
	const last = arr[arr.length - 1];
	for (let i = arr.length - 1; i > 0; i--) {
		arr[i] = arr[i - 1];
	}
	arr[0] = last;
}

export function rotateLeft(arr: Uint32Array<ArrayBuffer>) {
	const first = arr[0];
	for (let i = 0; i < arr.length - 1; i++) {
		arr[i] = arr[i + 1];
	}
	arr[arr.length - 1] = first;
}
