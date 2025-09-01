import { Simulation } from './simulation.js';
import { Element, COLORS } from './elements.js';

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');

const GRID_SIZE = window.innerWidth < 600 ? 150 : 200;
const sim = new Simulation(GRID_SIZE, GRID_SIZE);
canvas.width = GRID_SIZE;
canvas.height = GRID_SIZE;

// Make the canvas fill the window while preserving simulation resolution.
function resizeCanvas() {
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const imageData = ctx.createImageData(sim.width, sim.height);
const pixels = imageData.data;

let current = Element.Sand;
let paused = false;
const BRUSH_RADIUS = 1;

function render() {
  for (let i = 0; i < sim.size; i++) {
    const c = COLORS[sim.front[i]];
    const p = i * 4;
    pixels[p] = c[0];
    pixels[p + 1] = c[1];
    pixels[p + 2] = c[2];
    pixels[p + 3] = c[3];
  }
  ctx.putImageData(imageData, 0, 0);
}

function loop() {
  if (!paused) sim.step();
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function pointerPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((evt.clientX - rect.left) / rect.width) * sim.width);
  const y = Math.floor(((evt.clientY - rect.top) / rect.height) * sim.height);
  return { x, y };
}

function draw(evt) {
  const { x, y } = pointerPos(evt);
  for (let dx = -BRUSH_RADIUS; dx <= BRUSH_RADIUS; dx++) {
    for (let dy = -BRUSH_RADIUS; dy <= BRUSH_RADIUS; dy++) {
      const nx = x + dx;
      const ny = y + dy;
      if (!sim.inBounds(nx, ny)) continue;
      sim.set(nx, ny, current);
      if (current === Element.Fire) sim.setLife(nx, ny, 5);
      if (current === Element.Smoke) sim.setLife(nx, ny, 10);
    }
  }
}

let drawing = false;
canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  draw(e);
});
canvas.addEventListener('mousemove', (e) => drawing && draw(e));
window.addEventListener('mouseup', () => (drawing = false));

canvas.addEventListener('touchstart', (e) => {
  drawing = true;
  draw(e.touches[0]);
});
canvas.addEventListener('touchmove', (e) => {
  if (drawing) draw(e.touches[0]);
  e.preventDefault();
});
window.addEventListener('touchend', () => (drawing = false));

// UI controls
const tools = document.getElementById('tools');
for (const [name, elem] of [
  ['Sand', Element.Sand],
  ['Water', Element.Water],
  ['Wall', Element.Wall],
  ['Plant', Element.Plant],
  ['Oil', Element.Oil],
  ['Fire', Element.Fire],
  ['Erase', Element.Empty],
]) {
  const btn = document.createElement('button');
  btn.textContent = name;
  btn.addEventListener('click', () => {
    current = elem;
  });
  tools.appendChild(btn);
}

document.getElementById('pause').addEventListener('click', () => {
  paused = !paused;
});

document.getElementById('clear').addEventListener('click', () => {
  sim.clear();
});
