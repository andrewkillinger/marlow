import { MATERIALS } from './materials.js';

export function substep(grid, dt) {
  // placeholder physics step to ensure module executes
  for (let y = 0; y < (grid.height || 0); y++) {
    for (let x = 0; x < (grid.width || 0); x++) {
      const cell = grid.get(x, y);
      if (!cell) continue;
      const mat = MATERIALS[cell.mat];
      if (mat && mat.state === 'granular' && grid.inBounds(x, y + 1) && !grid.get(x, y + 1)) {
        grid.swap(x, y, x, y + 1);
      }
    }
  }
}
