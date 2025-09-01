# Falling Sand Simulation

A small, dependency-free falling-sand style sandbox written in modern
JavaScript. The simulation runs entirely in the browser using a simple
cellular automata engine and the Canvas 2D API.

## Running

Open `index.html` in any modern desktop or mobile browser. No build step or
network access is required. The canvas size adapts to the window; reload the
page after resizing.

## Controls

* Select a material using the buttons.
* Click or touch the canvas to draw.
* **Pause** toggles the simulation.
* **Clear** removes all particles.

## Extensibility

The core logic lives in `src/simulation.js` with clearly separated update
functions for each element. New elements can be added by extending the element
enum in `src/elements.js`, providing a colour mapping, and implementing an
update function in `Simulation.step`.
