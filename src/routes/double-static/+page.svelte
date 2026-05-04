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

	function generateNoise2(imageData: ImageData) {
		const data = imageData.data;
		const len = data.length;
		for (let i = 0; i < len; i += 4) {
			const v = Math.random() * 255;
			data[i + 1] = data[i + 2] = v;
		}
		return imageData;
	}
</script>

<main>
	<GraphicalEffect
		updateHandler={(fx: FxState) => {
			generateNoise(fx.imageData);
		}}
		style="width: 30%; height: 50%"
	></GraphicalEffect>
	<GraphicalEffect
		init={(fx: FxState) => {
			//console.log('init', $state.snapshot(fx));
			fx.factor = 1;
		}}
		updateHandler={(fx: FxState) => {
			generateNoise2(fx.imageData);
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
