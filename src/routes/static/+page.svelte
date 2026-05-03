<script lang="ts">
	import type { FxState } from '$lib/fx-harness.svelte';
	import GraphicalEffect from '$lib/GraphicalEffect.svelte';

	// Static effect based on: https://codepen.io/matthewhudson/pen/KOPxNv
	// Generate one frame of noise
	function generateNoise(imageData: ImageData) {
		const data = imageData.data;
		const len = data.length;
		for (let i = 0; i < len; i += 4) {
			const v = Math.random() * 255;
			data[i] = data[i + 1] = data[i + 2] = v;
		}
		return imageData;
	}
</script>

<main>
	<GraphicalEffect
		updateHandler={(fx: FxState) => {
			generateNoise(fx.imageData);
		}}
		style={{ width: '100%', height: '100%' }}
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
