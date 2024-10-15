/**
 * @deprecated Use `getWeakRandomInt` instead.
 *
 * @param min Inclusive
 * @param max Inclusive
 */
export const getWeakRandomNumberInRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
