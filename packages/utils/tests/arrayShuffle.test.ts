import { arrayShuffle } from '../src/arrayShuffle';
import { getWeakRandomInt } from '../src/getWeakRandomInt';

const KEYS = ['a', 'b', 'c', 'd', 'e'];
const SAMPLES = 10000;
const TOLERANCE = 0.1;
const EXPECTED = SAMPLES / KEYS.length;

const LOWER_BOUND = (1 - TOLERANCE) * EXPECTED;
const UPPER_BOUND = (1 + TOLERANCE) * EXPECTED;

describe(arrayShuffle.name, () => {
    it('shuffles randomly', () => {
        const samples = Object.fromEntries(KEYS.map(key => [key, new Array(KEYS.length).fill(0)]));

        for (let sample = 0; sample < SAMPLES; ++sample) {
            const shuffled = arrayShuffle(KEYS, { randomInt: getWeakRandomInt });
            for (let i = 0; i < shuffled.length; ++i) {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const key: string = shuffled[i];
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const counts: number[] = samples[key];
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                counts[i]++;
            }
        }

        KEYS.forEach(key => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const keyCounts: number[] = samples[key];
            keyCounts.forEach(count => {
                expect(count).toBeGreaterThanOrEqual(LOWER_BOUND);
                expect(count).toBeLessThanOrEqual(UPPER_BOUND);
            });
        });
    });
});
