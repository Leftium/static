<script lang="ts">
	import { createOpaqueImageData, type FxState } from '$lib/fx-harness.svelte';
	import { generateNoise, renderNoise } from '$lib/generateNoise';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';
	import { paletteCyan } from '$lib/palette';

	let imageData = [null, null] as unknown as [ImageData, ImageData];
	let noise = [new Uint8Array(0), new Uint8Array(0)];
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
			noise[0] = new Uint8Array(width * height);
		}}
		onupdate={() => generateNoise(noise[0])}
		onrender={() => renderNoise(noise[0], imageData[0], paletteCyan)}
		style="width: 30%; height: 50%"
	></GraphicalEffect>

	<GraphicalEffect
		onresize={(_fx, width, height) => {
			console.log('resizeHandler', { width, height });
			imageData[1] = createOpaqueImageData(width, height);
			noise[1] = new Uint8Array(width * height);
		}}
		onupdate={() => generateNoise(noise[1])}
		onrender={() => renderNoise(noise[1], imageData[1])}
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
