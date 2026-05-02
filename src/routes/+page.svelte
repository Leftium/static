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

	let dimensions = $state('0x0 (0x0)');

	let main = $state<HTMLElement>();
	let canvas = $state<HTMLCanvasElement>();
	
	let canvasWidth = $state(0)
	let canvasHeight = $state(0)

	let paused = $state(false);
	let infoHidden = $state(false);
	let standardSize = $state(false);
	let crtScanlines = $state(true)

	// Static effect based on: https://codepen.io/matthewhudson/pen/KOPxNv
	// Resize canvas to fill window
	function resize() {
		if (!canvas) return;

		// Pixel ratio based on NTSC 440x486 resolution stretched to 4:3 aspect ratio.
		const crtPixelAspectRatio = ((4 / 440) * 486) / 3;
		const factor = 0.5; // Canvas size relative to window.

		canvasWidth = standardSize ? 800 : window.innerWidth;
		canvasHeight = standardSize ? 500 : window.innerHeight;

		canvas.width = (factor * canvasWidth) / crtPixelAspectRatio;
		canvas.height = factor * canvasHeight;
		dimensions = `${canvasWidth}x${canvasHeight} (${canvas.width}x${canvas.height})`;

		generateNoise()
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

			if (event.key === 'i') {
				infoHidden = !infoHidden;
			}

			if (event.key === 's') {
				standardSize = !standardSize;
				resize();
			}

			if (event.key === 'c') {
				crtScanlines = !crtScanlines
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
	<canvas
		bind:this={canvas}
		style:width={canvasWidth + 'px'}
		style:height={canvasHeight + 'px'}
	></canvas>

	<div class="crt-overlay" hidden={!crtScanlines}></div>

	<div class="info" hidden={infoHidden}>
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
		background: #ccc;
	}

	main {
		display: flex;
		height: 100%;
		justify-content: center;
		align-items: center;
	}

	canvas {
		display: block;
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
		left: 24px;
		color: rgba(255, 255, 255, 0.8);
		font-family: monospace;
		font-size: clamp(12px, 2vw, 18px);
		pointer-events: none;
		z-index: 20;
	}
</style>
