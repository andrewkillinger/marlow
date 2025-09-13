/**
 * Element type identifiers used by the simulation.
 * Each element is represented by a small integer to
 * keep the grid compact and cache friendly.
 */
export const Element = Object.freeze({
  Empty: 0,
  Sand: 1,
  Water: 2,
  Wall: 3,
  Fire: 4,
  Plant: 5,
  Smoke: 6,
  Oil: 7,
  Seed: 8,
  Flower: 9,
  Tree: 10,
});

/**
 * Mapping from element to display color (RGBA).
 * Keeping colors centralized makes palette tweaks easy.
 */
export const COLORS = {
  [Element.Empty]: [0, 0, 0, 0],
  [Element.Sand]: [194, 178, 128, 255],
  [Element.Water]: [64, 164, 223, 255],
  [Element.Wall]: [120, 120, 120, 255],
  [Element.Fire]: [255, 85, 0, 255],
  [Element.Plant]: [0, 160, 0, 255],
  [Element.Smoke]: [80, 80, 80, 150],
  [Element.Oil]: [30, 30, 30, 255],
  [Element.Seed]: [139, 69, 19, 255],
  [Element.Flower]: [255, 105, 180, 255],
  [Element.Tree]: [101, 67, 33, 255],
};

/**
 * Elements that catch fire when touching a flame.
 */
export const FLAMMABLE = new Set([
  Element.Plant,
  Element.Oil,
  Element.Seed,
  Element.Flower,
  Element.Tree,
]);
