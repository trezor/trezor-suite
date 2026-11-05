import { secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';

import { toHex } from './hex';
import { type Scalar } from './scalar';

const { Point } = secp256k1;
const { Fp } = Point;

type NoblePoint = InstanceType<typeof Point>;

const SECP256K1_TAG_PUBKEY_EVEN = 0x02;
const SECP256K1_TAG_PUBKEY_ODD = 0x03;
const COMPRESSED_LENGTH = 33;
const CURVE_B = 7n;

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/Groups/GroupElement.cs`.
 *
 * Wraps a `@noble/curves` secp256k1 point. The point at infinity needs explicit
 * handling because noble refuses to serialize it while upstream serializes it as 33
 * zero bytes, and because noble's `multiply` rejects a zero scalar while upstream
 * returns infinity for it.
 */
export class GroupElement {
    /** `null` is the point at infinity. */
    private readonly p: NoblePoint | null;

    /**
     * Memoized compressed serialization.
     *
     * Upstream holds the affine coordinates in a `Lazy<GE>`, so `ToBytes` on a shared
     * generator is a byte copy rather than a field inversion. This matters: committing a
     * 42-bit range proof statement to the transcript serializes about eleven thousand
     * elements, almost all of them the point at infinity or one of the fixed generators.
     * The object is immutable, so caching is safe.
     */
    private bytes?: Uint8Array;

    private constructor(point: NoblePoint | null) {
        this.p = point;
    }

    static readonly INFINITY = new GroupElement(null);

    static fromPoint(point: NoblePoint) {
        return point.is0() ? GroupElement.INFINITY : new GroupElement(point);
    }

    static fromAffine(x: bigint, y: bigint) {
        return GroupElement.fromPoint(Point.fromAffine({ x, y }));
    }

    get isInfinity() {
        return this.p === null;
    }

    /** The underlying noble point. Throws for infinity; callers must check first. */
    get point(): NoblePoint {
        if (this.p === null) {
            throw new Error('The point at infinity has no affine representation.');
        }

        return this.p;
    }

    add(other: GroupElement): GroupElement {
        if (this.p === null) {
            return other;
        }
        if (other.p === null) {
            return this;
        }

        return GroupElement.fromPoint(this.p.add(other.p));
    }

    subtract(other: GroupElement): GroupElement {
        return this.add(other.negate());
    }

    negate(): GroupElement {
        return this.p === null ? this : GroupElement.fromPoint(this.p.negate());
    }

    /**
     * `operator *(Scalar, GroupElement)`.
     *
     * Upstream comments that `scalar * GE.Infinity` is not infinity in NBitcoin and
     * fixes it up; a zero scalar likewise has to yield infinity, which is what
     * libsecp256k1's `ecmult` does but noble's range-checked `multiply` will not.
     */
    multiply(scalar: Scalar): GroupElement {
        if (this.p === null || scalar === 0n) {
            return GroupElement.INFINITY;
        }

        return GroupElement.fromPoint(this.p.multiply(scalar));
    }

    /** Variable-time multiplication, for public inputs only (never for a witness). */
    multiplyUnsafe(scalar: Scalar): GroupElement {
        if (this.p === null || scalar === 0n) {
            return GroupElement.INFINITY;
        }

        return GroupElement.fromPoint(this.p.multiplyUnsafe(scalar));
    }

    equals(other: GroupElement | null | undefined): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        if (this.p === null || other.p === null) {
            return this.p === null && other.p === null;
        }

        return this.p.equals(other.p);
    }

    /**
     * `GroupElement.ToBytes()` — compressed SEC1.
     *
     * `GE.Infinity` has `x = 0`, so upstream's `(true, _) => 0` prefix plus a zero
     * `x` makes the point at infinity serialize as 33 zero bytes.
     */
    toBytes(): Uint8Array {
        if (this.bytes !== undefined) {
            return this.bytes;
        }
        const buffer = new Uint8Array(COMPRESSED_LENGTH);
        if (this.p === null) {
            this.bytes = buffer;

            return buffer;
        }
        const affine = this.p.toAffine();
        buffer[0] = (affine.y & 1n) === 1n ? SECP256K1_TAG_PUBKEY_ODD : SECP256K1_TAG_PUBKEY_EVEN;
        let { x } = affine;
        for (let i = COMPRESSED_LENGTH - 1; i >= 1; i--) {
            buffer[i] = Number(x & 0xffn);
            x >>= 8n;
        }
        this.bytes = buffer;

        return buffer;
    }

    toHex(): string {
        return toHex(this.toBytes());
    }

    static fromBytes(bytes: Uint8Array): GroupElement {
        if (bytes.length !== COMPRESSED_LENGTH) {
            throw new Error(`A group element is ${COMPRESSED_LENGTH} bytes, got ${bytes.length}.`);
        }
        // Upstream matches on the prefix alone, so a zero prefix is infinity whatever
        // the remaining bytes hold.
        if (bytes[0] === 0) {
            return GroupElement.INFINITY;
        }
        if (bytes[0] !== SECP256K1_TAG_PUBKEY_EVEN && bytes[0] !== SECP256K1_TAG_PUBKEY_ODD) {
            throw new Error('Argument is not a well-formatted group element.');
        }
        try {
            return GroupElement.fromPoint(Point.fromBytes(bytes));
        } catch {
            throw new Error('Argument is not a valid group element.');
        }
    }

    toString(): string {
        return this.isInfinity ? 'Infinity' : this.toHex();
    }
}

/**
 * `Generators.FromBuffer` — port of the iterated-SHA256 lift.
 *
 * Hashes first, then retries until the hash is the x coordinate of a curve point,
 * taking the y that is itself a quadratic residue (`GE.TryCreateXQuad`, i.e.
 * `y = (x^3 + 7)^((p+1)/4)`, which is what `@noble/curves`' `Fp.sqrt` computes for
 * secp256k1's `p ≡ 3 (mod 4)`).
 */
export const groupElementFromBuffer = (buffer: Uint8Array): GroupElement => {
    let current = buffer;
    for (;;) {
        current = sha256(current);
        let x = 0n;
        for (const byte of current) {
            x = (x << 8n) | BigInt(byte);
        }
        // `new FE(buffer)` loads the bytes without reducing; a hash at or above the
        // field order is a ~2^-224 event, and reducing keeps the lift total.
        x = Fp.create(x);
        const ySquared = Fp.add(Fp.mul(Fp.sqr(x), x), Fp.create(CURVE_B));
        let y: bigint;
        try {
            y = Fp.sqrt(ySquared);
        } catch {
            continue;
        }

        return GroupElement.fromAffine(x, y);
    }
};

export const groupElementFromText = (text: string) =>
    groupElementFromBuffer(new TextEncoder().encode(text));

/** `Extensions.Sum(this IEnumerable<GroupElement>)`. */
export const groupElementSum = (elements: Iterable<GroupElement>): GroupElement => {
    let sum = GroupElement.INFINITY;
    for (const element of elements) {
        sum = sum.add(element);
    }

    return sum;
};

/**
 * `ScalarVector * GroupElementVector` — `ECMultContext.MultBatch`.
 *
 * Infinity generators and zero scalars contribute nothing, and most columns of a
 * range-proof statement are infinity, so dropping them is what makes a 42-bit range
 * proof affordable rather than an optimisation that changes the result. Upstream's
 * `MultBatch` is handed the same already-filtered vectors by `Statement`.
 *
 * The surviving terms use variable-time multiplication. This matches the reference
 * implementation: `ECMultContext.MultBatch` is libsecp256k1's `ecmult_multi`, which is
 * variable time in both the point and the scalar, as is `Scalar * GE`. Where the point
 * is one of the fixed generators, `precomputeGenerator` has given it a window table,
 * which is what keeps this affordable — a range-proof statement is 211 non-infinity
 * terms per equation set and all but a few of them are fixed generators.
 *
 * Batched (interleaved-window) multiplication was measured here as the alternative. It
 * is a clear win when a single equation has tens of distinct non-precomputed points,
 * but 84 of a 42-bit statement's 85 equations have only two non-infinity terms, where
 * it is no faster than this loop and a precomputed table beats both.
 */
export const multiScalarMultiply = (
    scalars: readonly Scalar[],
    elements: readonly GroupElement[],
): GroupElement => {
    if (scalars.length !== elements.length) {
        throw new Error('Scalar and group element vectors must have the same length.');
    }
    let sum = GroupElement.INFINITY;
    for (let i = 0; i < scalars.length; i++) {
        const scalar = scalars[i] as Scalar;
        const element = elements[i] as GroupElement;
        if (scalar === 0n || element.isInfinity) {
            continue;
        }
        sum = sum.add(element.multiplyUnsafe(scalar));
    }

    return sum;
};

/**
 * The same sum with constant-time multiplication, kept as the reference the fast path is
 * checked against in `groupElement.test.ts`.
 */
export const constantTimeMultiScalarMultiply = (
    scalars: readonly Scalar[],
    elements: readonly GroupElement[],
): GroupElement => {
    if (scalars.length !== elements.length) {
        throw new Error('Scalar and group element vectors must have the same length.');
    }
    let sum = GroupElement.INFINITY;
    for (let i = 0; i < scalars.length; i++) {
        const scalar = scalars[i] as Scalar;
        const element = elements[i] as GroupElement;
        if (scalar === 0n || element.isInfinity) {
            continue;
        }
        sum = sum.add(element.multiply(scalar));
    }

    return sum;
};

/**
 * Attaches a `@noble/curves` window table to a generator that will be multiplied many
 * times over the life of the process.
 *
 * The table is built lazily on first multiplication, so an unused generator costs
 * nothing. Measured with full 256-bit scalars: 0.96 ms without a table, 0.22 ms with a
 * width-8 one, 0.32 ms with width 5. Width 8 is for the ten base generators, which a
 * single range proof touches well over a hundred times; the 255 negated powers of two
 * get width 5, because each is touched once or twice per proof and the wider table is
 * not worth its memory.
 */
export const precomputeGenerator = (element: GroupElement, windowSize: number) => {
    if (!element.isInfinity) {
        element.point.precompute(windowSize);
    }

    return element;
};

export const groupElementsEqual = (a: readonly GroupElement[], b: readonly GroupElement[]) =>
    a.length === b.length && a.every((element, index) => element.equals(b[index]));
