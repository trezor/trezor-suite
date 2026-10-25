import { secp256k1 } from '@noble/curves/secp256k1.js';

/**
 * Port of the parts of `NBitcoin.Secp256k1.Scalar` that `NWabiSabi` relies on, plus
 * `NWabiSabi/WabiSabi/Crypto/Extensions.cs`.
 *
 * A `Scalar` here is always a `bigint` already reduced into `[0, N)`. Upstream's
 * `Scalar` can additionally hold an unreduced value and report `IsOverflow`; the only
 * place that matters is parsing 32 bytes, which is why `scalarFromBytes` returns the
 * overflow flag separately. Both the Fiat-Shamir challenge loop and the nonce
 * provider resample on overflow, so the unreduced value is never observable.
 */
export type Scalar = bigint;

/** The order of the secp256k1 group, `EC.N`. */
export const SCALAR_ORDER = secp256k1.Point.Fn.ORDER;

export const SCALAR_ZERO: Scalar = 0n;
export const SCALAR_ONE: Scalar = 1n;

export const SCALAR_BYTES = 32;

/**
 * `new Scalar(ulong)` / `new Scalar(uint)`.
 *
 * A deliberate divergence, the only one in this file. Upstream reaches this as
 * `new Scalar((ulong)value)` on a `long`, so a negative amount does not fail: the cast
 * wraps it to a huge positive scalar and the client goes on to build a commitment and a
 * range proof over it, which the coordinator then rejects with an opaque protocol error.
 * Throwing names the actual bug at the call site instead. Nothing in the port can reach
 * it with a negative value — registration amounts are clamped by the round parameters
 * and decomposition only ever emits positive amounts — so this is a guard, not a branch
 * that changes behaviour.
 *
 * The reduction is a no-op for every real input (upstream's source type is at most 64
 * bits, the group order is 256) and is kept only so the return value is always a
 * canonical scalar.
 */
export const scalarFromNumber = (value: number | bigint): Scalar => {
    const big = BigInt(value);
    if (big < 0n) {
        throw new Error('A scalar cannot be created from a negative number.');
    }

    return big % SCALAR_ORDER;
};

/**
 * `new Scalar(ReadOnlySpan<byte>, out int overflow)` — 32 bytes, big-endian.
 *
 * `overflow` is set when the raw value is at or above the group order; the reduced
 * value is returned alongside it exactly as `secp256k1_scalar_set_b32` does.
 */
export const scalarFromBytes = (bytes: Uint8Array): { scalar: Scalar; overflow: boolean } => {
    if (bytes.length !== SCALAR_BYTES) {
        throw new Error(`A scalar is ${SCALAR_BYTES} bytes, got ${bytes.length}.`);
    }
    let raw = 0n;
    for (const byte of bytes) {
        raw = (raw << 8n) | BigInt(byte);
    }

    return { scalar: raw % SCALAR_ORDER, overflow: raw >= SCALAR_ORDER };
};

/** `Scalar.ToBytes()` — 32 bytes, big-endian. */
export const scalarToBytes = (scalar: Scalar): Uint8Array => {
    const bytes = new Uint8Array(SCALAR_BYTES);
    let value = scalar;
    for (let i = SCALAR_BYTES - 1; i >= 0; i--) {
        bytes[i] = Number(value & 0xffn);
        value >>= 8n;
    }

    return bytes;
};

export const scalarAdd = (a: Scalar, b: Scalar): Scalar => (a + b) % SCALAR_ORDER;

export const scalarMultiply = (a: Scalar, b: Scalar): Scalar => (a * b) % SCALAR_ORDER;

/** `Scalar.Negate()` — `0` negates to `0`, as in `secp256k1_scalar_negate`. */
export const scalarNegate = (a: Scalar): Scalar => (a === 0n ? 0n : SCALAR_ORDER - a);

/** `Extensions.Sum(this IEnumerable<Scalar>)`. */
export const scalarSum = (scalars: Iterable<Scalar>): Scalar => {
    let sum = SCALAR_ZERO;
    for (const scalar of scalars) {
        sum = scalarAdd(sum, scalar);
    }

    return sum;
};

export const scalarIsZero = (scalar: Scalar) => scalar === 0n;

/** `Scalar.IsHigh` — above `N / 2`. */
export const scalarIsHigh = (scalar: Scalar) => scalar > SCALAR_ORDER >> 1n;

/** `Scalar.GetBits(offset, 1)`. */
export const scalarGetBit = (scalar: Scalar, offset: number) =>
    Number((scalar >> BigInt(offset)) & 1n);

/** `Extensions.ToUlong(this Scalar)` — `(d1 << 32) | d0`, i.e. the low 64 bits. */
export const scalarToUlong = (scalar: Scalar) => scalar & 0xffffffffffffffffn;

/**
 * `Scalar.Zero.CAddBit(i, 1)` for a single bit, i.e. `2^offset`.
 *
 * Only defined up to 254 because `Generators.ScalarPowersOfTwo` goes that far and
 * `2^255 < N` is the last power that does not wrap.
 */
export const scalarPowerOfTwo = (offset: number): Scalar => {
    if (offset < 0 || offset > 255) {
        throw new Error(`Power of two out of range: ${offset}.`);
    }

    return (1n << BigInt(offset)) % SCALAR_ORDER;
};

/** `ScalarVector * ScalarVector` elementwise addition. */
export const scalarVectorAdd = (a: readonly Scalar[], b: readonly Scalar[]): Scalar[] => {
    if (a.length !== b.length) {
        throw new Error('Scalar vectors must have the same length.');
    }

    return a.map((value, index) => scalarAdd(value, b[index] as Scalar));
};

/** `Scalar * ScalarVector`. */
export const scalarVectorScale = (scalar: Scalar, vector: readonly Scalar[]): Scalar[] =>
    vector.map(value => scalarMultiply(scalar, value));
