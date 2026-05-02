<script lang="ts">
	import { onMount } from 'svelte';

	// Based on: https://stackoverflow.com/a/5111475
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

    onMount(() => {
		setInterval(() => {
			updateFps();
		});

		setInterval(() => {
			displayFrameTime = frameTime.toFixed(3);
			displayFps = (1000 / frameTime).toFixed(1);
		}, 500);
	});
</script>

{displayFps} FPS<br />
{displayFrameTime} ms
