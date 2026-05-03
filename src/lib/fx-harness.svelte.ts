import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';

export type FxState = {
	paused: boolean;
	infoHidden: boolean;
	standardSize: boolean;
	crtScanlines: boolean;
	active: boolean;
	displayFrameTime: string;
	displayFps: string;
	dimensions: string;
	imageData: ImageData;
	canvas: HTMLCanvasElement;
};

type FxHarnessOptions = {
	updateHandler: (fx: FxState) => void;
	resizeHandler?: (canvas: HTMLCanvasElement) => void;
	globalHandlers?: Record<string, (canvas: HTMLCanvasElement) => EventListener>;
};

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
		displayFrameTime: 'N',
		displayFps: 'N',
		dimensions: 'WxH (WxH)',
		imageData: null as unknown as ImageData,
		canvas: null as unknown as HTMLCanvasElement
	});

	function fxHarness({
		updateHandler,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		resizeHandler,
		globalHandlers
	}: FxHarnessOptions): Attachment {
		function internalUpdateHandler(fx: FxState) {
			updateHandler(fx);
			const ctx = fx.canvas.getContext('2d');
			if (ctx && fx.imageData && !fx.paused) {
				ctx.putImageData(fx.imageData, 0, 0);
			}
		}

		return (element) => {
			console.log('attaching');
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

				console.log(event.key);
				if (event.key === ' ') {
					fx.paused = !fx.paused;
				}
			}

			// Resize canvas to fill window
			function internalResizeHandler(fx: FxState) {
				// Pixel ratio based on NTSC 440x486 resolution stretched to 4:3 aspect ratio.
				const crtPixelAspectRatio = ((4 / 440) * 486) / 3;
				const factor = 0.5; // Canvas size relative to window.

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

				fx.canvas.width = (factor * canvasWidth) / crtPixelAspectRatio;
				fx.canvas.height = factor * canvasHeight;
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

				const ctx = fx.canvas.getContext('2d');

				if (
					ctx &&
					(!fx.imageData ||
						fx.imageData.width !== fx.canvas.width ||
						fx.imageData.height !== fx.canvas.height)
				) {
					fx.imageData = ctx?.createImageData(fx.canvas.width, fx.canvas.height);
					const data = fx.imageData.data;
					const len = data.length;

					for (let i = 0; i < len; i += 4) {
						data[i + 3] = 255;
					}
				}
				internalUpdateHandler(fx);

				if (ctx && fx.imageData) {
					ctx.putImageData(fx.imageData, 0, 0);
				}
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
				internalResizeHandler(fx);
			});

			const intervalIds = [
				setInterval(() => {
					if (
						!document.fullscreenElement ||
						document.fullscreenElement == fx.canvas.parentElement
					) {
						internalUpdateHandler(fx);
						updateFps();
					}
				}),

				setInterval(() => {
					fx.displayFrameTime = frameTime.toFixed(1);
					fx.displayFps = (1000 / frameTime).toFixed(1);
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
