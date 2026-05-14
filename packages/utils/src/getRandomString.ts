import { getRandomInt } from './getRandomInt';

const DEFAULT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// `getRandomInt` only supports ranges up to 2^32, so the alphabet is bounded by the same value.
const MAX_ALPHABET_LENGTH = 0xffffffff + 1;

/**
 * Generate a cryptographically strong random string of the given length.
 *
 * Each character is picked by drawing an unbiased integer in `[0, alphabet.length)`
 * via `getRandomInt` (rejection sampling over `crypto.getRandomValues`) and
 * mapping it to the alphabet. The mapping is bijective only when `alphabet`
 * contains unique characters; duplicates would bias the output toward the
 * repeated chars, so the function rejects them.
 *
 * @param length Number of characters to return.
 * @param alphabet Unique characters to sample from. Defaults to `[A-Za-z0-9]`.
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

    if (alphabet.length > MAX_ALPHABET_LENGTH) {
        throw new RangeError(
            `The alphabet must contain at most ${MAX_ALPHABET_LENGTH} characters. Received ${alphabet.length}`,
        );
    }

    if (new Set(alphabet).size !== alphabet.length) {
        throw new RangeError('The alphabet must contain unique characters.');
    }

    let result = '';
    for (let i = 0; i < length; i++) {
        result += alphabet.charAt(getRandomInt(0, alphabet.length));
    }

    return result;
};
