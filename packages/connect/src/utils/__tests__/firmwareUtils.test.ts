import { isStrictFeatures, isValidReleases } from '../firmwareUtils';

describe('parse', () => {
    describe('isStrictFeatures()', () => {
        it('fail on not matching pattern', () => {
            expect(
                // @ts-expect-error
                isStrictFeatures({ foo: 'bar' }),
            ).toEqual(false);
        });
    });

    describe('isValidReleases()', () => {
        it('fail on not matching pattern', () => {
            expect(isValidReleases({ foo: 'bar' })).toEqual(false);
        });
    });
});
