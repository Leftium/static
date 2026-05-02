<script lang="ts">
	import { onMount } from 'svelte';
	import { on } from 'svelte/events';

	// Frame counter based on: https://stackoverflow.com/a/5111475
	// The higher this value, the less the fps will reflect temporary variations
	// A value of 1 will only keep the last value
	let filterStrength = 10;

	let frameTime = $state(0);

	let lastLoop = performance.now();
	let thisLoop = lastLoop;

	function updateFps() {
		thisLoop = performance.now();
		let thisFrameTime = thisLoop - lastLoop;
		frameTime += (thisFrameTime - frameTime) / filterStrength;
		lastLoop = thisLoop;
	}

	let displayFrameTime = $state('0');
	let displayFps = $state('0');

	let canvas = $state<HTMLCanvasElement>();
	let main = $state<HTMLElement>();

	// Static effect based on: https://codepen.io/matthewhudson/pen/KOPxNv
	// Resize canvas to fill window
	function resize() {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	// Generate one frame of noise
	let w = 0;
	let h = 0;
	let imageData: ImageData;
	let data;
	let len: number;

	function generateNoise() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (w !== canvas.width || h !== canvas.height) {
			w = canvas.width;
			h = canvas.height;
			imageData = ctx.createImageData(w, h);
			data = imageData.data;
			len = data.length;

			for (let i = 0; i < len; i += 4) {
				data[i + 3] = 255;
			}
		}

		for (let i = 0; i < len; i += 4) {
			const v = Math.random() * 255;
			data[i] = data[i + 1] = data[i + 2] = v;
		}
		ctx.putImageData(imageData, 0, 0);
	}

	onMount(() => {
		on(window, 'keydown', (event) => {
			if (event.key === 'Enter') {
				// Check if we're in fullscreen mode
				if (document.fullscreenElement) {
					document.exitFullscreen();
					return;
				}
				// Otherwise enter fullscreen mode
				if (!main) return;
				main.requestFullscreen().catch((err) => {
					console.error(`Error enabling fullscreen: ${err.message}`);
				});
			}
		});

		on(window, 'resize', resize);

		resize();

		setInterval(() => {
			generateNoise();
			updateFps();
		});

		setInterval(() => {
			displayFrameTime = frameTime.toFixed(1);
			displayFps = (1000 / frameTime).toFixed(1);
		}, 500);
	});
</script>

<main bind:this={main}>
	<canvas bind:this={canvas}></canvas>

	<div class="info">
		{displayFps} FPS<br />
		{displayFrameTime}ms
	</div>
</main>

<style>
	:global(body, html) {
		height: 100%;
		margin: 0;
		overflow: hidden;
		background: #000;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.info {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		color: rgba(255, 255, 255, 0.8);
		font-family: monospace;
		font-size: clamp(12px, 2vw, 18px);
		letter-spacing: 0.4em;
		pointer-events: none;
		z-index: 20;
	}
</style>
