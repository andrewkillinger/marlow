import { Element, FLAMMABLE } from './elements.js';

/**
 * Core cellular automata engine. Holds the grid and applies
 * element rules on each simulation step. Uses a double buffer
 * to ensure that particles move at most one cell per tick.
 */
export class Simulation {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.size = width * height;
    this.front = new Uint8Array(this.size);
    this.back = new Uint8Array(this.size);
    this.lifeFront = new Uint8Array(this.size); // generic lifetime buffer
    this.lifeBack = new Uint8Array(this.size);
    this.tick = 0;
  }

  index(x, y) {
    return x + y * this.width;
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  get(x, y) {
    return this.front[this.index(x, y)];
  }

  set(x, y, elem) {
    this.front[this.index(x, y)] = elem;
  }

  setLife(x, y, val) {
    this.lifeFront[this.index(x, y)] = val;
  }

  clear() {
    this.front.fill(Element.Empty);
    this.lifeFront.fill(0);
  }

  /** Advance the world by one tick. */
  step() {
    const w = this.width,
      h = this.height,
      front = this.front,
      back = this.back,
      lifeF = this.lifeFront,
      lifeB = this.lifeBack;

    back.set(front);
    lifeB.set(lifeF);

    const rnd = Math.random;
    const yStart = this.tick % 2 === 0 ? 0 : h - 1;
    const yEnd = this.tick % 2 === 0 ? h : -1;
    const yStep = this.tick % 2 === 0 ? 1 : -1;

    const move = (from, to, type, life = 0) => {
      back[to] = type;
      lifeB[to] = life;
      back[from] = Element.Empty;
      lifeB[from] = 0;
    };

    const updateSand = (x, y, idx) => {
      if (y + 1 >= h) return; // bottom edge
      const below = idx + w;
      if (front[below] === Element.Empty) {
        move(idx, below, Element.Sand);
        return;
      }
      const dir = rnd() < 0.5 ? -1 : 1;
      const nx = x + dir;
      if (nx < 0 || nx >= w) return;
      const diag = below + dir;
      if (front[diag] === Element.Empty) {
        move(idx, diag, Element.Sand);
      }
    };

    const trySpread = (x, y, targets, type, life = 0) => {
      if (targets.length === 0) return false;
      const pick = targets[(Math.random() * targets.length) | 0];
      move(this.index(x, y), pick, type, life);
      return true;
    };

    const updateWater = (x, y, idx) => {
      if (y + 1 < h && front[idx + w] === Element.Empty) {
        move(idx, idx + w, Element.Water);
        return;
      }
      const dirs = rnd() < 0.5 ? [-1, 1] : [1, -1];
      for (const d of dirs) {
        const nx = x + d;
        if (nx < 0 || nx >= w) continue;
        const downDiag = idx + w + d;
        if (y + 1 < h && front[downDiag] === Element.Empty) {
          move(idx, downDiag, Element.Water);
          return;
        }
      }
      for (const d of dirs) {
        const nx = x + d;
        if (nx < 0 || nx >= w) continue;
        const n = idx + d;
        if (front[n] === Element.Empty && rnd() < 0.5) {
          move(idx, n, Element.Water);
          return;
        }
      }
    };

    const updateOil = (x, y, idx) => {
      // behaves like heavy water but flammable
      updateWater(x, y, idx);
      // if near fire, ignite
      const offsets = [-1, 1, -w, w];
      for (const off of offsets) {
        const n = idx + off;
        if (n < 0 || n >= front.length) continue;
        if (front[n] === Element.Fire) {
          back[idx] = Element.Fire;
          lifeB[idx] = 5;
          return;
        }
      }
    };

    const updateFire = (x, y, idx) => {
      const life = lifeF[idx];
      // water extinguishes fire
      const offsets = [-1, 1, -w, w];
      for (const off of offsets) {
        const n = idx + off;
        if (n < 0 || n >= front.length) continue;
        const t = front[n];
        if (t === Element.Water) {
          back[idx] = Element.Smoke;
          lifeB[idx] = 5;
          return;
        }
        if (FLAMMABLE.has(t)) {
          back[n] = Element.Fire;
          lifeB[n] = 5;
        }
      }
      if (Math.random() < 0.3 && y > 0 && front[idx - w] === Element.Empty) {
        back[idx - w] = Element.Spark;
        lifeB[idx - w] = 3;
      }
      if (life <= 0) {
        back[idx] = Element.Smoke;
        lifeB[idx] = 5;
      } else {
        lifeB[idx] = life - 1;
      }
    };

    const seedBelow = (x, y, idx, chance) => {
      if (y + 1 < h && front[idx + w] === Element.Empty && rnd() < chance) {
        back[idx + w] = Element.Seed;
      }
    };

    const burnCheck = (idx) => {
      const offsets = [-1, 1, -w, w];
      for (const off of offsets) {
        const n = idx + off;
        if (n < 0 || n >= front.length) continue;
        if (front[n] === Element.Fire) {
          back[idx] = Element.Fire;
          lifeB[idx] = 5;
          return true;
        }
      }
      return false;
    };

    const updatePlant = (x, y, idx) => {
      if (burnCheck(idx)) return;
      const life = lifeF[idx];
      if (life > 0 && y > 0 && front[idx - w] === Element.Empty) {
        back[idx - w] = Element.Plant;
        lifeB[idx - w] = life - 1;
      } else {
        seedBelow(x, y, idx, 0.01);
      }
    };

    const updateFlower = (x, y, idx) => {
      if (burnCheck(idx)) return;
      seedBelow(x, y, idx, 0.005);
    };

    const updateTree = (x, y, idx) => {
      if (burnCheck(idx)) return;
      const life = lifeF[idx];
      if (life > 0 && y > 0 && front[idx - w] === Element.Empty) {
        back[idx - w] = Element.Tree;
        lifeB[idx - w] = life - 1;
      } else {
        lifeB[idx] = life;
        seedBelow(x, y, idx, 0.02);
      }
    };

    const updateSeed = (x, y, idx) => {
      // fall like sand
      if (y + 1 < h) {
        const below = idx + w;
        if (front[below] === Element.Empty) {
          move(idx, below, Element.Seed);
          return;
        }
        const dir = rnd() < 0.5 ? -1 : 1;
        const nx = x + dir;
        if (nx >= 0 && nx < w) {
          const diag = below + dir;
          if (front[diag] === Element.Empty) {
            move(idx, diag, Element.Seed);
            return;
          }
        }
      }
      // sprout where it lands
      const roll = rnd();
      if (roll < 0.01) {
        back[idx] = Element.Tree;
        lifeB[idx] = 5;
      } else if (roll < 0.2) {
        back[idx] = Element.Plant;
        if (y > 0 && front[idx - w] === Element.Empty) {
          back[idx - w] = Element.Flower;
        }
      } else {
        back[idx] = Element.Plant;
        lifeB[idx] = 1 + (rnd() * 2) | 0;
      }
    };

    const updateSmoke = (x, y, idx) => {
      const life = lifeF[idx];
      if (life <= 0) {
        back[idx] = Element.Empty;
        lifeB[idx] = 0;
        return;
      }
      if (y > 0 && front[idx - w] === Element.Empty) {
        move(idx, idx - w, Element.Smoke, life - 1);
        return;
      }
      const dir = rnd() < 0.5 ? -1 : 1;
      const nx = x + dir;
      if (nx >= 0 && nx < w && y > 0) {
        const diag = idx - w + dir;
        if (front[diag] === Element.Empty) {
          move(idx, diag, Element.Smoke, life - 1);
          return;
        }
      }
      lifeB[idx] = life - 1;
    };

    const updateSpark = (x, y, idx) => {
      const life = lifeF[idx];
      if (life <= 0) {
        back[idx] = Element.Smoke;
        lifeB[idx] = 3;
        return;
      }
      const dir = rnd() < 0.5 ? -1 : 1;
      const nx = x + dir;
      const up = idx - w;
      const diag = up + dir;
      if (y > 0 && nx >= 0 && nx < w && front[diag] === Element.Empty) {
        move(idx, diag, Element.Spark, life - 1);
      } else if (y > 0 && front[up] === Element.Empty) {
        move(idx, up, Element.Spark, life - 1);
      } else {
        lifeB[idx] = life - 1;
      }
    };

    for (let y = yStart; y !== yEnd; y += yStep) {
      for (let x = 0; x < w; x++) {
        const idx = x + y * w;
        const t = front[idx];
        switch (t) {
          case Element.Sand:
            updateSand(x, y, idx);
            break;
          case Element.Water:
            updateWater(x, y, idx);
            break;
          case Element.Fire:
            updateFire(x, y, idx);
            break;
          case Element.Plant:
            updatePlant(x, y, idx);
            break;
          case Element.Flower:
            updateFlower(x, y, idx);
            break;
          case Element.Tree:
            updateTree(x, y, idx);
            break;
          case Element.Seed:
            updateSeed(x, y, idx);
            break;
          case Element.Smoke:
            updateSmoke(x, y, idx);
            break;
          case Element.Spark:
            updateSpark(x, y, idx);
            break;
          case Element.Oil:
            updateOil(x, y, idx);
            break;
        }
      }
    }

    this.front = back;
    this.back = front;
    this.lifeFront = lifeB;
    this.lifeBack = lifeF;
    this.tick++;
    // TODO: update NPCs or AI-driven entities here in future expansions.
  }
}
