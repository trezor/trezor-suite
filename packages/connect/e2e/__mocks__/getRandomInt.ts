// Deterministic mock for getRandomInt used in e2e tests.
// The real getRandomInt uses crypto.getRandomValues for unbiased randomness,
// but tests need deterministic output permutations for fixtures to be stable.
export const getRandomInt = (min: number, max: number) => min + (4 % (max - min));
