/**
 * Deterministic PRNG for tests — a seeded stand-in for `Math.random`.
 *
 * Returns a function producing values in [0, 1), matching the rng contract
 * expected by `placeMines`. Same seed always yields the same sequence, so
 * board layouts in tests are reproducible.
 */
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
