<script lang="ts">
	import { fxHarness } from './fx-harness.svelte';

	let displayFrameTime = $state('0');
	let displayFps = $state('0');
	let dimensions = $state('0x0 (0x0)');

	let paused = $state(false);
	let infoHidden = $state(false);
	let standardSize = $state(false);
	let crtScanlines = $state(true);

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

	let imageData: ImageData | undefined;

	// Resize canvas to fill window
	function resizeHandler(canvas: HTMLCanvasElement) {
		// Pixel ratio based on NTSC 440x486 resolution stretched to 4:3 aspect ratio.
		const crtPixelAspectRatio = ((4 / 440) * 486) / 3;
		const factor = 0.5; // Canvas size relative to window.

		const canvasWidth = standardSize ? 800 : window.innerWidth;
		const canvasHeight = standardSize ? 500 : window.innerHeight;

		canvas.width = (factor * canvasWidth) / crtPixelAspectRatio;
		canvas.height = factor * canvasHeight;
		canvas.style.width = `${canvasWidth}px`;
		canvas.style.height = `${canvasHeight}px`;
		dimensions = `${canvasWidth}x${canvasHeight} (${canvas.width}x${canvas.height})`;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (!imageData || imageData.width !== canvas.width || imageData.height !== canvas.height) {
			imageData = ctx.createImageData(canvas.width, canvas.height);
			const data = imageData.data;
			const len = data.length;

			for (let i = 0; i < len; i += 4) {
				data[i + 3] = 255;
			}
		}

		imageData = generateNoise(imageData);
		ctx.putImageData(imageData, 0, 0);
	}

	const globalHandlers = {
		resize: (canvas: HTMLCanvasElement) => {
			return () => resizeHandler(canvas);
		},
		click: () => {
			return () => (paused = !paused);
		},
		keydown: (canvas: HTMLCanvasElement) => {
			return (e: Event) => {
				const event = e as KeyboardEvent;
				if (event.key === 'Enter') {
					// Check if we're in fullscreen mode
					if (document.fullscreenElement) {
						document.exitFullscreen();
						return;
					}
					// Otherwise enter fullscreen mode
					if (!canvas.parentElement) return;
					canvas.parentElement.requestFullscreen().catch((err) => {
						console.error(`Error enabling fullscreen: ${err.message}`);
					});
				}

				if (event.key === 'i') {
					infoHidden = !infoHidden;
				}

				if (event.key === 's') {
					standardSize = !standardSize;
					resizeHandler(canvas);
				}

				if (event.key === 'c') {
					crtScanlines = !crtScanlines;
				}
			};
		}
	};

	function updateHandler(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		if (ctx && imageData && !paused) {
			imageData = generateNoise(imageData);
			ctx.putImageData(imageData, 0, 0);
		}
	}

	function updateFpsDisplay(frameTime: number) {
		displayFrameTime = frameTime.toFixed(1);
		displayFps = (1000 / frameTime).toFixed(1);
	}
</script>

<main {@attach fxHarness({ updateFpsDisplay, updateHandler, resizeHandler, globalHandlers })}>
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
