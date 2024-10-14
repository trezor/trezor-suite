import { randomBytes } from 'crypto';

/**
 * Crypto.randomInt() function is not implemented by polyfill 'crypto-browserify'
 * @see https://github.com/browserify/crypto-browserify/issues/224
 */
export const getRandomInt = (min: number, max: number) => {
    if (min >= max) {
        throw new RangeError(
            `The value of "max" is out of range. It must be greater than the value of "min" (${min}). Received ${max}`,
        );
    }

    const randomValue = parseInt(randomBytes(4).toString('hex'), 16);

    return min + (randomValue % (max - min));
};
