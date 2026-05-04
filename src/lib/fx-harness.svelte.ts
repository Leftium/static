import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';

export type FxState = {
	paused: boolean;
	infoHidden: boolean;
	standardSize: boolean;
	crtScanlines: boolean;
	active: boolean;

	factor: number;

	dimensions: string;
	infoString: string;

	canvas: HTMLCanvasElement;
};

type FxHarnessOptions = {
	init?: (fx: FxState) => void;
	updateHandler: (fx: FxState) => ImageData;
	resizeHandler?: (fx: FxState, width: number, height: number) => void;
	globalHandlers?: Record<string, (canvas: HTMLCanvasElement) => EventListener>;
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

	let frameTime = $state(0);

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
		crtScanlines: true,
		active: false,

		factor: 1 / 2,

		dimensions: 'WxH (WxH)',
		infoString: 'info',

		canvas: null as unknown as HTMLCanvasElement
	});

	function fxHarness({
		init,
		updateHandler,
		resizeHandler,
		globalHandlers
	}: FxHarnessOptions): Attachment {
		function internalUpdateHandler(fx: FxState) {
			const ctx = fx.canvas.getContext('2d');
			if (ctx && !fx.paused) {
				ctx.putImageData(updateHandler(fx), 0, 0);
			}
		}

		return (element) => {
			//console.log('attaching');
			function internalKeydownHandler(fx: FxState, event: KeyboardEvent) {
				if (event.key === 'Enter') {
					// Check if we're in fullscreen mode
					if (document.fullscreenElement) {
						document.exitFullscreen();
						internalResizeHandler(fx);
						return;
					}
					// Otherwise enter fullscreen mode
					if (!fx.active || !fx.canvas.parentElement) return;
					fx.canvas.parentElement.requestFullscreen().catch((err) => {
						console.error(`Error enabling fullscreen: ${err.message}`);
					});
				}

				if (!fx.active) return;

				if (event.key === 'i') {
					fx.infoHidden = !fx.infoHidden;
				}

				if (event.key === 's') {
					fx.standardSize = !fx.standardSize;
					internalResizeHandler(fx);
				}

				if (event.key === 'c') {
					fx.crtScanlines = !fx.crtScanlines;
				}

				if (event.key === ' ') {
					fx.paused = !fx.paused;
				}
			}

			// Resize canvas to fill window
			function internalResizeHandler(fx: FxState) {
				// Pixel ratio based on NTSC 440x486 resolution stretched to 4:3 aspect ratio.
				const crtPixelAspectRatio = ((4 / 440) * 486) / 3;

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

				fx.canvas.width = (fx.factor * canvasWidth) / crtPixelAspectRatio;
				fx.canvas.height = fx.factor * canvasHeight;
				fx.canvas.style.width = `${canvasWidth}px`;
				fx.canvas.style.height = `${canvasHeight}px`;

				const container = fx.canvas.parentElement;
				if (container) {
					container.style.width = `${canvasWidth}px`;
					container.style.height = `${canvasHeight}px`;
				}

				fx.dimensions = `${canvasWidth}x${canvasHeight} (${fx.canvas.width}x${fx.canvas.height})`;

				/*
				console.log(
					`internalResizeHandler: ${canvasWidth}x${canvasHeight} (${fx.canvas.width}x${fx.canvas.height})`,
					fx.canvas
				);
				*/

				if (resizeHandler) {
					resizeHandler(fx, fx.canvas.width, fx.canvas.height);
				}

				internalUpdateHandler(fx);
			}

			const abortController = new AbortController();
			const { signal } = abortController;

			if (globalHandlers) {
				for (const [eventName, makeHandler] of Object.entries(globalHandlers)) {
					window.addEventListener(eventName, makeHandler(fx.canvas), { signal });
				}
			}

			window.addEventListener('keydown', (e) => internalKeydownHandler(fx, e), {
				signal
			});
			window.addEventListener('resize', () => internalResizeHandler(fx), { signal });
			element.addEventListener('resize', () => internalResizeHandler(fx), { signal });
			element.addEventListener(
				'click',
				() => {
					if (fx.active) {
						fx.paused = !fx.paused;
					}
				},
				{ signal }
			);

			element.addEventListener('mouseenter', () => (fx.active = true), { signal });
			element.addEventListener('mouseleave', () => (fx.active = false), { signal });

			// Untrack to prevent this attachment from being run twice.
			untrack(() => {
				if (init) {
					init(fx);
				}
				internalResizeHandler(fx);
			});

			const intervalIds = [
				setInterval(() => {
					if (
						!document.fullscreenElement ||
						document.fullscreenElement == fx.canvas.parentElement
					) {
						if (!fx.paused) {
							internalUpdateHandler(fx);
						}
						updateFps();
					}
				}),

				setInterval(() => {
					const fps = 1000 / frameTime;
					const fpsPercentage = (fps * 100) / 250;

					fx.infoString = `
						${fps.toFixed(0)} FPS (${fpsPercentage.toFixed(0)}%)
						${frameTime.toFixed(1)}ms
						${fx.dimensions}`;
				}, 500)
			];

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
