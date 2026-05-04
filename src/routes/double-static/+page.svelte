<script lang="ts">
	import type { FxState } from '$lib/fx-harness.svelte';
	import { generateNoise } from '$lib/generateNoise';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';

	// Static effect based on: https://codepen.io/matthewhudson/pen/KOPxNv
	// Generate one frame of noise

	let noise = [new Uint8Array(0), new Uint8Array(0)];
	let imageData = [null as unknown as ImageData, null as unknown as ImageData];
</script>

<main>
	<GraphicalEffect
		resizeHandler={(fx: FxState) => {
			const width = fx.canvas.width;
			const height = fx.canvas.height;

			console.log('resizeHandler', { width, height });

			noise[0] = new Uint8Array(width * height);
			imageData[0] = new ImageData(width, height);
			const data = imageData[0].data;

			let j = 0;
			for (let i = 0; i < noise[0].length; i++) {
				data[(j += 4) + 3] = 255; // A
			}
		}}
		updateHandler={() => {
			return generateNoise(imageData[0], noise[0].length, true);
		}}
		style="width: 30%; height: 50%"
	></GraphicalEffect>

	<GraphicalEffect
		init={(fx: FxState) => {
			//console.log('init', $state.snapshot(fx));
			fx.factor = 1;
		}}
		resizeHandler={(fx: FxState) => {
			const width = fx.canvas.width;
			const height = fx.canvas.height;

			console.log('resizeHandler', { width, height });

			noise[1] = new Uint8Array(width * height);
			imageData[1] = new ImageData(width, height);
			const data = imageData[1].data;

			let j = 0;
			for (let i = 0; i < noise[1].length; i++) {
				data[(j += 4) + 3] = 255; // A
			}
		}}
		updateHandler={() => {
			return generateNoise(imageData[1], noise[1].length);
		}}
		style="width: 50%; height: 30%"
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
