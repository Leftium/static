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

	let dimensions = $state('0x0 (0x0)')

	let canvas = $state<HTMLCanvasElement>();
	let main = $state<HTMLElement>();

	// Static effect based on: https://codepen.io/matthewhudson/pen/KOPxNv
	// Resize canvas to fill window
	function resize() {
		if (!canvas) return;

		// Pixel ratio based on NTSC 440x486 resolution stretched to 4:3 aspect ratio.
		const crtPixelAspectRatio = ((4 / 440) * 486) / 3;
		const factor = 0.5; // Canvas size relative to window.

		canvas.width = (factor * window.innerWidth) / crtPixelAspectRatio;
		canvas.height = factor * window.innerHeight;

		dimensions = `${window.innerWidth}x${window.innerHeight} (${canvas.width}x${canvas.height})`
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

	let paused = $state(false);
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

		on(window, 'click', () => {
			paused = !paused;
		});

		on(window, 'resize', resize);

		resize();

		setInterval(() => {
			if (!paused) {
				generateNoise();
			}
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

	<div class="crt-overlay"></div>

	<div class="info">
		<div>{displayFps} FPS</div>
		<div>{displayFrameTime}ms</div>
		<div>{dimensions}</div>
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

	/* CRT scanlines */
	.crt-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		background: repeating-linear-gradient(
			to bottom,
			transparent 0px,
			transparent 2px,
			rgba(0, 0, 0, 0.12) 2px,
			rgba(0, 0, 0, 0.12) 4px
		);
		z-index: 10;
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
