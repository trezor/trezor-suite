import { getScore, isStrictFeatures, isValidReleases } from '../firmwareUtils';

describe('Score Utils', () => {
    describe('getScore()', () => {
        const inputs = [
            '17BdA1CBDE11943C1D48653CD',
            '27BdA1CBDE11943C1D48653CD',
            '37BdA1CBDE11943C1D48653CD',
            '47BdA1CBDE11943C1D48653CD',
        ];

        inputs.forEach(i => {
            it(`${i} should return between 0 and 1`, () => {
                const result = getScore(i);
                expect(result).toBeLessThanOrEqual(1);
                expect(result).toBeGreaterThanOrEqual(0);
            });
        });

        const ts = Date.now();
        it(`actually any input should return between 0 and 1, even timestamp ${ts}`, () => {
            const result = getScore(String(ts));
            expect(result).toBeLessThanOrEqual(1);
            expect(result).toBeGreaterThanOrEqual(0);
        });
    });
});

describe('parse', () => {
    describe('isStrictFeatures()', () => {
        it('fail on not matching pattern', () => {
            expect(
                // @ts-ignore
                isStrictFeatures({ foo: 'bar' }),
            ).toEqual(false);
        });
    });

    describe('isValidReleases()', () => {
        it('fail on not matching pattern', () => {
            expect(
                // @ts-ignore
                isValidReleases({ foo: 'bar' }),
            ).toEqual(false);
        });
    });
});
