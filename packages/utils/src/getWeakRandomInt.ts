/**
 * @param min Inclusive
 * @param max Exclusive
 */
export const getWeakRandomInt = (min: number, max: number) => {
    if (min >= max) {
        throw new RangeError(
            `The value of "max" is out of range. It must be greater than the value of "min" (${min}). Received ${max}`,
        );
    }

    return Math.floor(Math.random() * (max - min) + min);
};
