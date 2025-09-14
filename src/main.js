import { Simulation } from './simulation.js';
import { Element, COLORS } from './elements.js';

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const materials = document.getElementById('materials');
const materialBtn = document.getElementById('material-button');
const brushBtn = document.getElementById('brush');

const GRID_SIZE = window.innerWidth < 600 ? 150 : 200;
const sim = new Simulation(GRID_SIZE, GRID_SIZE);
canvas.width = GRID_SIZE;
canvas.height = GRID_SIZE;

// Make the canvas fill the available space while preserving simulation resolution.
function resizeCanvas() {
  const menuHeight = menu.offsetHeight;
  canvas.style.width = '100%';
  canvas.style.height = `${window.innerHeight - menuHeight}px`;
  materials.style.bottom = `${menuHeight + 10}px`;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const imageData = ctx.createImageData(sim.width, sim.height);
const pixels = imageData.data;

let current = Element.Sand;
const BRUSH_SIZES = [1, 2, 4, 8];
let brushIndex = 0;
let brushRadius = BRUSH_SIZES[brushIndex];

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
  sim.step();
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

function dropSeed(x, y) {
  for (let ny = y; ny >= 0; ny--) {
    if (sim.get(x, ny) === Element.Empty) {
      sim.set(x, ny, Element.Seed);
      break;
    }
  }
}

function draw(evt) {
  const { x, y } = pointerPos(evt);
  for (let dx = -brushRadius; dx <= brushRadius; dx++) {
    for (let dy = -brushRadius; dy <= brushRadius; dy++) {
      const nx = x + dx;
      const ny = y + dy;
      if (!sim.inBounds(nx, ny)) continue;
      if (current === Element.Seed) {
        dropSeed(nx, ny);
        continue;
      }
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

const materialDefs = [
  { name: 'Sand', elem: Element.Sand, emoji: '🟫' },
  { name: 'Water', elem: Element.Water, emoji: '💧' },
  { name: 'Wall', elem: Element.Wall, emoji: '🧱' },
  { name: 'Seed', elem: Element.Seed, emoji: '🌰' },
  { name: 'Oil', elem: Element.Oil, emoji: '🛢️' },
  { name: 'Fire', elem: Element.Fire, emoji: '🔥' },
  { name: 'Erase', elem: Element.Empty, emoji: '❌' },
];

for (const { name, elem, emoji } of materialDefs) {
  const btn = document.createElement('button');
  const color = COLORS[elem];
  btn.title = name;
  btn.textContent = emoji;
  btn.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  btn.addEventListener('click', () => {
    current = elem;
    materials.classList.add('hidden');
  });
  materials.appendChild(btn);
}

materialBtn.addEventListener('click', () => {
  materials.classList.toggle('hidden');
});

brushBtn.addEventListener('click', () => {
  brushIndex = (brushIndex + 1) % BRUSH_SIZES.length;
  brushRadius = BRUSH_SIZES[brushIndex];
  brushBtn.textContent = `Brush: ${brushRadius}`;
});

document.getElementById('clear').addEventListener('click', () => {
  sim.clear();
});
