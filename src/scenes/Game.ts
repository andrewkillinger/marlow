import Phaser from "phaser";
import { SUBSTEPS, RENDER_SCALE } from "../sim/materials";
import { substep } from "../sim/physicsRules";

export default class Game extends Phaser.Scene {
  // TODO: provide grid implementation when available
  private grid: any;

  create() {
    // Remove CRT overlay if you had one; keep crisp pixels:
    this.cameras.main.setZoom(RENDER_SCALE);
    this.game.canvas.style.imageRendering = "pixelated";
    this.game.canvas.style.imageRendering = "crisp-edges";
    // Ensure no auto-spawn: start with an empty stable world.
  }

  update(time: number, deltaMs: number) {
    if (!this.grid) return; // grid not yet implemented
    const dt = Math.min(1/60, deltaMs/1000);
    const step = dt / SUBSTEPS;
    for (let i=0; i<SUBSTEPS; i++) substep(this.grid, step);

    // your draw pass here: iterate grid and blit 2×2 px quads per cell
  }
}
