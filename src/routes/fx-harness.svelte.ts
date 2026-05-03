import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';

type FxHarnessOptions = {
	updateHandler: (canvas: HTMLCanvasElement) => void;
	resizeHandler?: (canvas: HTMLCanvasElement) => void;
	globalHandlers?: Record<string, (canvas: HTMLCanvasElement) => EventListener>;
};

type FxState = {
	paused: boolean;
	infoHidden: boolean;
	standardSize: boolean;
	crtScanlines: boolean;
	displayFrameTime: string;
	displayFps: string;
	dimensions: string;
	imageData: ImageData;
};

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

const paused = $state(false);
const infoHidden = $state(false);
const standardSize = $state(false);
const crtScanlines = $state(true);

export const fx = $state<FxState>({
	paused,
	infoHidden,
	standardSize,
	crtScanlines,
	displayFrameTime: 'N',
	displayFps: 'N',
	dimensions: 'WxH (WxH)',
	imageData: null as unknown as ImageData
});

export function fxHarness({
	updateHandler,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	resizeHandler,
	globalHandlers
}: FxHarnessOptions): Attachment {
	function internalUpdateHandler(canvas: HTMLCanvasElement) {
		updateHandler(canvas);
		const ctx = canvas.getContext('2d');
		if (ctx && fx.imageData && !fx.paused) {
			ctx.putImageData(fx.imageData, 0, 0);
		}
	}

	// Resize canvas to fill window
	function internalResizeHandler(canvas: HTMLCanvasElement) {
		// Pixel ratio based on NTSC 440x486 resolution stretched to 4:3 aspect ratio.
		const crtPixelAspectRatio = ((4 / 440) * 486) / 3;
		const factor = 0.5; // Canvas size relative to window.

		const canvasWidth = fx.standardSize ? 800 : window.innerWidth;
		const canvasHeight = fx.standardSize ? 500 : window.innerHeight;

		canvas.width = (factor * canvasWidth) / crtPixelAspectRatio;
		canvas.height = factor * canvasHeight;
		canvas.style.width = `${canvasWidth}px`;
		canvas.style.height = `${canvasHeight}px`;
		fx.dimensions = `${canvasWidth}x${canvasHeight} (${canvas.width}x${canvas.height})`;

		if (
			!fx.imageData ||
			fx.imageData.width !== canvas.width ||
			fx.imageData.height !== canvas.height
		) {
			fx.imageData = new ImageData(canvas.width, canvas.height);
			const data = fx.imageData.data;
			const len = data.length;

			for (let i = 0; i < len; i += 4) {
				data[i + 3] = 255;
			}
		}
		updateHandler(canvas);

		const ctx = canvas.getContext('2d');
		if (ctx && fx.imageData) {
			ctx.putImageData(fx.imageData, 0, 0);
		}
	}

	function internalKeydownHandler(canvas: HTMLCanvasElement, event: KeyboardEvent) {
		console.log('internalKeydownHandler');
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
			fx.infoHidden = !fx.infoHidden;
		}

		if (event.key === 's') {
			fx.standardSize = !fx.standardSize;
			internalResizeHandler(canvas);
		}

		if (event.key === 'c') {
			fx.crtScanlines = !fx.crtScanlines;
		}
	}

	return (element) => {
		const canvas = document.createElement('canvas');
		element.appendChild(canvas);

		const abortController = new AbortController();
		const { signal } = abortController;

		if (globalHandlers) {
			for (const [eventName, makeHandler] of Object.entries(globalHandlers)) {
				window.addEventListener(eventName, makeHandler(canvas), { signal });
			}
		}

		window.addEventListener('resize', () => internalResizeHandler(canvas), { signal });
		window.addEventListener('click', () => (fx.paused = !fx.paused), { signal });
		window.addEventListener('keydown', (e) => internalKeydownHandler(canvas, e), { signal });

		// Untrack to prevent this attachment from being run twice.
		untrack(() => {
			internalResizeHandler(canvas);
		});

		const intervalIds = [
			setInterval(() => {
				internalUpdateHandler(canvas);
				updateFps();
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
