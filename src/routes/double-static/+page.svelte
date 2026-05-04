<script lang="ts">
	import { createOpaqueImageData, type FxState } from '$lib/fx-harness.svelte';
	import { generateNoise } from '$lib/generateNoise';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';

	let noise = [new Uint8Array(0), new Uint8Array(0)];
	let imageData = [null as unknown as ImageData, null as unknown as ImageData];
</script>

<main>
	<GraphicalEffect
		resizeHandler={(fx: FxState, width: number, height: number) => {
			console.log('resizeHandler', { width, height });

			noise[0] = new Uint8Array(width * height);
			imageData[0] = createOpaqueImageData(width, height);
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
		resizeHandler={(fx: FxState, width: number, height: number) => {
			console.log('resizeHandler', { width, height });
			noise[1] = new Uint8Array(width * height);
			imageData[1] = createOpaqueImageData(width, height);
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
