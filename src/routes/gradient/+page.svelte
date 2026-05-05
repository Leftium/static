<script lang="ts">
	import { createOpaqueImageData, type FxState } from '$lib/fx-harness.svelte';
	import { renderNoise } from '$lib/generateNoise';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';

	let imageData: ImageData;
	let grid = new Uint8Array(0);

	function generateNoise(data: Uint8Array) {
		let width = imageData.width;
		for (let i = 0; i < width; i++) {
			for (let j = 0; j < innerHeight; j++) {
				grid[i + j * width] = i;
			}
		}
		return data;
	}
</script>

<main>
	<GraphicalEffect
		oninit={(fx: FxState) => {
			fx.standardSize = true;
			fx.standardWidth = 512;
			fx.standardHeight = 512;

			fx.crtScanlines = false;
			fx.scalingFactor = 1 / 2;
		}}
		onresize={(_fx, width, height) => {
			console.log('resizeHandler', { width, height });
			imageData = createOpaqueImageData(width, height);
			grid = new Uint8Array(width * height);

			generateNoise(grid);
		}}
		//onupdate={() => true }
		onrender={() => renderNoise(grid, imageData, true)}
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
