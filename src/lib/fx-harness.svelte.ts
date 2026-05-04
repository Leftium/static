import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';

export type FxState = {
	paused: boolean;
	infoHidden: boolean;
	standardSize: boolean;
	active: boolean;
	crtScanlines: boolean;

	scalingFactor: number;
	pixelAspectRatio: number;

	dimensions: string;
	infoString: string;
};

type FxHarnessOptions = {
	initHandler?: (fx: FxState) => void;
	updateHandler?: (fx: FxState) => void;
	renderHandler: (fx: FxState) => ImageData;
	resizeHandler?: (fx: FxState, width: number, height: number) => void;
};

export function createOpaqueImageData(width: number, height: number) {
	const imageData = new ImageData(width, height);
	const data = imageData.data;

	for (let i = 3; i < data.length; i += 4) {
		data[i] = 255; // A
	}
	return imageData;
}

export function makeFxHarness() {
	// Frame counter based on: https://stackoverflow.com/a/5111475
	// The higher this value, the less the fps will reflect temporary variations
	// A value of 1 will only keep the last value
	const filterStrength = 10;

	let frameTime = $state(2222);

	let lastLoop = performance.now();
	let thisLoop = lastLoop;

	function updateFps() {
		thisLoop = performance.now();
		const thisFrameTime = thisLoop - lastLoop;
		frameTime += (thisFrameTime - frameTime) / filterStrength;
		lastLoop = thisLoop;
	}

	const fx = $state<FxState>({
		paused: false,
		infoHidden: false,
		standardSize: false,
		active: false,
		crtScanlines: true,

		scalingFactor: 1,
		pixelAspectRatio: 1,

		dimensions: 'WxH (WxH)',
		infoString: 'info'
	});

	function fxHarness({
		initHandler,
		updateHandler,
		renderHandler,
		resizeHandler
	}: FxHarnessOptions): Attachment {
		return (element) => {
			console.log('attaching');

			const canvas = document.createElement('canvas');
			const container = element.getElementsByTagName('wrap-effect')[0] as HTMLElement;
			container.appendChild(canvas);

			const context = canvas.getContext('2d');
			function internalRender(fx: FxState) {
				if (context) {
					context.putImageData(renderHandler(fx), 0, 0);
				}
			}

			function internalKeydown(fx: FxState, event: KeyboardEvent) {
				if (event.key === 'Enter') {
					// Check if we're in fullscreen mode
					if (document.fullscreenElement) {
						document.exitFullscreen();
						internalResize(fx);
					} else if (fx.active) {
						// Otherwise enter fullscreen mode
						container.requestFullscreen().catch((err) => {
							console.error(`Error enabling fullscreen: ${err.message}`);
						});
					}
				}

				if (!fx.active) return;

				if (event.key === 'i') {
					fx.infoHidden = !fx.infoHidden;
				}

				if (event.key === 's') {
					fx.standardSize = !fx.standardSize;
					internalResize(fx);
				}

				if (event.key === 'c') {
					fx.crtScanlines = !fx.crtScanlines;
				}

				if (event.key === ' ') {
					fx.paused = !fx.paused;
				}
			}

			function internalClick(fx: FxState) {
				if (fx.active) {
					fx.paused = !fx.paused;
				}
			}

			// Resize canvas as needed.
			function internalResize(fx: FxState) {
				const canvasWidth = fx.standardSize
					? 800
					: document.fullscreenElement
						? window.innerWidth
						: element.clientWidth;
				const canvasHeight = fx.standardSize
					? 500
					: document.fullscreenElement
						? window.innerHeight
						: element.clientHeight;

				canvas.width = (fx.scalingFactor * canvasWidth) / fx.pixelAspectRatio;
				canvas.height = fx.scalingFactor * canvasHeight;
				canvas.style.width = `${canvasWidth}px`;
				canvas.style.height = `${canvasHeight}px`;

				container.style.width = `${canvasWidth}px`;
				container.style.height = `${canvasHeight}px`;

				fx.dimensions = `${canvasWidth}x${canvasHeight} (${canvas.width}x${canvas.height})`;

				/*
				console.log(
					`internalResizeHandler: ${canvasWidth}x${canvasHeight} (${fx.canvas.width}x${fx.canvas.height})`,
					fx.canvas
				);
				*/

				if (resizeHandler) {
					resizeHandler(fx, canvas.width, canvas.height);
				}
				internalUpdate(fx);
				internalRender(fx);
			}

			function internalUpdate(fx: FxState) {
				if (updateHandler) {
					updateHandler(fx);
				}
			}

			// Untrack to prevent this attachment from being run twice.
			untrack(() => {
				if (initHandler) {
					initHandler(fx);
				}
				internalResize(fx);
			});

			function renderInfo() {
				const fps = 1000 / frameTime;
				const fpsPercentage = (fps * 100) / 250;

				fx.infoString = `
					${fps.toFixed(0)} FPS (${fpsPercentage.toFixed(0)}%)
					${frameTime === 2222 ? '0' : frameTime.toFixed(1)}ms
					${fx.dimensions}`;
			}
			setTimeout(renderInfo);

			const intervalIds = [
				setInterval(() => {
					if (!document.fullscreenElement || document.fullscreenElement == container) {
						if (!fx.paused) {
							internalUpdate(fx);
							internalRender(fx);
						}
						updateFps();
					}
				}),

				setInterval(renderInfo, 500)
			];

			const abortController = new AbortController();
			const { signal } = abortController;

			window.addEventListener('keydown', (e) => internalKeydown(fx, e), { signal });
			window.addEventListener('resize', () => internalResize(fx), { signal });

			element.addEventListener('resize', () => internalResize(fx), { signal });
			element.addEventListener('click', () => internalClick(fx), { signal });

			element.addEventListener('mouseenter', () => (fx.active = true), { signal });
			element.addEventListener('mouseleave', () => (fx.active = false), { signal });

			return () => {
				// Clean up
				abortController.abort();
				for (const intervalId of intervalIds) {
					clearInterval(intervalId);
				}
			};
		};
	}

	return {
		fx,
		fxHarness
	};
}
