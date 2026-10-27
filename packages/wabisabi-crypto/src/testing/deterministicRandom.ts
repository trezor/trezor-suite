import { type Random, getScalarFrom } from '../random';

const INT_MAX = 2147483647;

/**
 * Port of .NET's legacy seeded `System.Random` (`Random.Net5CompatImpl.CompatPrng`),
 * the subtractive generator .NET keeps for compatibility when a seed is supplied.
 *
 * Every committed upstream test vector and both upstream client test suites run under
 * `DeterministicRandom(0)` or `InsecureRandom(seed: 0)`, which are both this generator.
 * Reproducing it bit for bit is what makes those vectors usable as a parity gate; the
 * shipped release binary uses a CSPRNG and cannot reproduce them at all.
 */
class CompatPrng {
    private readonly seedArray = new Int32Array(56);
    private inext = 0;
    private inextp = 21;

    constructor(seed: number) {
        const subtraction = seed === -2147483648 ? INT_MAX : Math.abs(seed);
        let mj = 161803398 - subtraction; // magic number based on Phi (golden ratio)
        this.seedArray[55] = mj;
        let mk = 1;
        let ii = 0;
        for (let i = 1; i < 55; i++) {
            // The range [1..55] is special (Knuth) and so the 0th position is wasted.
            ii += 21;
            if (ii >= 55) {
                ii -= 55;
            }

            this.seedArray[ii] = mk;
            mk = mj - mk;
            if (mk < 0) {
                mk += INT_MAX;
            }

            mj = this.seedArray[ii] as number;
        }

        for (let k = 1; k < 5; k++) {
            for (let i = 1; i < 56; i++) {
                let n = i + 30;
                if (n >= 55) {
                    n -= 55;
                }

                this.seedArray[i] =
                    (this.seedArray[i] as number) - (this.seedArray[1 + n] as number);
                if ((this.seedArray[i] as number) < 0) {
                    this.seedArray[i] = (this.seedArray[i] as number) + INT_MAX;
                }
            }
        }
    }

    /** `CompatPrng.InternalSample()`. */
    internalSample(): number {
        let locINext = this.inext;
        if (++locINext >= 56) {
            locINext = 1;
        }

        let locINextp = this.inextp;
        if (++locINextp >= 56) {
            locINextp = 1;
        }

        let retVal = (this.seedArray[locINext] as number) - (this.seedArray[locINextp] as number);

        if (retVal === INT_MAX) {
            retVal--;
        }
        if (retVal < 0) {
            retVal += INT_MAX;
        }

        this.seedArray[locINext] = retVal;
        this.inext = locINext;
        this.inextp = locINextp;

        return retVal;
    }

    /** `CompatPrng.Sample()` — a double in `[0, 1)`. */
    sample(): number {
        return this.internalSample() * (1.0 / INT_MAX);
    }

    /**
     * `CompatPrng.GetSampleForLargeRange()`.
     *
     * The distribution of `Sample` is not good enough for a range wider than
     * `int.MaxValue`, so .NET draws twice and derives the sign from the second draw.
     */
    getSampleForLargeRange(): number {
        let result = this.internalSample();

        // Note that addition cannot be used here: the distribution would be bad.
        const negative = this.internalSample() % 2 === 0;
        if (negative) {
            result = -result;
        }

        let d = result;
        d += INT_MAX - 1; // get a number in range [0..2*int.MaxValue-1)
        d /= 2 * INT_MAX - 1;

        return d;
    }

    /** `CompatPrng.NextBytes(Span<byte>)` — the low byte of one sample per byte. */
    nextBytes(length: number): Uint8Array {
        const buffer = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            buffer[i] = this.internalSample() & 0xff;
        }

        return buffer;
    }

    /** `Net5CompatSeedImpl.Next(int minValue, int maxValue)`. */
    next(minValue: number, maxValue: number): number {
        const range = maxValue - minValue;

        return range <= INT_MAX
            ? Math.trunc(this.sample() * range) + minValue
            : Math.trunc(this.getSampleForLargeRange() * range) + minValue;
    }
}

/**
 * Port of `WalletWasabi.WabiSabiClientLibrary/Crypto/DeterministicRandom.cs` and of
 * `NWabiSabi/WabiSabi/Crypto/Randomness/InsecureRandom.cs` with an explicit seed.
 *
 * Test-only. Never exported from the package root.
 */
export class DeterministicRandom implements Random {
    private readonly prng: CompatPrng;

    constructor(seed: number) {
        this.prng = new CompatPrng(seed);
    }

    getBytes(length: number) {
        return this.prng.nextBytes(length);
    }

    getInt(fromInclusive: number, toExclusive: number) {
        return this.prng.next(fromInclusive, toExclusive);
    }

    getScalar() {
        return getScalarFrom(length => this.getBytes(length));
    }
}
