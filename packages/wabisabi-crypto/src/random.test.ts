import { getRandomInt } from '@trezor/utils';

import { resetEntropyPool, secureRandom } from './random';
import { SCALAR_ORDER } from './scalar';

/**
 * `secureRandom` is the only randomness a credential, decomposition or selection path is
 * allowed to draw from, and it buffers its CSPRNG draws (see the pool in `random.ts`).
 * Buffering must not change a single value, so these tests drive both it and
 * `@trezor/utils`' `getRandomInt` — the reference `getInt` used to delegate to — off the
 * same deterministic byte stream and compare.
 */

const realCrypto = globalThis.crypto;

/**
 * A `getRandomValues` that hands out a fixed stream of 32-bit words.
 *
 * Words rather than bytes so that the stream maps to the same integers as
 * `getRandomInt`'s `Uint32Array` read on a big-endian platform too.
 */
const streamOfWords = (words: number[]) => {
    const stream = new Uint8Array(new Uint32Array(words).buffer);
    let offset = 0;

    // `getRandomInt` asks for a `Uint32Array` and `secureRandom` for a `Uint8Array`, so
    // write through a byte view of whatever comes in.
    return <T extends ArrayBufferView>(target: T) => {
        const bytes = new Uint8Array(target.buffer, target.byteOffset, target.byteLength);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = stream[offset % stream.length] as number;
            offset += 1;
        }

        return target;
    };
};

const useStream = (words: number[]) => {
    const fill = streamOfWords(words);
    Object.defineProperty(globalThis, 'crypto', {
        value: { getRandomValues: fill },
        configurable: true,
        writable: true,
    });
    resetEntropyPool();
};

const useRealCrypto = () => {
    Object.defineProperty(globalThis, 'crypto', {
        value: realCrypto,
        configurable: true,
        writable: true,
    });
    resetEntropyPool();
};

afterEach(useRealCrypto);

describe('secureRandom.getInt', () => {
    it('agrees with getRandomInt draw for draw on the same byte stream', () => {
        // Enough words to cross the 1 KiB pool boundary (256 words) more than once.
        const words = Array.from({ length: 700 }, (_, i) => (i * 2654435761) % 0x100000000);
        const ranges: [number, number][] = [
            [0, 2],
            [0, 10],
            [5, 6],
            [-10, 10],
            [0, 0xffffffff],
            [1000, 1_000_000],
        ];

        ranges.forEach(([min, max]) => {
            useStream(words);
            const pooled = Array.from({ length: 100 }, () => secureRandom.getInt(min, max));
            useStream(words);
            const reference = Array.from({ length: 100 }, () => getRandomInt(min, max));

            expect(pooled).toEqual(reference);
        });
    });

    it('rejects a draw that would bias the range, as getRandomInt does', () => {
        // 2^32 is one more than a multiple of 3, so 0xffffffff is the single value that
        // has to be thrown away for a range of 3.
        useStream([0xffffffff, 0x00000005]);
        expect(secureRandom.getInt(0, 3)).toBe(2);
        useStream([0xffffffff, 0x00000005]);
        expect(getRandomInt(0, 3)).toBe(2);
    });

    it('stays inside its bounds', () => {
        for (let i = 0; i < 2000; i++) {
            const value = secureRandom.getInt(-3, 7);
            expect(value).toBeGreaterThanOrEqual(-3);
            expect(value).toBeLessThan(7);
        }
    });

    it('validates its arguments the way getRandomInt does', () => {
        const invalid: [number, number][] = [
            [0.5, 10],
            [0, 10.5],
            [10, 10],
            [10, 0],
            [0, 2 ** 32 + 2],
        ];
        invalid.forEach(([min, max]) => {
            const fromPooled = () => secureRandom.getInt(min, max);
            const fromReference = () => getRandomInt(min, max);
            let referenceMessage = '';
            try {
                fromReference();
            } catch (error) {
                referenceMessage = error.message;
            }
            expect(referenceMessage).not.toBe('');
            expect(fromPooled).toThrow(referenceMessage);
        });
    });
});

describe('secureRandom.getBytes', () => {
    it('returns the requested length and consumes the stream in order', () => {
        useStream([0x04030201, 0x08070605]);
        expect(Array.from(secureRandom.getBytes(4))).toEqual([1, 2, 3, 4]);
        expect(Array.from(secureRandom.getBytes(2))).toEqual([5, 6]);
        expect(secureRandom.getBytes(40)).toHaveLength(40);
    });

    it('goes straight to the CSPRNG for a draw larger than the pool', () => {
        const getRandomValues = jest.fn((target: Uint8Array) => target);
        Object.defineProperty(globalThis, 'crypto', {
            value: { getRandomValues },
            configurable: true,
            writable: true,
        });
        resetEntropyPool();

        expect(secureRandom.getBytes(4096)).toHaveLength(4096);
        // One call, for the 4096 bytes themselves: no pool was filled.
        expect(getRandomValues).toHaveBeenCalledTimes(1);
        expect(getRandomValues.mock.calls[0]![0]).toHaveLength(4096);
    });

    it('rejects a non-positive length', () => {
        expect(() => secureRandom.getBytes(0)).toThrow('length must be at least 1');
    });

    it('does not repeat itself across pool refills', () => {
        const seen = new Set<string>();
        for (let i = 0; i < 100; i++) {
            seen.add(Buffer.from(secureRandom.getBytes(32)).toString('hex'));
        }
        expect(seen.size).toBe(100);
    });
});

describe('secureRandom.getScalar', () => {
    it('never returns zero or an out-of-range scalar', () => {
        for (let i = 0; i < 200; i++) {
            const scalar = secureRandom.getScalar();
            expect(scalar).toBeGreaterThan(0n);
            expect(scalar).toBeLessThan(SCALAR_ORDER);
        }
    });

    it('resamples on overflow and on zero', () => {
        const overflow = new Uint8Array(32).fill(0xff); // above the group order
        const zero = new Uint8Array(32); // scalar zero
        const valid = new Uint8Array(32);
        valid[31] = 7;
        const queue = [overflow, zero, valid];
        Object.defineProperty(globalThis, 'crypto', {
            value: {
                // One pool fill covers several draws, so the stream is laid out in
                // 32-byte chunks: overflow, then zero, then the scalar to land on.
                getRandomValues: (target: Uint8Array) => {
                    for (let offset = 0; offset < target.length; offset += 32) {
                        const chunk = queue.shift() ?? valid;
                        target.set(chunk.subarray(0, Math.min(32, target.length - offset)), offset);
                    }

                    return target;
                },
            },
            configurable: true,
            writable: true,
        });
        resetEntropyPool();

        expect(secureRandom.getScalar()).toBe(7n);
        expect(queue).toHaveLength(0);
    });
});

describe('without Web Crypto', () => {
    beforeEach(() => {
        Object.defineProperty(globalThis, 'crypto', {
            value: undefined,
            configurable: true,
            writable: true,
        });
        resetEntropyPool();
    });

    it('throws rather than degrading', () => {
        expect(() => secureRandom.getBytes(32)).toThrow('Web Crypto API');
        expect(() => secureRandom.getInt(0, 10)).toThrow('Web Crypto API');
        expect(() => secureRandom.getScalar()).toThrow('Web Crypto API');
    });
});
