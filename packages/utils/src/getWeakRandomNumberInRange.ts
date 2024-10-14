/**
 * @deprecated Consider using `getRandomInt` which is cryptographically secure.
 */
export const getWeakRandomNumberInRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
