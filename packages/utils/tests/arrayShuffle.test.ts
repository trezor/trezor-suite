import { arrayShuffle } from '../src/arrayShuffle';

const KEYS = ['a', 'b', 'c', 'd', 'e'];
const SAMPLES = 10000;
const TOLERANCE = 0.1;
const EXPECTED = SAMPLES / KEYS.length;

describe('arrayShuffle', () => {
    it('shuffles randomly', () => {
        const samples = Object.fromEntries(KEYS.map(key => [key, new Array(KEYS.length).fill(0)]));
        for (let sample = 0; sample < SAMPLES; ++sample) {
            const shuffled = arrayShuffle(KEYS);
            for (let i = 0; i < shuffled.length; ++i) {
                samples[shuffled[i]][i]++;
            }
        }
        KEYS.forEach(key =>
            samples[key].forEach(count => {
                expect(count).toBeGreaterThanOrEqual((1 - TOLERANCE) * EXPECTED);
                expect(count).toBeLessThanOrEqual((1 + TOLERANCE) * EXPECTED);
            }),
        );
    });
});
