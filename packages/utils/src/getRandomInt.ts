import { getRandomValues as cryptoGetRandomValues } from 'crypto';

/**
 * Before changing anything here, see the Modulo Bias problem!
 * @see https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/
 *
 * @param min Inclusive
 * @param max Exclusive (to match the crypto.randomInt() function API
 */
export const getRandomInt = (min: number, max: number) => {
    if (!Number.isSafeInteger(min)) {
        throw new RangeError(
            `The "min" argument must be a safe integer. Received type ${typeof min} (${min})`,
        );
    }

    if (!Number.isSafeInteger(max)) {
        throw new RangeError(
            `The "max" argument must be a safe integer. Received type ${typeof max} (${max})`,
        );
    }

    if (min >= max) {
        throw new RangeError(
            `The value of "max" is out of range. It must be greater than the value of "min" (${min}). Received ${max}`,
        );
    }

    const MAX_RANGE_32_BITS = 0xffffffff + 1;
    const range = max - min;

    if (range > MAX_RANGE_32_BITS) {
        throw new RangeError(
            `This function only provide 32 bits of entropy, therefore range cannot be more then 2^32.`,
        );
    }

    const getRandomValues =
        typeof window !== 'undefined'
            ? (array: Uint32Array) => window.crypto.getRandomValues(array)
            : (array: Uint32Array) => cryptoGetRandomValues(array);

    const array = new Uint32Array(1); // This provides 32 bits of entropy.

    // It is crucial to avoid modulo bias.
    // See: https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/

    // We calculate the maximum possible value that can be evenly distributed across the desired range.
    const maxRange = MAX_RANGE_32_BITS - (MAX_RANGE_32_BITS % range);

    let randomValue: number;
    do {
        getRandomValues(array);
        randomValue = array[0];
    } while (randomValue >= maxRange);

    return min + (randomValue % range);
};
