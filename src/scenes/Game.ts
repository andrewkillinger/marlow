import Phaser from "phaser";
import { SUBSTEPS } from "../sim/materials";
import { RENDER_SCALE } from "../sim/constants";
import { substep } from "../sim/physicsRules";

// Phase 0 done when:
// - No CRT/scanline/vhs overlay remains.
// - Game starts with an empty, stable world (no bouncing/auto-spawn).
// - Art is sharp with nearest-neighbor scaling; no shimmer; 2-px cell scale; camera zoom = 3x.

export default class Game extends Phaser.Scene {
  // TODO: provide grid implementation when available
  private grid: any;

  create() {
    this.cameras.main.setZoom(RENDER_SCALE);
    this.cameras.main.setRoundPixels(true);
    this.game.canvas.style.imageRendering = 'pixelated';
    (this.game.canvas.style as any).imageRendering = 'crisp-edges';

    this.textures.once(Phaser.Textures.Events.READY, () => {
      Object.values(this.textures.list).forEach((tex: any) => {
        tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
      });
    });
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
