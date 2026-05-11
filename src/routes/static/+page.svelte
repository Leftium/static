<script lang="ts">
	import { createOpaqueImageData, type FxState } from '$lib/fx-harness.svelte';
	import { generateNoiseUint8, renderNoisePalette } from '$lib/generateNoise';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';

	let imageData: ImageData;
	let noisePrev = new Uint8Array(0);
	let noiseNext = new Uint8Array(0);
</script>

<main>
	<GraphicalEffect
		oninit={(fx: FxState) => {
			//console.log('init', $state.snapshot(fx));
			fx.scalingFactor = 1 / 4;
			// Pixel ratio based on NTSC 440x486 resolution stretched to 4:3 aspect ratio.
			fx.pixelAspectRatio = ((4 / 440) * 486) / 3;
		}}
		onresize={(_fx, width, height) => {
			console.log('resizeHandler', { width, height });
			imageData = createOpaqueImageData(width, height);
			noisePrev = new Uint8Array(width * height);
			noiseNext = new Uint8Array(width * height);

			generateNoiseUint8(noisePrev);
			generateNoiseUint8(noiseNext);
		}}
		onupdate={(fx) => {
			[noisePrev, noiseNext] = [noiseNext, noisePrev];

			generateNoiseUint8(noiseNext);

			for (let j = 0; j < imageData.height; j++) {
				for (let i = 0; i < imageData.width; i++) {
					const gridX = Math.floor(i / (100 / fx.pixelAspectRatio)) % 2;
					const gridY = Math.floor(j / 100) % 2;

					if (gridX == 0 && gridY == 0 && Math.random() < 1) {
						const index = i + j * imageData.width;
						noiseNext[index] = noisePrev[index];
					}

					if (gridX == 1 && gridY == 1 && Math.random() < 0.8) {
						const index = i + j * imageData.width;
						noiseNext[index] = noisePrev[index];
					}
				}
			}
		}}
		onrender={() => renderNoisePalette(noisePrev, imageData)}
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
