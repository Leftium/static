<script lang="ts">
	import { createOpaqueImageData, type FxState } from '$lib/fx-harness.svelte';
	import { generateNoise } from '$lib/generateNoise';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';

	let imageData = null as unknown as ImageData;
</script>

<main>
	<GraphicalEffect
		init={(fx: FxState) => {
			fx.factor = 1;
		}}
		resizeHandler={(fx: FxState, width: number, height: number) => {
			console.log('resizeHandler', { width, height });
			imageData = createOpaqueImageData(width, height);
		}}
		updateHandler={() => {
			return generateNoise(imageData);
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
