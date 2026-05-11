<script lang="ts">
	import { createOpaqueImageData, type FxState } from '$lib/fx-harness.svelte';
	import { renderNoisePalette } from '$lib/generateNoise';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';
	import { paletteCyan, rotateLeft } from '$lib/palette';

	let imageData: ImageData;
	let grid = new Uint8Array(0);

	function generateNoise(data: Uint8Array) {
		const width = imageData.width;
		const height = imageData.height;

		const size = 255;

		for (let j = 0; j < height; j++) {
			for (let i = 0; i < height; i++) {
				const value = size - Math.min(Math.abs(i - j + size));
				grid[i + j * width] = value;
			}
		}
		return data;
	}
</script>

<main>
	<GraphicalEffect
		oninit={(fx: FxState) => {
			fx.standardSize = true;
			fx.standardWidth = 511;
			fx.standardHeight = 511;

			fx.crtScanlines = false;
			fx.scalingFactor = 1;

			fx.paused = true;
		}}
		onresize={(_fx, width, height) => {
			console.log('resizeHandler', { width, height });
			imageData = createOpaqueImageData(width, height);
			grid = new Uint8Array(width * height);

			generateNoise(grid);
		}}
		onupdate={() => {
			rotateLeft(paletteCyan);
		}}
		onrender={() => renderNoisePalette(grid, imageData, paletteCyan)}
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
