<script lang="ts">
	import { type FxState } from '$lib/fx-harness.svelte';
	import { generateNoise } from '$lib/generateNoise';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';

	// Static effect based on: https://codepen.io/matthewhudson/pen/KOPxNv
	// Generate one frame of noise

	let noise = new Uint8Array(0);
	let imageData = null as unknown as ImageData;
</script>

<main>
	<GraphicalEffect
		init={(fx: FxState) => {
			fx.factor = 1;
		}}
		resizeHandler={(fx: FxState) => {
			const width = fx.canvas.width;
			const height = fx.canvas.height;

			console.log('resizeHandler', { width, height });

			noise = new Uint8Array(width * height);
			imageData = new ImageData(width, height);
			const data = imageData.data;

			let j = 0;
			for (let i = 0; i < noise.length; i++) {
				data[(j += 4) + 3] = 255; // A
			}
		}}
		updateHandler={() => {
			return generateNoise(imageData, noise.length);
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
