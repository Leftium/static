<script lang="ts">
	import { makeFxHarness } from './fx-harness.svelte';

	const { fx, fxHarness } = makeFxHarness();

	const { updateHandler, style } = $props();
</script>

<graphical-effect
	{@attach fxHarness({ updateHandler })}
	style={Object.entries(style)
		.map(([k, v]) => `${k}:${v}`)
		.join(';')}
>
	<div>
		<canvas bind:this={fx.canvas}></canvas>
		<div class="crt-overlay" hidden={!fx.crtScanlines}></div>
		<div class="info" hidden={fx.infoHidden}>
			<div>{fx.displayFps} FPS</div>
			<div>{fx.displayFrameTime}ms</div>
			<div>{fx.dimensions}</div>
			<div>{fx.paused} {fx.active}</div>
		</div>
	</div>
</graphical-effect>

<style>
	graphical-effect,
	graphical-effect > div {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	/* CRT scanlines */
	.crt-overlay {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			to bottom,
			transparent 0px,
			transparent 2px,
			rgba(0, 0, 0, 0.12) 2px,
			rgba(0, 0, 0, 0.12) 4px
		);
		z-index: 10;
		pointer-events: none;
	}

	.info {
		position: absolute;
		bottom: 24px;
		left: 24px;
		color: rgba(255, 255, 255, 0.8);
		font-family: monospace;
		font-size: clamp(12px, 2vw, 18px);
		pointer-events: none;
		z-index: 20;
	}
</style>
