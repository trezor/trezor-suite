// Decoy (ring member) selection — the gamma picker.
//
// Faithful port of monero wallet2.cpp `gamma_picker` (constructor + pick()). This is privacy- not
// consensus-critical: a uniform-random ring is still *valid*, but selecting decoys with the wrong
// age distribution makes the real spend statistically distinguishable. The shape constants and the
// index math must therefore match wallet2 exactly.
//
// Randomness MUST be cryptographically secure (predictable decoys leak the real input). The RNG is
// injectable so the index math can be unit-tested deterministically; the default is crypto-backed.

const GAMMA_SHAPE = 19.28;
const GAMMA_SCALE = 1 / 1.61;
const DIFFICULTY_TARGET_V2 = 120; // seconds per block
const CRYPTONOTE_DEFAULT_TX_SPENDABLE_AGE = 10;
const DEFAULT_UNLOCK_TIME = CRYPTONOTE_DEFAULT_TX_SPENDABLE_AGE * DIFFICULTY_TARGET_V2; // 1200
const RECENT_SPEND_WINDOW = 15 * DIFFICULTY_TARGET_V2; // 1800
const BLOCKS_IN_A_YEAR = Math.floor((86400 * 365) / DIFFICULTY_TARGET_V2); // 262800

export interface RandomSource {
    /** Uniform double in [0, 1). */
    uniform01(): number;
    /** Uniform integer in [0, n). */
    randIdx(n: number): number;
}

const cryptoRandomBytes = (length: number): Uint8Array => {
    const bytes = new Uint8Array(length);
    // Available in the browser and (via webcrypto) in Node — connect runs in both.
    globalThis.crypto.getRandomValues(bytes);

    return bytes;
};

export const cryptoRandomSource: RandomSource = {
    uniform01() {
        // 53-bit precision uniform from 7 random bytes.
        const bytes = cryptoRandomBytes(7);
        let value = 0;
        for (const byte of bytes) {
            value = value * 256 + byte;
        }

        return value / 2 ** 56;
    },
    randIdx(n: number) {
        if (n <= 0) {
            throw new Error('randIdx requires n > 0');
        }
        // Rejection sampling to avoid modulo bias.
        const limit = Math.floor(0x100000000 / n) * n;
        for (;;) {
            const bytes = cryptoRandomBytes(4);
            const value = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, false);
            if (value < limit) {
                return value % n;
            }
        }
    },
};

/** Standard normal via Box–Muller, drawing from the injected uniform source. */
const sampleNormal = (rng: RandomSource): number => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng.uniform01();
    while (v === 0) v = rng.uniform01();

    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/** Gamma(shape, scale) via Marsaglia–Tsang (valid for shape >= 1; GAMMA_SHAPE = 19.28). */
const sampleGamma = (rng: RandomSource, shape: number, scale: number): number => {
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
        let x = sampleNormal(rng);
        const v = (1 + c * x) ** 3;
        if (v <= 0) {
            continue;
        }
        const u = rng.uniform01();
        x *= x;
        if (u < 1 - 0.0331 * x * x) {
            return d * v * scale;
        }
        if (Math.log(u) < 0.5 * x + d * (1 - v + Math.log(v))) {
            return d * v * scale;
        }
    }
};

const lowerBound = (arr: number[], value: number, hi: number): number => {
    let lo = 0;
    let end = hi;
    while (lo < end) {
        const mid = (lo + end) >>> 1;
        if (arr[mid]! < value) {
            lo = mid + 1;
        } else {
            end = mid;
        }
    }

    return lo;
};

const BAD_PICK = -1;

export class GammaPicker {
    private readonly numRctOutputs: number;
    private readonly averageOutputTime: number;
    private readonly endIndex: number; // exclusive upper bound for the lower_bound search
    private readonly shape: number;
    private readonly scale: number;

    /**
     * @param rctOffsets cumulative RCT output counts per block, from
     *   get_output_distribution(amount=0, cumulative=true).
     */
    constructor(
        private readonly rctOffsets: number[],
        private readonly rng: RandomSource = cryptoRandomSource,
        shape = GAMMA_SHAPE,
        scale = GAMMA_SCALE,
    ) {
        this.shape = shape;
        this.scale = scale;
        const size = rctOffsets.length;
        if (size <= Math.max(1, CRYPTONOTE_DEFAULT_TX_SPENDABLE_AGE)) {
            throw new Error('gamma picker: not enough rct offsets');
        }
        const blocksToConsider = Math.min(size, BLOCKS_IN_A_YEAR);
        const outputsToConsider =
            rctOffsets[size - 1]! -
            (blocksToConsider < size ? rctOffsets[size - blocksToConsider - 1]! : 0);
        // end = rct_offsets + size - SPENDABLE_AGE; num_rct_outputs = *(end - 1)
        this.endIndex = size - Math.max(1, CRYPTONOTE_DEFAULT_TX_SPENDABLE_AGE);
        this.numRctOutputs = rctOffsets[this.endIndex - 1]!;
        if (this.numRctOutputs === 0) {
            throw new Error('gamma picker: no rct outputs');
        }
        this.averageOutputTime = (DIFFICULTY_TARGET_V2 * blocksToConsider) / outputsToConsider;
    }

    /**
     * Deterministic part of pick(): map an output age (seconds before tip) to a global output
     * index, or BAD_PICK (-1). Separated from the random age sampling so the index math can be
     * unit-tested in isolation.
     */
    private mapAgeToIndex(ageSeconds: number): number {
        let outputIndex = Math.floor(ageSeconds / this.averageOutputTime);
        if (outputIndex >= this.numRctOutputs) {
            return BAD_PICK;
        }
        outputIndex = this.numRctOutputs - 1 - outputIndex;

        const index = lowerBound(this.rctOffsets, outputIndex, this.endIndex);
        if (index >= this.endIndex) {
            return BAD_PICK;
        }
        const firstRct = index === 0 ? 0 : this.rctOffsets[index - 1]!;
        const nRct = this.rctOffsets[index]! - firstRct;
        if (nRct === 0) {
            return BAD_PICK;
        }

        return firstRct + this.rng.randIdx(nRct);
    }

    /** One gamma pick → a global RCT output index, or BAD_PICK (-1) to retry. */
    pick(): number {
        let x = Math.exp(sampleGamma(this.rng, this.shape, this.scale));
        if (x > DEFAULT_UNLOCK_TIME) {
            x -= DEFAULT_UNLOCK_TIME;
        } else {
            x = this.rng.randIdx(RECENT_SPEND_WINDOW);
        }

        return this.mapAgeToIndex(x);
    }

    /**
     * Select `count` distinct decoy output indices, excluding `realIndex`. Mirrors wallet2's
     * retry-on-bad-pick loop. `maxAttempts` guards against degenerate distributions.
     */
    selectDecoys(count: number, realIndex: number, maxAttempts = count * 200): number[] {
        const chosen = new Set<number>([realIndex]);
        let attempts = 0;
        while (chosen.size < count + 1 && attempts < maxAttempts) {
            attempts += 1;
            const picked = this.pick();
            if (picked !== BAD_PICK) {
                chosen.add(picked);
            }
        }
        chosen.delete(realIndex);
        if (chosen.size < count) {
            throw new Error(`gamma picker: could not select ${count} decoys`);
        }

        return [...chosen].slice(0, count);
    }
}
