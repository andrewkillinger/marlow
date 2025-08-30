// Material types and baseline physics for a pixel/destructible world.
// Cell scale is defined in constants.ts and used for rendering.

export type MaterialState = "granular" | "solid" | "liquid" | "gas" | "reactive";

export interface Material {
  key: MaterialKey;
  state: MaterialState;

  // bulk properties
  density: number;           // relative kg/m^3
  viscosity?: number;        // relative Pa·s (liquids)
  surfaceTension?: number;   // 0..1
  permeability?: number;     // 0..1 for granular
  cohesion?: number;         // 0..1 (granular stickiness)
  muStatic?: number;         // static friction (solids & rigid)
  muDynamic?: number;        // kinetic friction
  restitution?: number;      // bounciness 0..1

  // thermal (optional)
  temp?: number;             // current °C
  ignitionTemp?: number;     // °C
  burnRate?: number;         // 0..1 per second
  evapTemp?: number;         // °C (liquids -> gas)
  evapRate?: number;         // 0..1 per second
  condenseTemp?: number;     // °C (gas -> liquid)
  coolToStoneTemp?: number;  // °C (lava -> stone)
  fadeRate?: number;         // 0..1 per second (smoke)
}

export type MaterialKey =
  | "SAND" | "DIRT" | "STONE" | "WOOD" | "WATER"
  | "OIL" | "LAVA" | "FIRE" | "STEAM" | "SMOKE";

export const GRAVITY_PX = 980;          // px/s^2 at this scale
export const SUBSTEPS = 4;              // 60 FPS * 4 = 240 Hz solver

// Default thermal constants (engine-wide)
export const AMBIENT_TEMP = 20;
export const WATER_BOIL = 100;
export const WATER_CONDENSE = 95;
export const LAVA_TEMP = 1200;

export const MATERIALS: Record<MaterialKey, Material> = {
  SAND: {
    key: "SAND", state: "granular",
    density: 1600, cohesion: 0.05, permeability: 0.65,
    viscosity: 0.02, restitution: 0.05, muStatic: 0.60, muDynamic: 0.45
  },
  DIRT: {
    key: "DIRT", state: "granular",
    density: 1400, cohesion: 0.15, permeability: 0.45,
    viscosity: 0.03, restitution: 0.03, muStatic: 0.70, muDynamic: 0.50
  },
  STONE: {
    key: "STONE", state: "solid",
    density: 2600, muStatic: 0.80, muDynamic: 0.65, restitution: 0.02
  },
  WOOD: {
    key: "WOOD", state: "solid",
    density: 600, muStatic: 0.55, muDynamic: 0.45, restitution: 0.10,
    ignitionTemp: 560, burnRate: 0.015
  },
  WATER: {
    key: "WATER", state: "liquid",
    density: 1000, viscosity: 1.0, surfaceTension: 0.35,
    evapTemp: WATER_BOIL, evapRate: 0.002
  },
  OIL: {
    key: "OIL", state: "liquid",
    density: 850, viscosity: 6.0, surfaceTension: 0.25,
    ignitionTemp: 310, burnRate: 0.02
  },
  LAVA: {
    key: "LAVA", state: "liquid",
    density: 2700, viscosity: 80.0, surfaceTension: 0.50,
    temp: LAVA_TEMP, coolToStoneTemp: 700
  },
  FIRE: {
    key: "FIRE", state: "reactive",
    density: 0.1,          // rises fast
    fadeRate: 0.0,         // fire converts to SMOKE/STEAM, not just fade
    temp: 900, burnRate: 1 // heat source; lifespan handled by fuel
  },
  STEAM: {
    key: "STEAM", state: "gas",
    density: 0.6, viscosity: 0.1,
    condenseTemp: WATER_CONDENSE, evapRate: 0.0, fadeRate: 0.0
  },
  SMOKE: {
    key: "SMOKE", state: "gas",
    density: 0.4, viscosity: 0.2, fadeRate: 0.01
  }
};
