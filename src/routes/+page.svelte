<script lang="ts">
import { fx } from './fx-harness.svelte';
	import GraphicalEffect from './GraphicalEffect.svelte';

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

	function updateHandler() {
		fx.imageData = generateNoise(fx.imageData);
	}
</script>

<GraphicalEffect {updateHandler}></GraphicalEffect>
