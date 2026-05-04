<script lang="ts">
	import { createOpaqueImageData, type FxState } from '$lib/fx-harness.svelte';
	import { generateNoise } from '$lib/generateNoise';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';

	let imageData = [null, null] as unknown as [ImageData, ImageData];
</script>

<main>
	<GraphicalEffect
		oninit={(fx: FxState) => {
			//console.log('init', $state.snapshot(fx));
			// Pixel ratio based on NTSC 440x486 resolution stretched to 4:3 aspect ratio.
			fx.pixelAspectRatio = ((4 / 440) * 486) / 3;
		}}
		onresize={(_fx, width, height) => {
			console.log('resizeHandler', { width, height });
			imageData[0] = createOpaqueImageData(width, height);
		}}
		onupdate={() => (imageData[0] = generateNoise(imageData[0], true))}
		onrender={() => imageData[0]}
		style="width: 30%; height: 50%"
	></GraphicalEffect>

	<GraphicalEffect
		onresize={(_fx, width, height) => {
			console.log('resizeHandler', { width, height });
			imageData[1] = createOpaqueImageData(width, height);
		}}
		onupdate={() => (imageData[1] = generateNoise(imageData[1]))}
		onrender={() => imageData[1]}
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
