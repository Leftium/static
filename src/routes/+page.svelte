<script lang="ts">
	import { fxHarness, fx } from './fx-harness.svelte';

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

<main {@attach fxHarness({ updateHandler })}>
	<div class="crt-overlay" hidden={!fx.crtScanlines}></div>

	<div class="info" hidden={fx.infoHidden}>
		<div>{fx.displayFps} FPS</div>
		<div>{fx.displayFrameTime}ms</div>
		<div>{fx.dimensions}</div>
		<div>{fx.paused}</div>
	</div>
</main>

<style>
	:global(body, html) {
		height: 100%;
		margin: 0;
		overflow: hidden;
		background: #ccc;
	}

	main {
		display: flex;
		height: 100%;
		justify-content: center;
		align-items: center;
	}

	/* CRT scanlines */
	.crt-overlay {
		position: fixed;
		inset: 0;
		background: repeating-linear-gradient(
			to bottom,
			transparent 0px,
			transparent 2px,
			rgba(0, 0, 0, 0.12) 2px,
			rgba(0, 0, 0, 0.12) 4px
		);
		z-index: 10;
		pointer-events: none;
	}

	.info {
		position: fixed;
		bottom: 24px;
		left: 24px;
		color: rgba(255, 255, 255, 0.8);
		font-family: monospace;
		font-size: clamp(12px, 2vw, 18px);
		pointer-events: none;
		z-index: 20;
	}
</style>
