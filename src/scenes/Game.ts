import Phaser from "phaser";
import { SUBSTEPS, RENDER_SCALE, CELL_PX } from "../sim/materials";
import { substep } from "../sim/physicsRules";
import { createGrid } from "../sim/grid"; // your grid impl

export default class Game extends Phaser.Scene {
  private grid = createGrid(/* width, height */);

  create() {
    // Remove CRT overlay if you had one; keep crisp pixels:
    this.cameras.main.setZoom(RENDER_SCALE);
    this.game.canvas.style.imageRendering = "pixelated";
    this.game.canvas.style.imageRendering = "crisp-edges";
    // Ensure no auto-spawn: start with an empty stable world.
  }

  update(time: number, deltaMs: number) {
    const dt = Math.min(1/60, deltaMs/1000);
    const step = dt / SUBSTEPS;
    for (let i=0; i<SUBSTEPS; i++) substep(this.grid, step);

    // your draw pass here: iterate grid and blit 2×2 px quads per cell
  }
}
