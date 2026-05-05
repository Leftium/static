function makePalette(makeColor: (i: number) => number) {
	return new Uint32Array(256).map((_value, i) => makeColor(i));
}

export const paletteGray = makePalette((i) => {
	const r = i,
		g = i,
		b = i,
		a = 255;
	return (a << 24) | (b << 16) | (g << 8) | r;
});

export const paletteCyan = makePalette((i) => {
	const g = i,
		b = i,
		a = 255;
	console.log({ i, g, b, a });
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
