const canvas = document.getElementById("topo");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

const config = {
	layerCount: 54,
	lineStep: 14,
	pointStep: 14,
	speed: 0.00085,
	ampBase: 11,
	ampWave: 39
};

function resize() {
	dpr = Math.min(window.devicePixelRatio || 1, 2);
	width = window.innerWidth;
	height = window.innerHeight;
	canvas.width = Math.floor(width * dpr);
	canvas.height = Math.floor(height * dpr);
	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function noise(x, y, t) {
	const n1 = Math.sin(x * 0.012 + t * 0.91);
	const n2 = Math.cos(y * 0.011 - t * 0.72);
	const n3 = Math.sin((x + y) * 0.006 + t * 1.13);
	const n4 = Math.cos((x - y) * 0.004 - t * 0.55);
	return (n1 + n2 + n3 + n4) * 0.25;
}

function drawBackground(time) {
	const pulse = 0.5 + 0.5 * Math.sin(time * 0.35);
	const gradient = ctx.createLinearGradient(0, 0, width, height);
	gradient.addColorStop(0, `rgba(${34 + pulse * 15}, 3, 5, 1)`);
	gradient.addColorStop(0.5, `rgba(${70 + pulse * 22}, 8, 12, 1)`);
	gradient.addColorStop(1, "rgba(25, 3, 6, 1)");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);
}

function drawLayer(layerIndex, time) {
	const yBase = layerIndex * config.lineStep + 8;
	const depth = layerIndex / config.layerCount;
	const amp = config.ampBase + (1 - Math.abs(0.5 - depth) * 2) * config.ampWave;

	const alpha = 0.14 + depth * 0.55;
	const glowAlpha = alpha * 0.35;

	ctx.beginPath();
	for (let x = -config.pointStep; x <= width + config.pointStep; x += config.pointStep) {
		const t = time * config.speed;
		const offset = noise(x + layerIndex * 37, yBase * 2.2, t + layerIndex * 0.027) * amp;
		const ridge = Math.sin(x * 0.005 + t * 2.3 + layerIndex * 0.18) * (amp * 0.28);
		const y = yBase + offset + ridge;

		if (x === -config.pointStep) {
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
		}
	}

	ctx.lineWidth = 1.15;
	ctx.strokeStyle = `rgba(255, ${90 + layerIndex * 2}, ${96 + layerIndex * 2}, ${alpha})`;
	ctx.stroke();

	ctx.strokeStyle = `rgba(255, 202, 206, ${glowAlpha})`;
	ctx.lineWidth = 2.6;
	ctx.stroke();
}

function render(ms) {
	drawBackground(ms * 0.001);

	for (let i = 0; i < config.layerCount; i += 1) {
		drawLayer(i, ms);
	}

	requestAnimationFrame(render);
}

window.addEventListener("resize", resize);

resize();
requestAnimationFrame(render);
