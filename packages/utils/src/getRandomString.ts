import { getRandomInt } from './getRandomInt';

const DEFAULT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate a cryptographically strong random string of the given length.
 *
 * Each character is picked by drawing an unbiased integer in `[0, alphabet.length)`
 * via `getRandomInt` (rejection sampling over `crypto.getRandomValues`) and
 * mapping it to the alphabet. The mapping is bijective, so the per-character
 * distribution stays uniform.
 *
 * @param length Number of characters to return.
 * @param alphabet Characters to sample from. Defaults to `[A-Za-z0-9]`.
 */
export const getRandomString = (length: number, alphabet: string = DEFAULT_ALPHABET): string => {
    if (!Number.isSafeInteger(length) || length < 1) {
        throw new RangeError(
            `The "length" argument must be a positive safe integer. Received ${length}`,
        );
    }

    if (alphabet.length < 2) {
        throw new RangeError(
            `The alphabet must contain at least 2 characters. Received ${alphabet.length}`,
        );
    }

    let result = '';
    for (let i = 0; i < length; i++) {
        result += alphabet.charAt(getRandomInt(0, alphabet.length));
    }

    return result;
};
