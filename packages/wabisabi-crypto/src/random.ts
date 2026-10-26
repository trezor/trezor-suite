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

const assertWebCrypto = () => {
    if (typeof globalThis.crypto?.getRandomValues !== 'function') {
        throw new Error(
            'Web Crypto API (globalThis.crypto.getRandomValues) is not available in this environment. ' +
                'Requires a secure browser context (HTTPS) or Node.js 19+.',
        );
    }
};

/**
 * Bytes drawn ahead from the CSPRNG, handed out a slice at a time.
 *
 * `crypto.getRandomValues` costs about 2.3 µs per call regardless of how many bytes are
 * asked for, and amount decomposition draws tens of thousands of integers per round
 * (ten thousand pre-decompositions, as upstream), so the per-call overhead alone was
 * 117 of the 180 ms a decomposition took — more than every other part of it together.
 * Buffering takes a draw to 0.14 µs. Nothing about the values changes: the pool is
 * filled by the same `getRandomValues`, bytes are consumed once and in order, and a
 * refill is a fresh CSPRNG draw.
 *
 * The pool is module state, which is safe here because it is never shared across
 * execution contexts: worker threads and renderer processes each load their own module
 * instance, and Node has no `fork()` that would duplicate unconsumed bytes into a child.
 * The buffer is small enough (1 KiB, 32 scalars) that an aborted round leaves little
 * unused randomness behind.
 */
const POOL_SIZE = 1024;
let pool = new Uint8Array(0);
let poolOffset = 0;

const fillFromPool = (target: Uint8Array) => {
    const { length } = target;
    if (poolOffset + length > pool.length) {
        pool = new Uint8Array(POOL_SIZE);
        globalThis.crypto.getRandomValues(pool);
        poolOffset = 0;
    }
    target.set(pool.subarray(poolOffset, poolOffset + length));
    poolOffset += length;

    return target;
};

/** Discards the buffered bytes. Only `random.test.ts` needs this. */
export const resetEntropyPool = () => {
    pool = new Uint8Array(0);
    poolOffset = 0;
};

const MAX_RANGE_32_BITS = 0xffffffff + 1;

/**
 * The four bytes a `getInt` draw reads, viewed as a 32-bit word.
 *
 * Reusing one buffer keeps a draw allocation-free, and reading it through a
 * `Uint32Array` is what `getRandomInt` does, so the two map a byte sequence to the same
 * integer on any platform rather than only on a little-endian one.
 */
const intWord = new Uint32Array(1);
const intWordBytes = new Uint8Array(intWord.buffer);

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/Randomness/SecureRandom.cs`.
 *
 * `RandomNumberGenerator.Fill` maps to `globalThis.crypto.getRandomValues`, and
 * `RandomNumberGenerator.GetInt32` to the same rejection-sampled 32-bit draw that
 * `@trezor/utils`' `getRandomInt` performs — uniform, no modulo bias, exclusive upper
 * bound, throwing rather than degrading when Web Crypto is absent. It is spelled out
 * here instead of delegating to `getRandomInt` only because `getRandomInt` allocates a
 * `Uint32Array` and calls `getRandomValues` per draw; see the pool above for what that
 * costs in decomposition. `random.test.ts` pins the arithmetic, the rejection threshold
 * and the argument validation against that reference.
 */
export const secureRandom: Random = {
    getBytes(length: number) {
        if (length < 1) {
            throw new Error('length must be at least 1.');
        }
        assertWebCrypto();
        if (length > POOL_SIZE) {
            const buffer = new Uint8Array(length);
            globalThis.crypto.getRandomValues(buffer);

            return buffer;
        }

        return fillFromPool(new Uint8Array(length));
    },
    getInt(fromInclusive: number, toExclusive: number) {
        if (!Number.isSafeInteger(fromInclusive)) {
            throw new RangeError(
                `The "min" argument must be a safe integer. Received type ${typeof fromInclusive} (${fromInclusive})`,
            );
        }
        if (!Number.isSafeInteger(toExclusive)) {
            throw new RangeError(
                `The "max" argument must be a safe integer. Received type ${typeof toExclusive} (${toExclusive})`,
            );
        }
        if (fromInclusive >= toExclusive) {
            throw new RangeError(
                `The value of "max" is out of range. It must be greater than the value of "min" (${fromInclusive}). Received ${toExclusive}`,
            );
        }
        const range = toExclusive - fromInclusive;
        if (range > MAX_RANGE_32_BITS) {
            throw new RangeError(
                'This function only provide 32 bits of entropy, therefore range cannot be more then 2^32.',
            );
        }
        assertWebCrypto();

        // The largest multiple of `range` that fits in 32 bits; a draw at or above it
        // would make the low values of the range more likely than the high ones.
        const maxRange = MAX_RANGE_32_BITS - (MAX_RANGE_32_BITS % range);

        let value: number;
        do {
            fillFromPool(intWordBytes);
            value = intWord[0] as number;
        } while (value >= maxRange);

        return fromInclusive + (value % range);
    },
    getScalar() {
        return getScalarFrom(length => secureRandom.getBytes(length));
    },
};
