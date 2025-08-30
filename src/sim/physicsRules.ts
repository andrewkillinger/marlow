import { MATERIALS, MaterialKey, GRAVITY_PX } from "./materials";

// Core, deterministic cell-step rules for each substep.
// Assumes a grid-based world with get/set helpers and integer cell coords.

export interface Cell {
  mat: MaterialKey;
  temp: number;
  vx: number; // optional per-cell drift (for gases/liquids)
  vy: number;
  // moisture flag could be added to boost SAND/DRT cohesion when wet
}

export interface Grid {
  width: number; height: number;
  get(x: number, y: number): Cell | null;
  set(x: number, y: number, c: Cell | null): void;
  swap(ax: number, ay: number, bx: number, by: number): void;
  inBounds(x: number, y: number): boolean;
}

export const MAX_FALL_WATER = 100; // px/s cap inside liquids (heavy)
export const MAX_FALL_WOOD  = 40;

export function substep(grid: Grid, dt: number) {
  updateGases(grid, dt);
  updateLiquids(grid, dt);
  updateGranular(grid, dt);
  solveReactions(grid, dt);
}

// ---------- GASES ----------
function updateGases(grid: Grid, dt: number) {
  forEachCell(grid, (x, y, cell) => {
    if (!cell) return;
    if (cell.mat !== "SMOKE" && cell.mat !== "STEAM" && cell.mat !== "FIRE") return;

    let riseRate = (cell.mat === "FIRE" ? 120 : cell.mat === "STEAM" ? 90 : 70); // px/s
    let targetY = y - Math.max(1, Math.floor((riseRate * dt)));
    // diffuse sideways randomly to avoid columns
    let dx = Math.sign(Math.random() - 0.5);

    const { x: fx, y: fy } = tryMoveGas(grid, x, y, x + dx, targetY, cell);

    // Smoke fades
    if (cell.mat === "SMOKE") {
      if (Math.random() < MATERIALS.SMOKE.fadeRate! * dt) grid.set(fx, fy, null);
    }
    // Steam condenses
    if (cell.mat === "STEAM") {
      const t = cell.temp ?? 100;
      if (t < (MATERIALS.STEAM.condenseTemp ?? 95)) {
        grid.set(fx, fy, { mat: "WATER", temp: 80, vx: 0, vy: 0 });
      }
    }
  });
}

function tryMoveGas(grid: Grid, x:number, y:number, nx:number, ny:number, c:Cell) {
  if (!grid.inBounds(nx, ny)) return { x, y };
  const dest = grid.get(nx, ny);
  if (!dest) { grid.swap(x, y, nx, ny); return { x: nx, y: ny }; }
  // gases displace only other gases (lighter rises through heavier)
  if (isGas(dest.mat) && density(dest.mat) > density(c.mat)) {
    grid.swap(x, y, nx, ny);
    return { x: nx, y: ny };
  }
  return { x, y };
}

const isGas = (m:MaterialKey) => m==="SMOKE"||m==="STEAM"||m==="FIRE";
const density = (m:MaterialKey)=> MATERIALS[m].density;

// ---------- LIQUIDS ----------
function updateLiquids(grid: Grid, dt: number) {
  forEachCell(grid, (x, y, cell) => {
    if (!cell) return;
    if (cell.mat !== "WATER" && cell.mat !== "OIL" && cell.mat !== "LAVA") return;

    const below = grid.get(x, y+1);
    if (!below) { grid.swap(x, y, x, y+1); return; }

    // Heavier liquid sinks under lighter liquid
    if (isLiquid(below.mat) && density(cell.mat) > density(below.mat)) { grid.swap(x,y,x,y+1); return; }

    // Spread sideways if blocked
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (tryLiquidSlide(grid, x, y, dir)) return;
    if (tryLiquidSlide(grid, x, y, -dir)) return;

    // Drag rigid "wood-like" solids to float
    if (isSolid(below.mat) && density(below.mat) < density("WATER")) {
      // do nothing; liquids flow around
    }
  });
}

const isLiquid = (m:MaterialKey)=> m==="WATER"||m==="OIL"||m==="LAVA";
const isSolid = (m:MaterialKey)=> m==="STONE"||m==="WOOD";

function tryLiquidSlide(grid:Grid, x:number, y:number, dir:number){
  const down = grid.get(x, y+1);
  const sx = x + dir;
  const sl = grid.get(sx, y);
  const sdl = grid.get(sx, y+1);
  if (grid.inBounds(sx,y) && !sl && !sdl) { grid.swap(x,y,sx,y); return true; }
  if (grid.inBounds(sx,y) && !sdl) { grid.swap(x,y,sx,y+1); return true; }
  return false;
}

