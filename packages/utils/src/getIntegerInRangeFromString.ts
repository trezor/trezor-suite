/**
 *
 * @param input - any string
 * @param max - max number not included for the range, if 100 is provided the range will be 0 to 99, if 101, then range is 0 to 100
 * @returns number
 * @see https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
 */
export const getIntegerInRangeFromString = (input: string, max: number): number => {
    let hash = 0;
    if (input.length === 0) {
        return 0;
    }

    // Non secure but fash hash function with browser compatibility
    // https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        // Convert to 32bit integer.
        hash |= 0;
    }

    // The result of `x % n` is always in the range `-(n-1)` to `n-1`.
    // Taking the absolute value ensures it's in the range 0 to max.
    return Math.abs(hash % max);
};
