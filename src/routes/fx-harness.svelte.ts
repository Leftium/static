	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

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

	type FxHarnessOptions = {
        updateFpsDisplay: (frameTime: number) => void;
		updateHandler: (canvas: HTMLCanvasElement) => void;
		resizeHandler: (canvas: HTMLCanvasElement) => void;
		globalHandlers: Record<string, (canvas: HTMLCanvasElement) => EventListener>;
	};

	export function fxHarness({updateFpsDisplay, updateHandler, resizeHandler, globalHandlers }: FxHarnessOptions): Attachment {
		return (element) => {
			const canvas = document.createElement('canvas');
			element.appendChild(canvas);

			const abortController = new AbortController();
			const { signal } = abortController;

			for (const [eventName, makeHandler] of Object.entries(globalHandlers)) {
				window.addEventListener(eventName, makeHandler(canvas), { signal });
			}

			// Untrack to prevent this attachment from being run twice.
			untrack(() => {
				resizeHandler(canvas);
			});

			const intervalIds = [
				setInterval(() => {
					updateHandler(canvas);
					updateFps();
				}),

				setInterval(() => updateFpsDisplay(frameTime), 500)
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
