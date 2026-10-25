import { type Random } from '../random';

/**
 * A `Random` that always returns the same bytes.
 *
 * Upstream's crypto tests mock `WasabiRandom.GetBytes(32)` with `new byte[32]` to show
 * that synthetic nonces still diverge when the RNG contributes nothing. Test-only.
 *
 * `getScalar` throws rather than returning a constant: nothing in the ported paths may
 * ever draw a blinding factor from a source like this.
 */
export const constantRandom = (fill = 0): Random => ({
    getBytes: (length: number) => new Uint8Array(length).fill(fill),
    getInt: (fromInclusive: number) => fromInclusive,
    getScalar: () => {
        throw new Error('constantRandom cannot produce a scalar: it would always be the same.');
    },
});

/** A `Random` that draws scalars from a fixed list, then throws. */
export const scriptedRandom = (scalars: readonly bigint[]): Random => {
    let index = 0;

    return {
        getBytes: (length: number) => new Uint8Array(length),
        getInt: (fromInclusive: number) => fromInclusive,
        getScalar: () => {
            const scalar = scalars[index];
            index += 1;
            if (scalar === undefined) {
                throw new Error('scriptedRandom ran out of scalars.');
            }

            return scalar;
        },
    };
};
