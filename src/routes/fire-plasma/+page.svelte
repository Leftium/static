<script lang="ts">
	import { createOpaqueImageData, type FxState } from '$lib/fx-harness.svelte';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';
	import { makeColor, paletteGray } from '$lib/palette';

	let imageData: ImageData;
	let grid = new Uint8Array(0);

	let heatPrev = new Uint8Array(0);
	let heatNext = new Uint8Array(0);

	const padSides = 1;
	const padTop = 1;
	const padBottom = 4;

	let heatWidth = 0;
	let heatHeight = 0;

	let paddedWidth = 0;
	let paddedHeight = 0;

	function makeFirePalette(extended = false) {
		let r = 0,
			g = 0,
			b = 0;

		let palette = new Uint32Array(256);
		palette.fill(makeColor(r, g, b));

		let i = 255;
		r = b = g = 255;

		while (i > 223) {
			palette[i] = makeColor(r, g, b);
			///console.log('A', { i, r, g, b });
			i--;
		}

		b++;
		while (b > 0) {
			b -= 8;
			palette[i] = makeColor(r, g, b);
			///console.log('A', { i, r, g, b });
			i--;
		}

		g++;
		while (g > 128) {
			g -= 4;
			if (!extended) {
				g -= 4;
			}

			palette[i] = makeColor(r, g, b);
			///console.log('B', { i, r, g, b });
			i--;
		}

		r++;
		while (g > 0) {
			r -= 8;
			g -= 4;

			if (!extended) {
				r -= 8;
				g -= 4;
			}

			palette[i] = makeColor(r, g, b);
			///console.log('C', { i, r, g, b });
			i--;
		}
		return palette;
	}

	const paletteFire = makeFirePalette(false);

	// Utility: create fire buffer with padding
	function createFireBuffer(width: number, height: number) {
		paddedWidth = width + padSides * 2;
		paddedHeight = height + padTop + padBottom;
		return new Uint8Array(paddedWidth * paddedHeight);
	}

	// Helper: get fire value at (x, y) with padding-aware indexing
	function getFire(fire: Uint8Array, x: number, y: number) {
		return fire[y * paddedWidth + x];
	}

	// Kernel: compute next fire value at (x, y)
	function fireMath(x: number, y: number, heatPrev: Uint8Array) {
		let total = 0;

		total += getFire(heatPrev, x + 0, y - 1);

		total += getFire(heatPrev, x - 1, y + 0);
		total += getFire(heatPrev, x + 0, y + 0) * 2;
		total += getFire(heatPrev, x + 1, y + 0);

		total += getFire(heatPrev, x + 0, y + 1);

		total += getFire(heatPrev, x - 1, y + 2);
		total += getFire(heatPrev, x + 1, y + 2);

		total += getFire(heatPrev, x + 0, y + 3);

		total += getFire(heatPrev, x - 1, y + 4);
		total += getFire(heatPrev, x + 0, y + 4);
		total += getFire(heatPrev, x + 1, y + 4);

		return (total / 12) | 0; // integer division
	}

	// Advance one frame: compute nextFire from prevFire
	function stepFire() {
		//console.log('stepFire');

		[heatPrev, heatNext] = [heatNext, heatPrev];

		// Add heat to bottom rows (fuel source)
		const bottomStart = heatHeight + padTop;
		const bottomEnd = bottomStart + padBottom;

		for (let y = bottomStart; y < bottomEnd; y++) {
			for (let x = padSides; x < heatWidth + padSides; x++) {
				const idx = y * paddedWidth + x;
				// Random heat: 0–255, or bias toward hotter values
				heatPrev[idx] = Math.random() < 0.73 ? 255 : 0;
			}
		}

		for (let y = padTop; y < heatHeight + padTop; y++) {
			for (let x = padSides; x < heatWidth + padSides; x++) {
				const idx = y * paddedWidth + x;
				heatNext[idx] = fireMath(x, y, heatPrev);
			}
		}
		//console.log(heatNext);
	}

	function generateNoise(data: Uint8Array) {
		const width = imageData.width;
		const height = imageData.height;

		const size = 255;

		for (let j = 0; j < height; j++) {
			for (let i = 0; i < height; i++) {
				const value = size - Math.min(Math.abs(i - j - size));
				grid[i + j * width] = value;
			}
		}
		return data;
	}

	export function renderFire(noise: Uint8Array, imageData: ImageData, palette = paletteGray) {
		const data32 = new Uint32Array(imageData.data.buffer);
		const paddedWidth = heatWidth + padSides * 2;

		let dst = 0; // index into imageData
		for (let y = padTop; y < heatHeight + padTop; y++) {
			const rowStart = y * paddedWidth + padSides;
			for (let x = 0; x < heatWidth; x++) {
				const idx = rowStart + x;
				data32[dst++] = palette[noise[idx]];
			}
		}

		return imageData;
	}
</script>

<main>
	<GraphicalEffect
		oninit={(fx: FxState) => {
			fx.standardSize = true;

			fx.crtScanlines = false;
			fx.scalingFactor = 1 / 2;

			//fx.paused = true;
		}}
		onresize={(_fx, width, height) => {
			console.log('resizeHandler', { width, height });
			imageData = createOpaqueImageData(width, height);
			grid = new Uint8Array(width * height);

			generateNoise(grid);

			heatWidth = width;
			heatHeight = height;

			heatPrev = createFireBuffer(width, height);
			heatNext = createFireBuffer(width, height);
		}}
		onupdate={() => {
			//console.log('onupdate')
			stepFire();
		}}
		onrender={() => {
			//stepFire()
			return renderFire(heatNext, imageData, paletteFire);
		}}
	></GraphicalEffect>
</main>

<style>
	main {
		display: flex;
		height: 100%;
		align-items: center;
		justify-content: center;
	}
</style>
