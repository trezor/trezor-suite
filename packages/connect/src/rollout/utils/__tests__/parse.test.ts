import { isStrictFeatures, isValidReleases } from '../parse';

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