// ---------- GRANULAR (SAND/DIRT) ----------
function updateGranular(grid: Grid, dt: number) {
  forEachCell(grid, (x, y, cell) => {
    if (!cell) return;
    if (cell.mat !== "SAND" && cell.mat !== "DIRT") return;

    // fall straight down if empty
    if (!grid.get(x, y+1)) { grid.swap(x, y, x, y+1); return; }

    // slide around obstacles (angle of repose ~ arctan(muStatic))
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (tryGranularSlide(grid, x, y, dir)) return;
    if (tryGranularSlide(grid, x, y, -dir)) return;

    // swap with lighter liquids (sink)
    const below = grid.get(x, y+1);
    if (below && isLiquid(below.mat) && density(cell.mat) > density(below.mat)) {
      grid.swap(x, y, x, y+1);
    }
  });
}

function tryGranularSlide(grid:Grid, x:number, y:number, dir:number){
  const sx = x + dir;
  const sdl = grid.get(sx, y+1);
  if (!grid.inBounds(sx, y+1)) return false;
  if (!sdl) { grid.swap(x, y, sx, y+1); return true; }
  return false;
}

// ---------- REACTIONS ----------
function solveReactions(grid: Grid, dt: number) {
  forEachCell(grid, (x, y, c) => {
    if (!c) return;

    // LAVA + WATER => STONE + STEAM (quench)
    if (c.mat === "LAVA") {
      forNeighbors(grid, x, y, (nx, ny, n) => {
        if (n?.mat === "WATER") {
          if (Math.random() < 0.4) grid.set(x, y, { mat: "STONE", temp: 200, vx: 0, vy: 0 });
          grid.set(nx, ny, { mat: "STEAM", temp: 100, vx: 0, vy: 0 });
        }
      });
    }

    // FIRE heats neighbors; consumes OIL/WOOD; creates SMOKE
    if (c.mat === "FIRE") {
      forNeighbors(grid, x, y, (nx, ny, n) => {
        if (!n) return;
        const ignite = (key:MaterialKey, t:number) =>
          MATERIALS[key].ignitionTemp && t >= MATERIALS[key].ignitionTemp!;
        n.temp = Math.max(n.temp ?? 0, (n.temp ?? 0) + 60 * dt);

        if ((n.mat === "OIL" || n.mat === "WOOD") && ignite(n.mat, n.temp!)) {
          // Convert cell to FIRE briefly, leave SMOKE trail
          if (Math.random() < 0.25) grid.set(nx, ny, { mat: "FIRE", temp: 800, vx: 0, vy: -20 });
          if (Math.random() < 0.15) grid.set(nx, ny-1, { mat: "SMOKE", temp: 120, vx: 0, vy: -10 });
        }
      });

      // Fire self-decay if no fuel nearby
      if (!hasCombustibleNeighbor(grid, x, y)) {
        if (Math.random() < 0.3) grid.set(x, y, { mat: "SMOKE", temp: 120, vx: 0, vy: -10 });
      }
    }

    // OIL near FIRE ignites
    if (c.mat === "OIL") {
      if (neighborIs(grid, x, y, "FIRE") && Math.random() < 0.5) {
        grid.set(x, y, { mat: "FIRE", temp: 800, vx: 0, vy: -20 });
      }
    }

    // STEAM cools -> WATER handled in gases update via condenseTemp
  });
}

// ---------- Helpers ----------
function forEachCell(grid:Grid, fn:(x:number,y:number,c:Cell|null)=>void){
  for (let y=0; y<grid.height; y++){
    for (let x=0; x<grid.width; x++){
      fn(x, y, grid.get(x, y));
    }
  }
}

function forNeighbors(grid:Grid, x:number, y:number, fn:(nx:number,ny:number,n:Cell|null)=>void){
  for (let dy=-1; dy<=1; dy++){
    for (let dx=-1; dx<=1; dx++){
      if (dx===0 && dy===0) continue;
      const nx=x+dx, ny=y+dy;
      if (grid.inBounds(nx, ny)) fn(nx, ny, grid.get(nx, ny));
    }
  }
}

function neighborIs(grid:Grid, x:number, y:number, mat:MaterialKey){
  let ok=false;
  forNeighbors(grid,x,y,(nx,ny,n)=>{ if(n?.mat===mat) ok=true; });
  return ok;
}

function hasCombustibleNeighbor(grid:Grid, x:number, y:number){
  let combustible=false;
  forNeighbors(grid,x,y,(nx,ny,n)=>{ if(n && (n.mat==="OIL" || n.mat==="WOOD")) combustible=true; });
  return combustible;
}
