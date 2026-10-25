import { getRandomInt } from '@trezor/utils';

import { SCALAR_BYTES, type Scalar, scalarFromBytes } from './scalar';

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/Randomness/WasabiRandom.cs`.
 *
 * There is exactly one production implementation, `secureRandom` below. The only
 * other implementation lives behind `src/testing`, which the package root does not
 * re-export, so the deterministic PRNG used for upstream's vectors cannot be reached
 * from application code. `Math.random` and `@trezor/utils`' `getWeakRandomNumberInRange`
 * must never appear in a credential, decomposition or selection path.
 */
export interface Random {
    /** `WasabiRandom.GetBytes(int)`. */
    getBytes(length: number): Uint8Array;
    /** `WasabiRandom.GetInt(int fromInclusive, int toExclusive)`. */
    getInt(fromInclusive: number, toExclusive: number): number;
    /** `WasabiRandom.GetScalar()`. */
    getScalar(): Scalar;
}

/**
 * `WasabiRandom.GetScalar()` — resample on overflow or zero.
 *
 * Shared by every implementation so the deterministic PRNG consumes exactly as many
 * bytes as the production one would for the same draw.
 */
export const getScalarFrom = (getBytes: (length: number) => Uint8Array): Scalar => {
    for (;;) {
        const { scalar, overflow } = scalarFromBytes(getBytes(SCALAR_BYTES));
        if (!overflow && scalar !== 0n) {
            return scalar;
        }
    }
};

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/Randomness/SecureRandom.cs`.
 *
 * `RandomNumberGenerator.Fill` maps to `globalThis.crypto.getRandomValues`, and
 * `RandomNumberGenerator.GetInt32` maps to `@trezor/utils`' `getRandomInt`, which is
 * already a behavioural match: uniform, rejection-sampled against modulo bias,
 * exclusive upper bound, and it throws rather than degrading when Web Crypto is absent.
 */
export const secureRandom: Random = {
    getBytes(length: number) {
        if (length < 1) {
            throw new Error('length must be at least 1.');
        }
        if (typeof globalThis.crypto?.getRandomValues !== 'function') {
            throw new Error(
                'Web Crypto API (globalThis.crypto.getRandomValues) is not available in this environment. ' +
                    'Requires a secure browser context (HTTPS) or Node.js 19+.',
            );
        }
        const buffer = new Uint8Array(length);
        globalThis.crypto.getRandomValues(buffer);

        return buffer;
    },
    getInt(fromInclusive: number, toExclusive: number) {
        return getRandomInt(fromInclusive, toExclusive);
    },
    getScalar() {
        return getScalarFrom(length => secureRandom.getBytes(length));
    },
};
