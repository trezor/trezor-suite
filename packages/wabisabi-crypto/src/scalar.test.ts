import { fromHex, toHex } from './hex';
import {
    SCALAR_ONE,
    SCALAR_ORDER,
    SCALAR_ZERO,
    scalarAdd,
    scalarFromBytes,
    scalarFromNumber,
    scalarGetBit,
    scalarIsHigh,
    scalarMultiply,
    scalarNegate,
    scalarPowerOfTwo,
    scalarSum,
    scalarToBytes,
    scalarToUlong,
    scalarVectorAdd,
    scalarVectorScale,
} from './scalar';

/** `EC.NC` — the complement of the group order, `2^256 - N`. */
const SCALAR_NC = (1n << 256n) - SCALAR_ORDER;

/** Serializes a value that may be at or above the group order, for overflow tests. */
const scalarToBytesUnreduced = (value: bigint) => {
    const bytes = new Uint8Array(32);
    let remaining = value;
    for (let i = 31; i >= 0; i--) {
        bytes[i] = Number(remaining & 0xffn);
        remaining >>= 8n;
    }

    return bytes;
};

describe('scalar', () => {
    // Port of `ScalarBehavesAsExpected` in NWabiSabi/WabiSabi.Tests/Crypto/ScalarTests.cs.
    // Where upstream relies on `Scalar` holding an unreduced value, this asserts the
    // reduction `scalarFromBytes` reports instead.
    it('behaves as expected at the edges of the group order', () => {
        const nBytes = scalarToBytesUnreduced(SCALAR_ORDER);
        expect(scalarFromBytes(nBytes).overflow).toBe(true);
        expect(scalarFromBytes(nBytes).scalar).toBe(SCALAR_ZERO);

        const nPlusOne = scalarFromBytes(scalarToBytesUnreduced(SCALAR_ORDER + 1n));
        expect(nPlusOne.overflow).toBe(true);
        expect(nPlusOne.scalar).toBe(SCALAR_ONE);

        expect(scalarAdd(nPlusOne.scalar, scalarNegate(SCALAR_ONE))).toBe(SCALAR_ZERO);

        const nMinusOne = scalarFromBytes(scalarToBytesUnreduced(SCALAR_ORDER - 1n));
        expect(nMinusOne.overflow).toBe(false);
        expect(scalarIsHigh(nMinusOne.scalar)).toBe(true);

        const largest = scalarFromBytes(new Uint8Array(32).fill(0xff));
        expect(largest.overflow).toBe(true);

        const two = scalarAdd(SCALAR_ONE, SCALAR_ONE);
        expect(two).toBe(scalarFromNumber(2));
        expect(scalarAdd(two, scalarNegate(SCALAR_ONE))).toBe(SCALAR_ONE);
        expect(scalarAdd(scalarAdd(two, scalarNegate(SCALAR_ONE)), scalarNegate(SCALAR_ONE))).toBe(
            SCALAR_ZERO,
        );
    });

    it('negates zero to zero', () => {
        expect(scalarNegate(SCALAR_ZERO)).toBe(SCALAR_ZERO);
        expect(scalarNegate(scalarNegate(SCALAR_NC))).toBe(SCALAR_NC);
    });

    it('round-trips 32 big-endian bytes', () => {
        const hex = '1A0C466F5D75E4D8AD6765D5F519DBC82B7C343B37F88500EC5E64005393B30D';
        const { scalar, overflow } = scalarFromBytes(fromHex(hex));
        expect(overflow).toBe(false);
        expect(toHex(scalarToBytes(scalar))).toBe(hex);
    });

    it('serializes with leading zeroes preserved', () => {
        expect(toHex(scalarToBytes(scalarFromNumber(1)))).toBe(
            '0000000000000000000000000000000000000000000000000000000000000001',
        );
        expect(toHex(scalarToBytes(SCALAR_ZERO))).toBe(`${'00'.repeat(32)}`);
    });

    it('rejects the wrong number of bytes', () => {
        expect(() => scalarFromBytes(new Uint8Array(31))).toThrow('A scalar is 32 bytes');
        expect(() => scalarFromBytes(new Uint8Array(33))).toThrow('A scalar is 32 bytes');
    });

    it('rejects negative numbers', () => {
        expect(() => scalarFromNumber(-1)).toThrow('negative');
    });

    it('takes the low 64 bits for ToUlong', () => {
        expect(scalarToUlong(scalarFromNumber(0xdeadbeefn))).toBe(0xdeadbeefn);
        expect(scalarToUlong((1n << 100n) + 5n)).toBe(5n);
    });

    it('exposes single bits', () => {
        const value = 0b1011n;
        expect([0, 1, 2, 3, 4].map(i => scalarGetBit(value, i))).toEqual([1, 1, 0, 1, 0]);
    });

    it('computes powers of two', () => {
        expect(scalarPowerOfTwo(0)).toBe(1n);
        expect(scalarPowerOfTwo(10)).toBe(1024n);
        // 2^255 < N, so the last table entry does not wrap.
        expect(scalarPowerOfTwo(254)).toBe(1n << 254n);
        expect(() => scalarPowerOfTwo(256)).toThrow('out of range');
    });

    it('sums and scales vectors', () => {
        expect(scalarSum([1n, 2n, 3n])).toBe(6n);
        expect(scalarSum([])).toBe(SCALAR_ZERO);
        expect(scalarSum([SCALAR_ORDER - 1n, 2n])).toBe(1n);
        expect(scalarVectorAdd([1n, 2n], [10n, 20n])).toEqual([11n, 22n]);
        expect(scalarVectorScale(3n, [1n, 2n])).toEqual([3n, 6n]);
        expect(() => scalarVectorAdd([1n], [1n, 2n])).toThrow('same length');
    });

    it('multiplies modulo the group order', () => {
        expect(scalarMultiply(SCALAR_ORDER - 1n, SCALAR_ORDER - 1n)).toBe(1n);
    });
});
