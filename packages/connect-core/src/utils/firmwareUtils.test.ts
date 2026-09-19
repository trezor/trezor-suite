import { isStrictFeatures } from './firmwareUtils';

describe('firmwareUtils', () => {
    describe('isStrictFeatures()', () => {
        it('errors on not matching pattern', () => {
            expect(
                // @ts-expect-error
                isStrictFeatures({ foo: 'bar' }),
            ).toEqual(false);
        });
    });
});
