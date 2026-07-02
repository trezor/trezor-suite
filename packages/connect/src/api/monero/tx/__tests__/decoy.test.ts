import { GammaPicker, type RandomSource } from '../decoy';

// randIdx always returns 0 -> picks the first output in the chosen block, making mapAgeToIndex
// fully deterministic for hand-computed assertions.
const zeroRng: RandomSource = { uniform01: () => 0.5, randIdx: () => 0 };

// Constant 2 outputs/block over 20 blocks: rctOffsets = [2,4,...,40].
//   endIndex = 20 - 10 = 10, numRctOutputs = rctOffsets[9] = 20, averageOutputTime = 120/2 = 60.
const constantOffsets = (perBlock: number, blocks: number) =>
    Array.from({ length: blocks }, (_, i) => (i + 1) * perBlock);

describe('GammaPicker index math (deterministic)', () => {
    const offsets = constantOffsets(2, 20);
    const picker = new GammaPicker(offsets, zeroRng);
    const mapAge = (age: number) => (picker as any).mapAgeToIndex(age) as number;

    it.each([
        [0, 18], // age 0 -> newest considered output (index 19) lives in block 9 -> firstRct 18
        [60, 16], // one output older
        [120, 16],
        [1140, 0], // age 19*60 -> outputIndex flips to 0 -> firstRct 0
    ])('maps age %s seconds to global index %s', (age, expected) => {
        expect(mapAge(age)).toBe(expected);
    });

    it('returns BAD_PICK (-1) when the age exceeds the available range', () => {
        expect(mapAge(20 * 60)).toBe(-1); // outputIndex 20 >= numRctOutputs 20
    });

    it('adds the in-block random offset', () => {
        const oneRng: RandomSource = { uniform01: () => 0.5, randIdx: () => 1 };
        const p = new GammaPicker(offsets, oneRng);
        expect((p as any).mapAgeToIndex(0)).toBe(19); // firstRct 18 + 1
    });
});

describe('GammaPicker statistical behaviour (crypto RNG)', () => {
    // A year of blocks at 4 outputs/block, so the gamma's recency bias is visible.
    const offsets = constantOffsets(4, 262_800);
    const picker = new GammaPicker(offsets);
    const numRctOutputs = offsets[262_800 - 11]!; // rctOffsets[endIndex - 1]

    it('produces valid, strongly recency-biased picks', () => {
        const samples: number[] = [];
        for (let i = 0; i < 2000; i++) {
            const pick = picker.pick();
            if (pick !== -1) {
                samples.push(pick);
            }
        }
        expect(samples.length).toBeGreaterThan(1500);

        for (const pick of samples) {
            expect(pick).toBeGreaterThanOrEqual(0);
            expect(pick).toBeLessThan(numRctOutputs);
        }

        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        // Uniform would give ~0.5 * N; the gamma clusters near the chain tip.
        expect(mean).toBeGreaterThan(0.6 * numRctOutputs);

        const inTopOnePercent = samples.filter(p => p > 0.99 * numRctOutputs).length;
        expect(inTopOnePercent / samples.length).toBeGreaterThan(0.2);
    });

    it('selectDecoys returns the requested count of distinct indices, excluding the real one', () => {
        const realIndex = 1_000_000;
        const decoys = picker.selectDecoys(15, realIndex);

        expect(decoys).toHaveLength(15);
        expect(new Set(decoys).size).toBe(15);
        expect(decoys).not.toContain(realIndex);
        for (const decoy of decoys) {
            expect(decoy).toBeGreaterThanOrEqual(0);
            expect(decoy).toBeLessThan(numRctOutputs);
        }
    });
});
