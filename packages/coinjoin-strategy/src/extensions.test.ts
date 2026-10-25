import { type Random } from '@trezor/wabisabi-crypto';
import { DeterministicRandom } from '@trezor/wabisabi-crypto/src/testing';

import {
    biasedRandomElement,
    combinationsWithoutRepetition,
    generalizedWeightedMean,
    randomElement,
    shuffle,
    toShuffled,
    weightedMean,
} from './extensions';

/** A `Random` that records every `getInt` call and always returns the lower bound. */
const tracingRandom = (): Random & { calls: [number, number][] } => {
    const calls: [number, number][] = [];

    return {
        calls,
        getBytes: (length: number) => new Uint8Array(length),
        getInt: (fromInclusive: number, toExclusive: number) => {
            calls.push([fromInclusive, toExclusive]);

            return fromInclusive;
        },
        getScalar: () => 1n,
    };
};

describe('randomElement', () => {
    it('draws once per element, as reservoir sampling does', () => {
        const random = tracingRandom();
        randomElement([1, 2, 3, 4], random);

        expect(random.calls).toEqual([
            [0, 1],
            [0, 2],
            [0, 3],
            [0, 4],
        ]);
    });

    it('returns undefined for an empty sequence and draws nothing', () => {
        const random = tracingRandom();

        expect(randomElement([], random)).toBeUndefined();
        expect(random.calls).toEqual([]);
    });

    it('keeps the element whose draw returned zero', () => {
        // The tracing random always returns the lower bound, i.e. always zero, so every
        // element replaces the previous one and the last wins.
        expect(randomElement(['a', 'b', 'c'], tracingRandom())).toBe('c');
    });

    it('covers every element over many draws', () => {
        const random = new DeterministicRandom(0);
        const seen = new Set<number>();
        for (let i = 0; i < 500; i++) {
            seen.add(randomElement([1, 2, 3, 4, 5], random) as number);
        }

        expect(seen.size).toBe(5);
    });
});

describe('biasedRandomElement', () => {
    it('takes the first element whose draw is within the bias', () => {
        const random = tracingRandom();

        expect(biasedRandomElement(['a', 'b', 'c'], 50, random)).toBe('a');
        expect(random.calls).toEqual([[1, 101]]);
    });

    it('falls back to the first element when no draw is within the bias', () => {
        const never: Random = {
            getBytes: (length: number) => new Uint8Array(length),
            getInt: (_from: number, toExclusive: number) => toExclusive - 1,
            getScalar: () => 1n,
        };

        expect(biasedRandomElement(['a', 'b', 'c'], 50, never)).toBe('a');
        expect(biasedRandomElement([], 50, never)).toBeUndefined();
    });

    it('biases towards the front', () => {
        const random = new DeterministicRandom(0);
        const counts = [0, 0, 0, 0];
        for (let i = 0; i < 2_000; i++) {
            counts[biasedRandomElement([0, 1, 2, 3], 50, random) as number]! += 1;
        }

        expect(counts[0]).toBeGreaterThan(counts[1] as number);
        expect(counts[1]).toBeGreaterThan(counts[2] as number);
    });
});

describe('shuffle', () => {
    it('mutates the list in place and returns it', () => {
        const list = [1, 2, 3, 4, 5];
        const result = shuffle(list, new DeterministicRandom(0));

        expect(result).toBe(list);
        expect([...result].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    });

    it('walks from the end, drawing once per element but the first', () => {
        const random = tracingRandom();
        shuffle([1, 2, 3, 4], random);

        expect(random.calls).toEqual([
            [0, 4],
            [0, 3],
            [0, 2],
        ]);
    });

    it('toShuffled leaves the source alone', () => {
        const list = [1, 2, 3, 4, 5];
        const result = toShuffled(list, new DeterministicRandom(0));

        expect(list).toEqual([1, 2, 3, 4, 5]);
        expect([...result].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    });

    it('produces every permutation of a small list', () => {
        const random = new DeterministicRandom(0);
        const seen = new Set<string>();
        for (let i = 0; i < 500; i++) {
            seen.add(toShuffled([1, 2, 3], random).join(''));
        }

        expect(seen.size).toBe(6);
    });
});

describe('means', () => {
    it('computes a weighted mean', () => {
        expect(
            weightedMean(
                [
                    [1.0, 1.1],
                    [1.2, 1.3],
                ],
                x => x[0] as number,
                x => x[1] as number,
            ),
        ).toBeCloseTo((1.0 * 1.1 + 1.2 * 1.3) / (1.1 + 1.3), 12);
    });

    // Port of `GeneralizedWeightedMean` in WalletWasabi.Tests/UnitTests/LinqExtensionsTests.cs
    it('matches the upstream generalized weighted mean vector', () => {
        expect(
            generalizedWeightedMean(
                [
                    [1.0, 1.1],
                    [1.2, 1.3],
                ],
                x => x[0] as number,
                x => x[1] as number,
                -1.4,
            ),
        ).toBe(1.097412680210462);
    });

    // Port of `GeneralizedWeightedMeanOneP`
    it('equals the weighted mean at p = 1', () => {
        const values: [number, number][] = [
            [1.0, 1.1],
            [1.2, 1.3],
        ];
        const value = (x: [number, number]) => x[0];
        const weight = (x: [number, number]) => x[1];

        expect(generalizedWeightedMean(values, value, weight, 1)).toBe(
            weightedMean(values, value, weight),
        );
    });

    it('rejects the inputs upstream rejects', () => {
        const one = (x: number) => x;
        expect(() => generalizedWeightedMean([], one, one, 1)).toThrow('cannot be empty');
        expect(() => generalizedWeightedMean([-1], one, one, 1)).toThrow(
            'value cannot be negative',
        );
        expect(() => generalizedWeightedMean([1], one, () => -1, 1)).toThrow(
            'weight cannot be negative',
        );
        expect(() => generalizedWeightedMean([1], one, () => 0, 1)).toThrow(
            'weight cannot be all zero',
        );
        expect(() => generalizedWeightedMean([1], one, one, 0)).toThrow('p cannot be zero');
    });
});

describe('combinationsWithoutRepetition', () => {
    it('yields every combination of the requested length', () => {
        const combinations = [...combinationsWithoutRepetition([1, 2, 3, 4], 3)].map(x =>
            x.join(''),
        );

        expect(combinations.sort()).toEqual(['123', '124', '134', '234']);
    });

    it('yields them front to back, as upstream does', () => {
        // Upstream pushes the remaining items onto a stack back to front so that they
        // come off front to back; the coin selector relies on this order because it stops
        // enumerating on a wall-clock budget.
        expect([...combinationsWithoutRepetition([1, 2, 3], 2)].map(x => x.join(''))).toEqual([
            '12',
            '13',
            '23',
        ]);
    });

    it('yields one empty combination for length zero', () => {
        expect([...combinationsWithoutRepetition([1, 2, 3], 0)]).toEqual([[]]);
    });

    it('yields nothing when the length exceeds the source', () => {
        expect([...combinationsWithoutRepetition([1, 2], 3)]).toEqual([]);
    });
});
