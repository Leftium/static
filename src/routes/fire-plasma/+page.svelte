<script lang="ts">
	import { createOpaqueImageData, type FxState } from '$lib/fx-harness.svelte';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';
	import { makeColor, paletteGray } from '$lib/palette';

	let imageData: ImageData;

	let heatPrev = new Float32Array(0);
	let heatNext = new Float32Array(0);

	const padSides = 0;
	const padTop = 1;
	const padBottom = 4;

	let heatWidth = 0;
	let heatHeight = 0;

	let paddedWidth = 0;
	let paddedHeight = 0;

	function makeFirePalette(options: { blue?: boolean; extended?: boolean } = {}) {
		options = {
			blue: false,
			extended: false,
			...options
		};

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
			if (!options.extended) {
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

			if (!options.extended) {
				r -= 8;
				g -= 4;
			}

			palette[i] = makeColor(r, g, b);
			///console.log('C', { i, r, g, b });
			i--;
		}

		if (options.blue) {
			// Use blue channel to track fire intensitiy value.
			palette = palette.map((value, index) => value | (index << 16));
		}

		return palette;
	}

	// Utility: create fire buffer with padding
	function createFireBuffer(width: number, height: number) {
		paddedWidth = width + padSides * 2;
		paddedHeight = height + padTop + padBottom;
		return new Float32Array(paddedWidth * paddedHeight);
	}

	// Helper: get fire value at (x, y) with padding-aware indexing
	function getFire(fire: Float32Array, x: number, y: number) {
		// Wrap x around using modulo
		return fire[y * paddedWidth + ((x + heatWidth) % heatWidth)];
	}

	// Kernel: compute next fire value at (x, y)
	function fireMath(x: number, y: number, heatPrev: Float32Array) {
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

		return total / 12.02;
	}

	// Advance one frame: compute nextFire from prevFire
	function stepFire() {
		//console.log('stepFire');

		[heatPrev, heatNext] = [heatNext, heatPrev];

		//heatNext.fill(160); // Invisible background heat.

		// Add heat to bottom rows (fuel source)
		const heatRows = 4;
		const bottomStart = heatHeight + padTop - heatRows;
		const bottomEnd = bottomStart + heatRows;

		for (let y = bottomStart; y < bottomEnd; y++) {
			for (let x = padSides; x < heatWidth + padSides; x++) {
				const idx = y * paddedWidth + x;
				heatPrev[idx] = Math.random() < 0.5 ? 505 : -145;
			}
		}

		for (let y = heatHeight; y > 0; y--) {
			let maxHeat = 0;

			for (let x = padSides; x < heatWidth + padSides; x++) {
				const index = y * paddedWidth + x;
				const heatValue = fireMath(x, y, heatPrev);
				heatNext[index] = heatValue;

				maxHeat = Math.max(maxHeat, heatValue);
			}

			if (maxHeat < 163) {
				//console.log('break:', {y})
				//break;
			}
		}
	}

	export function renderFire(noise: Float32Array, imageData: ImageData, palette = paletteGray) {
		const data32 = new Uint32Array(imageData.data.buffer);
		const paddedWidth = heatWidth + padSides * 2;

		let dst = 0; // index into imageData
		for (let y = padTop; y < heatHeight + padTop; y++) {
			const rowStart = y * paddedWidth + padSides;
			for (let x = 0; x < heatWidth; x++) {
				const idx = rowStart + x;
				data32[dst++] = palette[noise[idx] | 0];
			}
		}

		return imageData;
	}
</script>

<main>
	<GraphicalEffect
		oninit={(fx: FxState) => {
			fx.standardSize = true;
			fx.standardWidth = 500;
			fx.standardHeight = 800;
			//fx.pixelAspectRatio = .5

			fx.crtScanlines = false;
			fx.scalingFactor = 1 / 2;

			//fx.paused = true;

			fx.palettes.push(makeFirePalette());
			fx.palettes.push(makeFirePalette({ extended: true }));
			fx.palettes.push(makeFirePalette({ blue: true }));
			fx.palettes.push(makeFirePalette({ extended: true, blue: true }));

			fx.low = 131;
			fx.high = 131;
		}}
		onresize={(_fx, width, height) => {
			console.log('resizeHandler', { width, height });
			imageData = createOpaqueImageData(width, height);

			heatWidth = width;
			heatHeight = height;

			heatPrev = createFireBuffer(width, height);
			heatNext = createFireBuffer(width, height);
		}}
		onupdate={() => {
			//console.log('onupdate')
			stepFire();
		}}
		onrender={(fx) => {
			//stepFire()
			return renderFire(
				heatNext,
				imageData,
				fx.palettes[fx.paletteIndex] as Uint32Array<ArrayBuffer>
			);
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
