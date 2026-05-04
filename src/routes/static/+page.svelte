<script lang="ts">
	import { createOpaqueImageData, type FxState } from '$lib/fx-harness.svelte';
	import { generateNoise } from '$lib/generateNoise';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';

	let imageData: ImageData;
</script>

<main>
	<GraphicalEffect
		oninit={(fx: FxState) => {
			//console.log('init', $state.snapshot(fx));
			fx.scalingFactor = 1 / 2;
			// Pixel ratio based on NTSC 440x486 resolution stretched to 4:3 aspect ratio.
			fx.pixelAspectRatio = ((4 / 440) * 486) / 3;
		}}
		onresize={(_fx, width, height) => {
			console.log('resizeHandler', { width, height });
			imageData = createOpaqueImageData(width, height);
		}}
		onupdate={() => generateNoise(imageData)}
		onrender={() => imageData}
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
